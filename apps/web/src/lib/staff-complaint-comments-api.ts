const STAFF_SESSION_COOKIE = 'cms_staff_session';

export type StaffComplaintCommentVisibility = 'INTERNAL' | 'PUBLIC';
export type CollaborationTarget = {
  id: string;
  type: 'USER' | 'SYSTEM_ROLE' | 'SYSTEM_DEPARTMENT' | 'CUSTOM_GROUP';
  label: string;
  labelAr: string;
  recipientCount: number;
  roleCode?: string;
  roleName?: string;
  roleNameAr?: string;
  departmentId?: string | null;
  departmentName?: string | null;
  departmentNameAr?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  branchNameAr?: string | null;
};
export type CollaborationMentionTarget = Pick<CollaborationTarget, 'id' | 'type'>;
export type CollaborationWatcher = { userId: string; name: string; nameAr: string };
export type CollaborationCapabilities = { canComment: boolean; canManage: boolean; canManageWatchers: boolean };
export type CommunicationTargets = { targets: CollaborationTarget[]; currentWatchers: CollaborationWatcher[]; capabilities: CollaborationCapabilities; recipientLimit: number; confirmationRequiredAbove: number };
export type StaffComplaintComment = { id: string; complaintId: string; body: string; visibility: StaffComplaintCommentVisibility; authorId: string | null; authorName?: string; authorNameAr?: string; mentions?: { userId: string; name: string; nameAr: string; source: string; sourceLabel: string }[]; createdTaskId?: string | null; createdAt: string };
export type StaffComplaintCommentRequest = { body: string; visibility: StaffComplaintCommentVisibility; mentionTargets?: CollaborationMentionTarget[]; ccUserIds?: string[]; confirmedRecipientCount?: number; actionTask?: { title: string; assigneeId: string; dueAt: string } };
export type StaffCommentApiError = { kind: 'api' | 'network'; code: string; message: string; correlationId: string | null; status?: number; actualRecipientCount?: number };
export type StaffCommentApiResult<T> = { ok: true; data: T } | { ok: false; error: StaffCommentApiError };

type CommentsResponse = { items?: unknown[] };
type CollaborationTargetsResponse = { targets?: unknown[]; recipientLimit?: unknown; confirmationRequiredAbove?: unknown; currentWatchers?: unknown[]; capabilities?: unknown };
type ErrorEnvelope = { error?: { code?: string; message?: string; correlationId?: string | null; actualRecipientCount?: number } };

export async function getStaffComplaintComments({ apiUrl = process.env.API_URL ?? 'http://localhost:3000', complaintId, cookieHeader, fetchImpl = fetch }: { apiUrl?: string; complaintId?: string; cookieHeader?: string; fetchImpl?: typeof fetch } = {}): Promise<StaffComplaintComment[] | null> {
  const id = complaintId?.trim();
  if (!id) return null;
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;
  try {
    const response = await fetchImpl(new URL(`/complaints/${encodeURIComponent(id)}/comments`, apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } });
    if (!response.ok) return null;
    const body = await response.json() as CommentsResponse;
    return Array.isArray(body.items) ? body.items.filter(commentItem) : null;
  } catch { return null; }
}

export function addStaffComplaintComment(complaintId: string, request: StaffComplaintCommentRequest, fetchImpl: typeof fetch = fetch): Promise<StaffCommentApiResult<{ comment: StaffComplaintComment }>> {
  return staffRequestJson(`/api/complaints/${encodeURIComponent(complaintId)}/comments`, fetchImpl, { body: JSON.stringify(request), headers: csrfHeaders(), method: 'POST' });
}

