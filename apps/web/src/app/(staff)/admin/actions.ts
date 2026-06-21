'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const CSRF_COOKIE = 'cms_csrf_token';

export async function saveBranchAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = String(formData.get('id') ?? '').trim();
  const response = await adminFetch(id ? `/branches/${encodeURIComponent(id)}` : '/branches', {
    body: JSON.stringify({
      code: text(formData, 'code'),
      nameEn: text(formData, 'nameEn'),
      nameAr: text(formData, 'nameAr'),
    }),
    method: id ? 'PATCH' : 'POST',
  });
  redirect(`/admin?locale=${locale}&admin=${state(response)}`);
}

export async function saveCategoryAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = String(formData.get('id') ?? '').trim();
  const response = await adminFetch(id ? `/admin/categories/${encodeURIComponent(id)}` : '/admin/categories', {
    body: JSON.stringify({
      code: text(formData, 'code'),
      nameEn: text(formData, 'nameEn'),
      nameAr: text(formData, 'nameAr'),
      parentId: String(formData.get('parentId') ?? '').trim() || null,
    }),
    method: id ? 'PATCH' : 'POST',
  });
  redirect(`/admin?locale=${locale}&admin=${state(response)}`);
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

function state(response: Response): 'error' | 'success' | 'validation' {
  return response.ok ? 'success' : response.status === 400 ? 'validation' : 'error';
}

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}
