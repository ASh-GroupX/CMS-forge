'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const CSRF_COOKIE = 'cms_csrf_token';

export async function saveBranchAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = String(formData.get('id') ?? '').trim();
  const code = text(formData, 'code');
  const nameEn = text(formData, 'nameEn');
  const nameAr = text(formData, 'nameAr');

  const response = await adminFetch(id ? `/branches/${encodeURIComponent(id)}` : '/branches', {
    body: JSON.stringify({ code, nameEn, nameAr }),
    method: id ? 'PATCH' : 'POST',
  });

  if (response.ok) {
    await adminFetch('/service-bookings/centers', {
      body: JSON.stringify({ id: id || undefined, code, nameEn, nameAr }),
      method: 'POST',
    }).catch(() => null);
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/branches');
  revalidatePath('/admin/booking-settings');
  revalidatePath('/service-booking');
  redirect(`/admin/branches?locale=${locale}&admin=${state(response)}`);
}

export async function saveDepartmentAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = String(formData.get('id') ?? '').trim();
  const response = await adminFetch(id ? `/departments/${encodeURIComponent(id)}` : '/departments', {
    body: JSON.stringify({
      code: text(formData, 'code'),
      nameEn: text(formData, 'nameEn'),
      nameAr: text(formData, 'nameAr'),
      branchId: text(formData, 'branchId'),
    }),
    method: id ? 'PATCH' : 'POST',
  });
  revalidatePath('/admin', 'layout');
  redirect(`/admin/branches?locale=${locale}&admin=${state(response)}`);
}

export async function saveCategoryAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = String(formData.get('id') ?? '').trim();
  const payload = {
    code: text(formData, 'code'),
    nameEn: text(formData, 'nameEn'),
    nameAr: text(formData, 'nameAr'),
    departmentId: String(formData.get('departmentId') ?? '').trim() || null,
    branchId: String(formData.get('branchId') ?? '').trim() || null,
    isExternal: formData.get('isExternal') === 'true',
    isInternal: formData.get('isInternal') === 'true',
  };
  const response = await adminFetch(id ? `/admin/categories/${encodeURIComponent(id)}` : '/admin/categories', {
    body: JSON.stringify(payload),
    method: id ? 'PATCH' : 'POST',
  });
  revalidatePath('/admin', 'layout');
  redirect(`${returnTo(formData, '/admin/categories')}?locale=${locale}&admin=${state(response)}`);
}

export async function deactivateBranchAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = text(formData, 'id');
  const response = await adminFetch(`/branches/${encodeURIComponent(id)}/deactivate`, { method: 'POST' });
  revalidatePath('/admin', 'layout');
  redirect(`/admin/branches?locale=${locale}&admin=${state(response)}`);
}

export async function deactivateDepartmentAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = text(formData, 'id');
  const response = await adminFetch(`/departments/${encodeURIComponent(id)}/deactivate`, { method: 'POST' });
  revalidatePath('/admin', 'layout');
  redirect(`/admin/branches?locale=${locale}&admin=${state(response)}`);
}


export async function deactivateCategoryAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = text(formData, 'id');
  const response = await adminFetch(`/admin/categories/${encodeURIComponent(id)}/deactivate`, { method: 'POST' });
  revalidatePath('/admin', 'layout');
  redirect(`${returnTo(formData, '/admin/categories')}?locale=${locale}&admin=${state(response)}`);
}

export async function saveSlaPolicyAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = text(formData, 'id');
  const response = await adminFetch(`/sla/policies/${encodeURIComponent(id)}`, {
    body: JSON.stringify({
      durationMinutes: number(formData, 'durationMinutes'),
      warningPercent: number(formData, 'warningPercent'),
      branchTimezone: text(formData, 'branchTimezone'),
      workingCalendarMode: text(formData, 'workingCalendarMode'),
      escalationLevel1: text(formData, 'escalationLevel1'),
      escalationLevel2: optionalText(formData, 'escalationLevel2'),
      escalationLevel3: optionalText(formData, 'escalationLevel3'),
      escalationLevel2AfterBreachMinutes: optionalNumber(formData, 'escalationLevel2AfterBreachMinutes'),
      escalationLevel3AfterBreachMinutes: optionalNumber(formData, 'escalationLevel3AfterBreachMinutes'),
    }),
    method: 'PATCH',
  });
  revalidatePath('/admin', 'layout');
  redirect(`${returnTo(formData, '/admin/categories')}?locale=${locale}&admin=${state(response)}`);
}

async function adminFetch(path: string, init: RequestInit): Promise<Response> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const csrf = cookieStore.get(CSRF_COOKIE)?.value ?? readCookie(cookieHeader, CSRF_COOKIE);
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

function optionalText(formData: FormData, name: string): string | null {
  return text(formData, name) || null;
}

function number(formData: FormData, name: string): number {
  return Number(text(formData, name));
}

function optionalNumber(formData: FormData, name: string): number | null {
  const value = text(formData, name);
  return value ? Number(value) : null;
}

export async function seedSlaPoliciesAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const response = await adminFetch('/sla/policies/seed', { method: 'POST' });
  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/sla');
  redirect(`${returnTo(formData, '/admin/sla')}?locale=${locale}&admin=${state(response)}`);
}

function returnTo(formData: FormData, fallback: string): string {
  const val = String(formData.get('returnTo') ?? '');
  if (val === '/admin/categories' || val === '/admin/sla') return val;
  return fallback;
}
