import type { ComplaintDetail } from './staff-complaints-api';

type DetailResponse = { complaint?: Partial<ComplaintDetail> };

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export type StaffComplaintDetailView = {
  assignee: string | null;
  branch: string;
  reference: string;
  severity: string;
  status: string;
  subject: string;
  timeline: string[];
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
    return detail ? viewFromDetail(detail) : null;
  } catch {
    return null;
  }
}

function viewFromDetail(detail: ComplaintDetail): StaffComplaintDetailView {
  return {
    assignee: detail.ownerId,
    branch: detail.branchId,
    reference: detail.referenceNumber,
    severity: detail.severity,
    status: detail.status,
    subject: detail.subject,
    timeline: detail.statusHistory.map((item) => `${item.toStatus} - ${item.createdAt.slice(0, 10)}`),
  };
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
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    description: complaint.description,
    incidentAt: typeof complaint.incidentAt === 'string' ? complaint.incidentAt : null,
    statusHistory: complaint.statusHistory.filter(statusHistoryItem),
  };
}

function statusHistoryItem(item: unknown): item is ComplaintDetail['statusHistory'][number] {
  const row = item as Partial<ComplaintDetail['statusHistory'][number]>;
  return typeof row?.id === 'string' && typeof row.toStatus === 'string' && typeof row.createdAt === 'string';
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
