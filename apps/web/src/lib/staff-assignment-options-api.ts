export type AssignmentUserOption = {
  id: string;
  nameEn: string;
  nameAr: string;
  branchId: string | null;
  departmentId: string | null;
  roleCode: string;
};

export type AssignmentDepartmentOption = {
  id: string;
  nameEn: string;
  nameAr: string;
  branchId: string | null;
};

export type StaffAssignmentOptions = {
  users: AssignmentUserOption[];
  departments: AssignmentDepartmentOption[];
};

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getStaffAssignmentOptions({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffAssignmentOptions | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!cookies.includes(`${STAFF_SESSION_COOKIE}=`)) return null;
  try {
    const response = await fetchImpl(new URL('/assignments/options', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return optionsFrom(await response.json());
  } catch {
    return null;
  }
}

function optionsFrom(value: unknown): StaffAssignmentOptions | null {
  const body = value as Partial<StaffAssignmentOptions>;
  if (!Array.isArray(body.users) || !Array.isArray(body.departments)) return null;
  const users = body.users.filter(userOption);
  const departments = body.departments.filter(departmentOption);
  return users.length === body.users.length && departments.length === body.departments.length ? { users, departments } : null;
}

function userOption(value: unknown): value is AssignmentUserOption {
  const item = value as Partial<AssignmentUserOption>;
  return typeof item?.id === 'string' && typeof item.nameEn === 'string' && typeof item.nameAr === 'string'
    && (item.branchId === null || typeof item.branchId === 'string')
    && (item.departmentId === null || typeof item.departmentId === 'string') && typeof item.roleCode === 'string';
}

function departmentOption(value: unknown): value is AssignmentDepartmentOption {
  const item = value as Partial<AssignmentDepartmentOption>;
  return typeof item?.id === 'string' && typeof item.nameEn === 'string' && typeof item.nameAr === 'string'
    && (item.branchId === null || typeof item.branchId === 'string');
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}
