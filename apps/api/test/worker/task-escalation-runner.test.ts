import assert from 'node:assert/strict';
import test from 'node:test';
import { TaskStatus } from '@prisma/client';
import { NotificationsService } from '../../src/modules/notifications/notifications.service.ts';
import { TasksService } from '../../src/modules/tasks/tasks.service.ts';
import { processWorkerJob, taskEscalationJobName } from '../../src/worker/index.ts';

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

function task(id: string, assigneeId: string, dueAt: string) {
  return {
    id,
    title: 'Late task',
    ownerId: 'usr_owner',
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
