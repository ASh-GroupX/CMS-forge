export type ServiceBookingLane = {
  id: string;
  serviceCenterId: string;
  code: string;
  nameEn: string;
  nameAr: string;
  maxDailyAppointments: number;
  maxPerHour: number;
  maxPerSlot: number;
  position: number;
  isActive: boolean;
  updatedAt: string;
};

function apiBase() {
  return typeof window === 'undefined'
    ? process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    : process.env.NEXT_PUBLIC_API_URL || '/api';
}

export async function fetchServiceBookingLanes(serviceCenterId: string, includeInactive = false, cookieHeader?: string): Promise<ServiceBookingLane[]> {
  const query = includeInactive ? '?all=true' : '';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (cookieHeader) headers.cookie = cookieHeader;
  const res = await fetch(`${apiBase()}/service-bookings/centers/${encodeURIComponent(serviceCenterId)}/lanes${query}`, {
    headers, cache: 'no-store', credentials: 'include',
  });
  if (!res.ok) throw new Error('Could not load booking lanes');
  const json: unknown = await res.json();
  return Array.isArray(json) ? json as ServiceBookingLane[] : [];
}
