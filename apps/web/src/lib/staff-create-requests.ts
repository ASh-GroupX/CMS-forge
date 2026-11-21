'use client';

import type { CreateAppointmentInput, ServiceAppointment } from './staff-service-bookings-api';

type CreateResult<T> = { success: true; data: T } | { success: false; error: string; code?: string };
const pendingRequests = new Map<string, { id: string; fingerprint: number }>();

function requestIdFor(kind: string, input: unknown): string {
  const key = `cms:create:${kind}`;
  const value = JSON.stringify(input);
  let fingerprint = 2166136261;
  for (let i = 0; i < value.length; i++) fingerprint = Math.imul(fingerprint ^ value.charCodeAt(i), 16777619);
  let stored: string | null = null;
  try { stored = sessionStorage.getItem(key); } catch { /* Keep the request ID in this tab's memory. */ }
  if (stored) {
    try {
      const prior = JSON.parse(stored) as { id: string; fingerprint: number };
      if (prior.fingerprint === fingerprint) { pendingRequests.set(key, prior); return prior.id; }
    } catch { /* Replace a malformed pending request. */ }
  }
  const pending = pendingRequests.get(key);
  if (pending?.fingerprint === fingerprint) return pending.id;
  const id = crypto.randomUUID();
  pendingRequests.set(key, { id, fingerprint });
  try { sessionStorage.setItem(key, JSON.stringify({ id, fingerprint })); } catch { /* The in-memory ID still protects this tab's retry. */ }
  return id;
}

async function postCreate<T>(path: string, input: Record<string, unknown>, kind: string, fingerprintInput: unknown): Promise<CreateResult<T>> {
  const requestId = requestIdFor(kind, fingerprintInput);
  const csrf = document.cookie.split(';').map((item) => item.trim()).find((item) => item.startsWith('cms_csrf_token='))?.slice('cms_csrf_token='.length);
  try {
    const response = await fetch(`/api/${path}`, {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
      body: JSON.stringify({ ...input, requestId }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: body.error?.message ?? body.message ?? `Save failed (${response.status})`, code: body.error?.code ?? body.code };
    pendingRequests.delete(`cms:create:${kind}`);
    try { sessionStorage.removeItem(`cms:create:${kind}`); } catch { /* A successful save stays successful. */ }
    return { success: true, data: body as T };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Network error while saving' };
  }
}

export async function createBookingRequest(input: CreateAppointmentInput): Promise<{ success: boolean; appointment?: ServiceAppointment; error?: string }> {
  const result = await postCreate<ServiceAppointment>('service-bookings/appointments', input as unknown as Record<string, unknown>, 'booking', input);
  return result.success ? { success: true, appointment: result.data } : result;
}

export async function createTicketRequest(input: Record<string, unknown>): Promise<{ success: boolean; data?: { id: string }; error?: string; code?: string }> {
  const { dueAt: _dueAt, attachments: _attachments, ...stable } = input;
  const result = await postCreate<{ id: string }>('internal-tickets', input, 'ticket', stable);
  return result.success ? { success: true, data: result.data } : result;
}
