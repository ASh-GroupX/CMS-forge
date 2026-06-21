export type AdminUser = {
  id: string;
  email: string;
  nameEn: string;
  nameAr: string;
  roleCode: string;
  roleName: string;
  branchId: string | null;
  branchName: string | null;
  isActive: boolean;
};
export type AdminOption = { id: string; code: string; nameEn: string; nameAr: string };
export type AdminUsersData = { users: AdminUser[]; roles: AdminOption[]; branches: AdminOption[] };

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getAdminUsers({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<AdminUsersData | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!cookies.includes(`${STAFF_SESSION_COOKIE}=`)) return null;
  try {
    const response = await fetchImpl(new URL('/admin/users', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    return response.ok ? ((await response.json()) as AdminUsersData) : null;
  } catch {
    return null;
  }
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}
