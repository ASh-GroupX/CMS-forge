export type StaffSessionPrincipal = {
  sessionId: string;
  userId: string;
  email: string;
  nameEn: string;
  nameAr: string;
  roleCode: string;
  permissions: string[];
  branchId: string | null;
  branchName: string | null;
  branchNameAr: string | null;
  branchTimezone: string | null;
};

type AuthMeResponse = { user?: Partial<StaffSessionPrincipal> };

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getStaffSessionPrincipal({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffSessionPrincipal | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const response = await fetchImpl(new URL('/auth/me', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return principalFrom((await response.json()) as AuthMeResponse);
  } catch {
    return null;
  }
}

function hasStaffSessionCookie(cookieHeader: string): boolean {
  return cookieHeader.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`));
}

function principalFrom(body: AuthMeResponse): StaffSessionPrincipal | null {
  const user = body.user;
  if (
    typeof user?.sessionId !== 'string' ||
    typeof user.userId !== 'string' ||
    typeof user.email !== 'string' ||
    typeof user.nameEn !== 'string' ||
    typeof user.nameAr !== 'string' ||
    typeof user.roleCode !== 'string'
  ) {
    return null;
  }

  return {
    sessionId: user.sessionId,
    userId: user.userId,
    email: user.email,
    nameEn: user.nameEn,
    nameAr: user.nameAr,
    roleCode: user.roleCode,
    permissions: Array.isArray(user.permissions) ? user.permissions.filter((permission): permission is string => typeof permission === 'string') : [],
    branchId: typeof user.branchId === 'string' ? user.branchId : null,
    branchName: typeof user.branchName === 'string' ? user.branchName : null,
    branchNameAr: typeof user.branchNameAr === 'string' ? user.branchNameAr : null,
    branchTimezone: typeof user.branchTimezone === 'string' ? user.branchTimezone : null,
  };
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}
