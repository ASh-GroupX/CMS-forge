import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import 'reflect-metadata';
import type { ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA, MODULE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ComplaintSeverity, ComplaintStatus, SlaEventType, SlaStage, WorkingCalendarMode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { PermissionGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { CsrfGuard } from '../../src/core/csrf.guard.ts';
import type { PrismaService } from '../../src/core/http-kernel.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { AuthModule } from '../../src/modules/auth/auth.module.ts';
import { NotificationsService } from '../../src/modules/notifications/notifications.service.ts';
import { NotificationsModule } from '../../src/modules/notifications/notifications.module.ts';
import { SlaController } from '../../src/modules/sla/sla.controller.ts';
import { parseUpdateSlaEscalationConfigBody, parseUpdateSlaPolicyConfigBody } from '../../src/modules/sla/dto/update-sla.dto.ts';
import { SlaModule } from '../../src/modules/sla/sla.module.ts';
import { SlaRepository } from '../../src/modules/sla/sla.repository.ts';
import type { SlaDeadlineBreachRecord, SlaDeadlineWarningRecord, SlaPolicyEscalationRecord, SlaPolicyRecord } from '../../src/modules/sla/sla.repository.ts';
import { DEFAULT_SLA_DURATION_MINUTES, SlaService } from '../../src/modules/sla/sla.service.ts';

const service = new SlaService({} as SlaRepository);

test('SLA calculator returns backend-owned ALWAYS_ON deadlines for default durations', () => {
  const enteredAt = '2026-06-18T09:00:00.000Z';
  const expectedDueAt = {
    [ComplaintSeverity.CRITICAL]: '2026-06-18T11:00:00.000Z',
    [ComplaintSeverity.HIGH]: '2026-06-18T17:00:00.000Z',
    [ComplaintSeverity.MEDIUM]: '2026-06-19T09:00:00.000Z',
    [ComplaintSeverity.LOW]: '2026-06-21T09:00:00.000Z',
  };

  for (const severity of Object.values(ComplaintSeverity)) {
    const deadline = service.calculateDeadline({
      policyId: `policy_${severity.toLowerCase()}`,
      severity,
      stage: SlaStage.INVESTIGATION,
      durationMinutes: DEFAULT_SLA_DURATION_MINUTES[severity],
      warningPercent: 80,
      branchTimezone: 'Asia/Riyadh',
      workingCalendarMode: WorkingCalendarMode.ALWAYS_ON,
      enteredAt,
    });

    assert.equal(deadline.policyId, `policy_${severity.toLowerCase()}`);
    assert.equal(deadline.enteredAt, enteredAt);
    assert.equal(deadline.dueAt, expectedDueAt[severity]);
  }
});

test('SLA calculator applies warning percent and validates branch timezone in API code', () => {
  const deadline = service.calculateDeadline({
    severity: ComplaintSeverity.HIGH,
    stage: SlaStage.MANAGER_REVIEW,
    durationMinutes: 480,
    warningPercent: 80,
    branchTimezone: 'Africa/Cairo',
    workingCalendarMode: WorkingCalendarMode.ALWAYS_ON,
    enteredAt: new Date('2026-06-18T08:00:00.000Z'),
  });

  assert.equal(deadline.warningAt, '2026-06-18T14:24:00.000Z');
  assert.equal(deadline.dueAt, '2026-06-18T16:00:00.000Z');
  assert.equal(deadline.branchTimezone, 'Africa/Cairo');

  assertPolicyMissing({
    severity: ComplaintSeverity.HIGH,
    stage: SlaStage.MANAGER_REVIEW,
    durationMinutes: 480,
    warningPercent: 80,
    branchTimezone: 'Not/A_Timezone',
    workingCalendarMode: WorkingCalendarMode.ALWAYS_ON,
    enteredAt: '2026-06-18T08:00:00.000Z',
  }, 'branchTimezone');
});

test('SLA calculator fails closed for missing policy fields and unsupported calendars', () => {
  const base = {
    severity: ComplaintSeverity.MEDIUM,
    stage: SlaStage.BRANCH_REVIEW,
    durationMinutes: 1440,
    warningPercent: 80,
    branchTimezone: 'UTC',
    workingCalendarMode: WorkingCalendarMode.ALWAYS_ON,
    enteredAt: '2026-06-18T08:00:00.000Z',
  };

  assertPolicyMissing({ ...base, durationMinutes: undefined }, 'durationMinutes');
  assertPolicyMissing({ ...base, durationMinutes: 0 }, 'durationMinutes');
  assertPolicyMissing({ ...base, warningPercent: undefined }, 'warningPercent');
  assertPolicyMissing({ ...base, warningPercent: 101 }, 'warningPercent');
  assertPolicyMissing({ ...base, severity: undefined }, 'severity');
  assertPolicyMissing({ ...base, stage: undefined }, 'stage');
  assertPolicyMissing({ ...base, branchTimezone: undefined }, 'branchTimezone');
  assertPolicyMissing({ ...base, workingCalendarMode: WorkingCalendarMode.CALENDAR_HOURS }, 'workingCalendarMode');
});

test('SLA repository reads only active policies by severity and stage', async () => {
  const calls: unknown[] = [];
  const repository = new SlaRepository({
    slaPolicy: {
      findMany: async (query: unknown) => {
        calls.push(query);
        return [];
      },
    },
  } as PrismaService);

  assert.deepEqual(await repository.findActiveBySeverityAndStage(ComplaintSeverity.HIGH, SlaStage.INVESTIGATION), []);
  assert.deepEqual(calls[0], {
    where: { severity: ComplaintSeverity.HIGH, stage: SlaStage.INVESTIGATION, isActive: true },
    orderBy: [{ updatedAt: 'desc' }],
    select: {
      id: true,
      severity: true,
      stage: true,
      branchId: true,
      departmentId: true,
      categoryId: true,
      durationMinutes: true,
      warningPercent: true,
      branchTimezone: true,
      workingCalendarMode: true,
      pausePolicy: true,
      escalationLevel1: true,
      escalationLevel2: true,
      escalationLevel3: true,
      escalationLevel2AfterBreachMinutes: true,
      escalationLevel3AfterBreachMinutes: true,
      totalTargetMinutes: true,
      isActive: true,
      updatedAt: true,
    },
  });
});

test('SLA resolver uses global fallback and deterministic scoped override', async () => {
  const resolver = new SlaService({
    findActiveBySeverityAndStage: async (severity, stage) => {
      assert.equal(severity, ComplaintSeverity.HIGH);
      assert.equal(stage, SlaStage.INVESTIGATION);
      return [
        policy({ id: 'global', updatedAt: '2026-06-18T09:00:00.000Z' }),
        policy({ id: 'global-newer', updatedAt: '2026-06-18T12:00:00.000Z' }),
        policy({ id: 'branch-old', branchId: 'branch_1', updatedAt: '2026-06-18T10:00:00.000Z' }),
        policy({ id: 'branch-category', branchId: 'branch_1', categoryId: 'cat_1', updatedAt: '2026-06-18T08:00:00.000Z' }),
        policy({ id: 'other-branch', branchId: 'branch_2', updatedAt: '2026-06-18T11:00:00.000Z' }),
      ];
    },
  } as SlaRepository);

  assert.equal((await resolver.resolvePolicy({
    severity: ComplaintSeverity.HIGH,
    stage: SlaStage.INVESTIGATION,
  })).id, 'global-newer');

  const scoped = await resolver.resolvePolicy({
    severity: ComplaintSeverity.HIGH,
    stage: SlaStage.INVESTIGATION,
    branchId: 'branch_1',
    categoryId: 'cat_1',
  });
  assert.equal(scoped.id, 'branch-category');
  assert.equal(scoped.durationMinutes, 480);
  assert.equal(scoped.escalationLevel2AfterBreachMinutes, null);
  assert.equal(scoped.escalationLevel3AfterBreachMinutes, null);
});

test('SLA resolver ignores inactive policies and fails closed when none match', async () => {
  const inactiveOnly = new SlaService({
    findActiveBySeverityAndStage: async () => [policy({ id: 'inactive', isActive: false })],
  } as SlaRepository);

  await assert.rejects(
    inactiveOnly.resolvePolicy({ severity: ComplaintSeverity.MEDIUM, stage: SlaStage.BRANCH_REVIEW }),
    (error: unknown) => error instanceof AppException && error.code === 'SLA_POLICY_MISSING',
  );

  const missing = new SlaService({
    findActiveBySeverityAndStage: async () => [policy({ id: 'other-branch', branchId: 'branch_2' })],
  } as SlaRepository);

  await assert.rejects(
    missing.resolvePolicy({ severity: ComplaintSeverity.MEDIUM, stage: SlaStage.BRANCH_REVIEW, branchId: 'branch_1' }),
    (error: unknown) => error instanceof AppException && error.code === 'SLA_POLICY_MISSING',
  );
});

test('SLA repository upserts deadline events by deterministic idempotency key', async () => {
  const calls: unknown[] = [];
  const dueAt = new Date('2026-06-18T17:00:00.000Z');
  const repository = new SlaRepository({
    slaEvent: {
      upsert: async (query: unknown) => {
        calls.push(query);
        return {
          complaintId: 'cmp_1',
          policyId: 'policy_1',
          stage: SlaStage.INVESTIGATION,
          dueAt,
          idempotencyKey: 'idem_1',
        };
      },
    },
  } as PrismaService);

  assert.deepEqual(await repository.createDeadlineEvent({
    complaintId: 'cmp_1',
    policyId: 'policy_1',
    stage: SlaStage.INVESTIGATION,
    dueAt,
    idempotencyKey: 'idem_1',
  }), {
    complaintId: 'cmp_1',
    policyId: 'policy_1',
    stage: SlaStage.INVESTIGATION,
    dueAt,
    idempotencyKey: 'idem_1',
  });
  assert.deepEqual(calls[0], {
    where: { idempotencyKey: 'idem_1' },
    update: {},
    create: {
      complaintId: 'cmp_1',
      policyId: 'policy_1',
      stage: SlaStage.INVESTIGATION,
      dueAt,
      idempotencyKey: 'idem_1',
      type: SlaEventType.DEADLINE_SET,
    },
    select: {
      complaintId: true,
      policyId: true,
      stage: true,
      dueAt: true,
      idempotencyKey: true,
    },
  });
});

test('SLA repository upserts lifecycle events by deterministic idempotency key', async () => {
  const calls: unknown[] = [];
  const occurredAt = new Date('2026-06-18T17:05:00.000Z');
  const repository = new SlaRepository({
    slaEvent: {
      upsert: async (query: unknown) => {
        calls.push(query);
        return {
          complaintId: 'cmp_1',
          policyId: null,
          type: SlaEventType.PAUSED,
          stage: SlaStage.INVESTIGATION,
          dueAt: null,
          occurredAt,
          idempotencyKey: 'life_1',
        };
      },
    },
  } as PrismaService);

  assert.deepEqual(await repository.createLifecycleEvent({
    complaintId: 'cmp_1',
    type: SlaEventType.PAUSED,
    stage: SlaStage.INVESTIGATION,
    occurredAt,
    idempotencyKey: 'life_1',
  }), {
    complaintId: 'cmp_1',
    policyId: null,
    type: SlaEventType.PAUSED,
    stage: SlaStage.INVESTIGATION,
    dueAt: null,
    occurredAt,
    idempotencyKey: 'life_1',
  });
  assert.deepEqual(calls[0], {
    where: { idempotencyKey: 'life_1' },
    update: {},
    create: {
      complaintId: 'cmp_1',
      policyId: null,
      type: SlaEventType.PAUSED,
      stage: SlaStage.INVESTIGATION,
      dueAt: null,
      occurredAt,
      idempotencyKey: 'life_1',
    },
    select: {
      complaintId: true,
      policyId: true,
      type: true,
      stage: true,
      dueAt: true,
      occurredAt: true,
      idempotencyKey: true,
    },
  });
});

test('SLA repository reads deadline events and creates warning and breach events idempotently', async () => {
  const calls: unknown[] = [];
  const dueAt = new Date('2026-06-18T17:00:00.000Z');
  const repository = new SlaRepository({
    slaEvent: {
      findMany: async (query: unknown) => {
        calls.push({ findMany: query });
        return [];
      },
      createMany: async (query: unknown) => {
        calls.push({ createMany: query });
        return { count: 1 };
      },
    },
  } as PrismaService);

  assert.deepEqual(await repository.findDeadlineEventsForWarning(), []);
  assert.equal(await repository.createWarningEvent({
    complaintId: 'cmp_1',
    policyId: 'policy_1',
    stage: SlaStage.INVESTIGATION,
    dueAt,
    idempotencyKey: 'warn_1',
  }), true);
  assert.deepEqual(await repository.findDeadlineEventsForBreach(), []);
  assert.equal(await repository.createBreachEvent({
    complaintId: 'cmp_1',
    policyId: 'policy_1',
    stage: SlaStage.INVESTIGATION,
    dueAt,
    idempotencyKey: 'breach_1',
  }), true);

  assert.deepEqual(calls[0], {
    findMany: {
      where: {
        type: SlaEventType.DEADLINE_SET,
        dueAt: { not: null },
        policy: { isNot: null },
        complaint: { status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.REJECTED] } },
      },
      select: {
        complaintId: true,
        policyId: true,
        stage: true,
        dueAt: true,
        occurredAt: true,
        idempotencyKey: true,
        policy: { select: { durationMinutes: true, warningPercent: true } },
        complaint: { select: { status: true, ownerId: true, slaEvents: { where: { type: SlaEventType.PAUSED }, select: { type: true, stage: true, occurredAt: true } } } },
      },
    },
  });
  assert.deepEqual(calls[1], {
    createMany: {
      data: {
        complaintId: 'cmp_1',
        policyId: 'policy_1',
        stage: SlaStage.INVESTIGATION,
        dueAt,
        idempotencyKey: 'warn_1',
        type: SlaEventType.WARNING,
      },
      skipDuplicates: true,
    },
  });
  assert.deepEqual(calls[2], {
    findMany: {
      where: {
        type: SlaEventType.DEADLINE_SET,
        dueAt: { not: null },
        complaint: { status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.REJECTED] } },
      },
      select: {
        complaintId: true,
        policyId: true,
        stage: true,
        dueAt: true,
        occurredAt: true,
        idempotencyKey: true,
        policy: {
          select: {
            escalationLevel1: true,
            escalationLevel2: true,
            escalationLevel3: true,
            escalationLevel2AfterBreachMinutes: true,
            escalationLevel3AfterBreachMinutes: true,
          },
        },
        complaint: { select: { status: true, slaEvents: { where: { type: SlaEventType.PAUSED }, select: { type: true, stage: true, occurredAt: true } } } },
      },
    },
  });
  assert.deepEqual(calls[3], {
    createMany: {
      data: {
        complaintId: 'cmp_1',
        policyId: 'policy_1',
        stage: SlaStage.INVESTIGATION,
        dueAt,
        idempotencyKey: 'breach_1',
        type: SlaEventType.BREACH,
      },
      skipDuplicates: true,
    },
  });
});

