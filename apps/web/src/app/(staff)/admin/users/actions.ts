'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const CSRF_COOKIE = 'cms_csrf_token';

export async function createAdminUserAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const response = await adminFetch('/admin/users', {
    body: JSON.stringify({
      email: String(formData.get('email') ?? ''),
      nameEn: String(formData.get('nameEn') ?? ''),
      nameAr: String(formData.get('nameAr') ?? ''),
      roleCode: String(formData.get('roleCode') ?? ''),
      branchId: String(formData.get('branchId') ?? '') || null,
      initialPassword: String(formData.get('initialPassword') ?? ''),
    }),
    method: 'POST',
  });
  redirect(`/admin/users?locale=${locale}&admin=${response.ok ? 'success' : response.status === 400 ? 'validation' : 'error'}`);
}

export async function toggleAdminUserAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = encodeURIComponent(String(formData.get('id') ?? ''));
  const action = formData.get('action') === 'reactivate' ? 'reactivate' : 'deactivate';
  const response = await adminFetch(`/admin/users/${id}/${action}`, { method: 'POST' });
  redirect(`/admin/users?locale=${locale}&admin=${response.ok ? 'success' : 'error'}`);
}

async function adminFetch(path: string, init: RequestInit): Promise<Response> {
  const cookieHeader = (await cookies()).toString();
  const csrf = readCookie(cookieHeader, CSRF_COOKIE);
  return fetch(new URL(path, API_URL), {
    ...init,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'content-type': 'application/json',
      cookie: cookieHeader,
      ...(csrf ? { 'x-csrf-token': csrf } : {}),
    },
  });
}

function readCookie(header: string, name: string): string | null {
  return header.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}

function safeLocale(value: FormDataEntryValue | null): 'ar' | 'en' {
  return value === 'ar' ? 'ar' : 'en';
}
