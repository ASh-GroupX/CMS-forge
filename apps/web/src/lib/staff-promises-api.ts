import { staffTaskFrom, type StaffTask } from './staff-tasks-api';

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export type StaffPromiseTask = StaffTask & {
  customerLabel: string | null;
  dealLabel: string | null;
  keptOnTime: boolean | null;
};

export type StaffPromises = {
  openPromiseCount: number;
  overduePromiseCount: number;
  keptOnTimePercent: number;
  promises: StaffPromiseTask[];
};

type Body = Partial<Omit<StaffPromises, 'promises'>> & { promises?: Partial<StaffPromiseTask>[] };

export async function getStaffPromises({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffPromises | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!cookies.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`))) return null;
  try {
    const response = await fetchImpl(new URL('/tasks/promises', apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } });
    return response.ok ? promisesFrom((await response.json()) as Body) : null;
  } catch {
    return null;
  }
}

function promisesFrom(body: Body): StaffPromises | null {
  if (typeof body.openPromiseCount !== 'number' || typeof body.overduePromiseCount !== 'number' || typeof body.keptOnTimePercent !== 'number' || !Array.isArray(body.promises)) return null;
  const promises = body.promises.map((row) => {
    const task = staffTaskFrom(row);
    if (!task) return null;
    return {
      ...task,
      customerLabel: typeof row.customerLabel === 'string' ? row.customerLabel : null,
      dealLabel: typeof row.dealLabel === 'string' ? row.dealLabel : null,
      keptOnTime: typeof row.keptOnTime === 'boolean' ? row.keptOnTime : null,
    };
  });
  return promises.some((task) => task === null) ? null : { openPromiseCount: body.openPromiseCount, overduePromiseCount: body.overduePromiseCount, keptOnTimePercent: body.keptOnTimePercent, promises: promises as StaffPromiseTask[] };
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}
