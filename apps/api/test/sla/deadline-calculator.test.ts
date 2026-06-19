import assert from 'node:assert/strict';
import test from 'node:test';
import { ComplaintSeverity, SlaStage, WorkingCalendarMode } from '@prisma/client';
import type { PrismaService } from '../../src/core/http-kernel.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { SlaRepository } from '../../src/modules/sla/sla.repository.ts';
import type { SlaPolicyRecord } from '../../src/modules/sla/sla.repository.ts';
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
    isActive: true,
    updatedAt: new Date('2026-06-18T09:00:00.000Z'),
    ...rest,
    updatedAt: updatedAt ? new Date(updatedAt) : new Date('2026-06-18T09:00:00.000Z'),
  };
}
