export type StaffAuditLog = {
  id: string;
  eventType: string;
  action: string;
  actorId: string | null;
  actorName: string | null;
  actorNameAr: string | null;
  branchId: string | null;
  branchName: string | null;
  branchNameAr: string | null;
  displayTimeZone: string;
  targetType: string;
  targetId: string | null;
  correlationId: string | null;
  metadata: unknown;
  createdAt: string;
};

export type StaffAuditFilters = {
  actorId?: string;
  correlationId?: string;
  eventType?: string;
  from?: string;
  page?: string;
  pageSize?: string;
  targetId?: string;
  targetType?: string;
  to?: string;
};

export type StaffAuditResult = { items: StaffAuditLog[]; page: number; pageSize: number };
export type StaffAuditLoadResult = { status: 'ready'; data: StaffAuditResult } | { status: 'denied' | 'error' };

const STAFF_SESSION_COOKIE = 'cms_staff_session';
export const auditFilterKeys = ['actorId', 'correlationId', 'eventType', 'from', 'page', 'pageSize', 'targetId', 'targetType', 'to'] as const;

export async function getStaffAuditLogs({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
  filters = {},
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  filters?: StaffAuditFilters;
} = {}): Promise<StaffAuditLoadResult> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { status: 'denied' };
  try {
    const url = new URL('/audit/logs', apiUrl);
    appendAuditFilters(url, filters);
    const response = await fetchImpl(url, { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } });
    if (response.status === 401 || response.status === 403) return { status: 'denied' };
    if (!response.ok) return { status: 'error' };
    const data = resultFrom(await response.json());
    return data ? { status: 'ready', data } : { status: 'error' };
  } catch {
    return { status: 'error' };
  }
}

export function auditExportHref(filters: StaffAuditFilters): string {
  const url = new URL('/audit/export', 'http://local');
  appendAuditFilters(url, filters);
  return `${url.pathname}${url.search}`;
}

export function appendAuditFilters(url: URL, filters: StaffAuditFilters): void {
  for (const key of auditFilterKeys) {
    const value = filters[key];
    if (value?.trim()) url.searchParams.set(key, value.trim());
  }
}

function resultFrom(body: unknown): StaffAuditResult | null {
  const value = body as { items?: unknown[]; page?: unknown; pageSize?: unknown };
  if (!Array.isArray(value.items) || typeof value.page !== 'number' || typeof value.pageSize !== 'number') return null;
  const items = value.items.map(logFrom);
  return items.some((item) => item === null) ? null : { items: items as StaffAuditLog[], page: value.page, pageSize: value.pageSize };
}

function logFrom(item: unknown): StaffAuditLog | null {
  const value = item as Partial<StaffAuditLog>;
  if (typeof value.id !== 'string' || typeof value.eventType !== 'string' || typeof value.action !== 'string' || typeof value.targetType !== 'string' || typeof value.createdAt !== 'string') return null;
  return {
    id: value.id,
    eventType: value.eventType,
    action: value.action,
    actorId: typeof value.actorId === 'string' ? value.actorId : null,
    actorName: typeof value.actorName === 'string' ? value.actorName : null,
    actorNameAr: typeof value.actorNameAr === 'string' ? value.actorNameAr : null,
    branchId: typeof value.branchId === 'string' ? value.branchId : null,
    branchName: typeof value.branchName === 'string' ? value.branchName : null,
    branchNameAr: typeof value.branchNameAr === 'string' ? value.branchNameAr : null,
    displayTimeZone: typeof value.displayTimeZone === 'string' ? value.displayTimeZone : 'UTC',
    targetType: value.targetType,
    targetId: typeof value.targetId === 'string' ? value.targetId : null,
    correlationId: typeof value.correlationId === 'string' ? value.correlationId : null,
    metadata: value.metadata,
    createdAt: value.createdAt,
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
