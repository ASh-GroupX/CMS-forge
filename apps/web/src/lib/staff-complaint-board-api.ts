import { fieldErrorsFrom } from './staff-error-envelope';
import { CSRF_COOKIE, hasStaffSessionCookie, incomingCookieHeader, readCookie } from './staff-request-auth';
import type { ComplaintSeverity, ComplaintStatus, ComplaintTransitionAction } from './staff-complaints-api';

// Typed client for the ticket board (Kanban) contract — docs/CMSS_REVAMP_PLAN.md B5.
// Mirrors apps/api/src/modules/complaints/dto/complaint-board.dto.ts. Reads are
// authorized by the server session; a drop drives the existing complaint state
// machine (POST /complaints/:id/transitions) — the client never decides state.

export type ComplaintBoardStage = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  color: string;
  position: number;
  mappedComplaintStatus: ComplaintStatus | null;
};

export type ComplaintBoardTransition = { action: ComplaintTransitionAction; toStatus: ComplaintStatus };

export type ComplaintBoardCard = {
  id: string;
  referenceNumber: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  subject: string;
  branchId: string;
  branchName: string;
  displayTimeZone: string;
  ownerId: string | null;
  ownerName: string | null;
  slaState: 'ON_TRACK' | 'WARNING' | 'BREACHED' | 'CLOSED';
  slaDueAt: string | null;
  slaStage: string | null;
  slaPercentElapsed: number | null;
  nextAction: string | null;
  createdAt: string;
  updatedAt: string;
  stageId: string;
  allowedTransitions: ComplaintBoardTransition[];
};

export type ComplaintBoardColumn = { stageId: string; cards: ComplaintBoardCard[] };
export type ComplaintBoard = { stages: ComplaintBoardStage[]; columns: ComplaintBoardColumn[] };

export type ComplaintBoardLoadResult = { status: 'ready'; data: ComplaintBoard } | { status: 'denied' | 'error' };

// The board never invents transition fields — it forwards exactly what the
// backend workflow requires for the resolved action (reason/resolution/routing).
export type ComplaintTransitionPayload = {
  fromStatus: ComplaintStatus;
  action: ComplaintTransitionAction;
  reason?: string | null;
  targetBranchId?: string | null;
  targetDepartmentId?: string | null;
  ownerId?: string | null;
  resolutionType?: string | null;
  resolutionSummary?: string | null;
  customerCommunicationStatus?: string | null;
  vehicleDataUnavailableReason?: string | null;
};

export type TransitionComplaintResult =
  | { status: 'success' }
  | { status: 'invalid'; fields: string[] }
  | { status: 'conflict' }
  | { status: 'denied' | 'not_found' | 'error' };

type RequestOptions = { apiUrl?: string; cookieHeader?: string; fetchImpl?: typeof fetch };