test('SLA service records deadline events idempotently', async () => {
  const events = new Map<string, { complaintId: string; policyId: string | null; stage: SlaStage; dueAt: Date; idempotencyKey: string }>();
  const repository = {
    findActiveBySeverityAndStage: async () => [policy({ id: 'policy_1' })],
    createDeadlineEvent: async (event) => {
      const existing = events.get(event.idempotencyKey);
      if (existing) return existing;
      events.set(event.idempotencyKey, event);
      return event;
    },
  } as SlaRepository;
  const recorder = new SlaService(repository);
  const input = {
    complaintId: 'cmp_1',
    severity: ComplaintSeverity.HIGH,
    stage: SlaStage.INVESTIGATION,
    enteredAt: '2026-06-18T09:00:00.000Z',
  };

  const first = await recorder.recordDeadlineEvent(input);
  const second = await recorder.recordDeadlineEvent(input);

  assert.deepEqual(first, {
    complaintId: 'cmp_1',
    policyId: 'policy_1',
    stage: SlaStage.INVESTIGATION,
    dueAt: '2026-06-18T17:00:00.000Z',
    idempotencyKey: 'sla:deadline:cmp_1:INVESTIGATION:policy_1:2026-06-18T09:00:00.000Z',
  });
  assert.deepEqual(second, first);
  assert.equal(events.size, 1);
});

