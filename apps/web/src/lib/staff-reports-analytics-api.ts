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
  view?: 'active' | 'resolved' | 'overdue' | 'unassigned' | 'none' | null;
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
  view?: 'active' | 'resolved' | 'overdue' | 'unassigned' | 'none' | null;
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

type ReportRequestOptions = {
  signal?: AbortSignal;
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
  options: ReportRequestOptions = {},
): Promise<ComplaintsAnalyticsResponse | null> {
  const cookies = await reportCookieHeader(cookieHeader);
  if (typeof window === 'undefined' && !hasStaffSessionCookie(cookies)) return null;

  try {
    const query = buildQuery(filter);
    const base = getReportsBaseUrl(apiUrl);
    const res = await reportFetch(`${base}/complaints-analytics?${query}`, cookies, options);
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
  options: ReportRequestOptions = {},
): Promise<{ total: number; items: ComplaintRecordRow[] } | null> {
  const cookies = await reportCookieHeader(cookieHeader);
  if (typeof window === 'undefined' && !hasStaffSessionCookie(cookies)) return null;

  try {
    const query = buildQuery({ ...filter, limit, offset });
    const base = getReportsBaseUrl(apiUrl);
    const res = await reportFetch(`${base}/complaints-records?${query}`, cookies, options);
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
  options: ReportRequestOptions = {},
): Promise<TicketsAnalyticsResponse | null> {
  const cookies = await reportCookieHeader(cookieHeader);
  if (typeof window === 'undefined' && !hasStaffSessionCookie(cookies)) return null;

  try {
    const query = buildQuery(filter);
    const base = getReportsBaseUrl(apiUrl);
    const res = await reportFetch(`${base}/tickets-analytics?${query}`, cookies, options);
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
  options: ReportRequestOptions = {},
): Promise<{ total: number; items: TicketRecordRow[] } | null> {
  const cookies = await reportCookieHeader(cookieHeader);
  if (typeof window === 'undefined' && !hasStaffSessionCookie(cookies)) return null;

  try {
    const query = buildQuery({ ...filter, limit, offset });
    const base = getReportsBaseUrl(apiUrl);
    const res = await reportFetch(`${base}/tickets-records?${query}`, cookies, options);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
async function reportCookieHeader(cookieHeader?: string): Promise<string> {
  if (cookieHeader !== undefined) return cookieHeader;
  return typeof window === 'undefined' ? incomingCookieHeader() : '';
}

function reportHeaders(cookieHeader: string): HeadersInit {
  return cookieHeader
    ? { Accept: 'application/json', cookie: cookieHeader }
    : { Accept: 'application/json' };
}

function reportFetch(url: string, cookieHeader: string, options: ReportRequestOptions) {
  return fetch(url, {
    headers: reportHeaders(cookieHeader),
    credentials: 'same-origin',
    cache: 'no-store',
    ...(options.signal ? { signal: options.signal } : {}),
  });
}