export async function getComplaintBoardLoadResult({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: RequestOptions = {}): Promise<ComplaintBoardLoadResult> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };

  try {
    const response = await fetchImpl(new URL('/complaints/board', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (!response.ok) return { status: 'error' };
    const data = complaintBoardFrom(await response.json());
    return data ? { status: 'ready', data } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

// Server-side transition (direct API call with the forwarded session + CSRF), so
// a server action can revalidate the board on success. A stale status yields 409
// → 'conflict' (COMPLAINT_INVALID_TRANSITION), surfaced as the board's conflict state.
export async function transitionComplaint(
  complaintId: string,
  payload: ComplaintTransitionPayload,
  { apiUrl = process.env.API_URL ?? 'http://localhost:3000', cookieHeader, fetchImpl = fetch }: RequestOptions = {},
): Promise<TransitionComplaintResult> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };
  const csrf = readCookie(cookies, CSRF_COOKIE);

  try {
    const response = await fetchImpl(new URL(`/complaints/${encodeURIComponent(complaintId)}/transitions`, apiUrl), {
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
    if (response.status === 409) return { status: 'conflict' };
    if (response.status === 400) return { status: 'invalid', fields: await fieldErrorsFrom(response) };
    if (!response.ok) return { status: 'error' };
    return { status: 'success' };
  } catch {
    return { status: 'error' };
  }
}

function complaintBoardFrom(body: unknown): ComplaintBoard | null {
  if (!body || typeof body !== 'object') return null;
  const { stages: rawStages, columns: rawColumns } = body as { stages?: unknown; columns?: unknown };
  if (!Array.isArray(rawStages) || !Array.isArray(rawColumns)) return null;

  const stages = rawStages.map((stage) => boardStageFrom(stage as Partial<ComplaintBoardStage>));
  if (stages.some((stage) => stage === null)) return null;

  const columns: ComplaintBoardColumn[] = [];
  for (const rawColumn of rawColumns as Partial<ComplaintBoardColumn>[]) {
    if (typeof rawColumn?.stageId !== 'string' || !Array.isArray(rawColumn.cards)) return null;
    const cards = rawColumn.cards.map((card) => boardCardFrom(card as Partial<ComplaintBoardCard>));
    if (cards.some((card) => card === null)) return null;
    columns.push({ stageId: rawColumn.stageId, cards: cards as ComplaintBoardCard[] });
  }
  return { stages: stages as ComplaintBoardStage[], columns };
}

function boardStageFrom(stage: Partial<ComplaintBoardStage>): ComplaintBoardStage | null {
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
  const mappedComplaintStatus = stage.mappedComplaintStatus ?? null;
  if (mappedComplaintStatus !== null && !isComplaintStatus(mappedComplaintStatus)) return null;
  return {
    id: stage.id,
    code: stage.code,
    nameEn: stage.nameEn,
    nameAr: stage.nameAr,
    color: stage.color,
    position: stage.position,
    mappedComplaintStatus,
  };
}

export function boardCardFrom(card: Partial<ComplaintBoardCard>): ComplaintBoardCard | null {
  if (
    typeof card.id !== 'string' ||
    typeof card.referenceNumber !== 'string' ||
    !isComplaintStatus(card.status) ||
    !isSeverity(card.severity) ||
    typeof card.subject !== 'string' ||
    typeof card.branchId !== 'string' ||
    typeof card.branchName !== 'string' ||
    typeof card.displayTimeZone !== 'string' ||
    !isSlaState(card.slaState) ||
    typeof card.createdAt !== 'string' ||
    typeof card.updatedAt !== 'string' ||
    typeof card.stageId !== 'string' ||
    !Array.isArray(card.allowedTransitions)
  ) {
    return null;
  }
  const allowedTransitions = card.allowedTransitions.map((item) => boardTransitionFrom(item as Partial<ComplaintBoardTransition>));
  if (allowedTransitions.some((item) => item === null)) return null;
  return {
    id: card.id,
    referenceNumber: card.referenceNumber,
    status: card.status,
    severity: card.severity,
    subject: card.subject,
    branchId: card.branchId,
    branchName: card.branchName,
    displayTimeZone: card.displayTimeZone,
    ownerId: typeof card.ownerId === 'string' ? card.ownerId : null,
    ownerName: typeof card.ownerName === 'string' ? card.ownerName : null,
    slaState: card.slaState,
    slaDueAt: typeof card.slaDueAt === 'string' ? card.slaDueAt : null,
    slaStage: typeof card.slaStage === 'string' ? card.slaStage : null,
    slaPercentElapsed: typeof card.slaPercentElapsed === 'number' ? card.slaPercentElapsed : null,
    nextAction: typeof card.nextAction === 'string' ? card.nextAction : null,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    stageId: card.stageId,
    allowedTransitions: allowedTransitions as ComplaintBoardTransition[],
  };
}

function boardTransitionFrom(item: Partial<ComplaintBoardTransition>): ComplaintBoardTransition | null {
  if (typeof item?.action !== 'string' || !isComplaintStatus(item.toStatus)) return null;
  return { action: item.action as ComplaintTransitionAction, toStatus: item.toStatus };
}

function isComplaintStatus(value: unknown): value is ComplaintStatus {
  return value === 'DRAFT' || value === 'SUBMITTED' || value === 'MANAGER_REVIEW' || value === 'BRANCH_REVIEW' || value === 'IN_PROGRESS' || value === 'RESOLVED' || value === 'CLOSED' || value === 'REOPENED' || value === 'REJECTED';
}

function isSeverity(value: unknown): value is ComplaintSeverity {
  return value === 'CRITICAL' || value === 'HIGH' || value === 'MEDIUM' || value === 'LOW';
}

function isSlaState(value: unknown): value is ComplaintBoardCard['slaState'] {
  return value === 'ON_TRACK' || value === 'WARNING' || value === 'BREACHED' || value === 'CLOSED';
}
