import { hasStaffSessionCookie, incomingCookieHeader } from './staff-request-auth';
import type { StaffTaskStatus } from './staff-tasks-api';

export type ManagerTaskDetail = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string | null;
  assigneeId: string;
  assigneeName: string | null;
  branchId: string | null;
  branchName: string | null;
  displayTimeZone: string;
  dueAt: string;
  status: StaffTaskStatus;
  nextAction: { what: string; whoId: string; whoName: string | null; when: string } | null;
  isCustomerPromise: boolean;
  links: { entityType: string; entityId: string }[];
  stuckReasons: ('NEXT_ACTION_OVERDUE' | 'NO_MOVEMENT')[];
  createdAt: string;
  updatedAt: string;
  capabilities: { canOpenInteractive: boolean };
};

export type ManagerTaskDetailLoadResult =
  | { status: 'ready'; data: ManagerTaskDetail }
  | { status: 'denied' | 'not_found' | 'error' };

export async function getManagerTaskDetailLoadResult(
  taskId: string,
  {
    apiUrl = process.env.API_URL ?? 'http://localhost:3000',
    cookieHeader,
    fetchImpl = fetch,
  }: { apiUrl?: string; cookieHeader?: string; fetchImpl?: typeof fetch } = {},
): Promise<ManagerTaskDetailLoadResult> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };
  try {
    const response = await fetchImpl(new URL(`/tasks/${encodeURIComponent(taskId)}/manager-detail`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (response.status === 404) return { status: 'not_found' };
    if (!response.ok) return { status: 'error' };
    const task = managerTaskDetailFrom((await response.json()) as { task?: Partial<ManagerTaskDetail> });
    return task ? { status: 'ready', data: task } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

function managerTaskDetailFrom(body: { task?: Partial<ManagerTaskDetail> }): ManagerTaskDetail | null {
  const task = body.task;
  if (!task || typeof task.id !== 'string' || typeof task.title !== 'string' || typeof task.ownerId !== 'string'
    || typeof task.assigneeId !== 'string' || typeof task.dueAt !== 'string' || typeof task.displayTimeZone !== 'string' || !isStatus(task.status)
    || typeof task.isCustomerPromise !== 'boolean' || !Array.isArray(task.links) || !Array.isArray(task.stuckReasons)
    || typeof task.createdAt !== 'string' || typeof task.updatedAt !== 'string'
    || typeof task.capabilities?.canOpenInteractive !== 'boolean') return null;
  const links = task.links.filter((link): link is { entityType: string; entityId: string } =>
    typeof link?.entityType === 'string' && typeof link.entityId === 'string');
  const reasons = task.stuckReasons.filter((reason): reason is ManagerTaskDetail['stuckReasons'][number] =>
    reason === 'NEXT_ACTION_OVERDUE' || reason === 'NO_MOVEMENT');
  if (links.length !== task.links.length || reasons.length !== task.stuckReasons.length) return null;
  const nextAction = task.nextAction === null ? null : task.nextAction
    && typeof task.nextAction.what === 'string' && typeof task.nextAction.whoId === 'string' && typeof task.nextAction.when === 'string'
      ? { ...task.nextAction, whoName: typeof task.nextAction.whoName === 'string' ? task.nextAction.whoName : null }
      : undefined;
  if (nextAction === undefined) return null;
  return {
    id: task.id,
    title: task.title,
    ownerId: task.ownerId,
    ownerName: typeof task.ownerName === 'string' ? task.ownerName : null,
    assigneeId: task.assigneeId,
    assigneeName: typeof task.assigneeName === 'string' ? task.assigneeName : null,
    branchId: typeof task.branchId === 'string' ? task.branchId : null,
    branchName: typeof task.branchName === 'string' ? task.branchName : null,
    displayTimeZone: task.displayTimeZone,
    dueAt: task.dueAt,
    status: task.status,
    nextAction,
    isCustomerPromise: task.isCustomerPromise,
    links,
    stuckReasons: reasons,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    capabilities: task.capabilities,
  };
}

function isStatus(value: unknown): value is StaffTaskStatus {
  return value === 'OPEN' || value === 'IN_PROGRESS' || value === 'WAITING' || value === 'DONE';
}
