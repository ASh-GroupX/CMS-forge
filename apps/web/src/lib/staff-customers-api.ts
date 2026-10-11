'use server';

import { hasStaffSessionCookie, incomingCookieHeader } from './staff-request-auth';

export type CustomerResponseDto = {
  id: string;
  nameEn: string;
  nameAr: string;
  phone: string;
  email: string | null;
  dmsCode: string | null;
  dataSource: string;
};

export type StaffApiResult<T> = { ok: true; data: T } | { ok: false; error: any };

export async function searchCustomers(query: string, fetchImpl: typeof fetch = fetch): Promise<StaffApiResult<{ items: CustomerResponseDto[] }>> {
  return requestJson(`/customers/search?q=${encodeURIComponent(query)}`, fetchImpl);
}

export async function getCustomer(id: string, fetchImpl: typeof fetch = fetch): Promise<StaffApiResult<{ customer: CustomerResponseDto }>> {
  return requestJson(`/customers/${encodeURIComponent(id)}`, fetchImpl);
}

async function requestJson<T>(path: string, fetchImpl: typeof fetch, init?: RequestInit): Promise<StaffApiResult<T>> {
  const cookies = await incomingCookieHeader();
  if (!hasStaffSessionCookie(cookies)) return { ok: false, error: { kind: 'denied' } };

  try {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
    const url = new URL(path, apiUrl);
    const response = await fetchImpl(url, {
      ...init,
      headers: { Accept: 'application/json', cookie: cookies, ...init?.headers },
      method: init?.method ?? 'GET',
    });

    if (!response.ok) {
      return { ok: false, error: { status: response.status } };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch {
    return {
      ok: false,
      error: { kind: 'network', code: 'NETWORK_ERROR', message: 'Unable to reach server. Try again.', correlationId: null },
    };
  }
}