test('SLA service records lifecycle events idempotently', async () => {
  const occurredAt = new Date('2026-06-18T17:05:00.000Z');
  const events = new Map<string, unknown>();
  const recorder = new SlaService({
    createLifecycleEvent: async (event) => {
      const existing = events.get(event.idempotencyKey);
      if (existing) return existing as never;
      const created = { ...event, policyId: null, dueAt: null };
      events.set(event.idempotencyKey, created);
      return created as never;
    },
  } as SlaRepository);

  const input = {
    complaintId: 'cmp_1',
    stage: SlaStage.INVESTIGATION,
    type: SlaEventType.PAUSED,
    occurredAt,
  };

  const first = await recorder.recordLifecycleEvent(input);
  const second = await recorder.recordLifecycleEvent(input);

  assert.deepEqual(first, {
    complaintId: 'cmp_1',
    policyId: null,
    type: SlaEventType.PAUSED,
    stage: SlaStage.INVESTIGATION,
    dueAt: null,
    occurredAt: '2026-06-18T17:05:00.000Z',
    idempotencyKey: 'sla:lifecycle:cmp_1:INVESTIGATION:PAUSED:2026-06-18T17:05:00.000Z',
  });
  assert.deepEqual(second, first);
  assert.equal(events.size, 1);
});

test('SLA service does not create a deadline event when policy is missing', async () => {
  let createCalled = false;
  const recorder = new SlaService({
    findActiveBySeverityAndStage: async () => [],
    createDeadlineEvent: async () => {
      createCalled = true;
      throw new Error('should not create event');
    },
  } as unknown as SlaRepository);

  await assert.rejects(
    recorder.recordDeadlineEvent({
      complaintId: 'cmp_missing',
      severity: ComplaintSeverity.HIGH,
      stage: SlaStage.INVESTIGATION,
      enteredAt: '2026-06-18T09:00:00.000Z',
    }),
    (error: unknown) => error instanceof AppException && error.code === 'SLA_POLICY_MISSING',
  );
  assert.equal(createCalled, false);
});

test('SLA policy escalation config persists and audits in the same transaction', async () => {
  const txClient = {};
  const audits: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const updates: unknown[] = [];
  const serviceWithAudit = new SlaService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    updatePolicyEscalationConfig: async (id, data, client) => {
      assert.equal(id, 'policy_1');
      assert.equal(client, txClient);
      updates.push(data);
      return policyEscalationRecord({ ...data });
    },
  } as unknown as SlaRepository, undefined, { record: async (input, client) => audits.push({ input, client }) } as unknown as AuditService);

  const result = await serviceWithAudit.updatePolicyEscalationConfig(' policy_1 ', parseUpdateSlaEscalationConfigBody({
    escalationLevel1: ' branch-manager ',
    escalationLevel2: 'service-manager',
    escalationLevel3: null,
    escalationLevel2AfterBreachMinutes: 30,
    escalationLevel3AfterBreachMinutes: null,
  }), { actorId: 'usr_admin', correlationId: 'req_sla', ipAddress: '203.0.113.12', userAgent: 'node:test' });

  assert.equal(result.escalationLevel1, 'branch-manager');
  assert.deepEqual(updates[0], {
    escalationLevel1: 'branch-manager',
    escalationLevel2: 'service-manager',
    escalationLevel3: null,
    escalationLevel2AfterBreachMinutes: 30,
    escalationLevel3AfterBreachMinutes: null,
  });
  assert.equal(audits[0]?.client, txClient);
  assert.deepEqual(audits[0]?.input, {
    eventType: 'CONFIG',
    action: 'sla_policy_escalation_updated',
    actorId: 'usr_admin',
    branchId: null,
    targetType: 'sla_policy',
    targetId: 'policy_1',
    correlationId: 'req_sla',
    ipAddress: '203.0.113.12',
    userAgent: 'node:test',
    metadata: { changedFields: ['escalationLevel1', 'escalationLevel2', 'escalationLevel3', 'escalationLevel2AfterBreachMinutes', 'escalationLevel3AfterBreachMinutes'] },
  });
  assert.equal(JSON.stringify(audits[0]).includes('branch-manager'), false);
  assert.equal(JSON.stringify(audits[0]).includes('service-manager'), false);
});

