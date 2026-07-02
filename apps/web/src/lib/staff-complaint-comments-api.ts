const STAFF_SESSION_COOKIE = 'cms_staff_session';

export type StaffComplaintCommentVisibility = 'INTERNAL' | 'PUBLIC';
export type StaffComplaintComment = { id: string; complaintId: string; body: string; visibility: StaffComplaintCommentVisibility; authorId: string | null; createdAt: string };
export type StaffComplaintCommentRequest = { body: string; visibility: StaffComplaintCommentVisibility };
export type StaffCommentApiError = { kind: 'api' | 'network'; code: string; message: string; correlationId: string | null; status?: number };
export type StaffCommentApiResult<T> = { ok: true; data: T } | { ok: false; error: StaffCommentApiError };

type CommentsResponse = { items?: unknown[] };
type ErrorEnvelope = { error?: { code?: string; message?: string; correlationId?: string | null } };

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
  return requestJson(`/api/complaints/${encodeURIComponent(complaintId)}/comments`, fetchImpl, { body: JSON.stringify(request), headers: csrfHeaders(), method: 'POST' });
}

async function requestJson<T>(path: string, fetchImpl: typeof fetch, init: RequestInit): Promise<StaffCommentApiResult<T>> {
  try {
    const response = await fetchImpl(path, { credentials: 'include', ...init, headers: { Accept: 'application/json', ...init.headers } });
    if (!response.ok) return { ok: false, error: await mapErrorResponse(response) };
    return { ok: true, data: await response.json() as T };
  } catch { return { ok: false, error: { kind: 'network', code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } }; }
}

function commentItem(item: unknown): item is StaffComplaintComment {
  const row = item as Partial<StaffComplaintComment>;
  return typeof row?.id === 'string' && typeof row.complaintId === 'string' && typeof row.body === 'string' && (row.visibility === 'INTERNAL' || row.visibility === 'PUBLIC') && (typeof row.authorId === 'string' || row.authorId === null) && typeof row.createdAt === 'string';
}

function hasStaffSessionCookie(cookieHeader: string): boolean { return cookieHeader.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`)); }
function csrfHeaders(): HeadersInit { const csrfToken = readableCookie('cms_csrf_token'); return csrfToken ? { 'content-type': 'application/json', 'x-csrf-token': csrfToken } : { 'content-type': 'application/json' }; }
function readableCookie(name: string): string | null { if (typeof document === 'undefined') return null; const prefix = `${encodeURIComponent(name)}=`; return document.cookie.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(prefix))?.slice(prefix.length) ?? null; }
async function incomingCookieHeader(): Promise<string> { try { const { cookies } = await import('next/headers'); return (await cookies()).toString(); } catch { return ''; } }
async function mapErrorResponse(response: Response): Promise<StaffCommentApiError> {
  const body = await response.json().catch(() => null) as ErrorEnvelope | null;
  return { kind: 'api', code: body?.error?.code ?? 'API_ERROR', message: body?.error?.message ?? 'Request failed. Try again.', correlationId: body?.error?.correlationId ?? null, status: response.status };
}
