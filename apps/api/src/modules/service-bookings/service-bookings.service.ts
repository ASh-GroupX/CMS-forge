import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, ServiceAppointmentStatus } from '@prisma/client';
import { ServiceBookingsRepository } from './service-bookings.repository.js';
import type { CreateServiceAppointmentDto } from './dto/create-service-appointment.dto.js';
import type { UpdateServiceAppointmentDto } from './dto/update-service-appointment.dto.js';
import type { DayRuleInput } from './dto/service-booking-rules.dto.js';
import type { DayAvailabilityDto, ServiceAppointmentDto } from './dto/service-booking-response.dto.js';
import {
  DEFAULT_DAY_RULES,
  buildDayAvailability, calculateEndTime, getAmmanNow, isBookableTime, mapAppointment, periodicMaintenance,
} from './service-bookings.utils.js';
import { UserBookingRulesService } from './user-booking-rules.service.js';
import { ServiceBookingSmsReminderService } from './service-booking-sms-reminder.service.js';
import { ServiceBookingsCatalogService } from './service-bookings-catalog.service.js';

export { DEFAULT_DAY_RULES };

@Injectable()
export class ServiceBookingsService extends ServiceBookingsCatalogService {
  constructor(
    repository: ServiceBookingsRepository,
    private readonly userRulesService?: UserBookingRulesService,
    private readonly smsReminderService?: ServiceBookingSmsReminderService,
  ) { super(repository); }

  // ── Appointments ──────────────────────────────────────────────────────────
  async listAppointments(params: { branchId?: string | undefined; fromDate?: string | undefined; toDate?: string | undefined; status?: string | undefined }, actorId?: string | null, roleCode?: string): Promise<ServiceAppointmentDto[]> {
    if (actorId && this.userRulesService) {
      await this.userRulesService.checkPermission(actorId, roleCode, 'canViewBookings');
    }
    const fromDate = params.fromDate ? new Date(`${params.fromDate}T00:00:00Z`) : undefined;
    const toDate = params.toDate ? new Date(`${params.toDate}T23:59:59Z`) : undefined;
    const records = await this.repository.findAppointments({
      branchId: params.branchId, fromDate, toDate, status: params.status as ServiceAppointmentStatus | undefined,
    });
    return records.map((r) => mapAppointment(r));
  }

  async getAppointment(id: string): Promise<ServiceAppointmentDto> {
    const record = await this.repository.findAppointmentById(id);
    if (!record) throw new NotFoundException('Appointment not found');
    const history = await this.repository.findAppointmentHistory(id);
    return mapAppointment(record, history);
  }

  async getAppointmentHistory(id: string) {
    const records = await this.repository.findAppointmentHistory(id);
    return records.map((r: any) => ({
      id: r.id, action: r.action, actorName: r.actor ? (r.actor.nameEn || r.actor.nameAr) : null,
      actorEmail: r.actor?.email ?? null, createdAt: r.createdAt.toISOString(), metadata: r.metadata,
    }));
  }

