'use server';
import { cookies } from 'next/headers';
import { redirectRequest, type IntakeComplaint, type IntakeChoices } from '../../../lib/redirect-complaints-api';
async function request<T>(path: string, method = 'GET', input?: unknown) { const store = await cookies(); return redirectRequest<T>(store.toString(), path, method, input, store.get('cms_csrf_token')?.value); }
export async function loadRedirectQueue(filter: string, page = 1) { return request<{ items: IntakeComplaint[]; hasMore: boolean; page: number }>(`redirect-queue?filter=${encodeURIComponent(filter)}&page=${page}`); }
export async function loadRedirectDetail(id: string) { return request<IntakeComplaint>(`${encodeURIComponent(id)}/intake`); }
export async function loadRedirectChoices() { return request<IntakeChoices>('intake-options'); }
export async function canAccessRedirectIntake() { const result = await request<{ allowed: boolean }>('intake-access'); return result.status === 'ok' && result.data.allowed === true; }
export async function intakeClaimAction(id: string, expectedVersion: string, release = false) { return request<IntakeComplaint>(`${encodeURIComponent(id)}/intake-claim`, release ? 'DELETE' : 'POST', { expectedVersion }); }
export async function intakeCorrectionAction(id: string, input: Record<string, unknown>, redirect: boolean) { return request<IntakeComplaint>(`${encodeURIComponent(id)}/${redirect ? 'intake-redirect' : 'intake'}`, redirect ? 'POST' : 'PATCH', input); }
