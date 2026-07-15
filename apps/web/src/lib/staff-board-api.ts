import { CSRF_COOKIE, hasStaffSessionCookie, incomingCookieHeader, readCookie } from './staff-request-auth';
import type { StaffTaskStatus } from './staff-tasks-api';

// Typed client for the task board (Kanban) contract — docs/CMSS_REVAMP_PLAN.md A5.
// Mirrors apps/api/src/modules/tasks/dto/board.dto.ts. Reads and writes are
// authorized by the server session; this client never filters for privacy.

export type BoardStage = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  color: string;
  position: number;
  mappedTaskStatus: StaffTaskStatus | null;
};

export type BoardCardDueState = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';

export type BoardCard = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string | null;
  ownerNameAr: string | null;
  assigneeId: string;
  assigneeName: string | null;
  assigneeNameAr: string | null;
  assignedDepartmentId: string | null;
  departmentName: string | null;
  departmentNameAr: string | null;
  branchId: string | null;
  dueAt: string;
  status: StaffTaskStatus;
  stageId: string;
  boardPosition: number;
  isCustomerPromise: boolean;
  visibility: string;
  confidentialityLevel: string;
  daysActive: number;
  dueState: BoardCardDueState | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BoardColumn = { stageId: string; cards: BoardCard[] };
export type BoardDepartment = { id: string; nameEn: string; nameAr: string };
export type TaskBoard = { stages: BoardStage[]; columns: BoardColumn[]; departments: BoardDepartment[] };

export type TaskBoardLoadResult = { status: 'ready'; data: TaskBoard } | { status: 'denied' | 'error' };

export type MoveTaskCardPayload = {
  stageId: string;
  boardPosition: number;
  statusNote?: string;
  nextAction?: { what: string; whoId: string; when: string } | null;
};

export type MoveTaskCardResult =
  | { status: 'success'; card: BoardCard }
  | { status: 'invalid'; fields: string[] }
  | { status: 'denied' | 'not_found' | 'error' };

export type AssignTaskDepartmentResult =
  | { status: 'success' }
  | { status: 'invalid'; fields: string[] }
  | { status: 'denied' | 'not_found' | 'error' };

type RequestOptions = { apiUrl?: string; cookieHeader?: string; fetchImpl?: typeof fetch };

export async function getTaskBoardLoadResult({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: RequestOptions = {}): Promise<TaskBoardLoadResult> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };

  try {
    const response = await fetchImpl(new URL('/tasks/board', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (!response.ok) return { status: 'error' };
    const data = taskBoardFrom(await response.json());
    return data ? { status: 'ready', data } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

export async function moveTaskCard(
  taskId: string,
  payload: MoveTaskCardPayload,
  { apiUrl = process.env.API_URL ?? 'http://localhost:3000', cookieHeader, fetchImpl = fetch }: RequestOptions = {},
): Promise<MoveTaskCardResult> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };
  const csrf = readCookie(cookies, CSRF_COOKIE);

  try {
    const response = await fetchImpl(new URL(`/tasks/${encodeURIComponent(taskId)}/move`, apiUrl), {
      body: JSON.stringify(payload),
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
        cookie: cookies,
        ...(csrf ? { 'x-csrf-token': csrf } : {}),
      },
      method: 'POST',
    });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (response.status === 404) return { status: 'not_found' };
    if (response.status === 400) return { status: 'invalid', fields: await invalidFieldsFrom(response) };
    if (!response.ok) return { status: 'error' };
    const card = boardCardFrom(((await response.json()) as { card?: Partial<BoardCard> }).card ?? {});
    return card ? { status: 'success', card } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

// PATCH /tasks/:id limited to the board's department-assignment control.
// departmentId null clears the assignment; the API validates and audits.
export async function assignTaskDepartment(
  taskId: string,
  departmentId: string | null,
  { apiUrl = process.env.API_URL ?? 'http://localhost:3000', cookieHeader, fetchImpl = fetch }: RequestOptions = {},
): Promise<AssignTaskDepartmentResult> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };
  const csrf = readCookie(cookies, CSRF_COOKIE);

  try {
    const response = await fetchImpl(new URL(`/tasks/${encodeURIComponent(taskId)}`, apiUrl), {
      body: JSON.stringify({ assignedDepartmentId: departmentId }),
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
        cookie: cookies,
        ...(csrf ? { 'x-csrf-token': csrf } : {}),
      },
      method: 'PATCH',
    });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (response.status === 404) return { status: 'not_found' };
    if (response.status === 400) return { status: 'invalid', fields: await invalidFieldsFrom(response) };
    if (!response.ok) return { status: 'error' };
    return { status: 'success' };
  } catch {
    return { status: 'error' };
  }
}

