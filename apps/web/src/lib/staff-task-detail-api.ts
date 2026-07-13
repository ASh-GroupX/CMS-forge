import { staffRequestJson, type CollaborationMentionTarget, type CollaborationTarget, type CommunicationTargets, type StaffCommentApiResult } from './staff-complaint-comments-api';
import { hasStaffSessionCookie, incomingCookieHeader } from './staff-request-auth';
import { staffTaskFrom, type StaffTask } from './staff-tasks-api';

export type StaffTaskComment = { id: string; taskId: string; authorId: string; authorName: string | null; authorNameAr?: string | null; body: string; mentions: { userId: string; name: string | null; nameAr: string | null; source: string; sourceLabel: string }[]; createdAt: string };
export type StaffTaskCommentRequest = { body: string; mentionTargets?: CollaborationMentionTarget[]; ccUserIds?: string[]; confirmedRecipientCount?: number };

export async function getStaffTaskDetail({ apiUrl = process.env.API_URL ?? 'http://localhost:3000', cookieHeader, fetchImpl = fetch, taskId }: { apiUrl?: string; cookieHeader?: string; fetchImpl?: typeof fetch; taskId: string }): Promise<StaffTask | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;
  try {
    const response = await fetchImpl(new URL(`/tasks/${encodeURIComponent(taskId)}`, apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } });
    if (!response.ok) return null;
    return staffTaskFrom(((await response.json()) as { task?: Partial<StaffTask> }).task ?? {});
  } catch { return null; }
}

export async function getStaffTaskComments({ apiUrl = process.env.API_URL ?? 'http://localhost:3000', cookieHeader, fetchImpl = fetch, taskId }: { apiUrl?: string; cookieHeader?: string; fetchImpl?: typeof fetch; taskId: string }): Promise<StaffTaskComment[] | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;
  try {
    const response = await fetchImpl(new URL(`/tasks/${encodeURIComponent(taskId)}/comments`, apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } });
    if (!response.ok) return null;
    const body = (await response.json()) as { comments?: unknown[] };
    return Array.isArray(body.comments) && body.comments.every(taskComment) ? body.comments : null;
  } catch { return null; }
}

export async function getTaskCommunicationTargets(taskId: string, query = '', fetchImpl: typeof fetch = fetch): Promise<CommunicationTargets | null> {
  try {
    const response = await fetchImpl(`/api/tasks/${encodeURIComponent(taskId)}/communication-targets?q=${encodeURIComponent(query)}`, { credentials: 'include', headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const body = await response.json() as Partial<CommunicationTargets>;
    return Array.isArray(body.targets) && body.targets.every(target) && Array.isArray(body.currentWatchers) && body.currentWatchers.every(watcher) && capabilities(body.capabilities) && typeof body.recipientLimit === 'number' && typeof body.confirmationRequiredAbove === 'number' ? body as CommunicationTargets : null;
  } catch { return null; }
}

export async function addTaskComment(taskId: string, request: StaffTaskCommentRequest, fetchImpl: typeof fetch = fetch): Promise<StaffCommentApiResult<{ comment: StaffTaskComment }>> {
  return staffRequestJson(`/api/tasks/${encodeURIComponent(taskId)}/comments`, fetchImpl, { body: JSON.stringify(request), headers: csrfHeaders(), method: 'POST' });
}

export function removeTaskWatcher(taskId: string, userId: string, fetchImpl: typeof fetch = fetch): Promise<StaffCommentApiResult<void>> {
  return staffRequestJson(`/api/tasks/${encodeURIComponent(taskId)}/watchers/${encodeURIComponent(userId)}`, fetchImpl, { headers: csrfHeaders(), method: 'DELETE' });
}

function taskComment(value: unknown): value is StaffTaskComment {
  const row = value as Partial<StaffTaskComment>;
  return typeof row?.id === 'string' && typeof row.taskId === 'string' && typeof row.authorId === 'string' && typeof row.body === 'string' && typeof row.createdAt === 'string' && Array.isArray(row.mentions);
}
function target(value: unknown): value is CollaborationTarget { const row = value as Partial<CollaborationTarget>; return typeof row?.id === 'string' && typeof row.label === 'string' && typeof row.labelAr === 'string' && typeof row.recipientCount === 'number' && ['USER', 'SYSTEM_ROLE', 'SYSTEM_DEPARTMENT', 'CUSTOM_GROUP'].includes(String(row.type)); }
function watcher(value: unknown): boolean { const row = value as { userId?: unknown; name?: unknown; nameAr?: unknown }; return typeof row?.userId === 'string' && typeof row.name === 'string' && typeof row.nameAr === 'string'; }
function capabilities(value: unknown): boolean { const row = value as { canComment?: unknown; canManage?: unknown; canManageWatchers?: unknown }; return typeof row?.canComment === 'boolean' && typeof row.canManage === 'boolean' && typeof row.canManageWatchers === 'boolean'; }
function csrfHeaders(): HeadersInit { const token = typeof document === 'undefined' ? null : document.cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith('cms_csrf_token='))?.slice('cms_csrf_token='.length) ?? null; return token ? { Accept: 'application/json', 'content-type': 'application/json', 'x-csrf-token': token } : { Accept: 'application/json', 'content-type': 'application/json' }; }
