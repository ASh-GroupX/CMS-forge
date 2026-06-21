import { RoleCode } from '@prisma/client';
import type { NotificationsService } from '../modules/notifications/notifications.service.js';
import type { EmployeeTodayResponseDto, ManagerControlRoomResponseDto, TaskResponseDto } from '../modules/tasks/dto/task-response.dto.js';
import type { TasksService } from '../modules/tasks/tasks.service.js';

type TasksBatchRunner = Pick<TasksService, 'employeeToday' | 'managerControlRoom'>;
type NotificationsBatchRunner = Pick<NotificationsService, 'queueInternal'>;

export async function runTaskNotificationBatchJob(tasksService: TasksBatchRunner, notificationsService: NotificationsBatchRunner, now: Date): Promise<unknown> {
  const window = dailyDigestWindow(now);
  const rollup = await tasksService.managerControlRoom({ roleCode: RoleCode.ADMIN, branchId: null }, now);
  let employeeDigests = 0;

  for (const userId of employeeDigestRecipients(rollup)) {
    const digest = await tasksService.employeeToday(userId, now);
    if (digestCount(digest) === 0) continue;
    const idempotencyKey = `task-digest:employee:${userId}:${window.key}`;
    await notificationsService.queueInternal({
      recipientUserId: userId,
      templateCode: 'task.digest.employee.daily.internal',
      locale: 'en',
      idempotencyKey,
      payload: { ...window, recipientUserId: userId, counts: digestCounts(digest), taskIds: digestTaskIds(digest) },
    });
    employeeDigests += 1;
  }

  await notificationsService.queueInternal({
    templateCode: 'task.rollup.manager.daily.internal',
    locale: 'en',
    idempotencyKey: `task-rollup:manager:${window.key}`,
    payload: {
      ...window,
      scope: { roleCode: RoleCode.ADMIN, branchId: null },
      counts: {
        dueToday: rollup.dueToday.length,
        overduePromises: rollup.overduePromises.length,
        stuck: rollup.stuck.length,
        escalated: rollup.escalated.length,
      },
      overdueByEmployee: rollup.overdueByEmployee,
      workloadByAssignee: rollup.workloadByAssignee,
      promiseKpi: rollup.promiseKpi,
      taskIds: {
        dueToday: rollup.dueToday.map((task) => task.id),
        overduePromises: rollup.overduePromises.map((task) => task.id),
        stuck: rollup.stuck.map((task) => task.id),
        escalated: rollup.escalated.map((task) => task.id),
      },
    },
  });

  return { windowKey: window.windowKey, employeeDigests, managerRollups: 1 };
}

function dailyDigestWindow(now: Date) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  const windowKey = start.toISOString().slice(0, 10);
  return { key: windowKey, windowKey, windowStart: start.toISOString(), windowEnd: end.toISOString() };
}

function employeeDigestRecipients(rollup: ManagerControlRoomResponseDto): string[] {
  const users = new Set<string>();
  for (const task of [...rollup.dueToday, ...rollup.overduePromises, ...rollup.stuck, ...rollup.escalated]) addTaskUsers(users, task);
  for (const count of [...rollup.overdueByEmployee, ...rollup.workloadByAssignee]) users.add(count.assigneeId);
  return [...users].sort();
}

function addTaskUsers(users: Set<string>, task: TaskResponseDto): void {
  users.add(task.ownerId);
  users.add(task.assigneeId);
  if (task.nextAction) users.add(task.nextAction.whoId);
  for (const userId of task.participantUserIds) users.add(userId);
}

function digestCounts(digest: EmployeeTodayResponseDto) {
  return {
    dueToday: digest.dueToday.length,
    overdue: digest.overdue.length,
    overduePromises: digest.overduePromises.length,
    assignedToMe: digest.assignedToMe.length,
    waitingOnMe: digest.waitingOnMe.length,
  };
}

function digestCount(digest: EmployeeTodayResponseDto): number {
  return Object.values(digestCounts(digest)).reduce((sum, count) => sum + count, 0);
}

function digestTaskIds(digest: EmployeeTodayResponseDto) {
  return {
    dueToday: digest.dueToday.map((task) => task.id),
    overdue: digest.overdue.map((task) => task.id),
    overduePromises: digest.overduePromises.map((task) => task.id),
    assignedToMe: digest.assignedToMe.map((task) => task.id),
    waitingOnMe: digest.waitingOnMe.map((task) => task.id),
  };
}