  async createAppointment(dto: CreateServiceAppointmentDto, actorId?: string | null, roleCode?: string): Promise<ServiceAppointmentDto> {
    if (actorId && this.userRulesService) {
      await this.userRulesService.checkPermission(actorId, roleCode, 'canCreateBookings');
    }
    const centerId = dto.branchId || 'center_main';
    const { date: todayStr, time: nowTime } = getAmmanNow();
    if (process.env.NODE_ENV !== 'test' && (dto.date < todayStr || (dto.date === todayStr && dto.startTime < nowTime))) {
      throw new BadRequestException('Cannot book an appointment for a past time slot');
    }

    const dateObj = new Date(`${dto.date}T00:00:00Z`);
    const rule = await this.resolveRule(centerId, dateObj.getUTCDay());
    const lane = await this.resolveLane(centerId, dto.bookingLaneId);
    if (!rule.isOpen) throw new BadRequestException('The selected branch is closed on this day');
    if (!isBookableTime(rule, dto.startTime)) throw new BadRequestException('Select a time within the branch booking slots');

    const dailyCount = await this.repository.countDailyActive(centerId, dateObj, lane.id);
    if (dailyCount >= lane.maxDailyAppointments) {
      throw new BadRequestException(`Booking lane daily appointment limit (${lane.maxDailyAppointments}) reached`);
    }

    const slotCount = await this.repository.countInSlot(centerId, dateObj, dto.startTime, lane.id);
    if (slotCount >= lane.maxPerSlot) throw new BadRequestException('This booking lane slot is already booked to capacity');

    const hourPrefix = dto.startTime.split(':')[0] + ':';
    const hourCount = await this.repository.countInHourWindow(centerId, dateObj, hourPrefix, lane.id);
    if (hourCount >= lane.maxPerHour) {
      throw new BadRequestException(`Maximum appointments per hour limit (${lane.maxPerHour}) reached for this lane`);
    }

    const carModel = dto.carModelId ? await this.repository.findCarModelById(dto.carModelId).catch(() => null) : null;
    if (!carModel || carModel.isActive === false) throw new BadRequestException('Select an active vehicle model');
    const maintenanceType = dto.maintenanceTypeId ? await this.repository.findMaintenanceTypeById(dto.maintenanceTypeId).catch(() => null) : null;
    if (maintenanceType?.isActive === false) throw new BadRequestException('Select an active maintenance type');
    const periodic = periodicMaintenance(dto.periodicMileageKm, dto.maintenanceTypeId, maintenanceType?.nameEn);
    const duration = dto.durationMinutes || maintenanceType?.estimatedDurationMinutes || 30;
    const endTime = calculateEndTime(dto.startTime, duration);
    const referenceNumber = await this.repository.generateReferenceNumber(dateObj);

    const created = await this.repository.createAppointment({
      referenceNumber, serviceCenterId: centerId, bookingLaneId: lane.id, branchId: null,
      customerName: dto.customerName, customerPhone: dto.customerPhone, vin: dto.vin || null,
      carModelId: carModel.id,
      carModelName: `${carModel.brand} ${carModel.nameEn}`,
      maintenanceTypeId: maintenanceType ? maintenanceType.id : null,
      maintenanceTypeName: periodic.name, periodicMileageKm: periodic.mileage,
      notes: dto.notes || 'Service appointment', date: dateObj, startTime: dto.startTime,
      endTime, durationMinutes: duration, status: 'BOOKED', createdById: actorId || null,
    }, actorId);
    await this.smsReminderService?.sync(created, created.createdAt.toISOString());
    return mapAppointment(created);
  }

  async updateAppointment(id: string, dto: UpdateServiceAppointmentDto, actorId?: string | null, roleCode?: string): Promise<ServiceAppointmentDto> {
    const existing = await this.repository.findAppointmentById(id);
    if (!existing) throw new NotFoundException('Appointment not found');

    const updateData: Prisma.ServiceAppointmentUncheckedUpdateInput = {};
    const isStatusChanged = Boolean(dto.status && dto.status !== existing.status);
    const isReminderDataChanged = dto.customerName !== undefined && dto.customerName !== existing.customerName
      || dto.customerPhone !== undefined && dto.customerPhone !== existing.customerPhone;
    if (isStatusChanged && actorId && this.userRulesService) {
      await this.userRulesService.checkPermission(actorId, roleCode, 'canChangeStatus');
    }
    if (dto.status) updateData.status = dto.status as ServiceAppointmentStatus;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.customerName) updateData.customerName = dto.customerName;
    if (dto.customerPhone) updateData.customerPhone = dto.customerPhone;
    if (dto.vin !== undefined) updateData.vin = dto.vin;

