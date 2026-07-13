export type AdminCategory = { id: string; code: string; nameEn: string; nameAr: string; parentId: string | null; isActive: boolean };
export type AdminSlaPolicy = {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  stage: string;
  branchId: string | null;
  departmentId: string | null;
  categoryId: string | null;
  durationMinutes: number;
  warningPercent: number;
  branchTimezone: string;
  workingCalendarMode: 'ALWAYS_ON' | 'CALENDAR_HOURS';
  pausePolicy: string;
  escalationLevel1: string;
  escalationLevel2: string | null;
  escalationLevel3: string | null;
  escalationLevel2AfterBreachMinutes: number | null;
  escalationLevel3AfterBreachMinutes: number | null;
  totalTargetMinutes: number | null;
  isActive: boolean;
};

export type AdminCategorySlaConfig = { categories: AdminCategory[]; policies: AdminSlaPolicy[] };

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getAdminCategorySlaConfig({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<AdminCategorySlaConfig | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;
  try {
    const [categories, policies] = await Promise.all([
      fetchImpl(new URL('/admin/categories', apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } }),
      fetchImpl(new URL('/sla/policies', apiUrl), { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } }),
    ]);
    if (!categories.ok || !policies.ok) return null;
    const categoryBody = await categories.json() as { items?: AdminCategory[] };
    const policyBody = await policies.json() as { items?: AdminSlaPolicy[] };
    if (!Array.isArray(categoryBody.items) || !Array.isArray(policyBody.items)) return null;
    return { categories: categoryBody.items, policies: policyBody.items };
  } catch {
    return null;
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
