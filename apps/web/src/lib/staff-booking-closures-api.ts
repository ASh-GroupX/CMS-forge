export type BookingClosure = {
  id: string;
  serviceCenterId: string;
  startDate: string;
  endDate: string;
  reason: string;
};

const base = () => process.env.NEXT_PUBLIC_API_URL || '/api';
const url = (centerId: string) => `${base()}/service-bookings/centers/${encodeURIComponent(centerId)}/closures`;

function csrfHeaders(): HeadersInit {
  const token = document.cookie.split(';').map((part) => part.trim())
    .find((part) => part.startsWith('cms_csrf_token='))?.slice('cms_csrf_token='.length);
  return { 'Content-Type': 'application/json', ...(token ? { 'x-csrf-token': token } : {}) };
}

export async function listBookingClosures(centerId: string): Promise<BookingClosure[]> {
  const response = await fetch(url(centerId), { credentials: 'include', cache: 'no-store' });
  if (!response.ok) throw new Error('LOAD_FAILED');
  return response.json();
}

export async function createBookingClosure(centerId: string, input: { startDate: string; endDate: string; reason: string }): Promise<BookingClosure> {
  const response = await fetch(url(centerId), { method: 'POST', credentials: 'include', headers: csrfHeaders(), body: JSON.stringify(input) });
  if (!response.ok) throw new Error(response.status === 409 ? 'CONFLICT' : 'SAVE_FAILED');
  return response.json();
}

export async function deleteBookingClosure(centerId: string, id: string): Promise<void> {
  const response = await fetch(`${url(centerId)}/${encodeURIComponent(id)}`, {
    method: 'DELETE', credentials: 'include', headers: csrfHeaders(),
  });
  if (!response.ok) throw new Error('DELETE_FAILED');
}
