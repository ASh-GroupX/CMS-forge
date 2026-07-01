import { attachmentFileToBase64, validateAttachmentFile } from './attachment-file-policy';

export type PortalComplaintAttachmentRequest = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
  contentBase64: string;
};

export type PortalComplaintCreateRequest = {
  customerName: string;
  customerPhone: string;
  categoryId: string;
  subcategoryId: string;
  description: string;
  incidentAt: string;
  branchId: string;
  subject: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  vehicleRelated?: boolean;
  vehicleVin?: string | null;
  attachments?: PortalComplaintAttachmentRequest[];
};

export type PortalFieldError = { field: string; code: string; message: string };
export type PortalSubmitError = {
  kind: 'api' | 'network';
  code: string;
  message: string;
  correlationId: string | null;
  fieldErrors?: PortalFieldError[];
  status?: number;
};
export type PortalSubmitResult<T> = { ok: true; data: T } | { ok: false; error: PortalSubmitError };
export type PortalComplaintCreateResponse = {
  complaint: { id: string; referenceNumber: string; status: string; attachments?: Array<{ id: string; fileName: string; scanStatus: string }> };
};

type ErrorEnvelope = { error?: { code?: string; message?: string; correlationId?: string | null; fieldErrors?: PortalFieldError[] } };

export function submitPortalComplaint(
  complaint: PortalComplaintCreateRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<PortalSubmitResult<PortalComplaintCreateResponse>> {
  return requestJson('/api/portal/complaints', fetchImpl, {
    body: JSON.stringify(complaint),
    headers: { Accept: 'application/json', 'content-type': 'application/json' },
    method: 'POST',
  });
}

export async function portalSubmissionAttachments(files: File[]): Promise<{ ok: true; attachments: PortalComplaintAttachmentRequest[] } | { ok: false; error: PortalFieldError }> {
  const attachments: PortalComplaintAttachmentRequest[] = [];
  for (const file of files) {
    const validation = validateAttachmentFile(file);
    if (!validation.ok) return { ok: false, error: { field: 'attachments', code: validation.code, message: validation.code } };
    attachments.push({
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
      contentBase64: await attachmentFileToBase64(file),
    });
  }
  return { ok: true, attachments };
}

async function requestJson<T>(path: string, fetchImpl: typeof fetch, init: RequestInit): Promise<PortalSubmitResult<T>> {
  try {
    const response = await fetchImpl(path, { credentials: 'omit', ...init });
    if (!response.ok) return { ok: false, error: await mapErrorResponse(response) };
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, error: { kind: 'network', code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } };
  }
}

async function mapErrorResponse(response: Response): Promise<PortalSubmitError> {
  const body = await response.json().catch(() => null) as ErrorEnvelope | null;
  return {
    kind: 'api',
    code: body?.error?.code ?? 'API_ERROR',
    message: body?.error?.message ?? 'Request failed. Try again.',
    correlationId: body?.error?.correlationId ?? null,
    ...(body?.error?.fieldErrors ? { fieldErrors: body.error.fieldErrors } : {}),
    status: response.status,
  };
}