test('SLA policy list and full config update expose MVP fields and audit in one transaction', async () => {
  const txClient = {};
  const audits: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const updates: unknown[] = [];
  const serviceWithAudit = new SlaService({
    listPolicies: async () => [policy({ id: 'policy_1', pausePolicy: 'NONE', totalTargetMinutes: 2880 })],
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    updatePolicyConfig: async (id, data, client) => {
      assert.equal(id, 'policy_1');
      assert.equal(client, txClient);
      updates.push(data);
      return policyEscalationRecord({ ...data, pausePolicy: 'NONE', totalTargetMinutes: 2880 });
    },
  } as unknown as SlaRepository, undefined, { record: async (input, client) => audits.push({ input, client }) } as unknown as AuditService);

  const listed = await serviceWithAudit.listPolicies();
  assert.equal(listed.items[0]?.durationMinutes, 480);
  assert.equal(listed.items[0]?.warningPercent, 80);
  assert.equal(listed.items[0]?.pausePolicy, 'NONE');
  assert.equal(listed.items[0]?.totalTargetMinutes, 2880);

  const result = await serviceWithAudit.updatePolicyConfig(' policy_1 ', parseUpdateSlaPolicyConfigBody({
    durationMinutes: 360,
    warningPercent: 75,
    branchTimezone: 'Africa/Cairo',
    workingCalendarMode: WorkingCalendarMode.ALWAYS_ON,
    escalationLevel1: 'branch-manager',
    escalationLevel2: 'service-manager',
    escalationLevel3: null,
    escalationLevel2AfterBreachMinutes: 30,
    escalationLevel3AfterBreachMinutes: null,
  }), { actorId: 'usr_admin', correlationId: 'req_sla', ipAddress: '203.0.113.12', userAgent: 'node:test' });

  assert.equal(result.durationMinutes, 360);
  assert.equal(result.warningPercent, 75);
  assert.equal(result.branchTimezone, 'Africa/Cairo');
  assert.deepEqual(updates[0], {
    durationMinutes: 360,
    warningPercent: 75,
    branchTimezone: 'Africa/Cairo',
    workingCalendarMode: WorkingCalendarMode.ALWAYS_ON,
    escalationLevel1: 'branch-manager',
    escalationLevel2: 'service-manager',
    escalationLevel3: null,
    escalationLevel2AfterBreachMinutes: 30,
    escalationLevel3AfterBreachMinutes: null,
  });
  assert.equal(audits[0]?.client, txClient);
  assert.deepEqual(audits[0]?.input.metadata, {
    changedFields: ['durationMinutes', 'warningPercent', 'branchTimezone', 'workingCalendarMode', 'escalationLevel1', 'escalationLevel2', 'escalationLevel3', 'escalationLevel2AfterBreachMinutes', 'escalationLevel3AfterBreachMinutes'],
  });
  assert.equal(JSON.stringify(audits[0]).includes('branch-manager'), false);
});

test('SLA policy escalation config validation rejects unsafe timing shapes', () => {
  assertValidationFields({ escalationLevel1: 'l1', escalationLevel2: 'l2' }, ['escalationLevel2AfterBreachMinutes']);
  assertValidationFields({ escalationLevel1: 'l1', escalationLevel2AfterBreachMinutes: 10 }, ['escalationLevel2']);
  assertValidationFields({ escalationLevel1: 'l1', escalationLevel3: 'l3' }, ['escalationLevel3AfterBreachMinutes']);
  assertValidationFields({ escalationLevel1: 'l1', escalationLevel2: 'l2', escalationLevel3: 'l3', escalationLevel2AfterBreachMinutes: 20, escalationLevel3AfterBreachMinutes: 20 }, ['escalationLevel3AfterBreachMinutes']);
  assertValidationFields({ escalationLevel1: ' ', escalationLevel2AfterBreachMinutes: 0 }, ['escalationLevel1', 'escalationLevel2AfterBreachMinutes']);
});

test('SLA policy config validation rejects unsafe MVP fields', () => {
  assert.throws(
    () => parseUpdateSlaPolicyConfigBody({
      durationMinutes: 0,
      warningPercent: 101,
      branchTimezone: 'Not/A_Timezone',
      workingCalendarMode: 'browser',
      escalationLevel1: 'branch-manager',
    }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED' && assert.deepEqual(error.fieldErrors.map((item) => item.field), ['durationMinutes', 'warningPercent', 'branchTimezone', 'workingCalendarMode']) === undefined,
  );
});

test('SLA policy escalation route requires SLA_MANAGE and CSRF', async () => {
  assert.deepEqual(guardNames('listPolicies'), ['SessionAuthGuard', 'PermissionGuard']);
  assert.deepEqual(guardNames('updatePolicyConfig'), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('updatePolicyEscalationConfig'), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);

  const auditRecords: AuditRecordInput[] = [];
  const guard = new PermissionGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  assert.equal(await guard.canActivate(context(request(['SLA_MANAGE']), 'updatePolicyEscalationConfig')), true);
  await assert.rejects(
    guard.canActivate(context(request([], '/sla/policies/policy_1/escalation?sessionToken=leaked&password=leaked'), 'updatePolicyEscalationConfig')),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'permission_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata?.requiredPermissions, ['SLA_MANAGE']);
  assertSafePermissionAudit(auditRecords);
});

test('SLA module and OpenAPI document policy escalation config route', () => {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, SlaModule) as unknown[];
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, SlaModule) as unknown[];
  const openapi = JSON.parse(readFileSync('packages/contracts/openapi.json', 'utf8'));

  assert.ok(imports.includes(AuthModule));
  assert.ok(imports.includes(NotificationsModule));
  assert.ok(providers.includes(SessionAuthGuard));
  assert.ok(providers.includes(PermissionGuard));
  assert.ok(providers.includes(CsrfGuard));
  assert.equal(providers.some((provider) => providerObject(provider)?.provide === SESSION_AUTH_SERVICE), true);
  assert.ok(openapi.paths['/sla/policies']?.get);
  assert.ok(openapi.paths['/sla/policies/{id}']?.patch);
  assert.ok(openapi.paths['/sla/policies/{id}/escalation']?.patch);
  assert.ok(openapi.components.schemas.SlaPolicyConfigRequest);
  assert.ok(openapi.components.schemas.SlaPolicyListResponse);
  assert.ok(openapi.components.schemas.SlaPolicyEscalationConfigRequest);
  assert.ok(openapi.components.schemas.SlaPolicyWriteResponse);
});

test('SLA warning job skips terminal complaint status without writing', async () => {
  let createCalled = false;
  const runner = new SlaService({
    findDeadlineEventsForWarning: async () => [deadlineWarning({ complaint: { status: ComplaintStatus.REJECTED, ownerId: null, slaEvents: [] } })],
    createWarningEvent: async () => {
      createCalled = true;
      throw new Error('should not create warning');
    },
  } as unknown as SlaRepository);

  assert.deepEqual(await runner.runWarningJob('2026-06-18T17:00:00.000Z'), {
    scanned: 1,
    created: 0,
    skipped: 1,
    warningIdempotencyKeys: [],
  });
  assert.equal(createCalled, false);
});

