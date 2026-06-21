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
  branchName?: string;
  ownerId: string | null;
  ownerName?: string | null;
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
  fieldErrors?: StaffApiFieldError[];
  status?: number;
};

export type StaffApiResult<T> = { ok: true; data: T } | { ok: false; error: StaffApiError };

export type StaffApiFieldError = {
  field: string;
  code: string;
  message: string;
};

export type StaffComplaintCreateRequest = {
  customerName: string;
  customerPhone?: string | null;
  customerNumber?: string | null;
  categoryId: string;
  subcategoryId: string;
  description: string;
  incidentAt: string;
  subject: string;
  severity: ComplaintSeverity;
  vehicleRelated?: boolean;
  vehicleVin?: string | null;
  vehicleId?: string | null;
};

export type StaffComplaintCreateResponse = {
  complaint: Pick<ComplaintQueueItem, 'id' | 'referenceNumber' | 'status'>;
};

type ComplaintQueueResponse = { items: ComplaintQueueItem[] };
type ComplaintDetailResponse = { complaint: ComplaintDetail };
type ErrorEnvelope = { error?: { code?: string; message?: string; correlationId?: string | null; fieldErrors?: StaffApiFieldError[] } };

export function listStaffComplaints(fetchImpl: typeof fetch = fetch): Promise<StaffApiResult<ComplaintQueueResponse>> {
  return requestJson('/complaints', fetchImpl);
}

export function getStaffComplaint(
  complaintId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<StaffApiResult<ComplaintDetailResponse>> {
  return requestJson(`/complaints/${encodeURIComponent(complaintId)}`, fetchImpl);
}

export function createStaffComplaint(
  branchId: string,
  complaint: StaffComplaintCreateRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<StaffApiResult<StaffComplaintCreateResponse>> {
  return requestJson(`/api/complaints?branchId=${encodeURIComponent(branchId)}`, fetchImpl, {
    body: JSON.stringify(complaint),
    headers: csrfHeaders(),
    method: 'POST',
  });
}

async function requestJson<T>(path: string, fetchImpl: typeof fetch, init?: RequestInit): Promise<StaffApiResult<T>> {
  try {
    const response = await fetchImpl(path, {
      credentials: 'include',
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
      method: init?.method ?? 'GET',
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

function csrfHeaders(): HeadersInit {
  const csrfToken = readableCookie('cms_csrf_token');
  return csrfToken ? { 'content-type': 'application/json', 'x-csrf-token': csrfToken } : { 'content-type': 'application/json' };
}

function readableCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length) ?? null;
}

async function mapErrorResponse(response: Response): Promise<StaffApiError> {
  const body = await response.json().catch(() => null);
  const envelope = body as ErrorEnvelope | null;
  return {
    kind: 'api',
    code: envelope?.error?.code ?? 'API_ERROR',
    message: envelope?.error?.message ?? 'Request failed. Try again.',
    correlationId: envelope?.error?.correlationId ?? null,
    ...(envelope?.error?.fieldErrors ? { fieldErrors: envelope.error.fieldErrors } : {}),
    status: response.status,
  };
}
