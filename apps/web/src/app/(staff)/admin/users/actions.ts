'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const CSRF_COOKIE = 'cms_csrf_token';

export async function createAdminUserAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const emailRaw = String(formData.get('email') ?? '').trim();
  const phoneRaw = String(formData.get('phone') ?? '').trim();
  const viewModeRaw = String(formData.get('viewMode') ?? '').trim();
  const allowedNavKeysRaw = formData.getAll('allowedNavKeys').map(String);

  const response = await adminFetch('/admin/users', {
    body: JSON.stringify({
      username: String(formData.get('username') ?? '').trim() || undefined,
      email: emailRaw ? emailRaw : undefined,
      phone: phoneRaw ? phoneRaw : undefined,
      viewMode: viewModeRaw ? viewModeRaw : undefined,
      allowedNavKeys: allowedNavKeysRaw.length > 0 ? allowedNavKeysRaw : undefined,
      nameEn: String(formData.get('nameEn') ?? '').trim(),
      nameAr: String(formData.get('nameAr') ?? '').trim(),
      roleCode: String(formData.get('roleCode') ?? '').trim(),
      branchId: String(formData.get('branchId') ?? '').trim() || null,
      departmentId: String(formData.get('departmentId') ?? '').trim() || undefined,
      initialPassword: String(formData.get('initialPassword') ?? ''),
    }),
    method: 'POST',
  });
  redirect(`/admin/users?locale=${locale}&admin=${response.ok ? 'success' : response.status === 400 ? 'validation' : 'error'}`);
}

export async function updateAdminUserNavRulesAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = encodeURIComponent(String(formData.get('id') ?? ''));
  const viewMode = String(formData.get('viewMode') ?? 'BOTH');
  const allowedNavKeys = formData.getAll('allowedNavKeys').map(String);
  const response = await adminFetch(`/admin/users/${id}/nav-rules`, {
    body: JSON.stringify({
      viewMode,
      allowedNavKeys,
    }),
    method: 'POST',
  });
  redirect(`/admin/users?locale=${locale}&admin=${response.ok ? 'success' : response.status === 400 ? 'validation' : 'error'}`);
}

export async function updateAdminUserDepartmentAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = encodeURIComponent(String(formData.get('id') ?? ''));
  const response = await adminFetch(`/admin/users/${id}/department`, {
    body: JSON.stringify({ departmentId: String(formData.get('departmentId') ?? '') }),
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

export async function updateAdminUserAssignmentsAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = encodeURIComponent(String(formData.get('id') ?? ''));
  const response = await adminFetch(`/admin/users/${id}/assignments`, {
    body: JSON.stringify({
      branchId: String(formData.get('branchId') ?? '') || null,
      departmentId: String(formData.get('departmentId') ?? '') || null,
      roleCode: String(formData.get('roleCode') ?? '') || null,
    }),
    method: 'POST',
  });
  redirect(`/admin/users?locale=${locale}&admin=${response.ok ? 'success' : 'error'}`);
}

export async function resetAdminUserPasswordAction(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get('locale'));
  const id = encodeURIComponent(String(formData.get('id') ?? ''));
  const password = String(formData.get('password') ?? '');
  const response = await adminFetch(`/admin/users/${id}/reset-password`, {
    body: JSON.stringify({ password }),
    method: 'POST',
  });
  redirect(`/admin/users?locale=${locale}&admin=${response.ok ? 'success' : response.status === 400 ? 'validation' : 'error'}`);
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
