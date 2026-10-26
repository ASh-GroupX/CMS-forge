import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, ServiceAppointmentStatus } from '@prisma/client';
import { ServiceBookingsRepository } from './service-bookings.repository.js';
import type { CreateServiceAppointmentDto } from './dto/create-service-appointment.dto.js';
import type { UpdateServiceAppointmentDto } from './dto/update-service-appointment.dto.js';
import type { DayRuleInput } from './dto/service-booking-rules.dto.js';
import type {
  DayAvailabilityDto,
  ServiceAppointmentDto,
} from './dto/service-booking-response.dto.js';
import {
  DEFAULT_DAY_RULES,
  buildDayAvailability,
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
    const centerId = dto.branchId || 'center_main';
    const dateObj = new Date(`${dto.date}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();
    const rule = await this.resolveRule(centerId, dayOfWeek);

    if (!rule.isOpen) {
      throw new BadRequestException('The selected branch is closed on this day');
    }

    const dailyCount = await this.repository.countDailyActive(centerId, dateObj);
    if (dailyCount >= rule.maxDailyAppointments) {
      throw new BadRequestException(`Service center daily appointment limit (${rule.maxDailyAppointments}) reached`);
    }

    const slotCount = await this.repository.countInSlot(centerId, dateObj, dto.startTime);
    if (slotCount >= rule.maxPerSlot) {
      throw new BadRequestException('This 15-minute slot is already booked to capacity');
    }

    const hourPrefix = dto.startTime.split(':')[0] + ':';
    const hourCount = await this.repository.countInHourWindow(centerId, dateObj, hourPrefix);
    if (hourCount >= rule.maxPerHour) {
      throw new BadRequestException(`Maximum appointments per hour limit (${rule.maxPerHour}) reached for this hour`);
    }

    const carModel = await this.repository.findCarModelById(dto.carModelId);
    const maintenanceType = await this.repository.findMaintenanceTypeById(dto.maintenanceTypeId);
    const duration = dto.durationMinutes || maintenanceType?.estimatedDurationMinutes || 30;
    const endTime = calculateEndTime(dto.startTime, duration);
    const referenceNumber = await this.repository.generateReferenceNumber(dateObj);

    const created = await this.repository.createAppointment({
      referenceNumber,
      serviceCenterId: centerId,
      branchId: centerId,
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
      status: 'BOOKED',
      createdById: actorId || null,
    });

    return mapAppointment(created);
  }

  async updateAppointment(id: string, dto: UpdateServiceAppointmentDto): Promise<ServiceAppointmentDto> {
    const existing = await this.repository.findAppointmentById(id);
    if (!existing) throw new NotFoundException('Appointment not found');

    const updateData: Prisma.ServiceAppointmentUncheckedUpdateInput = {};
    if (dto.status) updateData.status = dto.status as ServiceAppointmentStatus;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.customerName) updateData.customerName = dto.customerName;
    if (dto.customerPhone) updateData.customerPhone = dto.customerPhone;
    if (dto.vin !== undefined) updateData.vin = dto.vin;

    if ((dto.date && dto.date !== existing.date.toISOString().slice(0, 10)) || (dto.startTime && dto.startTime !== existing.startTime)) {
      const targetDateStr = dto.date || existing.date.toISOString().slice(0, 10);
      const targetDate = new Date(`${targetDateStr}T00:00:00Z`);
      const targetTime = dto.startTime || existing.startTime;
      const targetBranch = dto.branchId || existing.serviceCenterId || existing.branchId || 'center_main';

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
    const appointments = rule.isOpen
      ? await this.repository.findAppointmentsForDate(branchId, dateObj)
      : [];

    return buildDayAvailability({
      branchId,
      dateStr,
      dayOfWeek,
      rule,
      appointments,
    });
  }

  // ── Rules Management ──────────────────────────────────────────────────────
  async getBranchRules(branchId: string) {
    const existing = await this.repository.findRulesForBranch(branchId);
    if (existing.length === 7) return existing;

    const result = [];
    for (let day = 0; day < 7; day++) {
      const found = existing.find((r) => r.dayOfWeek === day);
      if (found) {
        result.push(found);
      } else {
        const def = DEFAULT_DAY_RULES[day]!;
        const created = await this.repository.upsertRule({
          serviceCenterId: branchId,
          dayOfWeek: day,
          isOpen: def.isOpen,
          startTime: def.startTime,
          endTime: def.endTime,
          maxDailyAppointments: def.maxDailyAppointments,
          maxPerHour: def.maxPerHour,
          maxPerSlot: def.maxPerSlot,
          slotDurationMinutes: def.slotDurationMinutes || 15,
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
        serviceCenterId: branchId,
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

  async initWeekRules(centerId: string) {
    const updated = [];
    for (let day = 0; day < 7; day++) {
      const def = DEFAULT_DAY_RULES[day]!;
      const res = await this.repository.upsertRule({
        serviceCenterId: centerId,
        dayOfWeek: day,
        isOpen: def.isOpen,
        startTime: def.startTime,
        endTime: def.endTime,
        maxDailyAppointments: def.maxDailyAppointments,
        maxPerHour: def.maxPerHour,
        maxPerSlot: def.maxPerSlot,
        slotDurationMinutes: def.slotDurationMinutes || 15,
      });
      updated.push(res);
    }
    return updated;
  }

  // ── Service Centers ───────────────────────────────────────────────────────
  async getServiceCenters(activeOnly = true) {
    const centers = await this.repository.listServiceCenters(activeOnly);
    if (centers.length === 0) {
      const defaultCenter = await this.repository.upsertServiceCenter({
        code: 'MAIN_CENTER',
        nameEn: 'Main Service Center',
        nameAr: 'مركز الصيانة الرئيسي',
        isActive: true,
      });
      return [defaultCenter];
    }
    return centers;
  }

  async upsertServiceCenter(data: {
    id?: string | undefined;
    code?: string | undefined;
    nameEn: string;
    nameAr: string;
    address?: string | null | undefined;
    phone?: string | null | undefined;
    isActive?: boolean | undefined;
  }) {
    return this.repository.upsertServiceCenter(data);
  }

  async deleteServiceCenter(id: string) {
    return this.repository.deleteServiceCenter(id);
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