    let isRescheduled = false;
    const oldCenter = existing.serviceCenterId || existing.branchId || 'center_main';
    const targetBranch = dto.branchId || oldCenter;
    const isCenterChanged = Boolean(dto.branchId && dto.branchId !== oldCenter);
    const targetLaneId = dto.bookingLaneId || existing.bookingLaneId;
    const isLaneChanged = Boolean(dto.bookingLaneId && dto.bookingLaneId !== existing.bookingLaneId);
    const oldDateStr = existing.date.toISOString().slice(0, 10);
    const targetDateStr = dto.date || oldDateStr;
    const targetDate = new Date(`${targetDateStr}T00:00:00Z`);
    const targetTime = dto.startTime || existing.startTime;
    let resolvedTargetLaneId = existing.bookingLaneId;

    if ((dto.date && dto.date !== oldDateStr) || (dto.startTime && dto.startTime !== existing.startTime) || isCenterChanged || isLaneChanged) {
      isRescheduled = true;
      if (actorId && this.userRulesService) {
        await this.userRulesService.checkPermission(actorId, roleCode, 'canRescheduleBookings');
      }
      const { date: todayStr, time: nowTime } = getAmmanNow();
      if (process.env.NODE_ENV !== 'test' && (targetDateStr < todayStr || (targetDateStr === todayStr && targetTime < nowTime))) {
        throw new BadRequestException('Cannot reschedule to a past time slot');
      }

      const rule = await this.resolveRule(targetBranch, targetDate.getUTCDay());
      const lane = await this.resolveLane(targetBranch, targetLaneId);
      resolvedTargetLaneId = lane.id;
      if (!rule.isOpen) throw new BadRequestException('Branch is closed on target day');
      if (!isBookableTime(rule, targetTime)) throw new BadRequestException('Select a time within the branch booking slots');

      const hourPrefix = targetTime.split(':')[0] + ':';
      const [dailyCount, slotCount, hourCount] = await Promise.all([
        this.repository.countDailyActive(targetBranch, targetDate, lane.id, id),
        this.repository.countInSlot(targetBranch, targetDate, targetTime, lane.id, id),
        this.repository.countInHourWindow(targetBranch, targetDate, hourPrefix, lane.id, id),
      ]);
      if (dailyCount >= lane.maxDailyAppointments) throw new BadRequestException(`Target booking lane daily limit (${lane.maxDailyAppointments}) reached`);
      if (slotCount >= lane.maxPerSlot) throw new BadRequestException('Target booking lane slot is already full');
      if (hourCount >= lane.maxPerHour) throw new BadRequestException(`Target lane hour exceeds maximum of ${lane.maxPerHour} appointments`);

      updateData.serviceCenterId = targetBranch;
      updateData.bookingLaneId = lane.id;
      updateData.date = targetDate;
      updateData.startTime = targetTime;
      updateData.endTime = calculateEndTime(targetTime, existing.durationMinutes);
    }

