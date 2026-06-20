import assert from 'node:assert/strict';
import test from 'node:test';
import { ComplaintStatus, ComplaintTransitionAction, RoleCode, SlaEventType, TaskStatus } from '@prisma/client';
import { complaintCaseKpis, taskPromiseKpis } from '../../src/modules/reports/reports.kpi.js';
import type { ComplaintCaseKpiRow, ComplaintCaseSlaEvent, ComplaintCaseStatusEvent, TaskKpiRow, TaskKpiStatusEvent } from '../../src/modules/reports/reports.kpi.js';
import type { ComplaintCaseKpiReadRows, ReportsRepository, TaskKpiReadRows } from '../../src/modules/reports/reports.repository.js';
import { ReportsService } from '../../src/modules/reports/reports.service.js';

test('task KPI formulas derive completion from DONE status events', () => {
  const result = taskPromiseKpis([
    task('on_time', '2026-06-20T10:00:00.000Z', TaskStatus.DONE),
    task('late', '2026-06-20T10:00:00.000Z', TaskStatus.DONE),
    task('active_overdue', '2026-06-20T09:00:00.000Z', TaskStatus.IN_PROGRESS),
    task('done_without_event', '2026-06-20T08:00:00.000Z', TaskStatus.DONE),
  ], [
    event('on_time', TaskStatus.IN_PROGRESS, '2026-06-20T09:00:00.000Z'),
    event('on_time', TaskStatus.DONE, '2026-06-20T09:30:00.000Z'),
    event('late', TaskStatus.DONE, '2026-06-20T12:00:00.000Z'),
  ], new Date('2026-06-20T11:00:00.000Z'));

  assert.equal(result.onTimeCompletionPercent, 50);
  assert.equal(result.activeOverdueCount, 1);
  assert.equal(result.averageDelayHours, 1);
});

test('customer promise kept percent uses the same DONE-event completion logic', () => {
  const result = taskPromiseKpis([
    task('promise_kept', '2026-06-20T10:00:00.000Z', TaskStatus.DONE, true),
    task('promise_missed', '2026-06-20T10:00:00.000Z', TaskStatus.DONE, true),
    task('normal_done', '2026-06-20T10:00:00.000Z', TaskStatus.DONE),
  ], [
    event('promise_kept', TaskStatus.DONE, '2026-06-20T09:59:00.000Z'),
    event('promise_missed', TaskStatus.DONE, '2026-06-20T10:01:00.000Z'),
    event('normal_done', TaskStatus.DONE, '2026-06-20T12:00:00.000Z'),
  ], new Date('2026-06-20T11:00:00.000Z'));

  assert.equal(result.customerPromiseKeptPercent, 50);
});

test('empty KPI denominators return zero', () => {
  assert.deepEqual(taskPromiseKpis([], [], new Date('2026-06-20T11:00:00.000Z')), {
    onTimeCompletionPercent: 0,
    activeOverdueCount: 0,
    averageDelayHours: 0,
    customerPromiseKeptPercent: 0,
  });
});

test('task KPI result does not expose an individual closed-count leaderboard', () => {
  const result = taskPromiseKpis([task('done', '2026-06-20T10:00:00.000Z', TaskStatus.DONE)], [
    event('done', TaskStatus.DONE, '2026-06-20T09:00:00.000Z'),
  ], new Date('2026-06-20T11:00:00.000Z'));

  assert.equal('closedCountByOwner' in result, false);
  assert.equal('closedCountLeaderboard' in result, false);
  assert.equal('leaderboard' in result, false);
});

test('reports service derives task KPIs from manager branch scope', async () => {
  let capturedBranchId: string | null | undefined;
  const service = reportsService(async (branchId) => {
    capturedBranchId = branchId;
    return {
      tasks: [
        task('kept', '2026-06-20T10:00:00.000Z', TaskStatus.DONE, true),
        task('missed', '2026-06-20T10:00:00.000Z', TaskStatus.DONE, true),
        task('active_overdue', '2026-06-20T09:00:00.000Z', TaskStatus.OPEN),
      ],
      events: [
        event('kept', TaskStatus.DONE, '2026-06-20T09:00:00.000Z'),
        event('missed', TaskStatus.DONE, '2026-06-20T11:00:00.000Z'),
      ],
    };
  });

  const result = await service.taskPromiseKpis({ role: RoleCode.BRANCH_MANAGER, branchId: 'branch-a', now: '2026-06-20T11:00:00.000Z' });

  assert.equal(capturedBranchId, 'branch-a');
  assert.deepEqual(result, {
    onTimeCompletionPercent: 50,
    activeOverdueCount: 1,
    averageDelayHours: 0.5,
    customerPromiseKeptPercent: 50,
  });
});

