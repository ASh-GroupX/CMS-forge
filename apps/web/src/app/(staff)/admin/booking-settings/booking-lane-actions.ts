'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { ServiceBookingLane } from '../../../../lib/staff-service-bookings-api';

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function saveBookingLaneAction(input: Omit<ServiceBookingLane, 'updatedAt'> & { expectedUpdatedAt?: string }) {
  const requestHeaders = await headers().catch(() => null);
  const cookieStore = await cookies().catch(() => null);
  const cookieHeader = requestHeaders?.get('cookie') || cookieStore?.toString() || '';
  const csrf = cookieStore?.get('cms_csrf_token')?.value
    ?? cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith('cms_csrf_token='))?.slice('cms_csrf_token='.length);
  try {
    const response = await fetch(`${API_BASE_URL}/service-bookings/centers/${encodeURIComponent(input.serviceCenterId)}/lanes`, {
      method: 'POST', cache: 'no-store', body: JSON.stringify(input),
      headers: { Accept: 'application/json', 'Content-Type': 'application/json',
        ...(cookieHeader ? { cookie: cookieHeader } : {}), ...(csrf ? { 'x-csrf-token': csrf } : {}) },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { success: false, conflict: response.status === 409, error: body?.error?.message ?? body?.message ?? 'Could not save booking lane' };
    }
    const lane = await response.json() as ServiceBookingLane;
    revalidatePath('/admin/booking-settings');
    revalidatePath('/service-booking');
    return { success: true, lane };
  } catch {
    return { success: false, conflict: false, error: 'Could not connect to the booking service' };
  }
}
