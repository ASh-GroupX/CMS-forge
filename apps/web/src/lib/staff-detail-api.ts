import type { ComplaintDetail } from './staff-complaints-api';

type DetailResponse = { complaint?: Partial<ComplaintDetail> };

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export type StaffComplaintDetailView = {
  assignee: string | null;
  branch: string;
  case: {
    id: string;
    type: string;
    status: string;
    lifecycleStatus: string;
    branchName: string;
    ownerId: string | null;
    ownerName: string | null;
  } | null;
  capaActions: CaseCapaAction[];
  caseTimeline: string[];
  reference: string;
  severity: string;
  status: string;
  subject: string;
  timeline: string[];
};

export type CaseCapaAction = {
  id: string;
  caseId: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  ownerId: string;
  ownerName: string;
  dueAt: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
  updatedAt: string;
};

export type CaseCapaCreateRequest = {
  ownerId?: string | null;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  dueAt: string;
  status: CaseCapaAction['status'];
};

export async function getStaffComplaintDetail({
  apiUrl = process.env.API_URL ?? 'http://localhost:3000',
  complaintId,
  cookieHeader,
  fetchImpl = fetch,
}: {
  apiUrl?: string;
  complaintId?: string;
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
} = {}): Promise<StaffComplaintDetailView | null> {
  const id = complaintId?.trim();
  if (!id) return null;
  const cookies = cookieHeader ?? await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return null;

  try {
    const response = await fetchImpl(new URL(`/complaints/${encodeURIComponent(id)}`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return null;
    const detail = detailFrom((await response.json()) as DetailResponse);
    if (!detail) return null;
    const [caseTimeline, capaActions] = detail.caseSummary
      ? await Promise.all([
        fetchCaseTimeline({ apiUrl, caseId: detail.caseSummary.id, cookies, fetchImpl }),
        fetchCaseCapa({ apiUrl, caseId: detail.caseSummary.id, cookies, fetchImpl }),
      ])
      : [[], []];
    return viewFromDetail(detail, caseTimeline, capaActions);
  } catch {
    return null;
  }
}

export async function createCaseCapa(caseId: string, body: CaseCapaCreateRequest, fetchImpl: typeof fetch = fetch): Promise<CaseCapaAction> {
  const response = await fetchImpl(`/api/cases/${encodeURIComponent(caseId)}/capa`, {
    body: JSON.stringify(body),
    credentials: 'include',
    headers: { Accept: 'application/json', ...csrfHeaders() },
    method: 'POST',
  });
  const payload = await response.json().catch(() => null) as { capa?: CaseCapaAction; error?: { message?: string } } | null;
  if (!response.ok || !payload?.capa) throw new Error(payload?.error?.message ?? 'CAPA could not be created.');
  return payload.capa;
}

async function fetchCaseTimeline({ apiUrl, caseId, cookies, fetchImpl }: { apiUrl: string; caseId: string; cookies: string; fetchImpl: typeof fetch }): Promise<string[]> {
  try {
    const response = await fetchImpl(new URL(`/cases/${encodeURIComponent(caseId)}/timeline`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return [];
    const body = await response.json() as { events?: Array<{ type?: string; occurredAt?: string; toStatus?: string; action?: string | null }> };
    return Array.isArray(body.events) ? body.events.filter((item) => typeof item.occurredAt === 'string' && typeof item.type === 'string').map(caseTimelineLabel) : [];
  } catch {
    return [];
  }
}

async function fetchCaseCapa({ apiUrl, caseId, cookies, fetchImpl }: { apiUrl: string; caseId: string; cookies: string; fetchImpl: typeof fetch }): Promise<CaseCapaAction[]> {
  try {
    const response = await fetchImpl(new URL(`/cases/${encodeURIComponent(caseId)}/capa`, apiUrl), {
      cache: 'no-store',
      headers: { Accept: 'application/json', cookie: cookies },
    });
    if (!response.ok) return [];
    const body = await response.json() as { items?: unknown[] };
    return Array.isArray(body.items) ? body.items.filter(caseCapaAction) : [];
  } catch {
    return [];
  }
}

function viewFromDetail(detail: ComplaintDetail, caseTimeline: string[], capaActions: CaseCapaAction[]): StaffComplaintDetailView {
  return {
    assignee: detail.ownerName ?? null,
    branch: detail.branchName ?? '',
    case: detail.caseSummary ? {
      id: detail.caseSummary.id,
      type: detail.caseSummary.type,
      status: detail.caseSummary.status,
      lifecycleStatus: detail.caseSummary.lifecycleStatus,
      branchName: detail.caseSummary.branchName,
      ownerId: detail.caseSummary.ownerId,
      ownerName: detail.caseSummary.ownerName,
    } : null,
    capaActions,
    caseTimeline,
    reference: detail.referenceNumber,
    severity: detail.severity,
    status: detail.status,
    subject: detail.subject,
    timeline: detail.statusHistory.map((item) => `${item.toStatus} - ${item.createdAt.slice(0, 10)}`),
  };
}

function caseCapaAction(item: unknown): item is CaseCapaAction {
  const row = item as Partial<CaseCapaAction>;
  return typeof row?.id === 'string'
    && typeof row.caseId === 'string'
    && typeof row.rootCause === 'string'
    && typeof row.correctiveAction === 'string'
    && typeof row.preventiveAction === 'string'
    && typeof row.ownerId === 'string'
    && typeof row.ownerName === 'string'
    && typeof row.dueAt === 'string'
    && (row.status === 'OPEN' || row.status === 'IN_PROGRESS' || row.status === 'DONE')
    && typeof row.createdAt === 'string'
    && typeof row.updatedAt === 'string';
}

function caseTimelineLabel(item: { type?: string; occurredAt?: string; toStatus?: string; action?: string | null }): string {
  const label = item.type === 'COMPLAINT_STATUS' && item.toStatus ? `Complaint ${item.toStatus}` : item.type?.replaceAll('_', ' ');
  return `${label} - ${item.occurredAt?.slice(0, 10)}`;
}

function detailFrom(body: DetailResponse): ComplaintDetail | null {
  const complaint = body.complaint;
  if (
    typeof complaint?.id !== 'string' ||
    typeof complaint.referenceNumber !== 'string' ||
    typeof complaint.status !== 'string' ||
    typeof complaint.severity !== 'string' ||
    typeof complaint.subject !== 'string' ||
    typeof complaint.branchId !== 'string' ||
    typeof complaint.createdAt !== 'string' ||
    typeof complaint.updatedAt !== 'string' ||
    typeof complaint.description !== 'string' ||
    !Array.isArray(complaint.statusHistory)
  ) {
    return null;
  }

  return {
    id: complaint.id,
    referenceNumber: complaint.referenceNumber,
    status: complaint.status,
    severity: complaint.severity,
    subject: complaint.subject,
    branchId: complaint.branchId,
    ownerId: typeof complaint.ownerId === 'string' ? complaint.ownerId : null,
    ownerName: typeof complaint.ownerName === 'string' ? complaint.ownerName : null,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    description: complaint.description,
    incidentAt: typeof complaint.incidentAt === 'string' ? complaint.incidentAt : null,
    statusHistory: complaint.statusHistory.filter(statusHistoryItem),
    caseSummary: caseSummary(complaint.caseSummary),
  };
}

function caseSummary(value: unknown): ComplaintDetail['caseSummary'] {
  const item = value as Partial<NonNullable<ComplaintDetail['caseSummary']>>;
  return typeof item?.id === 'string' && typeof item.type === 'string' && typeof item.status === 'string' && typeof item.lifecycleStatus === 'string' && typeof item.confidentialityLevel === 'string' && typeof item.branchId === 'string' && typeof item.branchName === 'string'
    ? { id: item.id, type: item.type, status: item.status, lifecycleStatus: item.lifecycleStatus, confidentialityLevel: item.confidentialityLevel, branchId: item.branchId, branchName: item.branchName, ownerId: typeof item.ownerId === 'string' ? item.ownerId : null, ownerName: typeof item.ownerName === 'string' ? item.ownerName : null }
    : null;
}

function statusHistoryItem(item: unknown): item is ComplaintDetail['statusHistory'][number] {
  const row = item as Partial<ComplaintDetail['statusHistory'][number]>;
  return typeof row?.id === 'string' && typeof row.toStatus === 'string' && typeof row.createdAt === 'string';
}

function hasStaffSessionCookie(cookieHeader: string): boolean {
  return cookieHeader.split(';').some((cookie) => cookie.trim().startsWith(`${STAFF_SESSION_COOKIE}=`));
}

function csrfHeaders(): HeadersInit {
  const csrfToken = readableCookie('cms_csrf_token');
  return csrfToken ? { 'content-type': 'application/json', 'x-csrf-token': csrfToken } : { 'content-type': 'application/json' };
}

function readableCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length) ?? null;
}

async function incomingCookieHeader(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    return (await cookies()).toString();
  } catch {
    return '';
  }
}
