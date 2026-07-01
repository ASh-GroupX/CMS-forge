export type ComplaintStatus = 'DRAFT' | 'SUBMITTED' | 'MANAGER_REVIEW' | 'BRANCH_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED' | 'REJECTED';

export type ComplaintSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ComplaintTransitionAction = 'SUBMIT' | 'ACCEPT_INTAKE' | 'REJECT_AS_INVALID' | 'APPROVE_AND_ROUTE' | 'SEND_BACK' | 'ASSIGN_INVESTIGATION' | 'RESOLVE_DIRECTLY' | 'REJECT_AFTER_REVIEW' | 'ADD_INVESTIGATION_UPDATE' | 'RESOLVE' | 'REJECT_AFTER_INVESTIGATION' | 'CLOSE' | 'REJECT_RESOLUTION' | 'REOPEN' | 'ROUTE_AGAIN';

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

export type ComplaintCaseSummary = {
  id: string;
  type: string;
  status: ComplaintStatus;
  lifecycleStatus: string;
  confidentialityLevel: string;
  branchId: string;
  branchName: string;
  ownerId: string | null;
  ownerName: string | null;
};

export type ComplaintCustomerDetail = { id: string; name: string; phone: string | null; identifier: string | null; source: 'LOCAL' | 'MANUAL' | 'DMS' };
export type ComplaintVehicleDetail = { id: string; vin: string; plate: string; make: string; model: string; year: number; source: 'LOCAL' | 'MANUAL' | 'DMS' };

export type ComplaintDetail = ComplaintQueueItem & {
  description: string;
  incidentAt: string | null;
  customer: ComplaintCustomerDetail;
  vehicle: ComplaintVehicleDetail | null;
  customerSource: 'LOCAL' | 'MANUAL' | 'DMS';
  manualCustomer: boolean;
  vehicleRelated: boolean;
  vehicleSource: 'LOCAL' | 'MANUAL' | 'DMS' | null;
  manualVehicle: boolean;
  vehicleDataUnavailableReason: string | null;
  statusHistory: ComplaintStatusTimelineItem[];
  caseSummary: ComplaintCaseSummary | null;
  allowedActions: ComplaintTransitionAction[];
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
  customerSource?: ComplaintDetail['customerSource'];
  categoryId: string;
  subcategoryId: string;
  description: string;
  incidentAt: string;
  subject: string;
  severity: ComplaintSeverity;
  vehicleRelated?: boolean;
  vehicleVin?: string | null;
  vehicleId?: string | null;
  vehiclePlate?: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleModelYear?: number | null;
  vehicleSource?: ComplaintDetail['vehicleSource'];
  vehicleDataUnavailableReason?: string | null;
};

export type StaffComplaintCreateResponse = {
  complaint: Pick<ComplaintQueueItem, 'id' | 'referenceNumber' | 'status'>;
};

export type StaffComplaintCorrectionRequest = {
  expectedUpdatedAt: string;
  reason: string;
  customerId?: string;
  customerSource?: ComplaintDetail['customerSource'];
  manualCustomer?: boolean;
  vehicleId?: string | null;
  vehicleSource?: ComplaintDetail['vehicleSource'];
  manualVehicle?: boolean;
  vehicleRelated?: boolean;
  vehicleDataUnavailableReason?: string | null;
};

export type StaffComplaintCorrectionResponse = {
  correction: {
    complaintId: string;
    changedFields: Array<keyof Omit<StaffComplaintCorrectionRequest, 'expectedUpdatedAt' | 'reason'>>;
  };
};

export type StaffComplaintTransitionRequest = {
  status: ComplaintStatus;
  action: ComplaintTransitionAction;
  reason: string;
};

export type StaffComplaintTransitionResponse = {
  transition: {
    complaintId: string;
    fromStatus: ComplaintStatus;
    action: ComplaintTransitionAction;
    actorRole: string;
    toStatus: ComplaintStatus;
  };
};

export type DmsLookupStatus = 'MATCH' | 'MULTIPLE_MATCHES' | 'NOT_FOUND' | 'PROVIDER_DOWN' | 'DISABLED';
export const DMS_DOWN_STATUS: DmsLookupStatus = 'PROVIDER_DOWN';

export type DmsCustomerVehicleMatch = {
  customerCode?: string;
  customerName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  vin?: string;
  plateNumber?: string;
  brand?: string;
  model?: string;
  modelYear?: number;
  saleDate?: string;
  warrantyStatus?: string;
  serviceBranch?: string;
  salesBranch?: string;
  source: 'DMS';
};

export type DmsLookupResult = {
  action: 'customerVehicleLookup';
  result: DmsLookupStatus;
  latencyMs: number;
  correlationId: string;
  manualFallbackAllowed: boolean;
  matches: DmsCustomerVehicleMatch[];
};

export type StaffDmsLookupQuery = {
  phone?: string | null;
  customerNumber?: string | null;
  vin?: string | null;
  name?: string | null;
};

type ComplaintQueueResponse = { items: ComplaintQueueItem[] };
type ComplaintDetailResponse = { complaint: ComplaintDetail };
type DmsLookupResponse = { lookup: DmsLookupResult };
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

export function correctStaffComplaint(
  complaintId: string,
  correction: StaffComplaintCorrectionRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<StaffApiResult<StaffComplaintCorrectionResponse>> {
  return requestJson(`/api/complaints/${encodeURIComponent(complaintId)}/corrections`, fetchImpl, {
    body: JSON.stringify(correction),
    headers: csrfHeaders(),
    method: 'POST',
  });
}

export function submitStaffComplaintWorkflowAction(
  complaintId: string,
  request: StaffComplaintTransitionRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<StaffApiResult<StaffComplaintTransitionResponse>> {
  return requestJson(`/api/complaints/${encodeURIComponent(complaintId)}/transitions`, fetchImpl, {
    body: JSON.stringify({ fromStatus: request.status, action: request.action, reason: request.reason }),
    headers: csrfHeaders(),
    method: 'POST',
  });
}

export function lookupStaffDmsCustomerVehicle(
  query: StaffDmsLookupQuery,
  fetchImpl: typeof fetch = fetch,
): Promise<StaffApiResult<DmsLookupResponse>> {
  const params = new URLSearchParams();
  appendQuery(params, 'phone', query.phone);
  appendQuery(params, 'customerNumber', query.customerNumber);
  appendQuery(params, 'vin', query.vin);
  appendQuery(params, 'name', query.name);
  const suffix = params.size ? `?${params.toString()}` : '';
  return requestJson(`/api/integrations/dms/customer-vehicle${suffix}`, fetchImpl);
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

function appendQuery(params: URLSearchParams, key: keyof StaffDmsLookupQuery, value: string | null | undefined) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text) params.set(key, text);
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
