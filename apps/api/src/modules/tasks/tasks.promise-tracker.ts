import { TaskLinkEntityType, TaskStatus } from '@prisma/client';
import type { PromiseTrackerResponseDto } from './dto/task-response.dto.js';
import { promiseKeptOnTime } from './tasks.promise.js';
import type { PromiseTaskRecord } from './tasks.repository.js';
import { taskToResponse } from './tasks.response.js';

export type PromiseTrackerScope = { userId: string; roleCode: string; branchId: string | null; departmentId?: string | null; permissions?: string[] };

export function promiseTrackerQuery(scope: PromiseTrackerScope) {
  return {
    userId: scope.userId,
    branchId: scope.branchId,
    departmentId: scope.roleCode === 'INTERNAL_OFFICER' ? null : scope.departmentId ?? null,
    isAdmin: scope.roleCode !== 'INTERNAL_OFFICER' && (scope.permissions?.includes('TASK_MANAGE_ALL') ?? false),
    isManager: scope.roleCode !== 'INTERNAL_OFFICER' && (scope.permissions?.some((code) => ['TASK_VIEW_BRANCH', 'TASK_MANAGE_BRANCH', 'TASK_MANAGE_ALL'].includes(code)) ?? false),
  };
}

export function buildPromiseTracker(tasks: PromiseTaskRecord[], now: Date): PromiseTrackerResponseDto {
  const open = tasks.filter((task) => task.status !== TaskStatus.DONE);
  const done = tasks.filter((task) => task.status === TaskStatus.DONE);
  const kept = done.filter((task) => promiseKeptOnTime(task, task.statusHistory) === true).length;
  return {
    openPromiseCount: open.length,
    overduePromiseCount: open.filter((task) => task.dueAt < now).length,
    keptOnTimePercent: done.length ? Math.round((kept / done.length) * 100) : 0,
    promises: tasks.map((task) => {
      const response = taskToResponse(task);
      return {
        ...response,
        customerLabel: firstLink(response.links, TaskLinkEntityType.CUSTOMER),
        dealLabel: firstLink(response.links, TaskLinkEntityType.DEAL),
        keptOnTime: task.status === TaskStatus.DONE ? promiseKeptOnTime(task, task.statusHistory) : null,
      };
    }),
  };
}

function firstLink(links: { entityType: TaskLinkEntityType; entityId: string }[], type: TaskLinkEntityType): string | null {
  return links.find((link) => link.entityType === type)?.entityId ?? null;
}