export async function getComplaintCommunicationTargets(complaintId: string, query = '', fetchImpl: typeof fetch = fetch): Promise<CommunicationTargets | null> {
  try {
    const response = await fetchImpl(`/api/complaints/${encodeURIComponent(complaintId)}/communication-targets?q=${encodeURIComponent(query)}`, { credentials: 'include', headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const body = await response.json() as CollaborationTargetsResponse;
    if (!Array.isArray(body.targets) || !Array.isArray(body.currentWatchers) || typeof body.recipientLimit !== 'number' || typeof body.confirmationRequiredAbove !== 'number' || !capabilitiesItem(body.capabilities)) return null;
    const targets = body.targets.filter(targetItem);
    const currentWatchers = body.currentWatchers.filter(watcherItem);
    return targets.length === body.targets.length && currentWatchers.length === body.currentWatchers.length ? { targets, currentWatchers, capabilities: body.capabilities, recipientLimit: body.recipientLimit, confirmationRequiredAbove: body.confirmationRequiredAbove } : null;
  } catch { return null; }
}

export function removeComplaintWatcher(complaintId: string, userId: string, fetchImpl: typeof fetch = fetch): Promise<StaffCommentApiResult<void>> {
  return staffRequestJson(`/api/complaints/${encodeURIComponent(complaintId)}/watchers/${encodeURIComponent(userId)}`, fetchImpl, { headers: csrfHeaders(), method: 'DELETE' });
}

export async function staffRequestJson<T>(path: string, fetchImpl: typeof fetch, init: RequestInit): Promise<StaffCommentApiResult<T>> {
  try {
    const response = await fetchImpl(path, { credentials: 'include', ...init, headers: { Accept: 'application/json', ...init.headers } });
    if (!response.ok) return { ok: false, error: await mapErrorResponse(response) };
    return { ok: true, data: response.status === 204 ? undefined as T : await response.json() as T };
  } catch { return { ok: false, error: { kind: 'network', code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }; }
}

function commentItem(item: unknown): item is StaffComplaintComment {
  const row = item as Partial<StaffComplaintComment>;
  return typeof row?.id === 'string' && typeof row.complaintId === 'string' && typeof row.body === 'string' && (row.visibility === 'INTERNAL' || row.visibility === 'PUBLIC') && (typeof row.authorId === 'string' || row.authorId === null) && typeof row.createdAt === 'string';
}

function targetItem(item: unknown): item is CollaborationTarget {
  const row = item as Partial<CollaborationTarget>;
  return typeof row?.id === 'string' && typeof row.label === 'string' && typeof row.labelAr === 'string' && typeof row.recipientCount === 'number' && ['USER', 'SYSTEM_ROLE', 'SYSTEM_DEPARTMENT', 'CUSTOM_GROUP'].includes(String(row.type));
}
function watcherItem(item: unknown): item is CollaborationWatcher { const row = item as Partial<CollaborationWatcher>; return typeof row?.userId === 'string' && typeof row.name === 'string' && typeof row.nameAr === 'string'; }
function capabilitiesItem(item: unknown): item is CollaborationCapabilities { const row = item as Partial<CollaborationCapabilities>; return typeof row?.canComment === 'boolean' && typeof row.canManage === 'boolean' && typeof row.canManageWatchers === 'boolean'; }

function hasStaffSessionCookie(cookieHeader: string): boolean { return cookieHeader.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`)); }
function csrfHeaders(): HeadersInit { const csrfToken = readableCookie('cms_csrf_token'); return csrfToken ? { 'content-type': 'application/json', 'x-csrf-token': csrfToken } : { 'content-type': 'application/json' }; }
function readableCookie(name: string): string | null { if (typeof document === 'undefined') return null; const prefix = `${encodeURIComponent(name)}=`; return document.cookie.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(prefix))?.slice(prefix.length) ?? null; }
async function incomingCookieHeader(): Promise<string> { try { const { cookies } = await import('next/headers'); return (await cookies()).toString(); } catch { return ''; } }
async function mapErrorResponse(response: Response): Promise<StaffCommentApiError> {
  const body = await response.json().catch(() => null) as ErrorEnvelope | null;
  return { kind: 'api', code: body?.error?.code ?? 'API_ERROR', message: body?.error?.message ?? 'Request failed. Try again.', correlationId: body?.error?.correlationId ?? null, status: response.status, ...(typeof body?.error?.actualRecipientCount === 'number' ? { actualRecipientCount: body.error.actualRecipientCount } : {}) };
}