test('SLA warning job skips deadlines paused after creation and allows newer deadlines', async () => {
  const warnings: unknown[] = [];
  const runner = new SlaService({
    findDeadlineEventsForWarning: async () => [
      deadlineWarning({
        idempotencyKey: 'deadline_paused',
        occurredAt: '2026-06-18T09:00:00.000Z',
        complaint: { status: ComplaintStatus.IN_PROGRESS, ownerId: null, slaEvents: [pauseEvent('2026-06-18T10:00:00.000Z')] },
      }),
      deadlineWarning({
        idempotencyKey: 'deadline_after_reopen',
        occurredAt: '2026-06-18T11:00:00.000Z',
        complaint: { status: ComplaintStatus.IN_PROGRESS, ownerId: null, slaEvents: [pauseEvent('2026-06-18T10:00:00.000Z')] },
      }),
    ],
    createWarningEvent: async (event) => {
      warnings.push(event);
      return true;
    },
  } as unknown as SlaRepository);

  assert.deepEqual(await runner.runWarningJob('2026-06-18T17:00:00.000Z'), {
    scanned: 2,
    created: 1,
    skipped: 1,
    warningIdempotencyKeys: ['sla:warning:deadline_after_reopen'],
  });
  assert.equal(warnings.length, 1);
});

test('SLA warning job filters due deadlines and records warnings idempotently', async () => {
  const warnings = new Map<string, { complaintId: string; policyId: string | null; stage: SlaStage; dueAt: Date; idempotencyKey: string }>();
  const runner = new SlaService({
    findDeadlineEventsForWarning: async () => [
      deadlineWarning({ idempotencyKey: 'deadline_due', dueAt: '2026-06-18T17:00:00.000Z' }),
      deadlineWarning({ idempotencyKey: 'deadline_not_due', dueAt: '2026-06-18T18:00:00.000Z' }),
      deadlineWarning({ idempotencyKey: 'deadline_malformed', dueAt: null }),
    ],
    createWarningEvent: async (event) => {
      const existing = warnings.get(event.idempotencyKey);
      if (existing) return false;
      warnings.set(event.idempotencyKey, event);
      return true;
    },
  } as SlaRepository);

  const first = await runner.runWarningJob('2026-06-18T15:24:00.000Z');
  const second = await runner.runWarningJob('2026-06-18T15:24:00.000Z');

  assert.deepEqual(first, {
    scanned: 3,
    created: 1,
    skipped: 2,
    warningIdempotencyKeys: ['sla:warning:deadline_due'],
  });
  assert.deepEqual(second, {
    scanned: 3,
    created: 0,
    skipped: 3,
    warningIdempotencyKeys: [],
  });
  assert.equal(warnings.size, 1);
});

test('SLA warning job queues one owner notification only for a new warning event', async () => {
  const warnings = new Map<string, { complaintId: string; policyId: string | null; stage: SlaStage; dueAt: Date; idempotencyKey: string }>();
  const notifications: unknown[] = [];
  const runner = new SlaService({
    findDeadlineEventsForWarning: async () => [deadlineWarning({ idempotencyKey: 'deadline_due', complaint: { status: ComplaintStatus.IN_PROGRESS, ownerId: 'usr_owner', slaEvents: [] } })],
    createWarningEvent: async (event) => {
      const existing = warnings.get(event.idempotencyKey);
      if (existing) return false;
      warnings.set(event.idempotencyKey, event);
      return true;
    },
  } as SlaRepository, {
    queueInternal: async (input) => {
      notifications.push(input);
      return {} as never;
    },
  } as NotificationsService);

  assert.deepEqual(await runner.runWarningJob('2026-06-18T15:24:00.000Z'), {
    scanned: 1,
    created: 1,
    skipped: 0,
    warningIdempotencyKeys: ['sla:warning:deadline_due'],
  });
  assert.deepEqual(await runner.runWarningJob('2026-06-18T15:24:00.000Z'), {
    scanned: 1,
    created: 0,
    skipped: 1,
    warningIdempotencyKeys: [],
  });
  assert.equal(warnings.size, 1);
  assert.deepEqual(notifications, [{
    complaintId: 'cmp_1',
    recipientUserId: 'usr_owner',
    templateCode: 'sla.warning.internal',
    locale: 'en',
    idempotencyKey: 'sla:warning:deadline_due',
    payload: {
      complaintId: 'cmp_1',
      policyId: 'policy_1',
      stage: SlaStage.INVESTIGATION,
      dueAt: '2026-06-18T17:00:00.000Z',
      warningIdempotencyKey: 'sla:warning:deadline_due',
    },
  }]);
});

test('SLA warning job creates missing-owner warnings without notification', async () => {
  const warnings: unknown[] = [];
  const runner = new SlaService({
    findDeadlineEventsForWarning: async () => [deadlineWarning({ idempotencyKey: 'deadline_no_owner', complaint: { status: ComplaintStatus.IN_PROGRESS, ownerId: null, slaEvents: [] } })],
    createWarningEvent: async (event) => {
      warnings.push(event);
      return true;
    },
  } as unknown as SlaRepository, throwingNotifications());

  assert.deepEqual(await runner.runWarningJob('2026-06-18T15:24:00.000Z'), {
    scanned: 1,
    created: 1,
    skipped: 0,
    warningIdempotencyKeys: ['sla:warning:deadline_no_owner'],
  });
  assert.equal(warnings.length, 1);
});

test('SLA warning job does not notify skipped warning paths', async () => {
  let createCalled = false;
  const runner = new SlaService({
    findDeadlineEventsForWarning: async () => [
      deadlineWarning({ idempotencyKey: 'terminal', complaint: { status: ComplaintStatus.CLOSED, ownerId: 'usr_owner', slaEvents: [] } }),
      deadlineWarning({ idempotencyKey: 'paused', complaint: { status: ComplaintStatus.IN_PROGRESS, ownerId: 'usr_owner', slaEvents: [pauseEvent('2026-06-18T10:00:00.000Z')] } }),
      deadlineWarning({ idempotencyKey: 'future', dueAt: '2026-06-18T18:00:00.000Z', complaint: { status: ComplaintStatus.IN_PROGRESS, ownerId: 'usr_owner', slaEvents: [] } }),
      deadlineWarning({ idempotencyKey: 'bad_policy', policy: { durationMinutes: 480, warningPercent: 101 }, complaint: { status: ComplaintStatus.IN_PROGRESS, ownerId: 'usr_owner', slaEvents: [] } }),
    ],
    createWarningEvent: async () => {
      createCalled = true;
      throw new Error('should not create warning');
    },
  } as unknown as SlaRepository, throwingNotifications());

  assert.deepEqual(await runner.runWarningJob('2026-06-18T15:24:00.000Z'), {
    scanned: 4,
    created: 0,
    skipped: 4,
    warningIdempotencyKeys: [],
  });
  assert.equal(createCalled, false);
});

test('SLA warning job skips invalid stored policy values', async () => {
  let createCalled = false;
  const runner = new SlaService({
    findDeadlineEventsForWarning: async () => [
      deadlineWarning({ idempotencyKey: 'zero_duration', policy: { durationMinutes: 0, warningPercent: 80 } }),
      deadlineWarning({ idempotencyKey: 'bad_percent', policy: { durationMinutes: 480, warningPercent: 101 } }),
    ],
    createWarningEvent: async () => {
      createCalled = true;
      throw new Error('should not create warning');
    },
  } as unknown as SlaRepository);

  assert.deepEqual(await runner.runWarningJob('2026-06-18T17:00:00.000Z'), {
    scanned: 2,
    created: 0,
    skipped: 2,
    warningIdempotencyKeys: [],
  });
  assert.equal(createCalled, false);
});

