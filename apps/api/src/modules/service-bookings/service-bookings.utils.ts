import type { DayRuleInput } from './dto/service-booking-rules.dto.js';
import type { AppointmentRecord } from './service-bookings.repository.js';
import type { ServiceAppointmentDto } from './dto/service-booking-response.dto.js';

export const DEFAULT_DAY_RULES: Omit<DayRuleInput, 'dayOfWeek'>[] = [
  // 0 = Sunday
  { isOpen: true, startTime: '08:00', endTime: '18:00', maxDailyAppointments: 24, maxPerHour: 3, maxPerSlot: 1, slotDurationMinutes: 15 },
  // 1 = Monday
  { isOpen: true, startTime: '08:00', endTime: '18:00', maxDailyAppointments: 24, maxPerHour: 3, maxPerSlot: 1, slotDurationMinutes: 15 },
  // 2 = Tuesday
  { isOpen: true, startTime: '08:00', endTime: '18:00', maxDailyAppointments: 24, maxPerHour: 3, maxPerSlot: 1, slotDurationMinutes: 15 },
  // 3 = Wednesday
  { isOpen: true, startTime: '08:00', endTime: '18:00', maxDailyAppointments: 24, maxPerHour: 3, maxPerSlot: 1, slotDurationMinutes: 15 },
  // 4 = Thursday
  { isOpen: true, startTime: '08:00', endTime: '18:00', maxDailyAppointments: 24, maxPerHour: 3, maxPerSlot: 1, slotDurationMinutes: 15 },
  // 5 = Friday (Weekend in region)
  { isOpen: false, startTime: '08:00', endTime: '14:00', maxDailyAppointments: 0, maxPerHour: 3, maxPerSlot: 1, slotDurationMinutes: 15 },
  // 6 = Saturday
  { isOpen: true, startTime: '09:00', endTime: '17:00', maxDailyAppointments: 18, maxPerHour: 3, maxPerSlot: 1, slotDurationMinutes: 15 },
];

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [h = 0, m = 0] = startTime.split(':').map(Number);
  const totalMinutes = (h ?? 0) * 60 + (m ?? 0) + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export function mapAppointment(record: AppointmentRecord): ServiceAppointmentDto {
  return {
    id: record.id,
    referenceNumber: record.referenceNumber,
    branchId: record.branchId,
    branchNameEn: record.branch?.nameEn,
    branchNameAr: record.branch?.nameAr,
    customerName: record.customerName,
    customerPhone: record.customerPhone,
    vin: record.vin,
    carModelId: record.carModelId,
    carModelName: record.carModelName,
    maintenanceTypeId: record.maintenanceTypeId,
    maintenanceTypeName: record.maintenanceTypeName,
    notes: record.notes,
    date: record.date.toISOString().slice(0, 10),
    startTime: record.startTime,
    endTime: record.endTime,
    durationMinutes: record.durationMinutes,
    status: record.status,
    createdById: record.createdById,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
