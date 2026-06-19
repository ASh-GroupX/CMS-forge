import assert from 'node:assert/strict';
import test from 'node:test';
import { ComplaintSeverity, ComplaintStatus, SlaEventType, SlaStage, WorkingCalendarMode } from '@prisma/client';
import type { PrismaService } from '../../src/core/http-kernel.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { SlaRepository } from '../../src/modules/sla/sla.repository.ts';
import type { SlaDeadlineBreachRecord, SlaDeadlineWarningRecord, SlaPolicyRecord } from '../../src/modules/sla/sla.repository.ts';
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
      where: { type: SlaEventType.DEADLINE_SET, dueAt: { not: null }, policy: { isNot: null } },
      select: {
        complaintId: true,
        policyId: true,
        stage: true,
        dueAt: true,
        idempotencyKey: true,
        policy: { select: { durationMinutes: true, warningPercent: true } },
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
        idempotencyKey: true,
        complaint: { select: { status: true } },
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

test('SLA breach job creates one reportable breach and skips duplicate retry', async () => {
  const breaches = new Map<string, { complaintId: string; policyId: string | null; stage: SlaStage; dueAt: Date; idempotencyKey: string }>();
  const runner = new SlaService({
    findDeadlineEventsForBreach: async () => [deadlineBreach({ idempotencyKey: 'deadline_due' })],
    createBreachEvent: async (event) => {
      const existing = breaches.get(event.idempotencyKey);
      if (existing) return false;
      breaches.set(event.idempotencyKey, event);
      return true;
    },
  } as SlaRepository);

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
});

test('SLA breach job skips future deadlines without writing', async () => {
  let createCalled = false;
  const runner = new SlaService({
    findDeadlineEventsForBreach: async () => [deadlineBreach({ idempotencyKey: 'future', dueAt: '2026-06-18T17:00:01.000Z' })],
    createBreachEvent: async () => {
      createCalled = true;
      throw new Error('should not create breach');
    },
  } as unknown as SlaRepository);

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
  } as unknown as SlaRepository);

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
    isActive: true,
    updatedAt: new Date('2026-06-18T09:00:00.000Z'),
    ...rest,
    updatedAt: updatedAt ? new Date(updatedAt) : new Date('2026-06-18T09:00:00.000Z'),
  };
}

type DeadlineWarningOverrides = Partial<Omit<SlaDeadlineWarningRecord, 'dueAt' | 'policy'>> & {
  dueAt?: Date | string | null;
  policy?: SlaDeadlineWarningRecord['policy'];
};

function deadlineWarning(overrides: DeadlineWarningOverrides = {}): SlaDeadlineWarningRecord {
  const { dueAt, policy: selectedPolicy, ...rest } = overrides;
  return {
    complaintId: 'cmp_1',
    policyId: 'policy_1',
    stage: SlaStage.INVESTIGATION,
    dueAt: dueAt === null ? null : new Date(dueAt ?? '2026-06-18T17:00:00.000Z'),
    idempotencyKey: 'deadline_1',
    policy: selectedPolicy ?? { durationMinutes: 480, warningPercent: 80 },
    ...rest,
  };
}

type DeadlineBreachOverrides = Partial<Omit<SlaDeadlineBreachRecord, 'dueAt' | 'complaint'>> & {
  dueAt?: Date | string | null;
  complaint?: SlaDeadlineBreachRecord['complaint'];
};

function deadlineBreach(overrides: DeadlineBreachOverrides = {}): SlaDeadlineBreachRecord {
  const { dueAt, complaint, ...rest } = overrides;
  return {
    complaintId: 'cmp_1',
    policyId: 'policy_1',
    stage: SlaStage.INVESTIGATION,
    dueAt: dueAt === null ? null : new Date(dueAt ?? '2026-06-18T17:00:00.000Z'),
    idempotencyKey: 'deadline_1',
    complaint: complaint ?? { status: ComplaintStatus.IN_PROGRESS },
    ...rest,
  };
}
