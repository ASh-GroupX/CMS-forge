export class UpdateServiceAppointmentDto {
  status?: string;
  date?: string;
  startTime?: string;
  notes?: string;
  branchId?: string;
  customerName?: string;
  customerPhone?: string;
  vin?: string | null;
  carModelId?: string;
  maintenanceTypeId?: string;
}

const VALID_STATUSES = ['BOOKED', 'CONFIRMED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

export function parseUpdateServiceAppointmentBody(input: unknown): UpdateServiceAppointmentDto {
  if (!input || typeof input !== 'object') {
    throw new Error('Update payload must be an object');
  }
  const body = input as Record<string, unknown>;
  const result: UpdateServiceAppointmentDto = {};

  if (body.status !== undefined) {
    const s = String(body.status).toUpperCase();
    if (!VALID_STATUSES.includes(s as any)) {
      throw new Error(`Invalid appointment status: ${body.status}`);
    }
    result.status = s;
  }
  if (body.date !== undefined) {
    const d = String(body.date).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error('Invalid date format');
    result.date = d;
  }
  if (body.startTime !== undefined) {
    const st = String(body.startTime).trim();
    if (!/^\d{2}:\d{2}$/.test(st)) throw new Error('Invalid start time format');
    result.startTime = st;
  }
  if (body.notes !== undefined) {
    result.notes = String(body.notes).trim();
  }
  if (body.branchId !== undefined) {
    result.branchId = String(body.branchId).trim();
  }
  if (body.customerName !== undefined) {
    result.customerName = String(body.customerName).trim();
  }
  if (body.customerPhone !== undefined) {
    result.customerPhone = String(body.customerPhone).trim();
  }
  if (body.vin !== undefined) {
    result.vin = body.vin ? String(body.vin).trim() : null;
  }
  if (body.carModelId !== undefined) {
    result.carModelId = String(body.carModelId).trim();
  }
  if (body.maintenanceTypeId !== undefined) {
    result.maintenanceTypeId = String(body.maintenanceTypeId).trim();
  }

  return result;
}
