export type StaffSessionPrincipal = {
  sessionId: string;
  userId: string;
  email: string | null;
  phone?: string | null | undefined;
  viewMode?: string | null | undefined;
  allowedNavKeys?: string[] | undefined;
  nameEn: string;
  nameAr: string;
  roleCode: string;
  permissions: string[];
  branchId: string | null;
  branchName: string | null;
  branchNameAr: string | null;
  branchTimezone: string | null;
  departmentId?: string | null | undefined;
  departmentName?: string | null | undefined;
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
    (user.email !== null && user.email !== undefined && typeof user.email !== 'string') ||
    typeof user.nameEn !== 'string' ||
    typeof user.nameAr !== 'string' ||
    typeof user.roleCode !== 'string'
  ) {
    return null;
  }

  return {
    sessionId: user.sessionId,
    userId: user.userId,
    email: typeof user.email === 'string' ? user.email : null,
    phone: typeof user.phone === 'string' ? user.phone : null,
    viewMode: typeof user.viewMode === 'string' ? user.viewMode : null,
    allowedNavKeys: Array.isArray(user.allowedNavKeys) ? user.allowedNavKeys.filter((k): k is string => typeof k === 'string') : undefined,
    nameEn: user.nameEn,
    nameAr: user.nameAr,
    roleCode: user.roleCode,
    permissions: Array.isArray(user.permissions) ? user.permissions.filter((permission): permission is string => typeof permission === 'string') : [],
    branchId: typeof user.branchId === 'string' ? user.branchId : null,
    branchName: typeof user.branchName === 'string' ? user.branchName : null,
    branchNameAr: typeof user.branchNameAr === 'string' ? user.branchNameAr : null,
    branchTimezone: typeof user.branchTimezone === 'string' ? user.branchTimezone : null,
    departmentId: typeof user.departmentId === 'string' ? user.departmentId : null,
    departmentName: typeof user.departmentName === 'string' ? user.departmentName : null,
  };
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { headers } = await import('next/headers');
    return (await headers()).get('cookie') ?? '';
  } catch {
    return '';
  }
}

export type UserDashboardCapabilities = {
  canSeeCrm: boolean;
  canSeeInternal: boolean;
  isInternalOnly: boolean;
  isCrmOnly: boolean;
};

export function resolveUserDashboardCapabilities(principal: StaffSessionPrincipal | null): UserDashboardCapabilities {
  const viewMode = principal?.viewMode;
  const allowed = principal?.allowedNavKeys;

  let canSeeCrm = true;
  let canSeeInternal = true;

  if (viewMode === 'INTERNAL_TICKETS') {
    canSeeCrm = false;
    canSeeInternal = true;
  } else if (viewMode === 'CRM') {
    canSeeCrm = true;
    canSeeInternal = false;
  } else if (viewMode === 'CUSTOM' && Array.isArray(allowed) && allowed.length > 0) {
    const hasCrm = allowed.includes('complaints') || allowed.includes('customers');
    const hasInternal = allowed.includes('internalTickets');
    if (hasInternal && !hasCrm) {
      canSeeCrm = false;
      canSeeInternal = true;
    } else if (hasCrm && !hasInternal) {
      canSeeCrm = true;
      canSeeInternal = false;
    }
  }

  return {
    canSeeCrm,
    canSeeInternal,
    isInternalOnly: canSeeInternal && !canSeeCrm,
    isCrmOnly: canSeeCrm && !canSeeInternal,
  };
}

