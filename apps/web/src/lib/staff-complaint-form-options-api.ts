export type ComplaintFormOption = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  departmentId?: string | null;
  branchId?: string | null;
  parentId?: string | null;
};

export type StaffUserOption = {
  id: string;
  nameEn: string;
  nameAr: string;
  email: string;
  departmentId: string | null;
  branchId: string | null;
  roleCode: string;
};

export type ComplaintFormOptions = {
  branches: ComplaintFormOption[];
  categories: ComplaintFormOption[];
  departments: Array<ComplaintFormOption & { branchId: string | null }>;
  severities: Array<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>;
  types: string[];
  rootCauses?: Array<{ id: string; nameEn: string; nameAr: string; order: number; complaintType?: string | null }>;
  salesAdvisors?: Array<{ id: string; nameEn: string; nameAr: string; order: number }>;
  users?: StaffUserOption[];
};

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getComplaintFormOptions({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<ComplaintFormOptions | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;
  try {
    const response = await fetchImpl(new URL('/complaints/form-options', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    return response.ok ? ((await response.json()) as ComplaintFormOptions) : null;
  } catch {
    return null;
  }
}

function hasStaffSessionCookie(cookieHeader: string): boolean {
  return cookieHeader.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`));
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { headers } = await import('next/headers');
    return (await headers()).get('cookie') ?? '';
  } catch {
    return '';
  }
}
