import assert from 'node:assert/strict';
import test from 'node:test';
import { TaskStatus } from '@prisma/client';
import { NotificationsService } from '../../src/modules/notifications/notifications.service.ts';
import { TasksService } from '../../src/modules/tasks/tasks.service.ts';
import { runTaskNotificationBatchJob } from '../../src/worker/task-notification-batches.ts';
import { processWorkerJob, taskEscalationJobName, taskNotificationBatchJobName } from '../../src/worker/index.ts';

test('worker queues task escalation notifications from backend manager scope', async () => {
  const queued: unknown[] = [];
  let seenScope: unknown;
  let triggerAt = '';
  const app = fakeApp({
    tasks: {
      managerControlRoom: async (scope: unknown, now?: Date) => {
        seenScope = scope;
        triggerAt = new Date((now?.getTime() ?? Date.now()) - 60_000).toISOString();
        return {
          overdueByEmployee: [],
          dueToday: [],
          overduePromises: [],
          stuck: [],
          workloadByAssignee: [],
          escalated: [task('task_late', 'usr_assignee', triggerAt)],
          promiseKpi: { openPromiseCount: 0, overduePromiseCount: 0 },
        };
      },
    },
    notifications: { queueInternal: async (input: unknown) => queued.push(input) },
  });

  const result = await processWorkerJob('notifications', { id: 'job_task_scan', name: taskEscalationJobName, data: { roleCode: 'ADMIN', branchId: 'branch_other' } }, app, fakeLogger([]));

  assert.deepEqual(seenScope, { roleCode: 'ADMIN', branchId: null });
  assert.deepEqual(result, { scanned: 1, queued: 1 });
  assert.deepEqual(queued, [{
    recipientUserId: 'usr_assignee',
    templateCode: 'task.escalation.internal',
    locale: 'en',
    idempotencyKey: `task-escalation:task_late:TEAM_LEADER:${triggerAt}`,
    payload: {
      idempotencyKey: `task-escalation:task_late:TEAM_LEADER:${triggerAt}`,
      taskId: 'task_late',
      level: 'TEAM_LEADER',
      reason: 'OVERDUE',
      triggerAt,
      overdueMinutes: 1,
    },
  }]);
});

