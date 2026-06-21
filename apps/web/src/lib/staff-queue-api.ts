import type { ComplaintQueueItem } from './staff-complaints-api';

type QueueResponse = { items?: Partial<ComplaintQueueItem>[] };

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export async function getStaffQueueItems({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<ComplaintQueueItem[] | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const response = await fetchImpl(new URL('/complaints', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return rowsFrom((await response.json()) as QueueResponse);
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

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}
