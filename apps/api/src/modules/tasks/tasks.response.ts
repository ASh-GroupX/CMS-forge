import type { ManagerRollupCountDto, ManagerTaskDetailResponseDto, TaskResponseDto } from './dto/task-response.dto.js';
import type { TaskRecord } from './tasks.repository.js';

export function taskCounts(tasks: TaskRecord[]): ManagerRollupCountDto[] {
  const grouped = new Map<string, { assigneeId: string; assigneeName: string | null; count: number }>();
  for (const task of tasks) {
    const current = grouped.get(task.assigneeId);
    grouped.set(task.assigneeId, { assigneeId: task.assigneeId, assigneeName: task.assignee?.nameEn ?? null, count: (current?.count ?? 0) + 1 });
  }
  return [...grouped.values()];
}

export function taskToResponse(task: TaskRecord): TaskResponseDto {
  return {
    id: task.id,
    title: task.title,
    ownerId: task.ownerId,
    ownerName: task.owner?.nameEn ?? null,
    assigneeId: task.assigneeId,
    assigneeName: task.assignee?.nameEn ?? null,
    branchId: task.assignee?.branchId ?? task.owner?.branchId ?? null,
    branchName: task.assignee?.branch?.nameEn ?? task.owner?.branch?.nameEn ?? null,
    displayTimeZone: task.assignee?.branch?.timezone ?? task.owner?.branch?.timezone ?? 'UTC',
    dueAt: task.dueAt.toISOString(),
    status: task.status,
    assignedDepartmentId: task.assignedDepartmentId,
    nextAction: currentNextAction(task)?.toDto ?? null,
    isCustomerPromise: task.isCustomerPromise,
    visibility: task.visibility,
    confidentialityLevel: task.confidentialityLevel,
    links: task.links.map((link) => ({ entityType: link.entityType, entityId: link.entityId })),
    participantUserIds: task.participants.map((participant) => participant.userId),
    participants: task.participants.map((participant) => ({ userId: participant.userId, role: participant.role, name: participant.user.nameEn, nameAr: participant.user.nameAr })),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function managerTaskDetailResponse(task: TaskRecord, now: Date, canOpenInteractive: boolean): ManagerTaskDetailResponseDto {
  const response = taskToResponse(task);
  return {
    task: {
      id: response.id,
      title: response.title,
      ownerId: response.ownerId,
      ownerName: response.ownerName ?? null,
      assigneeId: response.assigneeId,
      assigneeName: response.assigneeName ?? null,
      branchId: response.branchId ?? null,
      branchName: response.branchName ?? null,
      displayTimeZone: response.displayTimeZone,
      dueAt: response.dueAt,
      status: response.status,
      nextAction: response.nextAction,
      isCustomerPromise: response.isCustomerPromise,
      links: response.links,
      stuckReasons: [
        ...(task.nextActionWhen && task.nextActionWhen < now ? ['NEXT_ACTION_OVERDUE' as const] : []),
        ...(task.updatedAt < new Date(now.getTime() - 72 * 60 * 60 * 1000) ? ['NO_MOVEMENT' as const] : []),
      ],
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      capabilities: { canOpenInteractive },
    },
  };
}

export function currentNextAction(task: TaskRecord): ({ what: string; whoId: string; when: Date } & { toDto: TaskResponseDto['nextAction'] }) | null {
  if (!task.nextActionWhat || !task.nextActionWhoId || !task.nextActionWhen) return null;
  return {
    what: task.nextActionWhat,
    whoId: task.nextActionWhoId,
    when: task.nextActionWhen,
    toDto: { what: task.nextActionWhat, whoId: task.nextActionWhoId, whoName: task.nextActionWho?.nameEn ?? null, when: task.nextActionWhen.toISOString() },
  };
}
