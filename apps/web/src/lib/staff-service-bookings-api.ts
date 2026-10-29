export type ServiceAppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type ServiceAppointmentHistoryItem = {
  id: string;
  action: string;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: string;
  metadata?: {
    oldDate?: string;
    newDate?: string;
    oldStartTime?: string;
    newStartTime?: string;
    oldStatus?: string;
    newStatus?: string;
    [key: string]: unknown;
  };
};

export type ServiceAppointment = {
  id: string;
  referenceNumber: string;
  branchId: string;
  serviceCenterId?: string;
  branchNameEn?: string;
  branchNameAr?: string;
  customerName: string;
  customerPhone: string;
  vin?: string | null;
  carModelId: string;
  carModelName: string;
  maintenanceTypeId: string;
  maintenanceTypeName: string;
  notes: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: ServiceAppointmentStatus;
  createdById?: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdAt: string;
  updatedAt: string;
  history?: ServiceAppointmentHistoryItem[];
};

export type SlotAvailability = {
  slot: string;
  hour: string;
  bookedCount: number;
  hourBookedCount: number;
  maxPerSlot: number;
  maxPerHour: number;
  status: 'AVAILABLE' | 'PARTIAL' | 'FULL';
  remainingInHour: number;
  remainingInSlot: number;
};

export type DayAvailability = {
  date: string;
  dayOfWeek: number;
  branchId: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  maxDailyAppointments: number;
  bookedDailyCount: number;
  slots: SlotAvailability[];
};

export type CarModel = { id: string; nameEn: string; nameAr: string; brand: string; isActive: boolean };

export type MaintenanceType = { id: string; nameEn: string; nameAr: string; estimatedDurationMinutes: number; isActive: boolean };

export type ServiceCenter = { id: string; code: string; nameEn: string; nameAr: string; address?: string | null; phone?: string | null; isActive: boolean };

export type DayRule = {
  id?: string;
  branchId: string;
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
  maxDailyAppointments: number;
  maxPerHour: number;
  maxPerSlot: number;
  slotDurationMinutes: number;
};

export type UserBookingRule = {
  userId: string;
  canViewBookings: boolean;
  canCreateBookings: boolean;
  canRescheduleBookings: boolean;
  canChangeStatus: boolean;
  canCancelBookings: boolean;
  canManageSettings: boolean;
};

export type CreateAppointmentInput = {
  branchId: string;
  customerName: string;
  customerPhone: string;
  vin?: string | null;
  carModelId: string;
  maintenanceTypeId: string;
  date: string;
  startTime: string;
  durationMinutes?: number;
  notes: string;
};

export type UpdateAppointmentInput = Partial<CreateAppointmentInput> & {
  status?: ServiceAppointmentStatus;
};

function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }
  return process.env.NEXT_PUBLIC_API_URL || '/api';
}

async function getAuthHeaders(customCookie?: string): Promise<HeadersInit> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  let cookieHeader = customCookie || '';
  if (!cookieHeader && typeof window === 'undefined') {
    try {
      const { headers: nextHeaders, cookies: nextCookies } = await import('next/headers');
      const h = await nextHeaders().catch(() => null);
      cookieHeader = h?.get('cookie') ?? '';
      if (!cookieHeader) {
        const c = await nextCookies().catch(() => null);
        if (c) cookieHeader = c.toString();
      }
    } catch {}
  }
  if (cookieHeader) {
    headers.cookie = cookieHeader;
    const csrf = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith('cms_csrf_token='))?.slice('cms_csrf_token='.length);
    if (csrf) headers['x-csrf-token'] = csrf;
  }
  return headers;
}

