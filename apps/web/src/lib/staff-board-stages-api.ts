import { fieldErrorsFrom } from './staff-error-envelope';
import { CSRF_COOKIE, hasStaffSessionCookie, incomingCookieHeader, readCookie } from './staff-request-auth';
import type { StaffTaskStatus } from './staff-tasks-api';

// Typed client for /board-stages admin management (docs/CMSS_REVAMP_PLAN.md B2).
// Reads are staff-wide; writes are admin master data guarded server-side.

export const STAGE_COLORS = ['slate', 'blue', 'amber', 'green', 'red', 'violet'] as const;
export type StageColor = (typeof STAGE_COLORS)[number];
export type BoardStageScope = 'TASKS' | 'TICKETS';

export type AdminBoardStage = {
  id: string;
  code: string;
  scope: BoardStageScope;
  nameEn: string;
  nameAr: string;
  color: string;
  position: number;
  isDefault: boolean;
  mappedTaskStatus: StaffTaskStatus | null;
  mappedComplaintStatus: string | null;
};

export type AdminBoardStagesLoadResult = { status: 'ready'; data: AdminBoardStage[] } | { status: 'denied' | 'error' };

export type StageWriteResult =
  | { status: 'success' }
  | { status: 'invalid'; fields: string[] }
  | { status: 'denied' | 'conflict' | 'not_found' | 'error' };

export type CreateStagePayload = {
  code: string;
  scope: BoardStageScope;
  nameEn: string;
  nameAr: string;
  color: string;
  mappedTaskStatus?: StaffTaskStatus;
  mappedComplaintStatus?: string;
};

export type UpdateStagePayload = { nameEn?: string; nameAr?: string; color?: string };

type RequestOptions = { apiUrl?: string; cookieHeader?: string; fetchImpl?: typeof fetch };

export async function listAdminBoardStages(
  scope: BoardStageScope,
  { apiUrl = process.env.API_URL ?? 'http://localhost:3000', cookieHeader, fetchImpl = fetch }: RequestOptions = {},
): Promise<AdminBoardStagesLoadResult> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };
  try {
    const response = await fetchImpl(new URL(`/board-stages?scope=${scope}`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (!response.ok) return { status: 'error' };
    const items = ((await response.json()) as { items?: Partial<AdminBoardStage>[] }).items;
    if (!Array.isArray(items)) return { status: 'error' };
    const stages = items.map(adminStageFrom);
    return stages.some((stage) => stage === null) ? { status: 'error' } : { status: 'ready', data: stages as AdminBoardStage[] };
  } catch {
    return { status: 'error' };
  }
}

export async function createBoardStage(payload: CreateStagePayload, options: RequestOptions = {}): Promise<StageWriteResult> {
  return stageWrite('/board-stages', 'POST', payload, options);
}

export async function updateBoardStage(id: string, payload: UpdateStagePayload, options: RequestOptions = {}): Promise<StageWriteResult> {
  return stageWrite(`/board-stages/${encodeURIComponent(id)}`, 'PATCH', payload, options);
}

export async function reorderBoardStages(scope: BoardStageScope, orderedIds: string[], options: RequestOptions = {}): Promise<StageWriteResult> {
  return stageWrite('/board-stages/reorder', 'POST', { scope, orderedIds }, options);
}

export async function archiveBoardStage(id: string, destinationStageId: string, options: RequestOptions = {}): Promise<StageWriteResult> {
  return stageWrite(`/board-stages/${encodeURIComponent(id)}/archive`, 'POST', { destinationStageId }, options);
}

async function stageWrite(
  path: string,
  method: 'POST' | 'PATCH',
  payload: unknown,
  { apiUrl = process.env.API_URL ?? 'http://localhost:3000', cookieHeader, fetchImpl = fetch }: RequestOptions,
): Promise<StageWriteResult> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };
  const csrf = readCookie(cookies, CSRF_COOKIE);
  try {
    const response = await fetchImpl(new URL(path, apiUrl), {
      body: JSON.stringify(payload),
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
        cookie: cookies,
        ...(csrf ? { 'x-csrf-token': csrf } : {}),
      },
      method,
    });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (response.status === 404) return { status: 'not_found' };
    if (response.status === 409) return { status: 'conflict' };
    if (response.status === 400) return { status: 'invalid', fields: await fieldErrorsFrom(response) };
    return response.ok ? { status: 'success' } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

function adminStageFrom(stage: Partial<AdminBoardStage>): AdminBoardStage | null {
  if (
    typeof stage.id !== 'string' ||
    typeof stage.code !== 'string' ||
    (stage.scope !== 'TASKS' && stage.scope !== 'TICKETS') ||
    typeof stage.nameEn !== 'string' ||
    typeof stage.nameAr !== 'string' ||
    typeof stage.color !== 'string' ||
    typeof stage.position !== 'number' ||
    typeof stage.isDefault !== 'boolean'
  ) {
    return null;
  }
  return {
    id: stage.id,
    code: stage.code,
    scope: stage.scope,
    nameEn: stage.nameEn,
    nameAr: stage.nameAr,
    color: stage.color,
    position: stage.position,
    isDefault: stage.isDefault,
    mappedTaskStatus: stage.mappedTaskStatus ?? null,
    mappedComplaintStatus: stage.mappedComplaintStatus ?? null,
  };
}
