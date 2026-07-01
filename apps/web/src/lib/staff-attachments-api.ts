import { attachmentFileToBase64, validateAttachmentFile, type AttachmentFileValidation } from './attachment-file-policy';

export type StaffAttachment = {
  id: string;
  complaintId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  scanStatus: 'PENDING' | 'CLEAN' | 'REJECTED' | string;
  customerVisible: boolean;
};

export type StaffAttachmentDownload = { attachmentId: string; token: string; expiresAt: string };
export type StaffAttachmentError = { kind: 'api' | 'network' | 'validation'; code: string; message: string; correlationId: string | null; status?: number };
export type StaffAttachmentResult<T> = { ok: true; data: T } | { ok: false; error: StaffAttachmentError };
export type OpenAttachmentDownloadTarget = (target: string) => void;

type ErrorEnvelope = { error?: { code?: string; message?: string; correlationId?: string | null } };

export async function listStaffComplaintAttachments(complaintId: string, fetchImpl: typeof fetch = fetch): Promise<StaffAttachmentResult<{ items: StaffAttachment[] }>> {
  return requestJson(`/api/complaints/${encodeURIComponent(complaintId)}/attachments`, fetchImpl, { method: 'GET' });
}

export async function uploadStaffComplaintAttachment(complaintId: string, file: File | null, fetchImpl: typeof fetch = fetch): Promise<StaffAttachmentResult<{ attachment: StaffAttachment }>> {
  const validation = validateAttachmentFile(file);
  if (!validation.ok) return { ok: false, error: validationError(validation) };
  const selectedFile = file;
  if (!selectedFile) return { ok: false, error: validationError({ ok: false, code: 'ATTACHMENT_REQUIRED' }) };
  return requestJson(`/api/complaints/${encodeURIComponent(complaintId)}/attachments`, fetchImpl, {
    body: JSON.stringify({ fileName: selectedFile.name, contentType: selectedFile.type, sizeBytes: selectedFile.size, contentBase64: await attachmentFileToBase64(selectedFile) }),
    headers: csrfHeaders(),
    method: 'POST',
  });
}

export async function prepareStaffAttachmentDownload(complaintId: string, attachmentId: string, fetchImpl: typeof fetch = fetch): Promise<StaffAttachmentResult<{ download: StaffAttachmentDownload }>> {
  return requestJson(`/api/complaints/${encodeURIComponent(complaintId)}/attachments/${encodeURIComponent(attachmentId)}/download`, fetchImpl, { method: 'GET' });
}

export async function downloadStaffAttachment(
  complaintId: string,
  attachmentId: string,
  openTarget: OpenAttachmentDownloadTarget = openAttachmentDownloadTarget,
  fetchImpl: typeof fetch = fetch,
): Promise<StaffAttachmentResult<{ download: StaffAttachmentDownload; target: string }>> {
  const result = await prepareStaffAttachmentDownload(complaintId, attachmentId, fetchImpl);
  if (!result.ok) return result;
  const target = staffAttachmentDownloadTarget(complaintId, attachmentId, result.data.download);
  openTarget(target);
  return { ok: true, data: { ...result.data, target } };
}

export function staffAttachmentDownloadTarget(complaintId: string, attachmentId: string, download: StaffAttachmentDownload): string {
  const token = download.token.trim();
  if (isHttpUrl(token)) return token;
  return `/api/complaints/${encodeURIComponent(complaintId)}/attachments/${encodeURIComponent(attachmentId)}/download?redirect=1`;
}

async function requestJson<T>(path: string, fetchImpl: typeof fetch, init: RequestInit): Promise<StaffAttachmentResult<T>> {
  try {
    const response = await fetchImpl(path, { ...init, credentials: 'include', headers: { Accept: 'application/json', ...init.headers } });
    if (!response.ok) return { ok: false, error: await mapErrorResponse(response) };
    return { ok: true, data: await response.json() as T };
  } catch {
    return { ok: false, error: { kind: 'network', code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null } };
  }
}

function csrfHeaders(): HeadersInit {
  const token = readableCookie('cms_csrf_token');
  return token ? { 'content-type': 'application/json', 'x-csrf-token': token } : { 'content-type': 'application/json' };
}

function readableCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function validationError(validation: Exclude<AttachmentFileValidation, { ok: true }>): StaffAttachmentError {
  return { kind: 'validation', code: validation.code, message: validation.code === 'ATTACHMENT_SIZE_EXCEEDED' ? 'File exceeds size limit.' : validation.code === 'ATTACHMENT_REQUIRED' ? 'Choose a file first.' : 'File type is not allowed.', correlationId: null };
}

function openAttachmentDownloadTarget(target: string): void {
  if (typeof window !== 'undefined') window.location.assign(target);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function mapErrorResponse(response: Response): Promise<StaffAttachmentError> {
  const body = await response.json().catch(() => null) as ErrorEnvelope | null;
  return {
    kind: 'api',
    code: body?.error?.code ?? 'API_ERROR',
    message: body?.error?.message ?? 'Request failed. Try again.',
    correlationId: body?.error?.correlationId ?? null,
    status: response.status,
  };
}