test('SLA warning job is a no-op when nothing is due', async () => {
  let createCalled = false;
  const runner = new SlaService({
    findDeadlineEventsForWarning: async () => [
      deadlineWarning({ idempotencyKey: 'future', dueAt: '2026-06-18T18:00:00.000Z' }),
    ],
    createWarningEvent: async () => {
      createCalled = true;
      throw new Error('should not create warning');
    },
  } as unknown as SlaRepository);

  assert.deepEqual(await runner.runWarningJob('2026-06-18T14:23:59.000Z'), {
    scanned: 1,
    created: 0,
    skipped: 1,
    warningIdempotencyKeys: [],
  });
  assert.equal(createCalled, false);
});

test('SLA breach job queues one configured escalation notification only for a new breach event', async () => {
  const breaches = new Map<string, { complaintId: string; policyId: string | null; stage: SlaStage; dueAt: Date; idempotencyKey: string }>();
  const notifications: unknown[] = [];
  const runner = new SlaService({
    findDeadlineEventsForBreach: async () => [deadlineBreach({ idempotencyKey: 'deadline_due', policy: policyEscalation() })],
    createBreachEvent: async (event) => {
      const existing = breaches.get(event.idempotencyKey);
      if (existing) return false;
      breaches.set(event.idempotencyKey, event);
      return true;
    },
  } as SlaRepository, {
    queueInternal: async (input) => {
      notifications.push(input);
      return {} as never;
    },
  } as NotificationsService);

  assert.deepEqual(await runner.runBreachJob('2026-06-18T17:00:00.000Z'), {
    scanned: 1,
    created: 1,
    skipped: 0,
    breachIdempotencyKeys: ['sla:breach:deadline_due'],
  });
  assert.deepEqual(await runner.runBreachJob('2026-06-18T17:00:00.000Z'), {
    scanned: 1,
    created: 0,
    skipped: 1,
    breachIdempotencyKeys: [],
  });
  assert.equal(breaches.size, 1);
  assert.deepEqual(notifications, [{
    complaintId: 'cmp_1',
    templateCode: 'sla.breach.internal',
    locale: 'en',
    idempotencyKey: 'sla:breach:deadline_due',
    payload: {
      complaintId: 'cmp_1',
      policyId: 'policy_1',
      stage: SlaStage.INVESTIGATION,
      dueAt: '2026-06-18T17:00:00.000Z',
      breachIdempotencyKey: 'sla:breach:deadline_due',
      escalationLevel: 'branch-manager',
    },
  }]);
});

test('SLA escalation job queues one level2 notification when after-breach delay is due', async () => {
  const notifications: unknown[] = [];
  const runner = new SlaService({
    findBreachEventsForEscalation: async () => [deadlineBreach({
      idempotencyKey: 'sla:breach:deadline_due',
      occurredAt: '2026-06-18T17:00:00.000Z',
      policy: policyEscalation({ escalationLevel2: 'service-manager', escalationLevel2AfterBreachMinutes: 30 }),
    })],
  } as unknown as SlaRepository, queueOnceNotifications(notifications));

  assert.deepEqual(await runner.runEscalationJob('2026-06-18T17:30:00.000Z'), {
    scanned: 1,
    queued: 1,
    skipped: 0,
    escalationIdempotencyKeys: ['sla:escalation:deadline_due:LEVEL2'],
  });
  assert.deepEqual(notifications, [{
    complaintId: 'cmp_1',
    templateCode: 'sla.breach.internal',
    locale: 'en',
    idempotencyKey: 'sla:escalation:deadline_due:LEVEL2',
    payload: {
      complaintId: 'cmp_1',
      policyId: 'policy_1',
      stage: SlaStage.INVESTIGATION,
      dueAt: '2026-06-18T17:00:00.000Z',
      breachIdempotencyKey: 'sla:breach:deadline_due',
      escalationLevel: 'service-manager',
      escalationStep: 'LEVEL2',
      escalationIdempotencyKey: 'sla:escalation:deadline_due:LEVEL2',
    },
  }]);
});

test('SLA escalation job queues one level3 notification when after-breach delay is due', async () => {
  const notifications: unknown[] = [];
  const runner = new SlaService({
    findBreachEventsForEscalation: async () => [deadlineBreach({
      idempotencyKey: 'sla:breach:deadline_due',
      occurredAt: '2026-06-18T17:00:00.000Z',
      policy: policyEscalation({ escalationLevel3: 'general-manager', escalationLevel3AfterBreachMinutes: 90 }),
    })],
  } as unknown as SlaRepository, queueOnceNotifications(notifications));

  assert.deepEqual(await runner.runEscalationJob('2026-06-18T18:30:00.000Z'), {
    scanned: 1,
    queued: 1,
    skipped: 0,
    escalationIdempotencyKeys: ['sla:escalation:deadline_due:LEVEL3'],
  });
  assert.equal(notifications.length, 1);
  assert.deepEqual(notifications[0], {
    complaintId: 'cmp_1',
    templateCode: 'sla.breach.internal',
    locale: 'en',
    idempotencyKey: 'sla:escalation:deadline_due:LEVEL3',
    payload: {
      complaintId: 'cmp_1',
      policyId: 'policy_1',
      stage: SlaStage.INVESTIGATION,
      dueAt: '2026-06-18T17:00:00.000Z',
      breachIdempotencyKey: 'sla:breach:deadline_due',
      escalationLevel: 'general-manager',
      escalationStep: 'LEVEL3',
      escalationIdempotencyKey: 'sla:escalation:deadline_due:LEVEL3',
    },
  });
});

test('SLA escalation job duplicate retry creates no duplicate notification row', async () => {
  const notifications: unknown[] = [];
  const runner = new SlaService({
    findBreachEventsForEscalation: async () => [deadlineBreach({
      idempotencyKey: 'sla:breach:deadline_due',
      occurredAt: '2026-06-18T17:00:00.000Z',
      policy: policyEscalation({ escalationLevel2: 'service-manager', escalationLevel2AfterBreachMinutes: 30 }),
    })],
  } as unknown as SlaRepository, queueOnceNotifications(notifications));

  await runner.runEscalationJob('2026-06-18T17:30:00.000Z');
  await runner.runEscalationJob('2026-06-18T17:30:00.000Z');

  assert.equal(notifications.length, 1);
});

test('SLA escalation job skips missing route token and missing delay', async () => {
  const runner = new SlaService({
    findBreachEventsForEscalation: async () => [
      deadlineBreach({
        idempotencyKey: 'sla:breach:missing_route',
        occurredAt: '2026-06-18T17:00:00.000Z',
        policy: policyEscalation({ escalationLevel2: ' ', escalationLevel2AfterBreachMinutes: 30 }),
      }),
      deadlineBreach({
        idempotencyKey: 'sla:breach:missing_delay',
        occurredAt: '2026-06-18T17:00:00.000Z',
        policy: policyEscalation({ escalationLevel2: 'service-manager', escalationLevel2AfterBreachMinutes: null }),
      }),
    ],
  } as unknown as SlaRepository, throwingNotifications());

  assert.deepEqual(await runner.runEscalationJob('2026-06-18T17:30:00.000Z'), {
    scanned: 2,
    queued: 0,
    skipped: 2,
    escalationIdempotencyKeys: [],
  });
});

