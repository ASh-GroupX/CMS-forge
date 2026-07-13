export type StaffNotification = {
  id: string;
  status: string;
  readAt: string | null;
  targetHref?: string;
  targetId?: string;
  targetType?: string;
  templateCode: string;
  queuedAt: string;
  payload: {
    complaintId?: string;
    complaintReference?: string;
    href?: string;
    message?: string;
    referenceNumber?: string;
    status?: string;
    targetHref?: string;
    targetId?: string;
    targetType?: string;
    taskId?: string;
    title?: string;
  };
};

const STAFF_SESSION_COOKIE = 'cms_staff_session';
const CSRF_COOKIE = 'cms_csrf_token';

export async function getStaffNotifications({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffNotification[] | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!cookies.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`))) return null;
  try {
    const response = await fetchImpl(new URL('/notifications', apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } });
    if (!response.ok) return null;
    const body = (await response.json()) as { items?: Partial<StaffNotification>[] };
    if (!Array.isArray(body.items)) return null;
    const items = body.items.map(notificationFrom);
    return items.some((item) => item === null) ? null : items as StaffNotification[];
  } catch {
    return null;
  }
}

function notificationFrom(item: Partial<StaffNotification>): StaffNotification | null {
  if (typeof item.id !== 'string' || typeof item.status !== 'string' || typeof item.templateCode !== 'string' || typeof item.queuedAt !== 'string') return null;
  const payload = isRecord(item.payload) ? item.payload : {};
  return {
    id: item.id,
    status: item.status,
    readAt: typeof item.readAt === 'string' ? item.readAt : null,
    ...(typeof item.targetHref === 'string' ? { targetHref: item.targetHref } : {}),
    ...(typeof item.targetId === 'string' ? { targetId: item.targetId } : {}),
    ...(typeof item.targetType === 'string' ? { targetType: item.targetType } : {}),
    templateCode: item.templateCode,
    queuedAt: item.queuedAt,
    payload: {
      ...(typeof payload.complaintId === 'string' ? { complaintId: payload.complaintId } : {}),
      ...(typeof payload.complaintReference === 'string' ? { complaintReference: payload.complaintReference } : {}),
      ...(typeof payload.href === 'string' ? { href: payload.href } : {}),
      ...(typeof payload.referenceNumber === 'string' ? { referenceNumber: payload.referenceNumber } : {}),
      ...(typeof payload.targetHref === 'string' ? { targetHref: payload.targetHref } : {}),
      ...(typeof payload.targetId === 'string' ? { targetId: payload.targetId } : {}),
      ...(typeof payload.targetType === 'string' ? { targetType: payload.targetType } : {}),
      ...(typeof payload.taskId === 'string' ? { taskId: payload.taskId } : {}),
      ...(typeof payload.title === 'string' ? { title: payload.title } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      ...(typeof payload.message === 'string' ? { message: payload.message } : {}),
    },
  };
}

export async function markStaffNotificationRead(notificationId: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  return notificationWrite(`/notifications/${encodeURIComponent(notificationId)}/read`, fetchImpl);
}

export async function markAllStaffNotificationsRead(fetchImpl: typeof fetch = fetch): Promise<boolean> {
  return notificationWrite('/notifications/read-all', fetchImpl);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}

async function notificationWrite(path: string, fetchImpl: typeof fetch): Promise<boolean> {
  const cookies = await incomingCookieHeader();
  if (!cookies.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`))) return false;
  const csrf = readCookie(cookies, CSRF_COOKIE);
  try {
    const response = await fetchImpl(new URL(path, process.env.API_URL ?? 'http://localhost:3000'), {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        cookie: cookies,
        ...(csrf ? { 'x-csrf-token': csrf } : {}),
      },
      method: 'POST',
    });
    return response.ok;
  } catch {
    return false;
  }
}

function readCookie(cookieHeader: string, name: string): string | null {
  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? null;
}
