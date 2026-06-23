'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export async function createAdminRoleAction(formData: FormData): Promise<void> {
  const locale = formData.get('locale') === 'ar' ? 'ar' : 'en';
  const cookieHeader = (await cookies()).toString();
  const csrf = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith('cms_csrf_token='))?.slice('cms_csrf_token='.length);
  const response = await fetch(new URL('/admin/roles', API_URL), { method: 'POST', cache: 'no-store', headers: { Accept: 'application/json', 'content-type': 'application/json', cookie: cookieHeader, ...(csrf ? { 'x-csrf-token': csrf } : {}) }, body: JSON.stringify({ code: String(formData.get('code') ?? ''), nameEn: String(formData.get('nameEn') ?? ''), nameAr: String(formData.get('nameAr') ?? ''), permissionCodes: formData.getAll('permissionCodes').map(String) }) });
  redirect(`/admin/roles?locale=${locale}&role=${response.ok ? 'success' : response.status === 400 ? 'validation' : 'error'}`);
}
