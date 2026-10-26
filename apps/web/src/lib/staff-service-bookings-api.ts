export type ServiceAppointmentStatus = 'BOOKED' | 'CONFIRMED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type ServiceAppointment = {
  id: string;
  referenceNumber: string;
  branchId: string;
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
  createdAt: string;
  updatedAt: string;
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

export type CarModel = {
  id: string;
  nameEn: string;
  nameAr: string;
  brand: string;
  isActive: boolean;
};

export type MaintenanceType = {
  id: string;
  nameEn: string;
  nameAr: string;
  estimatedDurationMinutes: number;
  isActive: boolean;
};

export type ServiceCenter = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
};

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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (typeof window === 'undefined') {
    try {
      const { headers: nextHeaders } = await import('next/headers');
      const cookie = (await nextHeaders()).get('cookie');
      if (cookie) headers.cookie = cookie;
    } catch {
      // client-side or static
    }
  }
  return headers;
}

export async function fetchServiceAppointments(params: {
  branchId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
}): Promise<ServiceAppointment[]> {
  const query = new URLSearchParams();
  if (params.branchId) query.set('branchId', params.branchId);
  if (params.fromDate) query.set('fromDate', params.fromDate);
  if (params.toDate) query.set('toDate', params.toDate);
  if (params.status) query.set('status', params.status);

  const url = `${API_BASE}/service-bookings?${query.toString()}`;
  const res = await fetch(url, { headers: await getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.appointments ?? [];
}

export async function fetchSlotAvailability(branchId: string, date: string): Promise<DayAvailability | null> {
  const url = `${API_BASE}/service-bookings/availability?branchId=${encodeURIComponent(branchId)}&date=${encodeURIComponent(date)}`;
  const res = await fetch(url, { headers: await getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchCarModels(activeOnly = true): Promise<CarModel[]> {
  const url = `${API_BASE}/service-bookings/master-data/car-models?activeOnly=${activeOnly}`;
  const res = await fetch(url, { headers: await getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.carModels ?? [];
}

export async function fetchMaintenanceTypes(activeOnly = true): Promise<MaintenanceType[]> {
  const url = `${API_BASE}/service-bookings/master-data/maintenance-types?activeOnly=${activeOnly}`;
  const res = await fetch(url, { headers: await getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.maintenanceTypes ?? [];
}

export async function fetchBranchRules(branchId: string): Promise<DayRule[]> {
  const url = `${API_BASE}/service-bookings/rules/${encodeURIComponent(branchId)}`;
  const res = await fetch(url, { headers: await getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json();
  return json.rules ?? [];
}

export async function saveBranchRules(branchId: string, rules: DayRule[]): Promise<{ ok: boolean; message?: string }> {
  const url = `${API_BASE}/service-bookings/rules/${encodeURIComponent(branchId)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ rules }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: err.message || 'Failed to save rules' };
  }
  return { ok: true };
}

export async function saveCarModel(data: { id?: string | undefined; nameEn: string; nameAr: string; brand?: string | undefined; isActive?: boolean | undefined }): Promise<{ ok: boolean; message?: string }> {
  const url = `${API_BASE}/service-bookings/master-data/car-models`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: err.message || 'Failed to save car model' };
  }
  return { ok: true };
}

export async function saveMaintenanceType(data: { id?: string | undefined; nameEn: string; nameAr: string; estimatedDurationMinutes?: number | undefined; isActive?: boolean | undefined }): Promise<{ ok: boolean; message?: string }> {
  const url = `${API_BASE}/service-bookings/master-data/maintenance-types`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: err.message || 'Failed to save maintenance type' };
  }
  return { ok: true };
}

export async function createAppointmentApi(data: CreateAppointmentInput): Promise<{ ok: boolean; appointment?: ServiceAppointment; message?: string }> {
  const url = `${API_BASE}/service-bookings`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: json.message || 'Failed to create appointment' };
  }
  return { ok: true, appointment: json };
}

export async function updateAppointmentApi(id: string, data: UpdateAppointmentInput): Promise<{ ok: boolean; appointment?: ServiceAppointment; message?: string }> {
  const url = `${API_BASE}/service-bookings/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: json.message || 'Failed to update appointment' };
  }
  return { ok: true, appointment: json };
}

export async function fetchServiceCenters(activeOnly = true): Promise<ServiceCenter[]> {
  const url = `${API_BASE}/service-bookings/centers?all=${!activeOnly}`;
  const res = await fetch(url, { headers: await getAuthHeaders(), cache: 'no-store' });
  if (!res.ok) return [];
  const json = await res.json().catch(() => []);
  return Array.isArray(json) ? json : (json.centers ?? []);
}

export async function saveServiceCenter(data: {
  id?: string | undefined;
  code?: string | undefined;
  nameEn: string;
  nameAr: string;
  address?: string | null | undefined;
  phone?: string | null | undefined;
  isActive?: boolean | undefined;
}): Promise<{ ok: boolean; message?: string }> {
  const url = `${API_BASE}/service-bookings/centers`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: err.message || 'Failed to save service center' };
  }
  return { ok: true };
}

export async function deleteServiceCenter(id: string): Promise<{ ok: boolean; message?: string }> {
  const url = `${API_BASE}/service-bookings/centers/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: err.message || 'Failed to delete service center' };
  }
  return { ok: true };
}

export async function initWeekRulesApi(centerId: string): Promise<{ ok: boolean; message?: string }> {
  const url = `${API_BASE}/service-bookings/rules/${encodeURIComponent(centerId)}/init-week`;
  const res = await fetch(url, {
    method: 'POST',
    headers: await getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, message: err.message || 'Failed to initialize week rules' };
  }
  return { ok: true };
}

