import type { StaffCommentApiResult } from './staff-complaint-comments-api';
import { staffRequestJson } from './staff-complaint-comments-api';
import { hasStaffSessionCookie, incomingCookieHeader } from './staff-request-auth';

export type StaffGroupMember = { userId: string; displayName: string; displayNameAr: string };
export type StaffCommunicationGroup = { id: string; name: string; visibility: 'PERSONAL' | 'SHARED'; ownerId: string; members: StaffGroupMember[]; createdAt: string; updatedAt: string };
export type StaffCommunicationGroups = { items: StaffCommunicationGroup[]; eligibleMembers: StaffGroupMember[]; canManageShared: boolean };
export type StaffGroupWrite = { name: string; visibility: 'PERSONAL' | 'SHARED'; memberUserIds: string[] };
export type StaffGroupsLoadResult = { status: 'ready'; data: StaffCommunicationGroups } | { status: 'denied' | 'error' };

export async function getStaffCommunicationGroups({ apiUrl = process.env.API_URL ?? 'http://localhost:3000', cookieHeader, fetchImpl = fetch }: { apiUrl?: string; cookieHeader?: string; fetchImpl?: typeof fetch } = {}): Promise<StaffGroupsLoadResult> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };
  try {
    const response = await fetchImpl(new URL('/communication-groups', apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (!response.ok) return { status: 'error' };
    const body = await response.json() as Partial<StaffCommunicationGroups>;
    return groups(body) ? { status: 'ready', data: body } : { status: 'error' };
  } catch { return { status: 'error' }; }
}

export function writeCommunicationGroup(id: string | null, value: StaffGroupWrite, fetchImpl: typeof fetch = fetch): Promise<StaffCommentApiResult<StaffCommunicationGroup>> {
  const path = id ? `/api/communication-groups/${encodeURIComponent(id)}` : '/api/communication-groups';
  return staffRequestJson(path, fetchImpl, { body: JSON.stringify(value), headers: csrfHeaders(), method: id ? 'PATCH' : 'POST' });
}

export function deactivateCommunicationGroup(id: string, fetchImpl: typeof fetch = fetch): Promise<StaffCommentApiResult<void>> {
  return staffRequestJson(`/api/communication-groups/${encodeURIComponent(id)}`, fetchImpl, { headers: csrfHeaders(), method: 'DELETE' });
}

function groups(value: Partial<StaffCommunicationGroups>): value is StaffCommunicationGroups { return Array.isArray(value.items) && value.items.every(group) && Array.isArray(value.eligibleMembers) && value.eligibleMembers.every(member) && typeof value.canManageShared === 'boolean'; }
function group(value: unknown): value is StaffCommunicationGroup { const row = value as Partial<StaffCommunicationGroup>; return typeof row?.id === 'string' && typeof row.name === 'string' && (row.visibility === 'PERSONAL' || row.visibility === 'SHARED') && typeof row.ownerId === 'string' && Array.isArray(row.members) && row.members.every(member) && typeof row.createdAt === 'string' && typeof row.updatedAt === 'string'; }
function member(value: unknown): value is StaffGroupMember { const row = value as Partial<StaffGroupMember>; return typeof row?.userId === 'string' && typeof row.displayName === 'string' && typeof row.displayNameAr === 'string'; }
function csrfHeaders(): HeadersInit { const token = typeof document === 'undefined' ? null : document.cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith('cms_csrf_token='))?.slice('cms_csrf_token='.length) ?? null; return token ? { Accept: 'application/json', 'content-type': 'application/json', 'x-csrf-token': token } : { Accept: 'application/json', 'content-type': 'application/json' }; }
