'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('cms_staff_session')?.value || '';
  return {
    'Content-Type': 'application/json',
    'Cookie': `cms_staff_session=${token}`
  };
}

export async function getReasons(type: 'waiting' | 'resolution' | 'reject', departmentId: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/settings/reasons/${type}?departmentId=${departmentId}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getDepartments() {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/options`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.departments || [];
}

export async function createReason(type: 'waiting' | 'resolution' | 'reject', departmentId: string, reasonEn: string, reasonAr: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/settings/reasons/${type}`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ reasonEn, reasonAr, departmentId }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to create reason');
  revalidatePath('/admin/ticket-settings');
}

export async function updateReason(type: 'waiting' | 'resolution' | 'reject', id: string, reasonEn: string, reasonAr: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/settings/reasons/${type}/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ reasonEn, reasonAr }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to update reason');
  revalidatePath('/admin/ticket-settings');
}

export async function deleteReason(type: 'waiting' | 'resolution' | 'reject', id: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/settings/reasons/${type}/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to delete reason');
  revalidatePath('/admin/ticket-settings');
}
