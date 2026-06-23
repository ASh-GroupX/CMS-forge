export type AdminPermission = { id: string; code: string; nameEn: string; nameAr: string };
export type AdminRole = AdminPermission & { isActive: boolean; isSystem: boolean; permissions: AdminPermission[] };
export type AdminRolesData = { roles: AdminRole[]; permissions: AdminPermission[] };

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getAdminRoles({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000', cookieHeader, fetchImpl = fetch,
}: { apiUrl?: string; cookieHeader?: string; fetchImpl?: typeof fetch } = {}): Promise<AdminRolesData | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!cookies.includes(`${STAFF_SESSION_COOKIE}=`)) return null;
  try {
    const response = await fetchImpl(new URL('/admin/roles', apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } });
    return response.ok ? (await response.json()) as AdminRolesData : null;
  } catch { return null; }
}

async function incomingCookieHeader(): Promise<string> {
  try { const { cookies } = await import('next/headers'); return (await cookies()).toString(); } catch { return ''; }
}
