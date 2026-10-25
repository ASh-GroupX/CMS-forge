import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ServiceAppointmentStatus } from '@prisma/client';
import { ServiceBookingsRepository } from './service-bookings.repository.js';
import type { CreateServiceAppointmentDto } from './dto/create-service-appointment.dto.js';
import type { UpdateServiceAppointmentDto } from './dto/update-service-appointment.dto.js';
import type { DayRuleInput } from './dto/service-booking-rules.dto.js';
import type {
  DayAvailabilityDto,
  ServiceAppointmentDto,
  SlotAvailabilityDto,
} from './dto/service-booking-response.dto.js';
import {
  DEFAULT_DAY_RULES,
  calculateEndTime,
  mapAppointment,
} from './service-bookings.utils.js';

export { DEFAULT_DAY_RULES };

@Injectable()
export class ServiceBookingsService {
  constructor(private readonly repository: ServiceBookingsRepository) {}

  // ── Appointments ──────────────────────────────────────────────────────────
  async listAppointments(params: {
    branchId?: string | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
    status?: string | undefined;
  }): Promise<ServiceAppointmentDto[]> {
    const fromDate = params.fromDate ? new Date(`${params.fromDate}T00:00:00Z`) : undefined;
    const toDate = params.toDate ? new Date(`${params.toDate}T23:59:59Z`) : undefined;
    const records = await this.repository.findAppointments({
      branchId: params.branchId,
      fromDate,
      toDate,
      status: params.status as ServiceAppointmentStatus | undefined,
    });
    return records.map((r) => mapAppointment(r));
  }

  async getAppointment(id: string): Promise<ServiceAppointmentDto> {
    const record = await this.repository.findAppointmentById(id);
    if (!record) throw new NotFoundException('Appointment not found');
    return mapAppointment(record);
  }

