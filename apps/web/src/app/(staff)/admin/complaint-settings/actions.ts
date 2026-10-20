'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function getAuthHeaders() {
  const cookieHeader = (await cookies()).toString();
  const csrf = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('cms_csrf_token='))?.slice('cms_csrf_token='.length);
  return {
    'Content-Type': 'application/json',
    'Cookie': cookieHeader,
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

export async function getRootCauses(complaintType?: string) {
  const url = new URL(`${API_BASE_URL}/complaints/settings/root-causes`);
  if (complaintType && complaintType !== 'ALL') {
    url.searchParams.set('complaintType', complaintType);
  }
  const res = await fetch(url.toString(), {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createRootCause(nameEn: string, nameAr: string, complaintType?: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints/settings/root-causes`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ nameEn, nameAr, complaintType: complaintType || null }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    revalidatePath('/admin/complaint-settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function updateRootCause(id: string, nameEn: string, nameAr: string, complaintType?: string | null): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints/settings/root-causes/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ nameEn, nameAr, complaintType }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    revalidatePath('/admin/complaint-settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function deleteRootCause(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints/settings/root-causes/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    revalidatePath('/admin/complaint-settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function getSalesAdvisors() {
  const res = await fetch(`${API_BASE_URL}/complaints/settings/sales-advisors`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createSalesAdvisor(nameEn: string, nameAr: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints/settings/sales-advisors`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ nameEn, nameAr }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    revalidatePath('/admin/complaint-settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function updateSalesAdvisor(id: string, nameEn: string, nameAr: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints/settings/sales-advisors/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ nameEn, nameAr }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    revalidatePath('/admin/complaint-settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function deleteSalesAdvisor(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints/settings/sales-advisors/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => '');
      return { success: false, error: parseErrorMessage(msg, res.status) };
    }
    revalidatePath('/admin/complaint-settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

