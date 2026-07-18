import type { StaffTask, StaffTaskStatus } from './staff-tasks-api';

export function staffTaskFrom(task: Partial<StaffTask>): StaffTask | null {
  if (
    typeof task.id !== 'string' || typeof task.title !== 'string' || typeof task.ownerId !== 'string'
    || (task.assigneeId !== null && typeof task.assigneeId !== 'string') || typeof task.dueAt !== 'string'
    || typeof task.displayTimeZone !== 'string' || !isTaskStatus(task.status)
    || typeof task.isCustomerPromise !== 'boolean' || typeof task.visibility !== 'string'
    || typeof task.confidentialityLevel !== 'string' || !Array.isArray(task.links)
    || !Array.isArray(task.participantUserIds) || typeof task.createdAt !== 'string' || typeof task.updatedAt !== 'string'
  ) return null;

  const nextAction = nextActionFrom(task.nextAction);
  if (nextAction === false) return null;
  const links = linksFrom(task.links);
  if (!links) return null;
  const participantUserIds = task.participantUserIds.filter((id): id is string => typeof id === 'string');
  if (participantUserIds.length !== task.participantUserIds.length) return null;
  return {
    id: task.id, title: task.title, ownerId: task.ownerId,
    ownerName: typeof task.ownerName === 'string' ? task.ownerName : null,
    assigneeId: task.assigneeId ?? null,
    assigneeName: typeof task.assigneeName === 'string' ? task.assigneeName : null,
    assignedDepartmentId: typeof task.assignedDepartmentId === 'string' ? task.assignedDepartmentId : null,
    assignedDepartmentName: typeof task.assignedDepartmentName === 'string' ? task.assignedDepartmentName : null,
    assignedDepartmentNameAr: typeof task.assignedDepartmentNameAr === 'string' ? task.assignedDepartmentNameAr : null,
    branchId: typeof task.branchId === 'string' ? task.branchId : null,
    branchName: typeof task.branchName === 'string' ? task.branchName : null,
    displayTimeZone: task.displayTimeZone, dueAt: task.dueAt, status: task.status, nextAction,
    isCustomerPromise: task.isCustomerPromise, visibility: task.visibility,
    confidentialityLevel: task.confidentialityLevel, links, participantUserIds,
    createdAt: task.createdAt, updatedAt: task.updatedAt,
  };
}

function nextActionFrom(value: Partial<StaffTask['nextAction']> | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value.what !== 'string' || typeof value.whoId !== 'string' || typeof value.when !== 'string') return false;
  return { what: value.what, whoId: value.whoId, whoName: typeof value.whoName === 'string' ? value.whoName : null, when: value.when };
}

function linksFrom(value: StaffTask['links']): StaffTask['links'] | null {
  const links = value.filter((link): link is { entityType: string; entityId: string } => typeof link?.entityType === 'string' && typeof link.entityId === 'string');
  return links.length === value.length ? links : null;
}

function isTaskStatus(value: unknown): value is StaffTaskStatus {
  return value === 'OPEN' || value === 'IN_PROGRESS' || value === 'WAITING' || value === 'DONE';
}
