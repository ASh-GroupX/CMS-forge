'use server';

import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getAuthHeaders() {
  const reqHeaders = await headers().catch(() => null);
  const cookieStore = await cookies().catch(() => null);
  const cookieHeader = reqHeaders?.get('cookie') || cookieStore?.toString() || '';
  const csrf = cookieStore?.get('cms_csrf_token')?.value
    ?? cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith('cms_csrf_token='))?.slice('cms_csrf_token='.length);

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(cookieHeader ? { cookie: cookieHeader } : {}),
    ...(csrf ? { 'x-csrf-token': csrf } : {}),
  };
}

export async function getAllUsersBookingRulesAction() {
  try {
    const res = await fetch(`${API_BASE_URL}/service-bookings/settings/users-rules`, {
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function updateUserBookingRulesAction(userId: string, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/service-bookings/settings/users/${encodeURIComponent(userId)}/rules`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || 'Failed to update user booking rules' };
    }
    const updated = await res.json().catch(() => null);
    revalidatePath('/admin/booking-settings');
    revalidatePath('/service-booking');
    return { success: true, rule: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}
