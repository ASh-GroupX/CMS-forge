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
  reopenRate: number;
  escalationCount: number;
  slaBreachRate: number;
  medianTatHours: number;
  agingBuckets: StaffReportAgingBuckets;
  averageFirstResponseHours: number;
  averageResolutionHours: number;
};

export type StaffReportAgingBuckets = {
  zeroToOneDays: number;
  twoToThreeDays: number;
  fourToSevenDays: number;
  overSevenDays: number;
};

export type StaffReportFilters = {
  branchId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  ownerId?: string;
  severity?: string;
};

type ReportsResponse = { items?: Partial<StaffReportRow>[] };
type KpiResponse = { kpis?: Partial<StaffReportKpis> };
export type StaffReportCatalogItem = { id: string; name: string; users: string; requiredFilters: string[]; status: 'DELIVERED' | 'DEFERRED'; signoffRequired: boolean };
export type StaffReportCatalog = { items: StaffReportCatalogItem[] };

const STAFF_SESSION_COOKIE = 'cms_staff_session';
const REPORT_ROW_LIMIT = 17;

export async function getStaffReportRows({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  filters = {},
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  filters?: StaffReportFilters;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffReportRow[] | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const url = new URL('/reports', apiUrl);
    appendFilters(url, filters);
    url.searchParams.set('limit', String(REPORT_ROW_LIMIT));
    const response = await fetchImpl(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return rowsFrom((await response.json()) as ReportsResponse);
  } catch {
    return null;
  }
}

function appendFilters(url: URL, filters: StaffReportFilters): void {
  for (const [key, value] of Object.entries(filters)) {
    if (value?.trim()) url.searchParams.set(key, value.trim());
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

export async function getStaffReportCatalog({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffReportCatalog | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const response = await fetchImpl(new URL('/reports/catalog', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return catalogFrom(await response.json());
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
  const agingBuckets = agingBucketsFrom(kpis?.agingBuckets);
  if (
    !kpis ||
    typeof kpis.onTimeCompletionPercent !== 'number' ||
    typeof kpis.activeOverdueCount !== 'number' ||
    typeof kpis.averageDelayHours !== 'number' ||
    typeof kpis.customerPromiseKeptPercent !== 'number' ||
    typeof kpis.reopenedCount !== 'number' ||
    typeof kpis.reopenRate !== 'number' ||
    typeof kpis.escalationCount !== 'number' ||
    typeof kpis.slaBreachRate !== 'number' ||
    typeof kpis.medianTatHours !== 'number' ||
    !agingBuckets ||
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
    reopenRate: kpis.reopenRate,
    escalationCount: kpis.escalationCount,
    slaBreachRate: kpis.slaBreachRate,
    medianTatHours: kpis.medianTatHours,
    agingBuckets,
    averageFirstResponseHours: kpis.averageFirstResponseHours,
    averageResolutionHours: kpis.averageResolutionHours,
  };
}

function catalogFrom(body: unknown): StaffReportCatalog | null {
  const items = (body as { items?: unknown[] })?.items;
  if (!Array.isArray(items)) return null;
  const safeItems = items.flatMap((item) => {
    const value = item as Partial<StaffReportCatalogItem>;
    return typeof value.id === 'string' && typeof value.name === 'string' && typeof value.users === 'string' && Array.isArray(value.requiredFilters) && (value.status === 'DELIVERED' || value.status === 'DEFERRED') && typeof value.signoffRequired === 'boolean'
      ? [{ id: value.id, name: value.name, users: value.users, requiredFilters: value.requiredFilters.filter((filter): filter is string => typeof filter === 'string'), status: value.status, signoffRequired: value.signoffRequired }]
      : [];
  });
  return safeItems.length ? { items: safeItems } : null;
}

function agingBucketsFrom(value: unknown): StaffReportAgingBuckets | null {
  if (!value || typeof value !== 'object') return null;
  const buckets = value as Partial<StaffReportAgingBuckets>;
  if (
    typeof buckets.zeroToOneDays !== 'number' ||
    typeof buckets.twoToThreeDays !== 'number' ||
    typeof buckets.fourToSevenDays !== 'number' ||
    typeof buckets.overSevenDays !== 'number'
  ) {
    return null;
  }
  return {
    zeroToOneDays: buckets.zeroToOneDays,
    twoToThreeDays: buckets.twoToThreeDays,
    fourToSevenDays: buckets.fourToSevenDays,
    overSevenDays: buckets.overSevenDays,
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
