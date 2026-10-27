import { hasStaffSessionCookie, incomingCookieHeader } from './staff-request-auth';

export type ComplaintsAnalyticsFilter = {
  branchId?: string | null;
  departmentId?: string | null;
  ownerId?: string | null;
  categoryId?: string | null;
  type?: string | null;
  severity?: string | null;
  status?: string | null;
  dateDimension?: 'createdAt' | 'resolvedAt' | 'closedAt' | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
};

export type ComplaintsAnalyticsResponse = {
  kpis: {
    totalCreated: number;
    openWorkload: number;
    unassigned: number;
    inProgress: number;
    resolved: number;
    closed: number;
    overdue: number;
    atRisk: number;
    avgResolutionHours: number;
    slaComplianceRate: number;
    deltas: {
      totalCreated: number;
      openWorkload: number;
      resolved: number;
      closed: number;
      avgResolutionHours: number;
      slaComplianceRate: number;
    };
  };
  timeline: {
    date: string;
    labelEn: string;
    labelAr: string;
    created: number;
    resolved: number;
  }[];
  statusBreakdown: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  categoryBreakdown: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  severityBreakdown: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  agingBuckets: { bucket: '<24h' | '1-3d' | '4-7d' | '>7d'; labelEn: string; labelAr: string; count: number }[];
  officers: {
    officerId: string;
    nameEn: string;
    nameAr: string;
    role: string;
    activeWorkload: number;
    newAssignments: number;
    resolved: number;
    closed: number;
    overdue: number;
    slaComplianceRate: number;
    avgResolutionHours: number;
    oldestActiveDays: number;
  }[];
};

export type TicketsAnalyticsFilter = {
  branchId?: string | null;
  targetDepartmentId?: string | null;
  creatingDepartmentId?: string | null;
  assignedEmployeeId?: string | null;
  categoryId?: string | null;
  priority?: string | null;
  status?: string | null;
  dateDimension?: 'createdAt' | 'dueAt' | 'resolvedAt' | 'closedAt' | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
};

export type TicketsAnalyticsResponse = {
  kpis: {
    totalCreated: number;
    openWorkload: number;
    unassigned: number;
    inProgress: number;
    waiting: number;
    resolved: number;
    closed: number;
    overdue: number;
    avgResolutionDays: number;
    onTimeSlaRate: number;
    avgRating: number;
    deltas: {
      totalCreated: number;
      openWorkload: number;
      resolved: number;
      closed: number;
      avgResolutionDays: number;
      onTimeSlaRate: number;
    };
  };
  timeline: {
    date: string;
    labelEn: string;
    labelAr: string;
    created: number;
    resolved: number;
  }[];
  statusBreakdown: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  priorityBreakdown: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  departmentBreakdown: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  waitingReasons: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  deptToDeptFlow: {
    sourceDeptId: string;
    sourceDeptNameEn: string;
    sourceDeptNameAr: string;
    targetDeptId: string;
    targetDeptNameEn: string;
    targetDeptNameAr: string;
    ticketCount: number;
    unresolvedCount: number;
    avgResolutionDays: number;
  }[];
  agingBuckets: { bucket: '<24h' | '1-3d' | '4-7d' | '>7d'; labelEn: string; labelAr: string; count: number }[];
  officers: {
    employeeId: string;
    nameEn: string;
    nameAr: string;
    departmentId?: string | null;
    departmentNameEn?: string | null;
    departmentNameAr?: string | null;
    role: string;
    activeWorkload: number;
    newAssignments: number;
    resolved: number;
    closed: number;
    overdue: number;
    onTimeRate: number;
    avgResolutionDays: number;
    avgRating: number;
    oldestActiveDays: number;
  }[];
};

export type ComplaintRecordRow = {
  id: string;
  referenceNumber: string;
  subject: string;
  status: string;
  severity: string;
  customerName: string;
  customerPhone: string;
  ownerName: string;
  departmentId?: string | null;
  departmentName: string;
  createdAt: string;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  isOverdue: boolean;
};

export type TicketRecordRow = {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  priority: string;
  targetDepartmentId?: string | null;
  creatingDepartmentId?: string | null;
  creatingDepartmentName: string;
  targetDepartmentName: string;
  requestedByName: string;
  assignedEmployeeName: string;
  createdAt: string;
  dueAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  isOverdue: boolean;
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

export async function fetchComplaintsAnalytics(
  filter: ComplaintsAnalyticsFilter,
  cookieHeader?: string,
  apiUrl?: string,
): Promise<ComplaintsAnalyticsResponse | null> {
  const cookies = cookieHeader ?? (await incomingCookieHeader());
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const query = buildQuery(filter);
    const base = getReportsBaseUrl(apiUrl);
    const res = await fetch(`${base}/complaints-analytics?${query}`, {
      headers: { Accept: 'application/json', cookie: cookies },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchComplaintsRecords(
  filter: ComplaintsAnalyticsFilter,
  limit = 25,
  offset = 0,
  cookieHeader?: string,
  apiUrl?: string,
): Promise<{ total: number; items: ComplaintRecordRow[] } | null> {
  const cookies = cookieHeader ?? (await incomingCookieHeader());
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const query = buildQuery({ ...filter, limit, offset });
    const base = getReportsBaseUrl(apiUrl);
    const res = await fetch(`${base}/complaints-records?${query}`, {
      headers: { Accept: 'application/json', cookie: cookies },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchTicketsAnalytics(
  filter: TicketsAnalyticsFilter,
  cookieHeader?: string,
  apiUrl?: string,
): Promise<TicketsAnalyticsResponse | null> {
  const cookies = cookieHeader ?? (await incomingCookieHeader());
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const query = buildQuery(filter);
    const base = getReportsBaseUrl(apiUrl);
    const res = await fetch(`${base}/tickets-analytics?${query}`, {
      headers: { Accept: 'application/json', cookie: cookies },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchTicketsRecords(
  filter: TicketsAnalyticsFilter,
  limit = 25,
  offset = 0,
  cookieHeader?: string,
  apiUrl?: string,
): Promise<{ total: number; items: TicketRecordRow[] } | null> {
  const cookies = cookieHeader ?? (await incomingCookieHeader());
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const query = buildQuery({ ...filter, limit, offset });
    const base = getReportsBaseUrl(apiUrl);
    const res = await fetch(`${base}/tickets-records?${query}`, {
      headers: { Accept: 'application/json', cookie: cookies },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
