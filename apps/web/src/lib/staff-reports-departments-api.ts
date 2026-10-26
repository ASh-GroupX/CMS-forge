import { hasStaffSessionCookie, incomingCookieHeader } from './staff-request-auth';

export type DepartmentPerformanceFilter = {
  branchId?: string | null;
  departmentId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export type DepartmentPerformanceRow = {
  departmentId: string;
  nameEn: string;
  nameAr: string;
  code: string;
  branchId: string | null;
  branchNameEn: string | null;
  branchNameAr: string | null;
  employeeCount: number;
  ticketsCreated: number;
  ticketsTargeted: number;
  ticketsOpen: number;
  ticketsInProgress: number;
  ticketsWaiting: number;
  ticketsUnassigned: number;
  ticketsResolved: number;
  ticketsOverdue: number;
  ticketsAvgTatDays: number;
  ticketsOnTimeRate: number;
  complaintsTotal: number;
  complaintsOpen: number;
  complaintsResolved: number;
  complaintsOverdue: number;
  complaintsAvgHours: number;
  complaintsSlaRate: number;
  combinedVolume: number;
  combinedOpen: number;
  combinedResolved: number;
  combinedOverdue: number;
  overallCompletionRate: number;
};

function buildQuery(filter: Record<string, any>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filter)) {
    if (v !== undefined && v !== null && v !== '') {
      params.set(k, String(v));
    }
  }
  return params.toString();
}

function getReportsBaseUrl(apiUrl?: string): string {
  if (typeof window !== 'undefined') {
    return '/api/reports';
  }
  const base = apiUrl || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return `${base}/reports`;
}

export async function fetchDepartmentPerformance(
  filter: DepartmentPerformanceFilter,
  cookieHeader?: string,
  apiUrl?: string,
): Promise<DepartmentPerformanceRow[] | null> {
  const cookies = cookieHeader ?? (await incomingCookieHeader());
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const query = buildQuery(filter);
    const base = getReportsBaseUrl(apiUrl);
    const res = await fetch(`${base}/department-performance?${query}`, {
      headers: { Accept: 'application/json', cookie: cookies },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
