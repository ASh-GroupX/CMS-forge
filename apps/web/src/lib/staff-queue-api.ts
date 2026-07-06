import type { ComplaintQueueItem, ComplaintSeverity, ComplaintStatus } from './staff-complaints-api';

type QueueResponse = { items?: Partial<ComplaintQueueItem>[] };
type SearchResponse = QueueResponse & { hasNext?: boolean; limit?: number; offset?: number; total?: number };

export type StaffQueueQuery = {
  branchId?: string | null;
  page?: number | null;
  pageSize?: number | null;
  search?: string | null;
  severity?: ComplaintSeverity | null;
  status?: ComplaintStatus | null;
};

export type StaffQueueResult = {
  hasNext: boolean;
  page: number;
  pageSize: number;
  rows: ComplaintQueueItem[];
};

const STAFF_SESSION_COOKIE = 'cms_staff_session';
const defaultPageSize = 10;

export async function getStaffQueueItems({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<ComplaintQueueItem[] | null> {
  const result = await getStaffQueueResult({
    apiUrl,
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    fetchImpl,
  });
  return result?.rows ?? null;
}

export async function getStaffQueueResult({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
  query = {},
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  query?: StaffQueueQuery;
} = {}): Promise<StaffQueueResult | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const pageSize = clampPositive(query.pageSize, defaultPageSize, 50);
    const page = clampPositive(query.page, 1, 1000);
    const url = new URL('/complaints/search', apiUrl);
    const search = query.search?.trim();
    url.searchParams.set('limit', String(pageSize + 1));
    url.searchParams.set('offset', String((page - 1) * pageSize));
    append(url.searchParams, 'branchId', query.branchId);
    append(url.searchParams, 'status', query.status);
    append(url.searchParams, 'severity', query.severity);
    if (search) url.searchParams.set(isReferenceSearch(search) ? 'referenceNumber' : 'customer', search);

    const response = await fetchImpl(url, {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as SearchResponse;
    const rows = rowsFrom(body);
    if (!rows) return null;
    const offset = (page - 1) * pageSize;
    const hasNext = typeof body.hasNext === 'boolean' ? body.hasNext : typeof body.total === 'number' ? offset + pageSize < body.total : rows.length > pageSize;
    return { hasNext, page, pageSize, rows: rows.slice(0, pageSize) };
  } catch {
    return null;
  }
}

function rowsFrom(body: QueueResponse): ComplaintQueueItem[] | null {
  if (!Array.isArray(body.items)) return null;
  const rows: ComplaintQueueItem[] = [];
  for (const item of body.items) {
    const row = rowFrom(item);
    if (!row) return null;
    rows.push(row);
  }
  return rows;
}

function rowFrom(row: Partial<ComplaintQueueItem>): ComplaintQueueItem | null {
  if (
    typeof row.id !== 'string' ||
    typeof row.referenceNumber !== 'string' ||
    typeof row.status !== 'string' ||
    typeof row.severity !== 'string' ||
    typeof row.subject !== 'string' ||
    typeof row.branchId !== 'string' ||
    typeof row.createdAt !== 'string' ||
    typeof row.updatedAt !== 'string'
  ) {
    return null;
  }
  const branchName = typeof row.branchName === 'string' ? row.branchName : undefined;
  return {
    id: row.id,
    referenceNumber: row.referenceNumber,
    status: row.status,
    severity: row.severity,
    subject: row.subject,
    branchId: row.branchId,
    ...(branchName ? { branchName } : {}),
    ownerId: typeof row.ownerId === 'string' ? row.ownerId : null,
    ownerName: typeof row.ownerName === 'string' ? row.ownerName : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function hasStaffSessionCookie(cookieHeader: string): boolean {
  return cookieHeader.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`));
}

function append(params: URLSearchParams, key: string, value: string | null | undefined): void {
  const text = value?.trim();
  if (text && text !== 'all') params.set(key, text);
}

function clampPositive(value: number | null | undefined, fallback: number, max: number): number {
  return Number.isInteger(value) && value && value > 0 ? Math.min(value, max) : fallback;
}

function isReferenceSearch(value: string): boolean {
  return /^(CMS|CMP|DRAFT)-/i.test(value);
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}