test('SLA escalation job skips terminal paused and future paths', async () => {
  const runner = new SlaService({
    findBreachEventsForEscalation: async () => [
      deadlineBreach({
        idempotencyKey: 'sla:breach:terminal',
        occurredAt: '2026-06-18T17:00:00.000Z',
        complaint: { status: ComplaintStatus.CLOSED, slaEvents: [] },
        policy: policyEscalation({ escalationLevel2: 'service-manager', escalationLevel2AfterBreachMinutes: 30 }),
      }),
      deadlineBreach({
        idempotencyKey: 'sla:breach:paused',
        occurredAt: '2026-06-18T17:00:00.000Z',
        complaint: { status: ComplaintStatus.IN_PROGRESS, slaEvents: [pauseEvent('2026-06-18T17:01:00.000Z')] },
        policy: policyEscalation({ escalationLevel2: 'service-manager', escalationLevel2AfterBreachMinutes: 30 }),
      }),
      deadlineBreach({
        idempotencyKey: 'sla:breach:future',
        occurredAt: '2026-06-18T17:00:00.000Z',
        policy: policyEscalation({ escalationLevel2: 'service-manager', escalationLevel2AfterBreachMinutes: 31 }),
      }),
    ],
  } as unknown as SlaRepository, throwingNotifications());

  assert.deepEqual(await runner.runEscalationJob('2026-06-18T17:30:00.000Z'), {
    scanned: 3,
    queued: 0,
    skipped: 3,
    escalationIdempotencyKeys: [],
  });
});

test('SLA breach job creates missing-escalation breaches without notification', async () => {
  const breaches: unknown[] = [];
  const runner = new SlaService({
    findDeadlineEventsForBreach: async () => [
      deadlineBreach({ idempotencyKey: 'deadline_no_policy', policy: null }),
      deadlineBreach({ idempotencyKey: 'deadline_no_route', policy: policyEscalation({ escalationLevel1: '' }) }),
    ],
    createBreachEvent: async (event) => {
      breaches.push(event);
      return true;
    },
  } as unknown as SlaRepository, throwingNotifications());

  assert.deepEqual(await runner.runBreachJob('2026-06-18T17:00:00.000Z'), {
    scanned: 2,
    created: 2,
    skipped: 0,
    breachIdempotencyKeys: ['sla:breach:deadline_no_policy', 'sla:breach:deadline_no_route'],
  });
  assert.equal(breaches.length, 2);
});

test('SLA breach job does not notify skipped breach paths', async () => {
  let createCalled = false;
  const runner = new SlaService({
    findDeadlineEventsForBreach: async () => [
      deadlineBreach({ idempotencyKey: 'future', dueAt: '2026-06-18T17:00:01.000Z', policy: policyEscalation() }),
      deadlineBreach({ idempotencyKey: 'terminal', complaint: { status: ComplaintStatus.CLOSED, slaEvents: [] }, policy: policyEscalation() }),
      deadlineBreach({ idempotencyKey: 'paused', complaint: { status: ComplaintStatus.IN_PROGRESS, slaEvents: [pauseEvent('2026-06-18T10:00:00.000Z')] }, policy: policyEscalation() }),
    ],
    createBreachEvent: async () => {
      createCalled = true;
      throw new Error('should not create breach');
    },
  } as unknown as SlaRepository, throwingNotifications());

  assert.deepEqual(await runner.runBreachJob('2026-06-18T17:00:00.000Z'), {
    scanned: 3,
    created: 0,
    skipped: 3,
    breachIdempotencyKeys: [],
  });
  assert.equal(createCalled, false);
});

test('SLA breach job skips future deadlines without writing', async () => {
  let createCalled = false;
  const runner = new SlaService({
    findDeadlineEventsForBreach: async () => [deadlineBreach({ idempotencyKey: 'future', dueAt: '2026-06-18T17:00:01.000Z' })],
    createBreachEvent: async () => {
      createCalled = true;
      throw new Error('should not create breach');
    },
  } as unknown as SlaRepository, throwingNotifications());

  assert.deepEqual(await runner.runBreachJob('2026-06-18T17:00:00.000Z'), {
    scanned: 1,
    created: 0,
    skipped: 1,
    breachIdempotencyKeys: [],
  });
  assert.equal(createCalled, false);
});

test('SLA breach job skips terminal complaint status without writing', async () => {
  let createCalled = false;
  const runner = new SlaService({
    findDeadlineEventsForBreach: async () => [deadlineBreach({ complaint: { status: ComplaintStatus.CLOSED } })],
    createBreachEvent: async () => {
      createCalled = true;
      throw new Error('should not create breach');
    },
  } as unknown as SlaRepository, throwingNotifications());

  assert.deepEqual(await runner.runBreachJob('2026-06-18T17:00:00.000Z'), {
    scanned: 1,
    created: 0,
    skipped: 1,
    breachIdempotencyKeys: [],
  });
  assert.equal(createCalled, false);
});

test('SLA breach job skips deadlines paused after creation without writing', async () => {
  let createCalled = false;
  const runner = new SlaService({
    findDeadlineEventsForBreach: async () => [deadlineBreach({
      occurredAt: '2026-06-18T09:00:00.000Z',
      complaint: { status: ComplaintStatus.IN_PROGRESS, slaEvents: [pauseEvent('2026-06-18T10:00:00.000Z')] },
    })],
    createBreachEvent: async () => {
      createCalled = true;
      throw new Error('should not create breach');
    },
  } as unknown as SlaRepository, throwingNotifications());

  assert.deepEqual(await runner.runBreachJob('2026-06-18T17:00:00.000Z'), {
    scanned: 1,
    created: 0,
    skipped: 1,
    breachIdempotencyKeys: [],
  });
  assert.equal(createCalled, false);
});

function assertPolicyMissing(input: Parameters<SlaService['calculateDeadline']>[0], field: string): void {
  assert.throws(
    () => service.calculateDeadline(input),
    (error: unknown) =>
      error instanceof AppException &&
      error.code === 'SLA_POLICY_MISSING' &&
      error.fieldErrors[0]?.field === field,
  );
}

type PolicyOverrides = Partial<Omit<SlaPolicyRecord, 'updatedAt'>> & { updatedAt?: Date | string };

