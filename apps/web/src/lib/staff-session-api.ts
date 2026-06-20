export type StaffSessionPrincipal = {
  sessionId: string;
  userId: string;
  email: string;
  nameEn: string;
  nameAr: string;
  roleCode: string;
  branchId: string | null;
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
    branchId: typeof user.branchId === 'string' ? user.branchId : null,
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
