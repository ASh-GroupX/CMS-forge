'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import type {
  CreateAppointmentInput,
  DayRule,
  ServiceAppointmentStatus,
  UpdateAppointmentInput,
} from '../../../lib/staff-service-bookings-api';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function getAuthHeaders() {
  const cookieHeader = (await cookies()).toString();
  const csrf = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('cms_csrf_token='))
    ?.slice('cms_csrf_token='.length);

  return {
    'Content-Type': 'application/json',
    Cookie: cookieHeader,
    ...(csrf ? { 'x-csrf-token': csrf } : {}),
  };
}

function parseErrorMessage(raw: string, status: number): string {
  try {
    const json = JSON.parse(raw);
    if (json?.error?.message) return json.error.message;
    if (json?.message) return Array.isArray(json.message) ? json.message.join(', ') : json.message;
  } catch {}
  return raw || `Request failed with status ${status}`;
}

export async function createAppointmentAction(input: CreateAppointmentInput) {
  try {
    const res = await fetch(`${API_BASE_URL}/service-bookings`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    const data = await res.json();
    revalidatePath('/service-booking');
    return { success: true, appointment: data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function updateAppointmentAction(id: string, input: UpdateAppointmentInput) {
  try {
    const res = await fetch(`${API_BASE_URL}/service-bookings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    const data = await res.json();
    revalidatePath('/service-booking');
    return { success: true, appointment: data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function updateAppointmentStatusAction(id: string, status: ServiceAppointmentStatus) {
  return updateAppointmentAction(id, { status });
}

export async function rescheduleAppointmentAction(
  id: string,
  branchId: string,
  date: string,
  startTime: string,
) {
  return updateAppointmentAction(id, { branchId, date, startTime });
}

export async function saveBranchRulesAction(branchId: string, rules: DayRule[]) {
  try {
    const res = await fetch(`${API_BASE_URL}/service-bookings/rules/${encodeURIComponent(branchId)}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ rules }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    revalidatePath('/service-booking');
    revalidatePath('/admin/booking-settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function saveCarModelAction(data: {
  id?: string | undefined;
  nameEn: string;
  nameAr: string;
  brand?: string | undefined;
  isActive?: boolean | undefined;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/service-bookings/master-data/car-models`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    revalidatePath('/service-booking');
    revalidatePath('/admin/booking-settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function saveMaintenanceTypeAction(data: {
  id?: string | undefined;
  nameEn: string;
  nameAr: string;
  estimatedDurationMinutes?: number | undefined;
  isActive?: boolean | undefined;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/service-bookings/master-data/maintenance-types`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    revalidatePath('/service-booking');
    revalidatePath('/admin/booking-settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function updateBranchNameAction(branchId: string, nameEn: string, nameAr: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/branches/${encodeURIComponent(branchId)}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ nameEn, nameAr }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    revalidatePath('/service-booking');
    revalidatePath('/admin/booking-settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}
