'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Base URL for the API layer (since Next.js runs on 4000 usually, API is 3000)
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('cms_staff_session')?.value || '';
  return {
    'Content-Type': 'application/json',
    'Cookie': `cms_staff_session=${token}`
  };
}

export async function getTicketOptions() {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/options`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return { departments: [], categories: [], employees: [] };
  return res.json();
}

export async function createInternalTicket(data: {
  title: string;
  description: string;
  targetDepartmentId: string;
  categoryId: string;
  requestedEmployeeId?: string;
  priority?: string;
  dueAt?: string;
  attachments?: Array<{
    fileName: string;
    contentType: string;
    sizeBytes: number;
    contentBase64: string;
  }>;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/internal-tickets`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[createInternalTicket] API error:', res.status, body);
      return { success: false, error: `Failed to create ticket (${res.status}): ${body || 'Server error'}` };
    }
    revalidatePath('/internal-tickets', 'layout');
    const json = await res.json();
    return { success: true, data: json };
  } catch (err: any) {
    console.error('[createInternalTicket] Exception:', err);
    return { success: false, error: err?.message || 'Network error while creating ticket' };
  }
}

export async function getMyTickets() {
  const res = await fetch(`${API_BASE_URL}/internal-tickets`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getTeamWorkload() {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/team-workload`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getEmployeeTickets(employeeId: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/employee/${employeeId}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getDepartmentTickets(departmentId: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/department/${departmentId}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getTicketDetails(id: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${id}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export async function transferTicket(id: string, data: { targetDepartmentId: string; reason: string }) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${id}/transfer`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to transfer ticket');
  revalidatePath(`/internal-tickets/${id}`);
  return res.json();
}

export async function assignTicket(id: string, employeeId: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${id}/assign`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ employeeId }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to assign ticket');
  revalidatePath(`/internal-tickets/${id}`);
  return res.json();
}

export async function addTicketNote(id: string, content: string, attachments?: any[]) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${id}/notes`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ content, attachments }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to add note');
  revalidatePath(`/internal-tickets/${id}`);
  return res.json();
}

export async function approveRequestTicket(ticketId: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${ticketId}/approve-request`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to approve request');
  revalidatePath(`/internal-tickets/${ticketId}`);
  return res.json();
}

export async function acceptTicket(ticketId: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${ticketId}/accept`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to accept ticket');
  revalidatePath(`/internal-tickets/${ticketId}`);
  return res.json();
}

export async function waitTicket(ticketId: string, data: { waitingReasonId: string, customWaitingReason?: string }) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${ticketId}/wait`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to put ticket on wait');
  revalidatePath(`/internal-tickets/${ticketId}`);
  return res.json();
}

export async function approveTicket(ticketId: string, data: { rating?: number, feedback?: string }) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${ticketId}/approve`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to approve ticket');
  revalidatePath(`/internal-tickets/${ticketId}`);
  return res.json();
}

export async function rejectTicket(ticketId: string, data: { rejectReasonId: string, rejectDetails?: string }) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${ticketId}/reject`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to reject ticket');
  revalidatePath(`/internal-tickets/${ticketId}`);
  return res.json();
}

export async function resolveTicket(ticketId: string, data: { resolutionReasonId: string, resolutionDetails: string }) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${ticketId}/resolve`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to resolve ticket');
  revalidatePath(`/internal-tickets/${ticketId}`);
  return res.json();
}

export async function assignToTeamTicket(ticketId: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${ticketId}/assign-team`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to assign ticket to team');
  revalidatePath(`/internal-tickets/${ticketId}`);
  revalidatePath('/internal-tickets', 'layout');
  return res.json();
}

export async function deleteTicketAction(ticketId: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${ticketId}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to delete ticket');
  revalidatePath('/internal-tickets', 'layout');
  return true;
}

export async function resubmitTicket(ticketId: string, reason: string) {
  const res = await fetch(`${API_BASE_URL}/internal-tickets/${ticketId}/resubmit`, {
    method: 'POST',
    headers: { ...await getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to resubmit ticket');
  revalidatePath(`/internal-tickets/${ticketId}`);
  revalidatePath('/internal-tickets', 'layout');
  return res.json();
}