test('reports service lets admin task KPI reads cover all branches', async () => {
  let capturedBranchId: string | null | undefined;
  const service = reportsService(async (branchId) => {
    capturedBranchId = branchId;
    return { tasks: [task('done', '2026-06-20T10:00:00.000Z', TaskStatus.DONE)], events: [event('done', TaskStatus.DONE, '2026-06-20T09:00:00.000Z')] };
  });

  assert.equal((await service.taskPromiseKpis({ role: RoleCode.ADMIN, now: '2026-06-20T11:00:00.000Z' })).onTimeCompletionPercent, 100);
  assert.equal(capturedBranchId, null);
});

test('reports service combines task and complaint/case KPI aggregates', async () => {
  const service = reportsService(
    async () => ({ tasks: [task('done', '2026-06-20T10:00:00.000Z', TaskStatus.DONE)], events: [event('done', TaskStatus.DONE, '2026-06-20T09:00:00.000Z')] }),
    async () => ({
      records: [record('cmp_1', '2026-06-20T08:00:00.000Z')],
      statusEvents: [statusEvent('cmp_1', ComplaintStatus.RESOLVED, ComplaintTransitionAction.RESOLVE, '2026-06-20T12:00:00.000Z')],
      slaEvents: [slaEvent('cmp_1', SlaEventType.BREACH, '2026-06-20T11:00:00.000Z')],
    }),
  );

  assert.deepEqual(await service.kpiSummary({ role: RoleCode.ADMIN, now: '2026-06-20T11:00:00.000Z' }), {
    onTimeCompletionPercent: 100,
    activeOverdueCount: 0,
    averageDelayHours: 0,
    customerPromiseKeptPercent: 0,
    reopenedCount: 0,
    escalationCount: 1,
    averageFirstResponseHours: 4,
    averageResolutionHours: 4,
  });
});

test('complaint/case KPI formulas derive from timeline events', () => {
  const result = complaintCaseKpis([
    record('cmp_1', '2026-06-20T08:00:00.000Z'),
    record('case_1', '2026-06-20T10:00:00.000Z'),
  ], [
    statusEvent('cmp_1', ComplaintStatus.SUBMITTED, ComplaintTransitionAction.SUBMIT, '2026-06-20T08:00:00.000Z'),
    statusEvent('cmp_1', ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.ACCEPT_INTAKE, '2026-06-20T09:00:00.000Z'),
    statusEvent('cmp_1', ComplaintStatus.RESOLVED, ComplaintTransitionAction.RESOLVE, '2026-06-20T12:00:00.000Z'),
    statusEvent('cmp_1', ComplaintStatus.REOPENED, ComplaintTransitionAction.REOPEN, '2026-06-21T12:00:00.000Z'),
    statusEvent('case_1', ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.ASSIGN_INVESTIGATION, '2026-06-20T13:00:00.000Z'),
  ], [
    slaEvent('cmp_1', SlaEventType.BREACH, '2026-06-20T11:00:00.000Z'),
    slaEvent('case_1', SlaEventType.WARNING, '2026-06-20T12:00:00.000Z'),
  ]);

  assert.deepEqual(result, {
    reopenedCount: 1,
    escalationCount: 1,
    averageFirstResponseHours: 2,
    averageResolutionHours: 4,
  });
});

test('complaint/case KPI empty denominators return zero and no leaderboard', () => {
  const result = complaintCaseKpis([], [], []);

  assert.deepEqual(result, {
    reopenedCount: 0,
    escalationCount: 0,
    averageFirstResponseHours: 0,
    averageResolutionHours: 0,
  });
  assert.equal('closedCountByOwner' in result, false);
  assert.equal('closedCountLeaderboard' in result, false);
  assert.equal('leaderboard' in result, false);
});

function task(id: string, dueAt: string, status: TaskStatus, isCustomerPromise = false): TaskKpiRow {
  return { id, dueAt: new Date(dueAt), status, isCustomerPromise };
}

function event(taskId: string, toStatus: TaskStatus, createdAt: string): TaskKpiStatusEvent {
  return { taskId, toStatus, createdAt: new Date(createdAt) };
}

function reportsService(
  listTaskKpiRows: (branchId: string | null) => Promise<TaskKpiReadRows>,
  listComplaintCaseKpiRows: (branchId: string | null) => Promise<ComplaintCaseKpiReadRows> = async () => ({ records: [], statusEvents: [], slaEvents: [] }),
): ReportsService {
  return new ReportsService({ listTaskKpiRows, listComplaintCaseKpiRows } as ReportsRepository, {} as never, {} as never, {} as never);
}

function record(id: string, createdAt: string): ComplaintCaseKpiRow {
  return { id, createdAt: new Date(createdAt) };
}

function statusEvent(recordId: string, toStatus: ComplaintStatus, action: ComplaintTransitionAction | null, createdAt: string): ComplaintCaseStatusEvent {
  return { recordId, toStatus, action, createdAt: new Date(createdAt) };
}

function slaEvent(recordId: string, type: SlaEventType, occurredAt: string): ComplaintCaseSlaEvent {
  return { recordId, type, occurredAt: new Date(occurredAt) };
}
