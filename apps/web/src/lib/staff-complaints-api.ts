export type ComplaintStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'MANAGER_REVIEW'
  | 'BRANCH_REVIEW'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'REJECTED';

export type ComplaintSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ComplaintQueueItem = {
  id: string;
  referenceNumber: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  subject: string;
  branchId: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ComplaintStatusTimelineItem = {
  id: string;
  fromStatus: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  action: string | null;
  actorId: string | null;
  actorRole: string | null;
  requestSource: string | null;
  reason: string | null;
  correlationId: string | null;
  createdAt: string;
};

export type ComplaintDetail = ComplaintQueueItem & {
  description: string;
  incidentAt: string | null;
  statusHistory: ComplaintStatusTimelineItem[];
};

export type StaffApiError = {
  kind: 'api' | 'network';
  code: string;
  message: string;
  correlationId: string | null;
  status?: number;
};

export type StaffApiResult<T> = { ok: true; data: T } | { ok: false; error: StaffApiError };

type ComplaintQueueResponse = { items: ComplaintQueueItem[] };
type ComplaintDetailResponse = { complaint: ComplaintDetail };
type ErrorEnvelope = { error?: { code?: string; message?: string; correlationId?: string | null } };

export function listStaffComplaints(fetchImpl: typeof fetch = fetch): Promise<StaffApiResult<ComplaintQueueResponse>> {
  return requestJson('/complaints', fetchImpl);
}

export function getStaffComplaint(
  complaintId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<StaffApiResult<ComplaintDetailResponse>> {
  return requestJson(`/complaints/${encodeURIComponent(complaintId)}`, fetchImpl);
}

async function requestJson<T>(path: string, fetchImpl: typeof fetch): Promise<StaffApiResult<T>> {
  try {
    const response = await fetchImpl(path, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      method: 'GET',
    });

    if (!response.ok) {
      return { ok: false, error: await mapErrorResponse(response) };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch {
    return {
      ok: false,
      error: { kind: 'network', code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null },
    };
  }
}

async function mapErrorResponse(response: Response): Promise<StaffApiError> {
  const body = await response.json().catch(() => null);
  const envelope = body as ErrorEnvelope | null;
  return {
    kind: 'api',
    code: envelope?.error?.code ?? 'API_ERROR',
    message: envelope?.error?.message ?? 'Request failed. Try again.',
    correlationId: envelope?.error?.correlationId ?? null,
    status: response.status,
  };
}
