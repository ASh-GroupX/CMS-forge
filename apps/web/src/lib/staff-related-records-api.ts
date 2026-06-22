export type RelatedRecordType = 'CUSTOMER' | 'COMPLAINT' | 'CASE' | 'DEAL';

export type StaffRelatedRecord = {
  recordType: RelatedRecordType;
  recordId: string;
  label: string;
  labelAr: string;
  context: string | null;
  contextAr: string | null;
};

export type StaffRelatedRecordOptions = Record<RelatedRecordType, StaffRelatedRecord[]>;

const STAFF_SESSION_COOKIE = 'cms_staff_session';
const TYPES: RelatedRecordType[] = ['CUSTOMER', 'COMPLAINT', 'CASE', 'DEAL'];

export async function getRelatedRecords({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
  type,
  q,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  type: RelatedRecordType;
  q?: string;
}): Promise<StaffRelatedRecord[] | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!cookies.includes(`${STAFF_SESSION_COOKIE}=`)) return null;
  const url = new URL('/tasks/related-records', apiUrl);
  url.searchParams.set('type', type);
  if (q) url.searchParams.set('q', q);
  try {
    const response = await fetchImpl(url, { cache: 'no-store', headers: { Accept: 'application/json', cookie: cookies } });
    if (!response.ok) return null;
    return recordsFrom((await response.json()) as { records?: Partial<StaffRelatedRecord>[] });
  } catch {
    return null;
  }
}

export async function getQuickAddRelatedRecords(input: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffRelatedRecordOptions | null> {
  const rows = await Promise.all(TYPES.map((type) => getRelatedRecords({ ...input, type })));
  if (rows.some((records) => records === null)) return null;
  return Object.fromEntries(TYPES.map((type, index) => [type, rows[index] ?? []])) as StaffRelatedRecordOptions;
}

function recordsFrom(body: { records?: Partial<StaffRelatedRecord>[] }): StaffRelatedRecord[] | null {
  if (!Array.isArray(body.records)) return null;
  const rows = body.records.filter((item): item is StaffRelatedRecord =>
    isType(item.recordType) &&
    typeof item.recordId === 'string' &&
    typeof item.label === 'string' &&
    typeof item.labelAr === 'string' &&
    (item.context === null || typeof item.context === 'string') &&
    (item.contextAr === null || typeof item.contextAr === 'string'));
  return rows.length === body.records.length ? rows : null;
}

function isType(value: unknown): value is RelatedRecordType {
  return value === 'CUSTOMER' || value === 'COMPLAINT' || value === 'CASE' || value === 'DEAL';
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}