  async createAppointment(dto: CreateServiceAppointmentDto, actorId?: string | null): Promise<ServiceAppointmentDto> {
    const dateObj = new Date(`${dto.date}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();
    const rule = await this.resolveRule(dto.branchId, dayOfWeek);

    if (!rule.isOpen) {
      throw new BadRequestException('The selected branch is closed on this day');
    }

    // Daily limit
    const dailyCount = await this.repository.countDailyActive(dto.branchId, dateObj);
    if (dailyCount >= rule.maxDailyAppointments) {
      throw new BadRequestException(`Branch daily appointment limit (${rule.maxDailyAppointments}) reached`);
    }

    // Slot limit
    const slotCount = await this.repository.countInSlot(dto.branchId, dateObj, dto.startTime);
    if (slotCount >= rule.maxPerSlot) {
      throw new BadRequestException('This 15-minute slot is already booked to capacity');
    }

    // Hourly limit (e.g. at most 3 per hour)
    const hourPrefix = dto.startTime.split(':')[0] + ':';
    const hourCount = await this.repository.countInHourWindow(dto.branchId, dateObj, hourPrefix);
    if (hourCount >= rule.maxPerHour) {
      throw new BadRequestException(`Maximum appointments per hour limit (${rule.maxPerHour}) reached for this hour`);
    }

    // Resolve models
    const carModel = await this.repository.findCarModelById(dto.carModelId);
    const maintenanceType = await this.repository.findMaintenanceTypeById(dto.maintenanceTypeId);

    const duration = dto.durationMinutes || maintenanceType?.estimatedDurationMinutes || 30;
    const endTime = calculateEndTime(dto.startTime, duration);
    const referenceNumber = await this.repository.generateReferenceNumber(dateObj);

    const created = await this.repository.createAppointment({
      referenceNumber,
      branchId: dto.branchId,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      vin: dto.vin || null,
      carModelId: dto.carModelId,
      carModelName: carModel ? `${carModel.brand} ${carModel.nameEn}` : 'Vehicle',
      maintenanceTypeId: dto.maintenanceTypeId,
      maintenanceTypeName: maintenanceType ? maintenanceType.nameEn : 'General Service',
      notes: dto.notes,
      date: dateObj,
      startTime: dto.startTime,
      endTime,
      durationMinutes: duration,
      createdById: actorId ?? null,
    });

    return mapAppointment(created);
  }

  async updateAppointment(id: string, dto: UpdateServiceAppointmentDto): Promise<ServiceAppointmentDto> {
    const existing = await this.repository.findAppointmentById(id);
    if (!existing) throw new NotFoundException('Appointment not found');

    const updateData: any = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.customerName) updateData.customerName = dto.customerName;
    if (dto.customerPhone) updateData.customerPhone = dto.customerPhone;
    if (dto.vin !== undefined) updateData.vin = dto.vin;

    // Time/date reschedule validation
    if ((dto.date && dto.date !== existing.date.toISOString().slice(0, 10)) || (dto.startTime && dto.startTime !== existing.startTime)) {
      const targetDateStr = dto.date || existing.date.toISOString().slice(0, 10);
      const targetDate = new Date(`${targetDateStr}T00:00:00Z`);
      const targetTime = dto.startTime || existing.startTime;
      const targetBranch = dto.branchId || existing.branchId;

      const rule = await this.resolveRule(targetBranch, targetDate.getUTCDay());
      if (!rule.isOpen) throw new BadRequestException('Branch is closed on target day');

      const hourPrefix = targetTime.split(':')[0] + ':';
      const [slotCount, hourCount] = await Promise.all([
        this.repository.countInSlot(targetBranch, targetDate, targetTime, id),
        this.repository.countInHourWindow(targetBranch, targetDate, hourPrefix, id),
      ]);

      if (slotCount >= rule.maxPerSlot) throw new BadRequestException('Target slot is already full');
      if (hourCount >= rule.maxPerHour) throw new BadRequestException(`Target hour exceeds maximum of ${rule.maxPerHour} appointments`);

      updateData.date = targetDate;
      updateData.startTime = targetTime;
      updateData.endTime = calculateEndTime(targetTime, existing.durationMinutes);
    }

    const updated = await this.repository.updateAppointment(id, updateData);
    return mapAppointment(updated);
  }

  // ── Availability Engine ───────────────────────────────────────────────────
  async getSlotAvailability(branchId: string, dateStr: string): Promise<DayAvailabilityDto> {
    const dateObj = new Date(`${dateStr}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();
    const rule = await this.resolveRule(branchId, dayOfWeek);

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

    const appointments = await this.repository.findAppointmentsForDate(branchId, dateObj);
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

  // ── Rules Management ──────────────────────────────────────────────────────
  async getBranchRules(branchId: string) {
    const existing = await this.repository.findRulesByBranch(branchId);
    if (existing.length === 7) return existing;

    // Seed defaults for missing days
    const result = [];
    for (let day = 0; day < 7; day++) {
      const found = existing.find((r) => r.dayOfWeek === day);
      if (found) {
        result.push(found);
      } else {
        const def = DEFAULT_DAY_RULES[day]!;
        const created = await this.repository.upsertRule({
          branchId,
          dayOfWeek: day,
          isOpen: def.isOpen,
          startTime: def.startTime,
          endTime: def.endTime,
          maxDailyAppointments: def.maxDailyAppointments,
          maxPerHour: def.maxPerHour,
          maxPerSlot: def.maxPerSlot,
          slotDurationMinutes: def.slotDurationMinutes ?? 15,
        });
        result.push(created);
      }
    }
    return result;
  }

  async updateBranchRules(branchId: string, rules: DayRuleInput[]) {
    const updated = [];
    for (const r of rules) {
      const res = await this.repository.upsertRule({
        branchId,
        dayOfWeek: r.dayOfWeek,
        isOpen: r.isOpen,
        startTime: r.startTime,
        endTime: r.endTime,
        maxDailyAppointments: r.maxDailyAppointments,
        maxPerHour: r.maxPerHour,
        maxPerSlot: r.maxPerSlot,
        slotDurationMinutes: r.slotDurationMinutes || 15,
      });
      updated.push(res);
    }
    return updated;
  }

  // ── Master Data ───────────────────────────────────────────────────────────
  async getCarModels(activeOnly = true) {
    return this.repository.listCarModels(activeOnly);
  }

  async upsertCarModel(data: { id?: string | undefined; nameEn: string; nameAr: string; brand?: string | undefined; isActive?: boolean | undefined }) {
    return this.repository.upsertCarModel(data);
  }

  async getMaintenanceTypes(activeOnly = true) {
    return this.repository.listMaintenanceTypes(activeOnly);
  }

  async upsertMaintenanceType(data: { id?: string | undefined; nameEn: string; nameAr: string; estimatedDurationMinutes?: number | undefined; isActive?: boolean | undefined }) {
    return this.repository.upsertMaintenanceType(data);
  }

  // ── Private Helpers ───────────────────────────────────────────────────────
  private async resolveRule(branchId: string, dayOfWeek: number) {
    const rule = await this.repository.findRuleForDay(branchId, dayOfWeek);
    if (rule) return rule;
    const def = DEFAULT_DAY_RULES[dayOfWeek] || DEFAULT_DAY_RULES[0]!;
    return { ...def, id: 'default', branchId, dayOfWeek };
  }
}