function taskBoardFrom(body: unknown): TaskBoard | null {
  if (!body || typeof body !== 'object') return null;
  const { stages: rawStages, columns: rawColumns, departments: rawDepartments } = body as { stages?: unknown; columns?: unknown; departments?: unknown };
  if (!Array.isArray(rawStages) || !Array.isArray(rawColumns) || !Array.isArray(rawDepartments)) return null;

  const stages = rawStages.map((stage) => boardStageFrom(stage as Partial<BoardStage>));
  if (stages.some((stage) => stage === null)) return null;

  const departments: BoardDepartment[] = [];
  for (const rawDepartment of rawDepartments as Partial<BoardDepartment>[]) {
    if (typeof rawDepartment?.id !== 'string' || typeof rawDepartment.nameEn !== 'string' || typeof rawDepartment.nameAr !== 'string') return null;
    departments.push({ id: rawDepartment.id, nameEn: rawDepartment.nameEn, nameAr: rawDepartment.nameAr });
  }

  const columns: BoardColumn[] = [];
  for (const rawColumn of rawColumns as Partial<BoardColumn>[]) {
    if (typeof rawColumn?.stageId !== 'string' || !Array.isArray(rawColumn.cards)) return null;
    const cards = rawColumn.cards.map((card) => boardCardFrom(card as Partial<BoardCard>));
    if (cards.some((card) => card === null)) return null;
    columns.push({ stageId: rawColumn.stageId, cards: cards as BoardCard[] });
  }
  return { stages: stages as BoardStage[], columns, departments };
}

function boardStageFrom(stage: Partial<BoardStage>): BoardStage | null {
  if (
    typeof stage.id !== 'string' ||
    typeof stage.code !== 'string' ||
    typeof stage.nameEn !== 'string' ||
    typeof stage.nameAr !== 'string' ||
    typeof stage.color !== 'string' ||
    typeof stage.position !== 'number'
  ) {
    return null;
  }
  const mappedTaskStatus = stage.mappedTaskStatus ?? null;
  if (mappedTaskStatus !== null && !isTaskStatus(mappedTaskStatus)) return null;
  return {
    id: stage.id,
    code: stage.code,
    nameEn: stage.nameEn,
    nameAr: stage.nameAr,
    color: stage.color,
    position: stage.position,
    mappedTaskStatus,
  };
}

export function boardCardFrom(card: Partial<BoardCard>): BoardCard | null {
  if (
    typeof card.id !== 'string' ||
    typeof card.title !== 'string' ||
    typeof card.ownerId !== 'string' ||
    typeof card.assigneeId !== 'string' ||
    typeof card.dueAt !== 'string' ||
    !isTaskStatus(card.status) ||
    typeof card.stageId !== 'string' ||
    typeof card.boardPosition !== 'number' ||
    typeof card.isCustomerPromise !== 'boolean' ||
    typeof card.visibility !== 'string' ||
    typeof card.confidentialityLevel !== 'string' ||
    typeof card.daysActive !== 'number' ||
    typeof card.commentCount !== 'number' ||
    typeof card.createdAt !== 'string' ||
    typeof card.updatedAt !== 'string'
  ) {
    return null;
  }
  const dueState = card.dueState ?? null;
  if (dueState !== null && dueState !== 'OVERDUE' && dueState !== 'DUE_TODAY' && dueState !== 'UPCOMING') return null;
  return {
    id: card.id,
    title: card.title,
    ownerId: card.ownerId,
    ownerName: typeof card.ownerName === 'string' ? card.ownerName : null,
    ownerNameAr: typeof card.ownerNameAr === 'string' ? card.ownerNameAr : null,
    assigneeId: card.assigneeId,
    assigneeName: typeof card.assigneeName === 'string' ? card.assigneeName : null,
    assigneeNameAr: typeof card.assigneeNameAr === 'string' ? card.assigneeNameAr : null,
    assignedDepartmentId: typeof card.assignedDepartmentId === 'string' ? card.assignedDepartmentId : null,
    departmentName: typeof card.departmentName === 'string' ? card.departmentName : null,
    departmentNameAr: typeof card.departmentNameAr === 'string' ? card.departmentNameAr : null,
    branchId: typeof card.branchId === 'string' ? card.branchId : null,
    dueAt: card.dueAt,
    status: card.status,
    stageId: card.stageId,
    boardPosition: card.boardPosition,
    isCustomerPromise: card.isCustomerPromise,
    visibility: card.visibility,
    confidentialityLevel: card.confidentialityLevel,
    daysActive: card.daysActive,
    dueState,
    commentCount: card.commentCount,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

async function invalidFieldsFrom(response: Response): Promise<string[]> {
  try {
    const body = (await response.json()) as { details?: { field?: unknown }[] };
    if (!Array.isArray(body.details)) return [];
    return body.details
      .map((detail) => detail?.field)
      .filter((field): field is string => typeof field === 'string');
  } catch {
    return [];
  }
}

function isTaskStatus(value: unknown): value is StaffTaskStatus {
  return value === 'OPEN' || value === 'IN_PROGRESS' || value === 'WAITING' || value === 'DONE';
}
