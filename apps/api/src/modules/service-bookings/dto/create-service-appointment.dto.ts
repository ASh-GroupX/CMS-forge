export class CreateServiceAppointmentDto {
  customerName!: string;
  customerPhone!: string;
  vin?: string | null;
  carModelId!: string;
  maintenanceTypeId!: string;
  branchId!: string;
  date!: string; // YYYY-MM-DD
  startTime!: string; // HH:mm (e.g. "09:15")
  notes!: string;
  durationMinutes?: number;
}

export function parseCreateServiceAppointmentBody(input: unknown): CreateServiceAppointmentDto {
  if (!input || typeof input !== 'object') {
    throw new Error('Appointment payload must be an object');
  }
  const body = input as Record<string, unknown>;

  const customerName = String(body.customerName ?? '').trim();
  if (!customerName) throw new Error('Customer name is required');

  const customerPhone = String(body.customerPhone ?? '').trim();
  if (!customerPhone) throw new Error('Customer phone number is required');

  const branchId = String(body.branchId ?? '').trim() || 'center_main';
  const carModelId = String(body.carModelId ?? '').trim() || 'car_tiggo8_pro';
  const maintenanceTypeId = String(body.maintenanceTypeId ?? '').trim() || 'maint_periodic_10k';

  const date = String(body.date ?? '').trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Valid appointment date (YYYY-MM-DD) is required');
  }

  const startTime = String(body.startTime ?? '').trim();
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
    throw new Error('Valid start time (HH:mm) is required');
  }

  const notes = String(body.notes ?? '').trim() || 'Service appointment';

  const vin = body.vin ? String(body.vin).trim() : null;
  const durationMinutes = Number(body.durationMinutes) > 0 ? Number(body.durationMinutes) : 30;

  return {
    customerName,
    customerPhone,
    vin,
    carModelId,
    maintenanceTypeId,
    branchId,
    date,
    startTime,
    notes,
    durationMinutes,
  };
}
