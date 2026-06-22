export type AssignableStaff = {
  userId: string;
  displayName: string;
  displayNameAr: string;
  role: string;
  roleAr: string;
  branchLabel: string | null;
  branchLabelAr: string | null;
};

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getAssignableStaff({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<AssignableStaff[] | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!cookies.includes(`${STAFF_SESSION_COOKIE}=`)) return null;
  try {
    const response = await fetchImpl(new URL('/staff/assignable', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return staffFrom((await response.json()) as { staff?: Partial<AssignableStaff>[] });
  } catch {
    return null;
  }
}

function staffFrom(body: { staff?: Partial<AssignableStaff>[] }): AssignableStaff[] | null {
  if (!Array.isArray(body.staff)) return null;
  const rows = body.staff.filter((item): item is AssignableStaff =>
    typeof item.userId === 'string' &&
    typeof item.displayName === 'string' &&
    typeof item.displayNameAr === 'string' &&
    typeof item.role === 'string' &&
    typeof item.roleAr === 'string' &&
    (item.branchLabel === null || typeof item.branchLabel === 'string') &&
    (item.branchLabelAr === null || typeof item.branchLabelAr === 'string'));
  return rows.length === body.staff.length ? rows : null;
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}
