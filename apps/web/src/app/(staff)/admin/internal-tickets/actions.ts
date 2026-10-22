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

export async function getDepartments() {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/options`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.departments || [];
}

export async function getDepartmentFields(departmentId: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/settings/departments/${departmentId}/fields`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) {
    return {
      config: {
        departmentId,
        enablePriorityField: true,
        enableDueDateField: true,
        enableAttachmentsField: true,
        enableOfficerSelection: true,
      },
      customFields: [],
    };
  }
  return res.json();
}

export async function updateDepartmentConfig(departmentId: string, data: any) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/settings/departments/${departmentId}/config`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to update department form config');
  revalidatePath('/admin/internal-tickets');
  return res.json();
}

export async function createDepartmentCustomField(departmentId: string, data: any) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/settings/departments/${departmentId}/custom-fields`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create custom field');
  }
  revalidatePath('/admin/internal-tickets');
  return res.json();
}

export async function updateDepartmentCustomField(departmentId: string, fieldId: string, data: any) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/settings/departments/${departmentId}/custom-fields/${fieldId}`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to update custom field');
  revalidatePath('/admin/internal-tickets');
  return res.json();
}

export async function deleteDepartmentCustomField(departmentId: string, fieldId: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/settings/departments/${departmentId}/custom-fields/${fieldId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to delete custom field');
  revalidatePath('/admin/internal-tickets');
  return { success: true };
}

export async function getAllUsersRules() {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/settings/users-rules`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function updateUserTicketRules(userId: string, data: any) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/settings/users/${userId}/rules`, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to update user ticket rules');
  revalidatePath('/admin/internal-tickets');
  return res.json();
}
