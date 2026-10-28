import type { DayRuleInput } from './dto/service-booking-rules.dto.js';
import type { AppointmentRecord } from './service-bookings.types.js';
import type {
  DayAvailabilityDto,
  ServiceAppointmentDto,
  SlotAvailabilityDto,
} from './dto/service-booking-response.dto.js';

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

export function mapAppointment(record: AppointmentRecord, historyRecords: any[] = []): ServiceAppointmentDto {
  const centerNameEn = record.serviceCenter?.nameEn || record.branch?.nameEn;
  const centerNameAr = record.serviceCenter?.nameAr || record.branch?.nameAr;
  const effectiveId = record.serviceCenterId || record.branchId || '';
  return {
    id: record.id,
    referenceNumber: record.referenceNumber,
    branchId: effectiveId,
    branchNameEn: centerNameEn,
    branchNameAr: centerNameAr,
    serviceCenterId: effectiveId,
    serviceCenterNameEn: centerNameEn,
    serviceCenterNameAr: centerNameAr,
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
    createdByName: (record as any).createdBy ? ((record as any).createdBy.nameEn || (record as any).createdBy.nameAr) : null,
    createdByEmail: (record as any).createdBy?.email || null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    history: historyRecords.map((h) => ({
      id: h.id,
      action: h.action,
      actorName: h.actor ? (h.actor.nameEn || h.actor.nameAr) : (h.actorName || null),
      actorEmail: h.actor?.email || h.actorEmail || null,
      createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : String(h.createdAt),
      metadata: h.metadata,
    })),
  };
}

export function buildDayAvailability(params: {
  branchId: string;
  dateStr: string;
  dayOfWeek: number;
  rule: {
    isOpen: boolean;
    startTime: string;
    endTime: string;
    maxDailyAppointments: number;
    maxPerHour: number;
    maxPerSlot: number;
    slotDurationMinutes?: number;
  };
  appointments: AppointmentRecord[];
}): DayAvailabilityDto {
  const { branchId, dateStr, dayOfWeek, rule, appointments } = params;

  if (!rule.isOpen) {
    return {
      date: dateStr,
      dayOfWeek,
      branchId,
      isOpen: false,
      startTime: rule.startTime,
      endTime: rule.endTime,
      maxDailyAppointments: rule.maxDailyAppointments,
      bookedDailyCount: 0,
      slots: [],
    };
  }

  const slotCounts = new Map<string, number>();
  const hourCounts = new Map<string, number>();
  for (const app of appointments) {
    slotCounts.set(app.startTime, (slotCounts.get(app.startTime) || 0) + 1);
    const hr = app.startTime.split(':')[0] + ':00';
    hourCounts.set(hr, (hourCounts.get(hr) || 0) + 1);
  }

  const slots: SlotAvailabilityDto[] = [];
  const [startHour = 8, startMin = 0] = rule.startTime.split(':').map(Number);
  const [endHour = 18, endMin = 0] = rule.endTime.split(':').map(Number);
  const startMinutes = (startHour ?? 8) * 60 + (startMin ?? 0);
  const endMinutes = (endHour ?? 18) * 60 + (endMin ?? 0);
  const step = rule.slotDurationMinutes || 15;

  for (let m = startMinutes; m < endMinutes; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const slot = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    const hourKey = `${String(h).padStart(2, '0')}:00`;

    const bookedCount = slotCounts.get(slot) || 0;
    const hourBookedCount = hourCounts.get(hourKey) || 0;
    const remainingInHour = Math.max(0, rule.maxPerHour - hourBookedCount);
    const remainingInSlot = Math.max(0, rule.maxPerSlot - bookedCount);

    let status: 'AVAILABLE' | 'PARTIAL' | 'FULL' = 'AVAILABLE';
    if (appointments.length >= rule.maxDailyAppointments || remainingInHour <= 0 || remainingInSlot <= 0) {
      status = 'FULL';
    } else if (hourBookedCount > 0 || bookedCount > 0) {
      status = 'PARTIAL';
    }

    slots.push({
      slot,
      hour: hourKey,
      bookedCount,
      hourBookedCount,
      maxPerSlot: rule.maxPerSlot,
      maxPerHour: rule.maxPerHour,
      status,
      remainingInHour,
      remainingInSlot,
    });
  }

  return {
    date: dateStr,
    dayOfWeek,
    branchId,
    isOpen: true,
    startTime: rule.startTime,
    endTime: rule.endTime,
    maxDailyAppointments: rule.maxDailyAppointments,
    bookedDailyCount: appointments.length,
    slots,
  };
}
