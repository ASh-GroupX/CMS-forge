export type DealStage = 'LEAD' | 'BOOKING' | 'PAYMENT' | 'FINANCE' | 'INSURANCE' | 'REGISTRATION' | 'PDI' | 'DELIVERY' | 'POST_DELIVERY';

export type DealBoardItem = {
  id: string;
  title: string;
  branchId: string;
  branchName: string | null;
  ownerId: string;
  ownerName: string | null;
  currentHolderId: string;
  currentHolderName: string | null;
  stage: DealStage;
  stageDueAt: string;
  blocker: string | null;
  delayAgeMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type DealStageBucket = { stage: DealStage; count: number; deals: DealBoardItem[] };
export type DealHolderBucket = { currentHolderId: string; currentHolderName: string | null; count: number };
export type DealHandoffBoard = { byStage: DealStageBucket[]; stuck: DealBoardItem[]; currentHolder: DealHolderBucket[] };

type DealHandoffBody = {
  byStage?: (Partial<DealStageBucket> & { deals?: Partial<DealBoardItem>[] })[];
  stuck?: Partial<DealBoardItem>[];
  currentHolder?: Partial<DealHolderBucket>[];
};

const STAFF_SESSION_COOKIE = 'cms_staff_session';
const CSRF_COOKIE = 'cms_csrf_token';
const DEAL_STAGES: readonly DealStage[] = ['LEAD', 'BOOKING', 'PAYMENT', 'FINANCE', 'INSURANCE', 'REGISTRATION', 'PDI', 'DELIVERY', 'POST_DELIVERY'];

export async function getDealHandoffBoard({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<DealHandoffBoard | null> {
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const response = await fetchImpl(new URL('/deals/handoff-board', apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    return handoffFrom((await response.json()) as DealHandoffBody);
  } catch {
    return null;
  }
}

export async function createDeal(input: { title: string; branchId?: string; currentHolderId: string; stageDueAt: string; blocker?: string | null }): Promise<boolean> {
  return dealWrite('/deals', 'POST', input);
}

export async function advanceDeal(id: string, input: { currentHolderId: string; stageDueAt: string }): Promise<boolean> {
  return dealWrite(`/deals/${encodeURIComponent(id)}/advance`, 'POST', input);
}

export async function updateDealBlocker(id: string, blocker: string | null): Promise<boolean> {
  return dealWrite(`/deals/${encodeURIComponent(id)}/blocker`, 'PATCH', { blocker });
}

function handoffFrom(body: DealHandoffBody): DealHandoffBoard | null {
  if (!Array.isArray(body.byStage) || !Array.isArray(body.stuck) || !Array.isArray(body.currentHolder)) return null;
  const byStage = body.byStage.map(stageBucketFrom);
  const stuck = body.stuck.map(dealFrom);
  const currentHolder = holderBucketsFrom(body.currentHolder);
  if (byStage.some((bucket) => bucket === null) || stuck.some((deal) => deal === null) || !currentHolder) return null;
  return { byStage: byStage as DealStageBucket[], stuck: stuck as DealBoardItem[], currentHolder };
}

function stageBucketFrom(bucket: NonNullable<DealHandoffBody['byStage']>[number]): DealStageBucket | null {
  const stage = stageFrom(bucket.stage);
  if (!stage || typeof bucket.count !== 'number' || !Array.isArray(bucket.deals)) return null;
  const deals = bucket.deals.map(dealFrom);
  return deals.some((deal) => deal === null) ? null : { stage, count: bucket.count, deals: deals as DealBoardItem[] };
}

function dealFrom(deal: Partial<DealBoardItem>): DealBoardItem | null {
  const stage = stageFrom(deal.stage);
  if (
    typeof deal.id !== 'string' ||
    typeof deal.title !== 'string' ||
    typeof deal.branchId !== 'string' ||
    (deal.branchName !== null && typeof deal.branchName !== 'string') ||
    typeof deal.ownerId !== 'string' ||
    (deal.ownerName !== null && typeof deal.ownerName !== 'string') ||
    typeof deal.currentHolderId !== 'string' ||
    (deal.currentHolderName !== null && typeof deal.currentHolderName !== 'string') ||
    !stage ||
    typeof deal.stageDueAt !== 'string' ||
    (deal.blocker !== null && typeof deal.blocker !== 'string') ||
    typeof deal.delayAgeMinutes !== 'number' ||
    typeof deal.createdAt !== 'string' ||
    typeof deal.updatedAt !== 'string'
  ) return null;
  return { id: deal.id, title: deal.title, branchId: deal.branchId, branchName: deal.branchName ?? null, ownerId: deal.ownerId, ownerName: deal.ownerName ?? null, currentHolderId: deal.currentHolderId, currentHolderName: deal.currentHolderName ?? null, stage, stageDueAt: deal.stageDueAt, blocker: deal.blocker, delayAgeMinutes: deal.delayAgeMinutes, createdAt: deal.createdAt, updatedAt: deal.updatedAt };
}

function holderBucketsFrom(rows: Partial<DealHolderBucket>[]): DealHolderBucket[] | null {
  const buckets = rows.filter((row): row is DealHolderBucket => typeof row.currentHolderId === 'string' && (row.currentHolderName === null || typeof row.currentHolderName === 'string') && typeof row.count === 'number');
  return buckets.length === rows.length ? buckets : null;
}

async function dealWrite(path: string, method: 'PATCH' | 'POST', body: unknown): Promise<boolean> {
  const cookies = await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return false;
  const csrf = readCookie(cookies, CSRF_COOKIE);
  const response = await fetch(new URL(path, process.env.API_URL ?? 'http://localhost:3000'), {
    body: JSON.stringify(body),
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'content-type': 'application/json',
      cookie: cookies,
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
    },
    method,
  });
  return response.ok;
}

function stageFrom(value: unknown): DealStage | null {
  return typeof value === 'string' && DEAL_STAGES.includes(value as DealStage) ? value as DealStage : null;
}

function hasStaffSessionCookie(cookieHeader: string): boolean {
  return cookieHeader.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`));
}

function readCookie(header: string, name: string): string | null {
  return header.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}
