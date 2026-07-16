import { getStaffTaskComments, type StaffTaskComment } from './staff-task-detail-api';
import { hasStaffSessionCookie, incomingCookieHeader } from './staff-request-auth';

// Fetch-on-open payload for the task board's quick-look drawer (B6). Reuses the
// authorized task-comments endpoint (server-side branch/visibility scoping); the
// drawer adds no read path that sidesteps that authorization.

export type TaskCardDetail =
  | { status: 'ready'; comments: StaffTaskComment[] }
  | { status: 'denied' | 'error' };

type RequestOptions = { apiUrl?: string; cookieHeader?: string; fetchImpl?: typeof fetch };

export async function getTaskCardDetail(
  taskId: string,
  { apiUrl = process.env.API_URL ?? 'http://localhost:3000', cookieHeader, fetchImpl = fetch }: RequestOptions = {},
): Promise<TaskCardDetail> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };
  const comments = await getStaffTaskComments({ apiUrl, cookieHeader: cookies, fetchImpl, taskId });
  // getStaffTaskComments returns null on a non-ok/denied response; with a valid
  // session that means the read failed, surfaced as the drawer's error state.
  return comments ? { status: 'ready', comments } : { status: 'error' };
}

export type { StaffTaskComment };
