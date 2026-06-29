export type PortalApiError = {
  kind: 'api' | 'network';
  code: string;
  message: string;
  correlationId: string | null;
  status?: number;
};

export type PortalApiResult<T> = { ok: true; data: T } | { ok: false; error: PortalApiError };

export type PortalOtpRequest = { referenceNumber: string; customerPhone: string };
export type PortalOtpResponse = { ok: true; verificationId: string; expiresAt: string };
export type PortalSessionResponse = { session: { sessionToken: string; expiresAt: string } };
export type PortalTrackingTimelineItem = { fromStatus: string | null; toStatus: string; action: string | null; createdAt: string };
export type PortalTrackingComplaint = {
  referenceNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  timeline: PortalTrackingTimelineItem[];
};
export type PortalTrackingResponse = { complaint: PortalTrackingComplaint };

type ErrorEnvelope = { error?: { code?: string; message?: string; correlationId?: string | null } };

export function requestPortalOtp(input: PortalOtpRequest, fetchImpl: typeof fetch = fetch): Promise<PortalApiResult<PortalOtpResponse>> {
  return requestJson('/api/portal/tracking/otp', fetchImpl, jsonPost(input));
}

export function verifyPortalOtp(input: { verificationId: string; otp: string }, fetchImpl: typeof fetch = fetch): Promise<PortalApiResult<PortalSessionResponse>> {
  return requestJson('/api/portal/tracking/otp/verify', fetchImpl, jsonPost(input));
}

export function getPortalTracking(sessionToken: string, fetchImpl: typeof fetch = fetch): Promise<PortalApiResult<PortalTrackingResponse>> {
  return requestJson('/api/portal/tracking', fetchImpl, portalSessionInit('GET', sessionToken));
}

export function submitPortalFollowUp(sessionToken: string, body: string, fetchImpl: typeof fetch = fetch): Promise<PortalApiResult<{ ok: true }>> {
  return requestJson('/api/portal/tracking/follow-ups', fetchImpl, { ...portalSessionInit('POST', sessionToken), body: JSON.stringify({ body }) });
}

async function requestJson<T>(path: string, fetchImpl: typeof fetch, init: RequestInit): Promise<PortalApiResult<T>> {
  try {
    const response = await fetchImpl(path, { credentials: 'omit', ...init });
    if (!response.ok) return { ok: false, error: await mapErrorResponse(response) };
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, error: { kind: 'network', code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } };
  }
}

function jsonPost(body: unknown): RequestInit {
  return {
    body: JSON.stringify(body),
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
    method: 'POST',
  };
}

function portalSessionInit(method: 'GET' | 'POST', sessionToken: string): RequestInit {
  return {
    headers: { Accept: 'application/json', 'x-portal-session': sessionToken },
    method,
  };
}

async function mapErrorResponse(response: Response): Promise<PortalApiError> {
  const body = await response.json().catch(() => null) as ErrorEnvelope | null;
  return {
    kind: 'api',
    code: body?.error?.code ?? 'API_ERROR',
    message: body?.error?.message ?? 'Request failed. Try again.',
    correlationId: body?.error?.correlationId ?? null,
    status: response.status,
  };
}
