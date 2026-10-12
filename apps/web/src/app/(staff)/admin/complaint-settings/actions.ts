'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('cms_staff_session')?.value || '';
  return {
    'Content-Type': 'application/json',
    'Cookie': `cms_staff_session=${token}`,
  };
}

export async function getRootCauses() {
  const res = await fetch(`${API_BASE_URL}/complaints/settings/root-causes`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createRootCause(nameEn: string, nameAr: string) {
  const res = await fetch(`${API_BASE_URL}/complaints/settings/root-causes`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ nameEn, nameAr }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to create root cause');
  revalidatePath('/admin/complaint-settings');
}

export async function updateRootCause(id: string, nameEn: string, nameAr: string) {
  const res = await fetch(`${API_BASE_URL}/complaints/settings/root-causes/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ nameEn, nameAr }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to update root cause');
  revalidatePath('/admin/complaint-settings');
}

export async function deleteRootCause(id: string) {
  const res = await fetch(`${API_BASE_URL}/complaints/settings/root-causes/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to delete root cause');
  revalidatePath('/admin/complaint-settings');
}

export async function getSalesAdvisors() {
  const res = await fetch(`${API_BASE_URL}/complaints/settings/sales-advisors`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createSalesAdvisor(nameEn: string, nameAr: string) {
  const res = await fetch(`${API_BASE_URL}/complaints/settings/sales-advisors`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ nameEn, nameAr }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to create sales advisor');
  revalidatePath('/admin/complaint-settings');
}

export async function updateSalesAdvisor(id: string, nameEn: string, nameAr: string) {
  const res = await fetch(`${API_BASE_URL}/complaints/settings/sales-advisors/${id}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ nameEn, nameAr }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to update sales advisor');
  revalidatePath('/admin/complaint-settings');
}

export async function deleteSalesAdvisor(id: string) {
  const res = await fetch(`${API_BASE_URL}/complaints/settings/sales-advisors/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to delete sales advisor');
  revalidatePath('/admin/complaint-settings');
}