test('worker queues employee digest and manager rollup from backend read models idempotently', async () => {
  const created = new Map<string, unknown>();
  const employeeCalls: string[] = [];
  let seenScope: unknown;
  const digestTask = task('task_today', 'usr_employee', '2026-06-21T09:00:00.000Z');
  const tasks = {
    managerControlRoom: async (scope: unknown) => {
      seenScope = scope;
      return {
        overdueByEmployee: [{ assigneeId: 'usr_employee', count: 1 }],
        dueToday: [digestTask],
        overduePromises: [],
        stuck: [],
        workloadByAssignee: [{ assigneeId: 'usr_employee', count: 1 }],
        escalated: [digestTask],
        promiseKpi: { openPromiseCount: 0, overduePromiseCount: 0 },
      };
    },
    employeeToday: async (userId: string) => {
      employeeCalls.push(userId);
      return { dueToday: [digestTask], overdue: [], overduePromises: [], assignedToMe: [digestTask], waitingOnMe: [] };
    },
  };
  const notifications = {
    queueInternal: async (input: { idempotencyKey?: string }) => {
      assert.ok(input.idempotencyKey);
      if (!created.has(input.idempotencyKey)) created.set(input.idempotencyKey, input);
      return created.get(input.idempotencyKey) as never;
    },
  };

  const first = await runTaskNotificationBatchJob(tasks as never, notifications as never, new Date('2026-06-21T12:00:00.000Z'));
  const second = await runTaskNotificationBatchJob(tasks as never, notifications as never, new Date('2026-06-21T12:00:00.000Z'));

  assert.deepEqual(seenScope, { roleCode: 'ADMIN', branchId: null });
  assert.deepEqual(first, { windowKey: '2026-06-21', employeeDigests: 1, managerRollups: 1 });
  assert.deepEqual(second, first);
  assert.deepEqual(employeeCalls, ['usr_employee', 'usr_employee']);
  assert.deepEqual([...created.keys()].sort(), ['task-digest:employee:usr_employee:2026-06-21', 'task-rollup:manager:2026-06-21']);
  assert.deepEqual(created.get('task-digest:employee:usr_employee:2026-06-21'), {
    recipientUserId: 'usr_employee',
    templateCode: 'task.digest.employee.daily.internal',
    locale: 'en',
    idempotencyKey: 'task-digest:employee:usr_employee:2026-06-21',
    payload: {
      key: '2026-06-21',
      windowKey: '2026-06-21',
      windowStart: '2026-06-21T00:00:00.000Z',
      windowEnd: '2026-06-22T00:00:00.000Z',
      recipientUserId: 'usr_employee',
      counts: { dueToday: 1, overdue: 0, overduePromises: 0, assignedToMe: 1, waitingOnMe: 0 },
      taskIds: { dueToday: ['task_today'], overdue: [], overduePromises: [], assignedToMe: ['task_today'], waitingOnMe: [] },
    },
  });
  assert.deepEqual(created.get('task-rollup:manager:2026-06-21'), {
    templateCode: 'task.rollup.manager.daily.internal',
    locale: 'en',
    idempotencyKey: 'task-rollup:manager:2026-06-21',
    payload: {
      key: '2026-06-21',
      windowKey: '2026-06-21',
      windowStart: '2026-06-21T00:00:00.000Z',
      windowEnd: '2026-06-22T00:00:00.000Z',
      scope: { roleCode: 'ADMIN', branchId: null },
      counts: { dueToday: 1, overduePromises: 0, stuck: 0, escalated: 1 },
      overdueByEmployee: [{ assigneeId: 'usr_employee', count: 1 }],
      workloadByAssignee: [{ assigneeId: 'usr_employee', count: 1 }],
      promiseKpi: { openPromiseCount: 0, overduePromiseCount: 0 },
      taskIds: { dueToday: ['task_today'], overduePromises: [], stuck: [], escalated: ['task_today'] },
    },
  });
});

test('worker ignores digest batch role and branch payload authority', async () => {
  let seenScope: unknown;
  const app = fakeApp({
    tasks: {
      managerControlRoom: async (scope: unknown) => {
        seenScope = scope;
        return { overdueByEmployee: [], dueToday: [], overduePromises: [], stuck: [], workloadByAssignee: [], escalated: [], promiseKpi: { openPromiseCount: 0, overduePromiseCount: 0 } };
      },
      employeeToday: async () => {
        throw new Error('should not ask employee digest without backend rollup recipients');
      },
    },
    notifications: { queueInternal: async () => ({}) as never },
  });

  await processWorkerJob('notifications', { id: 'job_task_batch', name: taskNotificationBatchJobName, data: { roleCode: 'CR_OFFICER', branchId: 'branch_other' } }, app, fakeLogger([]));

  assert.deepEqual(seenScope, { roleCode: 'ADMIN', branchId: null });
});

function task(id: string, assigneeId: string, dueAt: string) {
  return {
    id,
    title: 'Late task',
    ownerId: assigneeId,
    assigneeId,
    dueAt,
    status: TaskStatus.OPEN,
    nextAction: null,
    isCustomerPromise: false,
    visibility: 'PARTICIPANTS',
    confidentialityLevel: 'NORMAL',
    links: [],
    participantUserIds: [],
    createdAt: '2026-06-19T00:00:00.000Z',
    updatedAt: '2026-06-19T00:00:00.000Z',
  };
}

function fakeApp(services: { tasks: Partial<TasksService>; notifications: Partial<NotificationsService> }) {
  return {
    get: (token: unknown) => {
      if (token === TasksService) return services.tasks as TasksService;
      assert.equal(token, NotificationsService);
      return services.notifications as NotificationsService;
    },
  };
}

function fakeLogger(logs: string[]) {
  return { log: (message: string) => logs.push(message) };
}
