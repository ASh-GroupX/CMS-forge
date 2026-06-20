import assert from 'node:assert/strict';
import test from 'node:test';
import { TaskStatus } from '@prisma/client';
import { selectTaskEscalations } from '../../src/modules/tasks/tasks.escalation.ts';

const now = new Date('2026-06-20T12:00:00.000Z');

test('task escalation scan selects due-soon tasks', () => {
  const result = selectTaskEscalations([row('soon', TaskStatus.OPEN, '2026-06-20T13:00:00.000Z')], undefined, now);

  assert.deepEqual(result, [{
    taskId: 'soon',
    level: 'DUE_SOON',
    reason: 'DUE_SOON',
    triggerAt: '2026-06-20T13:00:00.000Z',
    overdueMinutes: 0,
  }]);
});

test('task escalation scan selects overdue levels from due dates and next actions', () => {
  const result = selectTaskEscalations([
    row('late_due', TaskStatus.IN_PROGRESS, '2026-06-19T11:00:00.000Z'),
    row('late_next_action', TaskStatus.WAITING, '2026-06-22T12:00:00.000Z', '2026-06-20T10:00:00.000Z'),
  ], undefined, now);

  assert.deepEqual(result.map((item) => [item.taskId, item.level, item.reason, item.overdueMinutes]), [
    ['late_due', 'BRANCH_MANAGER', 'OVERDUE', 1500],
    ['late_next_action', 'TEAM_LEADER', 'OVERDUE', 120],
  ]);
});

test('task escalation scan ignores completed and far-future tasks', () => {
  const result = selectTaskEscalations([
    row('done', TaskStatus.DONE, '2026-06-19T11:00:00.000Z'),
    row('future', TaskStatus.OPEN, '2026-06-25T11:00:00.000Z'),
  ], undefined, now);

  assert.deepEqual(result, []);
});

test('task escalation scan is idempotent for the same input', () => {
  const rows = [
    row('b', TaskStatus.OPEN, '2026-06-20T13:00:00.000Z'),
    row('a', TaskStatus.OPEN, '2026-06-20T13:00:00.000Z'),
  ];

  assert.deepEqual(selectTaskEscalations(rows, undefined, now), selectTaskEscalations(rows, undefined, now));
  assert.deepEqual(selectTaskEscalations(rows, undefined, now).map((item) => item.taskId), ['a', 'b']);
});

function row(id: string, status: TaskStatus, dueAt: string, nextActionWhen?: string) {
  return {
    id,
    status,
    dueAt: new Date(dueAt),
    nextActionWhen: nextActionWhen ? new Date(nextActionWhen) : null,
  };
}