export async function fetchServiceAppointments(params: {
  branchId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
}, cookieHeader?: string): Promise<ServiceAppointment[]> {
  const query = new URLSearchParams();
  if (params.branchId) query.set('branchId', params.branchId);
  if (params.fromDate) query.set('fromDate', params.fromDate);
  if (params.toDate) query.set('toDate', params.toDate);
  if (params.status) query.set('status', params.status);

  const url = `${getApiBaseUrl()}/service-bookings/appointments?${query.toString()}`;
  const res = await fetch(url, { headers: await getAuthHeaders(cookieHeader), cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json().catch(() => []);
  return Array.isArray(json) ? json : (json.appointments ?? []);
}

export async function fetchSlotAvailability(branchId: string, date: string, cookieHeader?: string): Promise<DayAvailability | null> {
  const url = `${getApiBaseUrl()}/service-bookings/slots-availability?branchId=${encodeURIComponent(branchId)}&date=${encodeURIComponent(date)}`;
  const res = await fetch(url, { headers: await getAuthHeaders(cookieHeader), cache: 'no-store' });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

export async function fetchCarModels(activeOnly = true, cookieHeader?: string): Promise<CarModel[]> {
  const base = `${getApiBaseUrl()}/service-bookings`;
  const headers = await getAuthHeaders(cookieHeader);
  let res = await fetch(`${base}/car-models?all=${!activeOnly}`, { headers, cache: 'no-store' }).catch(() => null);
  if (!res || !res.ok) {
    res = await fetch(`${base}/master-data/car-models?all=${!activeOnly}`, { headers, cache: 'no-store' }).catch(() => null);
  }
  if (!res || !res.ok) return [];
  const json = await res.json().catch(() => []);
  return Array.isArray(json) ? json : (json.carModels ?? json.items ?? []);
}

export async function fetchMaintenanceTypes(activeOnly = true, cookieHeader?: string): Promise<MaintenanceType[]> {
  const base = `${getApiBaseUrl()}/service-bookings`;
  const headers = await getAuthHeaders(cookieHeader);
  let res = await fetch(`${base}/maintenance-types?all=${!activeOnly}`, { headers, cache: 'no-store' }).catch(() => null);
  if (!res || !res.ok) {
    res = await fetch(`${base}/master-data/maintenance-types?all=${!activeOnly}`, { headers, cache: 'no-store' }).catch(() => null);
  }
  if (!res || !res.ok) return [];
  const json = await res.json().catch(() => []);
  return Array.isArray(json) ? json : (json.maintenanceTypes ?? json.items ?? []);
}

export async function fetchBranchRules(branchId: string, cookieHeader?: string): Promise<DayRule[]> {
  const url = `${getApiBaseUrl()}/service-bookings/rules/${encodeURIComponent(branchId)}`;
  const res = await fetch(url, { headers: await getAuthHeaders(cookieHeader), cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json().catch(() => []);
  return Array.isArray(json) ? json : (json.rules ?? json.items ?? []);
}

export async function saveBranchRules(branchId: string, rules: DayRule[]): Promise<{ ok: boolean; message?: string }> {
  const url = `${getApiBaseUrl()}/service-bookings/rules/${encodeURIComponent(branchId)}`;
  const res = await fetch(url, { method: 'PUT', headers: await getAuthHeaders(), body: JSON.stringify({ rules }) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: err.message || 'Failed to save rules' };
  }
  return { ok: true };
}

export async function saveCarModel(data: { id?: string | undefined; nameEn: string; nameAr: string; brand?: string | undefined; isActive?: boolean | undefined }): Promise<{ ok: boolean; message?: string }> {
  const url = `${getApiBaseUrl()}/service-bookings/car-models`;
  const res = await fetch(url, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: err.message || 'Failed to save car model' };
  }
  return { ok: true };
}

export async function saveMaintenanceType(data: { id?: string | undefined; nameEn: string; nameAr: string; estimatedDurationMinutes?: number | undefined; isActive?: boolean | undefined }): Promise<{ ok: boolean; message?: string }> {
  const url = `${getApiBaseUrl()}/service-bookings/maintenance-types`;
  const res = await fetch(url, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(data) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: err.message || 'Failed to save maintenance type' };
  }
  return { ok: true };
}

export async function createAppointmentApi(data: CreateAppointmentInput): Promise<{ ok: boolean; appointment?: ServiceAppointment; message?: string }> {
  const url = `${getApiBaseUrl()}/service-bookings/appointments`;
  const res = await fetch(url, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(data) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: json.message || 'Failed to create appointment' };
  return { ok: true, appointment: json };
}

export async function updateAppointmentApi(id: string, data: UpdateAppointmentInput): Promise<{ ok: boolean; appointment?: ServiceAppointment; message?: string }> {
  const url = `${getApiBaseUrl()}/service-bookings/appointments/${encodeURIComponent(id)}`;
  const res = await fetch(url, { method: 'PATCH', headers: await getAuthHeaders(), body: JSON.stringify(data) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, message: json.message || 'Failed to update appointment' };
  return { ok: true, appointment: json };
}

export async function fetchServiceCenters(activeOnly = true, cookieHeader?: string): Promise<ServiceCenter[]> {
  const url = `${getApiBaseUrl()}/service-bookings/centers?all=${!activeOnly}`;
  const res = await fetch(url, { headers: await getAuthHeaders(cookieHeader), cache: 'no-store' });
  if (!res.ok) {
    console.error(`[fetchServiceCenters] failed with status ${res.status}: ${res.statusText}`);
    return [];
  }
  const json = await res.json().catch(() => []);
  return Array.isArray(json) ? json : (json.centers ?? []);
}

export async function saveServiceCenter(data: { id?: string; code?: string; nameEn: string; nameAr: string; address?: string | null; phone?: string | null; isActive?: boolean }): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${getApiBaseUrl()}/service-bookings/centers`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(data) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); return { ok: false, message: err.message || 'Failed to save service center' }; }
  return { ok: true };
}

export async function deleteServiceCenter(id: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${getApiBaseUrl()}/service-bookings/centers/${encodeURIComponent(id)}`, { method: 'DELETE', headers: await getAuthHeaders() });
  if (!res.ok) { const err = await res.json().catch(() => ({})); return { ok: false, message: err.message || 'Failed to delete service center' }; }
  return { ok: true };
}

export async function initWeekRulesApi(centerId: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${getApiBaseUrl()}/service-bookings/rules/${encodeURIComponent(centerId)}/init-week`, { method: 'POST', headers: await getAuthHeaders() });
  if (!res.ok) { const err = await res.json().catch(() => ({})); return { ok: false, message: err.message || 'Failed to initialize week rules' }; }
  return { ok: true };
}

export async function fetchMyBookingRules(cookieHeader?: string): Promise<UserBookingRule> {
  const res = await fetch(`${getApiBaseUrl()}/service-bookings/my-rules`, { headers: await getAuthHeaders(cookieHeader), cache: 'no-store' });
  if (!res.ok) return { userId: '', canViewBookings: true, canCreateBookings: true, canRescheduleBookings: true, canChangeStatus: true, canCancelBookings: true, canManageSettings: false };
  return res.json();
}