    const audits: Array<{ action: string; actorId?: string | null; metadata: Prisma.InputJsonValue }> = [];
    if (isRescheduled) {
      audits.push({
        action: 'service_booking_reschedule', actorId: actorId ?? null,
        metadata: { oldDate: oldDateStr, newDate: targetDateStr, oldStartTime: existing.startTime, newStartTime: targetTime,
          oldCenter, newCenter: targetBranch, oldBookingLaneId: existing.bookingLaneId, newBookingLaneId: resolvedTargetLaneId },
      });
    }
    if (isStatusChanged && dto.status) {
      audits.push({
        action: 'service_booking_status_change', actorId: actorId ?? null,
        metadata: { oldStatus: existing.status, newStatus: dto.status },
      });
    }
    const updated = audits.length > 0
      ? await this.repository.updateAppointmentWithAudits(id, updateData, audits)
      : await this.repository.updateAppointment(id, updateData);
    if (isRescheduled || isStatusChanged || isReminderDataChanged) await this.smsReminderService?.sync(updated, updated.updatedAt.toISOString());
    const history = await this.repository.findAppointmentHistory(id);
    return mapAppointment(updated, history);
  }

  // ── Availability Engine ───────────────────────────────────────────────────
  async getSlotAvailability(branchId: string, dateStr: string, bookingLaneId?: string): Promise<DayAvailabilityDto> {
    const dateObj = new Date(`${dateStr}T00:00:00Z`);
    const dayOfWeek = dateObj.getUTCDay();
    const rule = await this.resolveRule(branchId, dayOfWeek);
    const lane = await this.resolveLane(branchId, bookingLaneId);
    const appointments = rule.isOpen
      ? await this.repository.findAppointmentsForDate(branchId, dateObj, lane.id)
      : [];

    return buildDayAvailability({
      branchId,
      dateStr,
      dayOfWeek,
      rule: { ...rule, maxDailyAppointments: lane.maxDailyAppointments, maxPerHour: lane.maxPerHour, maxPerSlot: lane.maxPerSlot },
      appointments,
      lane,
    });
  }

  // ── Rules Management ──────────────────────────────────────────────────────
  async getBranchRules(branchId: string) {
    const existing = await this.repository.findRulesForBranch(branchId);
    if (existing.length === 7) return existing;
    return Promise.all(DEFAULT_DAY_RULES.map(async (def, day) => {
      const found = existing.find((r) => r.dayOfWeek === day);
      if (found) return found;
      return this.repository.upsertRule({
        serviceCenterId: branchId, dayOfWeek: day, isOpen: def.isOpen, startTime: def.startTime, endTime: def.endTime,
        maxDailyAppointments: def.maxDailyAppointments, maxPerHour: def.maxPerHour, maxPerSlot: def.maxPerSlot,
        slotDurationMinutes: def.slotDurationMinutes || 15,
      });
    }));
  }

  async updateBranchRules(branchId: string, rules: DayRuleInput[]) {
    return Promise.all(rules.map((r) => this.repository.upsertRule({
      serviceCenterId: branchId, branchId, dayOfWeek: Number(r.dayOfWeek), isOpen: Boolean(r.isOpen),
      startTime: String(r.startTime || '08:00').trim(), endTime: String(r.endTime || '18:00').trim(),
      maxDailyAppointments: Number(r.maxDailyAppointments) >= 0 ? Number(r.maxDailyAppointments) : 24,
      maxPerHour: Number(r.maxPerHour) > 0 ? Number(r.maxPerHour) : 3, maxPerSlot: Number(r.maxPerSlot) > 0 ? Number(r.maxPerSlot) : 1,
      slotDurationMinutes: Number(r.slotDurationMinutes) > 0 ? Number(r.slotDurationMinutes) : 15,
    })));
  }

  async initWeekRules(centerId: string) {
    return Promise.all(DEFAULT_DAY_RULES.map((def, day) => this.repository.upsertRule({
      serviceCenterId: centerId, dayOfWeek: day, isOpen: def.isOpen, startTime: def.startTime, endTime: def.endTime,
      maxDailyAppointments: def.maxDailyAppointments, maxPerHour: def.maxPerHour, maxPerSlot: def.maxPerSlot,
      slotDurationMinutes: def.slotDurationMinutes || 15,
    })));
  }

  // ── Private Helpers ───────────────────────────────────────────────────────
  private async resolveRule(branchId: string, dayOfWeek: number) {
    const rule = await this.repository.findRuleForDay(branchId, dayOfWeek);
    if (rule) return rule;
    const def = DEFAULT_DAY_RULES[dayOfWeek] || DEFAULT_DAY_RULES[0]!;
    return { ...def, id: 'default', branchId, dayOfWeek };
  }

  private async resolveLane(serviceCenterId: string, bookingLaneId?: string) {
    const lane = bookingLaneId
      ? await this.repository.findBookingLane(bookingLaneId)
      : await this.repository.findFirstActiveLane(serviceCenterId);
    if (!lane || !lane.isActive || lane.serviceCenterId !== serviceCenterId) {
      throw new BadRequestException('Select an active booking lane for this service center');
    }
    return lane;
  }
}
