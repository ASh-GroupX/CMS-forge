import type { ManagerRollupCountDto, TaskResponseDto } from './dto/task-response.dto.js';
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
    dueAt: task.dueAt.toISOString(),
    status: task.status,
    nextAction: currentNextAction(task)?.toDto ?? null,
    isCustomerPromise: task.isCustomerPromise,
    visibility: task.visibility,
    confidentialityLevel: task.confidentialityLevel,
    links: task.links.map((link) => ({ entityType: link.entityType, entityId: link.entityId })),
    participantUserIds: task.participants.map((participant) => participant.userId),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
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
