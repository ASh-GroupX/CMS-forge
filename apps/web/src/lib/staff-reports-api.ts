export type StaffReportRow = {
  id: string;
  referenceNumber: string;
  branchId: string;
  categoryId: string;
  status: string;
  severity: string;
  subject: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StaffReportKpis = {
  onTimeCompletionPercent: number;
  activeOverdueCount: number;
  averageDelayHours: number;
  customerPromiseKeptPercent: number;
  reopenedCount: number;
  escalationCount: number;
  averageFirstResponseHours: number;
  averageResolutionHours: number;
};

type ReportsResponse = { items?: Partial<StaffReportRow>[] };
type KpiResponse = { kpis?: Partial<StaffReportKpis> };

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getStaffReportRows({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffReportRow[] | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const response = await fetchImpl(new URL('/reports', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return rowsFrom((await response.json()) as ReportsResponse);
  } catch {
    return null;
  }
}

export async function getStaffReportKpis({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffReportKpis | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const response = await fetchImpl(new URL('/reports/kpis', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return kpisFrom((await response.json()) as KpiResponse);
  } catch {
    return null;
  }
}

function rowsFrom(body: ReportsResponse): StaffReportRow[] | null {
  if (!Array.isArray(body.items)) return null;
  const rows: StaffReportRow[] = [];
  for (const item of body.items) {
    const row = rowFrom(item);
    if (!row) return null;
    rows.push(row);
  }
  return rows;
}

function rowFrom(row: Partial<StaffReportRow>): StaffReportRow | null {
  if (
    typeof row.id !== 'string' ||
    typeof row.referenceNumber !== 'string' ||
    typeof row.branchId !== 'string' ||
    typeof row.categoryId !== 'string' ||
    typeof row.status !== 'string' ||
    typeof row.severity !== 'string' ||
    typeof row.subject !== 'string' ||
    typeof row.createdAt !== 'string' ||
    typeof row.updatedAt !== 'string'
  ) {
    return null;
  }
  return {
    id: row.id,
    referenceNumber: row.referenceNumber,
    branchId: row.branchId,
    categoryId: row.categoryId,
    status: row.status,
    severity: row.severity,
    subject: row.subject,
    ownerId: typeof row.ownerId === 'string' ? row.ownerId : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function kpisFrom(body: KpiResponse): StaffReportKpis | null {
  const kpis = body.kpis;
  if (
    !kpis ||
    typeof kpis.onTimeCompletionPercent !== 'number' ||
    typeof kpis.activeOverdueCount !== 'number' ||
    typeof kpis.averageDelayHours !== 'number' ||
    typeof kpis.customerPromiseKeptPercent !== 'number' ||
    typeof kpis.reopenedCount !== 'number' ||
    typeof kpis.escalationCount !== 'number' ||
    typeof kpis.averageFirstResponseHours !== 'number' ||
    typeof kpis.averageResolutionHours !== 'number'
  ) {
    return null;
  }
  return {
    onTimeCompletionPercent: kpis.onTimeCompletionPercent,
    activeOverdueCount: kpis.activeOverdueCount,
    averageDelayHours: kpis.averageDelayHours,
    customerPromiseKeptPercent: kpis.customerPromiseKeptPercent,
    reopenedCount: kpis.reopenedCount,
    escalationCount: kpis.escalationCount,
    averageFirstResponseHours: kpis.averageFirstResponseHours,
    averageResolutionHours: kpis.averageResolutionHours,
  };
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
