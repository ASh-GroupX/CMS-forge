export type StaffNotification = {
  id: string;
  status: string;
  templateCode: string;
  queuedAt: string;
  payload: { taskId?: string; title?: string; status?: string; message?: string };
};

const STAFF_SESSION_COOKIE = 'cms_staff_session';

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
    templateCode: item.templateCode,
    queuedAt: item.queuedAt,
    payload: {
      ...(typeof payload.taskId === 'string' ? { taskId: payload.taskId } : {}),
      ...(typeof payload.title === 'string' ? { title: payload.title } : {}),
      ...(typeof payload.status === 'string' ? { status: payload.status } : {}),
      ...(typeof payload.message === 'string' ? { message: payload.message } : {}),
    },
  };
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
