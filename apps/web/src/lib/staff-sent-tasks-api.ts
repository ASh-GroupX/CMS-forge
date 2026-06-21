import { staffTaskFrom, type StaffTask } from './staff-tasks-api';

export type StaffTaskComment = {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string | null;
  body: string;
  createdAt: string;
};
export type SentTask = StaffTask & { comments: StaffTaskComment[] };

const STAFF_SESSION_COOKIE = 'cms_staff_session';
const CSRF_COOKIE = 'cms_csrf_token';

export async function getSentTasks({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<SentTask[] | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;
  try {
    const response = await fetchImpl(new URL('/tasks/sent-by-me', apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } });
    if (!response.ok) return null;
    const body = (await response.json()) as { tasks?: Partial<StaffTask>[] };
    if (!Array.isArray(body.tasks)) return null;
    const tasks = body.tasks.map(staffTaskFrom);
    if (tasks.some((task) => task === null)) return null;
    return Promise.all((tasks as StaffTask[]).map(async (task) => ({ ...task, comments: await getTaskComments(task.id, { apiUrl, cookieHeader: cookies, fetchImpl }) ?? [] })));
  } catch {
    return null;
  }
}

export async function commentOnTask(taskId: string, body: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  return taskWrite(`/tasks/${encodeURIComponent(taskId)}/comments`, { body }, fetchImpl);
}

export async function nudgeTask(taskId: string, message: string | undefined, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  return taskWrite(`/tasks/${encodeURIComponent(taskId)}/nudge`, message ? { message } : {}, fetchImpl);
}

async function getTaskComments(taskId: string, { apiUrl, cookieHeader, fetchImpl }: { apiUrl: string; cookieHeader: string; fetchImpl: typeof fetch }): Promise<StaffTaskComment[] | null> {
  const response = await fetchImpl(new URL(`/tasks/${encodeURIComponent(taskId)}/comments`, apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookieHeader } });
  if (!response.ok) return null;
  const body = (await response.json()) as { comments?: Partial<StaffTaskComment>[] };
  if (!Array.isArray(body.comments)) return null;
  const comments = body.comments.map(commentFrom);
  return comments.some((comment) => comment === null) ? null : comments as StaffTaskComment[];
}

function commentFrom(comment: Partial<StaffTaskComment>): StaffTaskComment | null {
  if (typeof comment.id !== 'string' || typeof comment.taskId !== 'string' || typeof comment.authorId !== 'string' || typeof comment.body !== 'string' || typeof comment.createdAt !== 'string') return null;
  return { id: comment.id, taskId: comment.taskId, authorId: comment.authorId, authorName: typeof comment.authorName === 'string' ? comment.authorName : null, body: comment.body, createdAt: comment.createdAt };
}

async function taskWrite(path: string, payload: unknown, fetchImpl: typeof fetch): Promise<boolean> {
  const cookies = await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return false;
  const csrf = readCookie(cookies, CSRF_COOKIE);
  try {
    const response = await fetchImpl(new URL(path, process.env.API_URL ?? 'http://localhost:3000'), {
      body: JSON.stringify(payload),
      cache: 'no-store',
      headers: { Accept: 'application/json', 'content-type': 'application/json', cookie: cookies, ...(csrf ? { 'x-csrf-token': csrf } : {}) },
      method: 'POST',
    });
    return response.ok;
  } catch {
    return false;
  }
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

function readCookie(cookieHeader: string, name: string): string | null {
  return cookieHeader.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}
