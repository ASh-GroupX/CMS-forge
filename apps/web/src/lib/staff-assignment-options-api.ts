export type AssignmentUserOption = {
  id: string;
  nameEn: string;
  nameAr: string;
  branchId: string | null;
  departmentId: string | null;
  roleCode: string;
  activeTasksCount?: number;
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

import { getApiBase } from './api-base';
import { incomingCookieHeader, STAFF_SESSION_COOKIE } from './staff-request-auth';


export async function getStaffAssignmentOptions({
  apiUrl = getApiBase(),
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
    && (item.departmentId === null || typeof item.departmentId === 'string') && typeof item.roleCode === 'string'
    && (item.activeTasksCount === undefined || typeof item.activeTasksCount === 'number');
}

function departmentOption(value: unknown): value is AssignmentDepartmentOption {
  const item = value as Partial<AssignmentDepartmentOption>;
  return typeof item?.id === 'string' && typeof item.nameEn === 'string' && typeof item.nameAr === 'string'
    && (item.branchId === null || typeof item.branchId === 'string');
}

