export type DealStage = 'LEAD' | 'QUALIFIED' | 'TEST_DRIVE' | 'QUOTE' | 'FINANCE' | 'DELIVERY' | 'POST_DELIVERY';

export type DealBoardItem = {
  id: string;
  title: string;
  branchId: string;
  ownerId: string;
  currentHolderId: string;
  stage: DealStage;
  stageDueAt: string;
  blocker: string | null;
  delayAgeMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type DealStageBucket = { stage: DealStage; count: number; deals: DealBoardItem[] };
export type DealHolderBucket = { currentHolderId: string; count: number };
export type DealHandoffBoard = { byStage: DealStageBucket[]; stuck: DealBoardItem[]; currentHolder: DealHolderBucket[] };

type DealHandoffBody = {
  byStage?: (Partial<DealStageBucket> & { deals?: Partial<DealBoardItem>[] })[];
  stuck?: Partial<DealBoardItem>[];
  currentHolder?: Partial<DealHolderBucket>[];
};

const STAFF_SESSION_COOKIE = 'cms_staff_session';
const DEAL_STAGES: readonly DealStage[] = ['LEAD', 'QUALIFIED', 'TEST_DRIVE', 'QUOTE', 'FINANCE', 'DELIVERY', 'POST_DELIVERY'];

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
    typeof deal.ownerId !== 'string' ||
    typeof deal.currentHolderId !== 'string' ||
    !stage ||
    typeof deal.stageDueAt !== 'string' ||
    (deal.blocker !== null && typeof deal.blocker !== 'string') ||
    typeof deal.delayAgeMinutes !== 'number' ||
    typeof deal.createdAt !== 'string' ||
    typeof deal.updatedAt !== 'string'
  ) return null;
  return { id: deal.id, title: deal.title, branchId: deal.branchId, ownerId: deal.ownerId, currentHolderId: deal.currentHolderId, stage, stageDueAt: deal.stageDueAt, blocker: deal.blocker, delayAgeMinutes: deal.delayAgeMinutes, createdAt: deal.createdAt, updatedAt: deal.updatedAt };
}

function holderBucketsFrom(rows: Partial<DealHolderBucket>[]): DealHolderBucket[] | null {
  const buckets = rows.filter((row): row is DealHolderBucket => typeof row.currentHolderId === 'string' && typeof row.count === 'number');
  return buckets.length === rows.length ? buckets : null;
}

function stageFrom(value: unknown): DealStage | null {
  return typeof value === 'string' && DEAL_STAGES.includes(value as DealStage) ? value as DealStage : null;
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