function policy(overrides: PolicyOverrides = {}): SlaPolicyRecord {
  const { updatedAt, ...rest } = overrides;
  return {
    id: 'policy',
    severity: ComplaintSeverity.HIGH,
    stage: SlaStage.INVESTIGATION,
    branchId: null,
    departmentId: null,
    categoryId: null,
    durationMinutes: 480,
    warningPercent: 80,
    branchTimezone: 'Asia/Riyadh',
    workingCalendarMode: WorkingCalendarMode.ALWAYS_ON,
    pausePolicy: 'NONE',
    escalationLevel1: 'branch-manager',
    escalationLevel2: null,
    escalationLevel3: null,
    escalationLevel2AfterBreachMinutes: null,
    escalationLevel3AfterBreachMinutes: null,
    totalTargetMinutes: null,
    isActive: true,
    updatedAt: new Date('2026-06-18T09:00:00.000Z'),
    ...rest,
    updatedAt: updatedAt ? new Date(updatedAt) : new Date('2026-06-18T09:00:00.000Z'),
  };
}

type DeadlineWarningOverrides = Partial<Omit<SlaDeadlineWarningRecord, 'dueAt' | 'policy' | 'occurredAt' | 'complaint'>> & {
  dueAt?: Date | string | null;
  occurredAt?: Date | string;
  policy?: SlaDeadlineWarningRecord['policy'];
  complaint?: SlaDeadlineWarningRecord['complaint'];
};

function deadlineWarning(overrides: DeadlineWarningOverrides = {}): SlaDeadlineWarningRecord {
  const { dueAt, occurredAt, policy: selectedPolicy, complaint, ...rest } = overrides;
  return {
    complaintId: 'cmp_1',
    policyId: 'policy_1',
    stage: SlaStage.INVESTIGATION,
    dueAt: dueAt === null ? null : new Date(dueAt ?? '2026-06-18T17:00:00.000Z'),
    occurredAt: new Date(occurredAt ?? '2026-06-18T09:00:00.000Z'),
    idempotencyKey: 'deadline_1',
    policy: selectedPolicy ?? { durationMinutes: 480, warningPercent: 80 },
    complaint: complaint ?? { status: ComplaintStatus.IN_PROGRESS, ownerId: null, slaEvents: [] },
    ...rest,
  };
}

type DeadlineBreachOverrides = Partial<Omit<SlaDeadlineBreachRecord, 'dueAt' | 'occurredAt' | 'complaint'>> & {
  dueAt?: Date | string | null;
  occurredAt?: Date | string;
  complaint?: SlaDeadlineBreachRecord['complaint'];
  policy?: SlaDeadlineBreachRecord['policy'];
};

function deadlineBreach(overrides: DeadlineBreachOverrides = {}): SlaDeadlineBreachRecord {
  const { dueAt, occurredAt, complaint, policy: selectedPolicy, ...rest } = overrides;
  return {
    complaintId: 'cmp_1',
    policyId: 'policy_1',
    stage: SlaStage.INVESTIGATION,
    dueAt: dueAt === null ? null : new Date(dueAt ?? '2026-06-18T17:00:00.000Z'),
    occurredAt: new Date(occurredAt ?? '2026-06-18T09:00:00.000Z'),
    idempotencyKey: 'deadline_1',
    policy: selectedPolicy === undefined ? policyEscalation() : selectedPolicy,
    complaint: complaint ?? { status: ComplaintStatus.IN_PROGRESS, slaEvents: [] },
    ...rest,
  };
}

function pauseEvent(occurredAt: Date | string, stage = SlaStage.INVESTIGATION) {
  return { type: SlaEventType.PAUSED, stage, occurredAt: new Date(occurredAt) };
}

function policyEscalation(overrides: Partial<NonNullable<SlaDeadlineBreachRecord['policy']>> = {}): NonNullable<SlaDeadlineBreachRecord['policy']> {
  return {
    escalationLevel1: 'branch-manager',
    escalationLevel2: null,
    escalationLevel3: null,
    escalationLevel2AfterBreachMinutes: null,
    escalationLevel3AfterBreachMinutes: null,
    ...overrides,
  };
}

function policyEscalationRecord(overrides: Partial<SlaPolicyEscalationRecord> = {}): SlaPolicyEscalationRecord {
  return {
    id: 'policy_1',
    severity: ComplaintSeverity.HIGH,
    stage: SlaStage.INVESTIGATION,
    branchId: null,
    departmentId: null,
    categoryId: null,
    durationMinutes: 480,
    warningPercent: 80,
    branchTimezone: 'Asia/Riyadh',
    workingCalendarMode: WorkingCalendarMode.ALWAYS_ON,
    pausePolicy: 'NONE',
    escalationLevel1: 'branch-manager',
    escalationLevel2: null,
    escalationLevel3: null,
    escalationLevel2AfterBreachMinutes: null,
    escalationLevel3AfterBreachMinutes: null,
    totalTargetMinutes: null,
    isActive: true,
    ...overrides,
  };
}

function assertValidationFields(body: Record<string, unknown>, fields: string[]): void {
  assert.throws(
    () => parseUpdateSlaEscalationConfigBody(body),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED' && assert.deepEqual(error.fieldErrors.map((item) => item.field), fields) === undefined,
  );
}

const adminPrincipal: StaffPrincipal = {
  sessionId: 'ses_sla',
  userId: 'usr_admin',
  email: 'admin@cms-auto.test',
  nameEn: 'Admin',
  nameAr: 'Admin',
  roleCode: 'ADMIN',
  permissions: ['SLA_MANAGE'],
  branchId: null,
};

function request(permissions = adminPrincipal.permissions, url = '/sla/policies/policy_1/escalation'): AuthenticatedRequest {
  return {
    principal: { ...adminPrincipal, permissions },
    method: 'PATCH',
    url,
    correlationId: 'req_sla_guard',
    headers: { 'x-forwarded-for': '203.0.113.20, 10.0.0.1', 'user-agent': 'node:test token secret' },
    socket: { remoteAddress: '127.0.0.1' },
  };
}

function context(req: AuthenticatedRequest, handler: keyof SlaController): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => SlaController.prototype[handler],
    getClass: () => SlaController,
  } as ExecutionContext;
}

function guardNames(handler: keyof SlaController): string[] {
  const guards = Reflect.getMetadata(GUARDS_METADATA, SlaController.prototype[handler]) as Array<{ name: string }>;
  return guards.map((guard) => guard.name);
}

function providerObject(provider: unknown): { provide?: unknown } | null {
  return provider && typeof provider === 'object' ? provider as { provide?: unknown } : null;
}

function assertSafePermissionAudit(auditRecords: AuditRecordInput[]): void {
  const auditJson = JSON.stringify(auditRecords).toLowerCase();
  for (const forbidden of ['password', 'otp', 'token', 'reset token', 'session token', 'hash', 'secret', 'credential', 'provider']) {
    assert.equal(auditJson.includes(forbidden), false);
  }
}

function throwingNotifications(): NotificationsService {
  return {
    queueInternal: async () => {
      throw new Error('should not queue notification');
    },
  } as NotificationsService;
}

function queueOnceNotifications(notifications: unknown[]): NotificationsService {
  const idempotencyKeys = new Set<string>();
  return {
    queueInternal: async (input) => {
      if (!input.idempotencyKey || !idempotencyKeys.has(input.idempotencyKey)) {
        if (input.idempotencyKey) idempotencyKeys.add(input.idempotencyKey);
        notifications.push(input);
      }
      return {} as never;
    },
  } as NotificationsService;
}
