import type { ComplaintQueueItem, StaffApiResult } from './staff-complaints-api';

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export type SafeComplaintRelationItem = Pick<ComplaintQueueItem, 'id' | 'referenceNumber' | 'status' | 'severity' | 'subject' | 'branchId' | 'createdAt' | 'updatedAt'> & { branchName: string; customerName?: string };
export type ComplaintRelationState = 'ready' | 'loading' | 'empty' | 'error' | 'denied' | 'success';
export type StaffComplaintRelationsView = { candidates: SafeComplaintRelationItem[]; related: SafeComplaintRelationItem[]; state: ComplaintRelationState; windowDays: number };
export type ComplaintRelationMutationResponse = { relation: { sourceComplaintId: string; targetComplaintId: string; changed: boolean } };

type RelationListResponse = { items?: unknown[] };
type DuplicateCandidatesResponse = RelationListResponse & { windowDays?: number };
type ErrorEnvelope = { error?: { code?: string; message?: string; correlationId?: string | null } };
type RelationRead<T> = { ok: true; data: T } | { ok: false; denied: boolean };

export async function getStaffComplaintRelationsView({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  complaintId,
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  complaintId?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffComplaintRelationsView | null> {
  const id = complaintId?.trim();
  if (!id) return null;
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  const [candidates, related] = await Promise.all([
    getStaffComplaintDuplicateCandidates({ apiUrl, complaintId: id, cookies, fetchImpl }),
    getStaffComplaintRelated({ apiUrl, complaintId: id, cookies, fetchImpl }),
  ]);
  if (!candidates.ok || !related.ok) return { candidates: [], related: [], state: relationDenied(candidates) || relationDenied(related) ? 'denied' : 'error', windowDays: 30 };
  const items = { candidates: candidates.data.items, related: related.data.items };
  return { ...items, state: items.candidates.length || items.related.length ? 'ready' : 'empty', windowDays: candidates.data.windowDays };
}

export async function getStaffComplaintDuplicateCandidates({ apiUrl, complaintId, cookies, fetchImpl }: { apiUrl: string; complaintId: string; cookies: string; fetchImpl: typeof fetch }): Promise<RelationRead<{ items: SafeComplaintRelationItem[]; windowDays: number }>> {
  const result = await getJson<DuplicateCandidatesResponse>(apiUrl, `/complaints/${encodeURIComponent(complaintId)}/duplicate-candidates`, cookies, fetchImpl);
  return result.ok ? { ok: true, data: { items: safeItems(result.data.items), windowDays: typeof result.data.windowDays === 'number' ? result.data.windowDays : 30 } } : result;
}

export async function getStaffComplaintRelated({ apiUrl, complaintId, cookies, fetchImpl }: { apiUrl: string; complaintId: string; cookies: string; fetchImpl: typeof fetch }): Promise<RelationRead<{ items: SafeComplaintRelationItem[] }>> {
  const result = await getJson<RelationListResponse>(apiUrl, `/complaints/${encodeURIComponent(complaintId)}/related`, cookies, fetchImpl);
  return result.ok ? { ok: true, data: { items: safeItems(result.data.items) } } : result;
}

export function linkStaffComplaintRelation(complaintId: string, targetComplaintId: string, fetchImpl: typeof fetch = fetch): Promise<StaffApiResult<ComplaintRelationMutationResponse>> {
  return requestJson(`/api/complaints/${encodeURIComponent(complaintId)}/related`, fetchImpl, {
    body: JSON.stringify({ targetComplaintId }),
    headers: csrfHeaders(),
    method: 'POST',
  });
}

export function unlinkStaffComplaintRelation(complaintId: string, targetComplaintId: string, fetchImpl: typeof fetch = fetch): Promise<StaffApiResult<ComplaintRelationMutationResponse>> {
  return requestJson(`/api/complaints/${encodeURIComponent(complaintId)}/related`, fetchImpl, {
    body: JSON.stringify({ targetComplaintId }),
    headers: csrfHeaders(),
    method: 'DELETE',
  });
}

async function getJson<T>(apiUrl: string, path: string, cookies: string, fetchImpl: typeof fetch): Promise<RelationRead<T>> {
  try {
    const response = await fetchImpl(new URL(path, apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } });
    if (!response.ok) return { ok: false, denied: response.status === 401 || response.status === 403 };
    return { ok: true, data: await response.json() as T };
  } catch {
    return { ok: false, denied: false };
  }
}

function relationDenied(read: RelationRead<unknown>): boolean {
  return !read.ok && read.denied;
}

async function requestJson<T>(path: string, fetchImpl: typeof fetch, init: RequestInit): Promise<StaffApiResult<T>> {
  try {
    const response = await fetchImpl(path, { credentials: 'include', ...init, headers: { Accept: 'application/json', ...init.headers } });
    if (!response.ok) return { ok: false, error: await mapErrorResponse(response) };
    return { ok: true, data: await response.json() as T };
  } catch {
    return { ok: false, error: { kind: 'network', code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } };
  }
}

function safeItems(items: unknown): SafeComplaintRelationItem[] {
  return Array.isArray(items) ? items.flatMap((item) => safeItem(item)) : [];
}

function safeItem(value: unknown): SafeComplaintRelationItem[] {
  const item = value as Partial<SafeComplaintRelationItem>;
  if (!(typeof item?.id === 'string' && typeof item.referenceNumber === 'string' && typeof item.status === 'string' && typeof item.severity === 'string' && typeof item.subject === 'string' && typeof item.branchId === 'string' && typeof item.branchName === 'string' && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string')) return [];
  return [{
    id: item.id,
    referenceNumber: item.referenceNumber,
    status: item.status,
    severity: item.severity,
    subject: item.subject,
    branchId: item.branchId,
    branchName: item.branchName,
    ...(typeof item.customerName === 'string' ? { customerName: item.customerName } : {}),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }];
}

function csrfHeaders(): HeadersInit {
  const csrfToken = readableCookie('cms_csrf_token');
  return csrfToken ? { 'content-type': 'application/json', 'x-csrf-token': csrfToken } : { 'content-type': 'application/json' };
}

function readableCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function mapErrorResponse(response: Response) {
  const envelope = await response.json().catch(() => null) as ErrorEnvelope | null;
  return { kind: 'api' as const, code: envelope?.error?.code ?? 'API_ERROR', message: envelope?.error?.message ?? 'Request failed. Try again.', correlationId: envelope?.error?.correlationId ?? null, status: response.status };
}

function hasStaffSessionCookie(cookieHeader: string): boolean {
  return cookieHeader.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`));
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}
