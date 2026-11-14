import { Injectable } from '@nestjs/common';
import type { Prisma, ServiceAppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import {
  appointmentSelect,
  type AppointmentRecord,
  type ServiceBookingClient,
} from './service-bookings.types.js';
import { ServiceBookingsCatalogRepository } from './service-bookings-catalog.repository.js';

export { appointmentSelect, type AppointmentRecord, type ServiceBookingClient };

@Injectable()
export class ServiceBookingsRepository extends ServiceBookingsCatalogRepository {
  constructor(prisma: PrismaService) { super(prisma); }

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }


  // ── Service Centers ───────────────────────────────────────────────────────
  async listServiceCenters(activeOnly = true) {
    return this.prisma.serviceCenter.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { nameEn: 'asc' },
    });
  }

  async findServiceCenterById(id: string) {
    return this.prisma.serviceCenter.findUnique({ where: { id } });
  }

  async upsertServiceCenter(data: { id?: string | undefined; code?: string | undefined; nameEn: string; nameAr: string; address?: string | null | undefined; phone?: string | null | undefined; isActive?: boolean | undefined }) {
    const existing = data.id
      ? await this.prisma.serviceCenter.findFirst({ where: { OR: [{ id: data.id }, ...(data.code ? [{ code: data.code }] : [])] } })
      : data.code ? await this.prisma.serviceCenter.findUnique({ where: { code: data.code } }) : null;

    if (existing) {
      return this.prisma.serviceCenter.update({
        where: { id: existing.id },
        data: {
          nameEn: data.nameEn,
          nameAr: data.nameAr,
          ...(data.code && data.code !== existing.code ? { code: data.code } : {}),
          ...(data.address !== undefined ? { address: data.address } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
    }
    const code = data.code || `CENTER_${Date.now()}`;
    return this.prisma.serviceCenter.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        code,
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        address: data.address ?? null,
        phone: data.phone ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async deleteServiceCenter(id: string) {
    await this.prisma.serviceBookingRule.deleteMany({ where: { serviceCenterId: id } });
    await this.prisma.serviceAppointment.updateMany({ where: { serviceCenterId: id }, data: { serviceCenterId: 'center_main' } });
    return this.prisma.serviceCenter.delete({ where: { id } });
  }

  // ── Appointments ──────────────────────────────────────────────────────────
  async findAppointments(params: {
    branchId?: string | undefined;
    fromDate?: Date | undefined;
    toDate?: Date | undefined;
    status?: ServiceAppointmentStatus | undefined;
  }): Promise<AppointmentRecord[]> {
    const where: Prisma.ServiceAppointmentWhereInput = {};
    if (params.branchId && params.branchId !== 'all') {
      where.OR = [{ serviceCenterId: params.branchId }, { branchId: params.branchId }];
    }
    if (params.fromDate || params.toDate) {
      where.date = {};
      if (params.fromDate) where.date.gte = params.fromDate;
      if (params.toDate) where.date.lte = params.toDate;
    }
    if (params.status) where.status = params.status;

    return this.prisma.serviceAppointment.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      select: appointmentSelect,
    });
  }

  async findAppointmentById(id: string): Promise<AppointmentRecord | null> {
    return this.prisma.serviceAppointment.findUnique({
      where: { id },
      select: appointmentSelect,
    });
  }

  async findAppointmentHistory(id: string) {
    return this.prisma.auditLog.findMany({
      where: { targetType: 'ServiceAppointment', targetId: id },
      include: { actor: { select: { id: true, nameEn: true, nameAr: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBookingLane(id: string) {
    return this.prisma.serviceBookingLane.findUnique({ where: { id } });
  }

  async findFirstActiveLane(serviceCenterId: string) {
    return this.prisma.serviceBookingLane.findFirst({
      where: { serviceCenterId, isActive: true }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listActiveBookingLanes(serviceCenterId: string) {
    return this.prisma.serviceBookingLane.findMany({
      where: { serviceCenterId, isActive: true }, orderBy: [{ position: 'asc' }, { nameEn: 'asc' }],
    });
  }

  async recordAppointmentAudit(data: { action: string; actorId?: string | null | undefined; targetId: string; metadata: Prisma.InputJsonValue }) {
    return this.prisma.auditLog.create({
      data: { eventType: 'WORKFLOW', action: data.action, actorId: data.actorId ?? null, targetType: 'ServiceAppointment', targetId: data.targetId, metadata: data.metadata },
    });
  }

  async findAppointmentsForDate(branchId: string, date: Date, bookingLaneId?: string): Promise<AppointmentRecord[]> {
    return this.prisma.serviceAppointment.findMany({
      where: {
        OR: [{ serviceCenterId: branchId }, { branchId }],
        date,
        ...(bookingLaneId ? { bookingLaneId } : {}),
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      orderBy: { startTime: 'asc' },
      select: appointmentSelect,
    });
  }

  async countDailyActive(branchId: string, date: Date, bookingLaneId?: string, excludeId?: string): Promise<number> {
    return this.prisma.serviceAppointment.count({
      where: {
        OR: [{ serviceCenterId: branchId }, { branchId }],
        date,
        ...(bookingLaneId ? { bookingLaneId } : {}),
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async countInHourWindow(branchId: string, date: Date, hourPrefix: string, bookingLaneId?: string, excludeId?: string): Promise<number> {
    return this.prisma.serviceAppointment.count({
      where: {
        OR: [{ serviceCenterId: branchId }, { branchId }],
        date,
        startTime: { startsWith: hourPrefix },
        ...(bookingLaneId ? { bookingLaneId } : {}),
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async countInSlot(branchId: string, date: Date, startTime: string, bookingLaneId?: string, excludeId?: string): Promise<number> {
    return this.prisma.serviceAppointment.count({
      where: {
        OR: [{ serviceCenterId: branchId }, { branchId }],
        date,
        startTime,
        ...(bookingLaneId ? { bookingLaneId } : {}),
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async createAppointment(
    data: Prisma.ServiceAppointmentUncheckedCreateInput,
    actorId?: string | null,
  ): Promise<AppointmentRecord> {
    return this.prisma.$transaction(async (client) => {
      const created = await client.serviceAppointment.create({ data, select: appointmentSelect });
      await client.auditLog.create({ data: { eventType: 'WORKFLOW', action: 'service_booking_created',
        actorId: actorId ?? null, targetType: 'ServiceAppointment', targetId: created.id,
        metadata: { branchId: data.serviceCenterId, date: created.date.toISOString().slice(0, 10), startTime: data.startTime } } });
      return created;
    });
  }

  async updateAppointment(
    id: string,
    data: Prisma.ServiceAppointmentUncheckedUpdateInput,
    client: ServiceBookingClient = this.prisma,
  ): Promise<AppointmentRecord> {
    return client.serviceAppointment.update({
      where: { id },
      data,
      select: appointmentSelect,
    });
  }

  async updateAppointmentWithAudits(
    id: string,
    data: Prisma.ServiceAppointmentUncheckedUpdateInput,
    audits: Array<{ action: string; actorId?: string | null; metadata: Prisma.InputJsonValue }>,
  ): Promise<AppointmentRecord> {
    return this.prisma.$transaction(async (client) => {
      const updated = await this.updateAppointment(id, data, client);
      for (const audit of audits) {
        await client.auditLog.create({ data: {
          eventType: 'WORKFLOW', action: audit.action, actorId: audit.actorId ?? null,
          targetType: 'ServiceAppointment', targetId: id, metadata: audit.metadata,
        } });
      }
      return updated;
    });
  }

  async generateReferenceNumber(date: Date, client: ServiceBookingClient = this.prisma): Promise<string> {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const prefix = `APT-${y}${m}${d}-`;
    const count = await client.serviceAppointment.count({
      where: { referenceNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  // ── Rules ─────────────────────────────────────────────────────────────────
  async findRulesForBranch(branchId: string) {
    return this.prisma.serviceBookingRule.findMany({
      where: { OR: [{ serviceCenterId: branchId }, { branchId }] },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async findRuleForDay(branchId: string, dayOfWeek: number) {
    return this.prisma.serviceBookingRule.findFirst({
      where: {
        OR: [{ serviceCenterId: branchId }, { branchId }],
        dayOfWeek,
      },
    });
  }

  async upsertRule(data: { serviceCenterId?: string | undefined; branchId?: string | undefined; dayOfWeek: number; isOpen: boolean; startTime: string; endTime: string; maxDailyAppointments: number; maxPerHour: number; maxPerSlot: number; slotDurationMinutes: number }) {
    const centerId = data.serviceCenterId || data.branchId || 'center_main';
    const existing = await this.prisma.serviceBookingRule.findFirst({
      where: { OR: [{ serviceCenterId: centerId }, { branchId: centerId }], dayOfWeek: data.dayOfWeek },
    });

    if (existing) {
      return this.prisma.serviceBookingRule.update({
        where: { id: existing.id },
        data: {
          serviceCenterId: centerId,
          isOpen: data.isOpen, startTime: data.startTime, endTime: data.endTime,
          maxDailyAppointments: data.maxDailyAppointments, maxPerHour: data.maxPerHour,
          maxPerSlot: data.maxPerSlot, slotDurationMinutes: data.slotDurationMinutes,
        },
      });
    }

    return this.prisma.serviceBookingRule.create({
      data: {
        dayOfWeek: data.dayOfWeek, isOpen: data.isOpen, startTime: data.startTime, endTime: data.endTime,
        maxDailyAppointments: data.maxDailyAppointments, maxPerHour: data.maxPerHour,
        maxPerSlot: data.maxPerSlot, slotDurationMinutes: data.slotDurationMinutes,
        serviceCenterId: centerId, branchId: null,
      },
    });
  }

}
