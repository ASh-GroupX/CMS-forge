import { Injectable } from '@nestjs/common';
import type { Prisma, ServiceAppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

export const appointmentSelect = {
  id: true,
  referenceNumber: true,
  branchId: true,
  customerName: true,
  customerPhone: true,
  vin: true,
  carModelId: true,
  carModelName: true,
  maintenanceTypeId: true,
  maintenanceTypeName: true,
  notes: true,
  date: true,
  startTime: true,
  endTime: true,
  durationMinutes: true,
  status: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  branch: {
    select: { id: true, code: true, nameEn: true, nameAr: true },
  },
} satisfies Prisma.ServiceAppointmentSelect;

export type AppointmentRecord = Prisma.ServiceAppointmentGetPayload<{ select: typeof appointmentSelect }>;
type ServiceBookingClient = Pick<Prisma.TransactionClient, 'serviceAppointment' | 'serviceBookingRule' | 'serviceCarModel' | 'serviceMaintenanceType'>;

@Injectable()
export class ServiceBookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
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
      where.branchId = params.branchId;
    }
    if (params.fromDate || params.toDate) {
      where.date = {};
      if (params.fromDate) where.date.gte = params.fromDate;
      if (params.toDate) where.date.lte = params.toDate;
    }
    if (params.status) {
      where.status = params.status;
    }

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

  async findAppointmentsForDate(branchId: string, date: Date): Promise<AppointmentRecord[]> {
    return this.prisma.serviceAppointment.findMany({
      where: {
        branchId,
        date,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      orderBy: { startTime: 'asc' },
      select: appointmentSelect,
    });
  }

  async countDailyActive(branchId: string, date: Date, excludeId?: string): Promise<number> {
    return this.prisma.serviceAppointment.count({
      where: {
        branchId,
        date,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async countInHourWindow(branchId: string, date: Date, hourPrefix: string, excludeId?: string): Promise<number> {
    return this.prisma.serviceAppointment.count({
      where: {
        branchId,
        date,
        startTime: { startsWith: hourPrefix },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async countInSlot(branchId: string, date: Date, startTime: string, excludeId?: string): Promise<number> {
    return this.prisma.serviceAppointment.count({
      where: {
        branchId,
        date,
        startTime,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  async createAppointment(
    data: Prisma.ServiceAppointmentUncheckedCreateInput,
    client: ServiceBookingClient = this.prisma,
  ): Promise<AppointmentRecord> {
    return client.serviceAppointment.create({
      data,
      select: appointmentSelect,
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

  // ── Booking Rules ─────────────────────────────────────────────────────────
  async findRulesByBranch(branchId: string) {
    return this.prisma.serviceBookingRule.findMany({
      where: { branchId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async findRuleForDay(branchId: string, dayOfWeek: number) {
    return this.prisma.serviceBookingRule.findUnique({
      where: {
        branchId_dayOfWeek: { branchId, dayOfWeek },
      },
    });
  }

  async upsertRule(
    data: {
      branchId: string;
      dayOfWeek: number;
      isOpen: boolean;
      startTime: string;
      endTime: string;
      maxDailyAppointments: number;
      maxPerHour: number;
      maxPerSlot: number;
      slotDurationMinutes: number;
    },
    client: ServiceBookingClient = this.prisma,
  ) {
    return client.serviceBookingRule.upsert({
      where: {
        branchId_dayOfWeek: { branchId: data.branchId, dayOfWeek: data.dayOfWeek },
      },
      create: data,
      update: data,
    });
  }

  // ── Car Models ────────────────────────────────────────────────────────────
  async listCarModels(activeOnly = true) {
    return this.prisma.serviceCarModel.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { nameEn: 'asc' },
    });
  }

  async findCarModelById(id: string) {
    return this.prisma.serviceCarModel.findUnique({ where: { id } });
  }

  async upsertCarModel(data: { id?: string | undefined; nameEn: string; nameAr: string; brand?: string | undefined; isActive?: boolean | undefined }) {
    const brand = data.brand || 'Nissan';
    if (data.id) {
      return this.prisma.serviceCarModel.update({
        where: { id: data.id },
        data: { nameEn: data.nameEn, nameAr: data.nameAr, brand, ...(data.isActive !== undefined ? { isActive: data.isActive } : {}) },
      });
    }
    return this.prisma.serviceCarModel.create({
      data: { nameEn: data.nameEn, nameAr: data.nameAr, brand, isActive: data.isActive ?? true },
    });
  }

  // ── Maintenance Types ─────────────────────────────────────────────────────
  async listMaintenanceTypes(activeOnly = true) {
    return this.prisma.serviceMaintenanceType.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { nameEn: 'asc' },
    });
  }

  async findMaintenanceTypeById(id: string) {
    return this.prisma.serviceMaintenanceType.findUnique({ where: { id } });
  }

  async upsertMaintenanceType(data: { id?: string | undefined; nameEn: string; nameAr: string; estimatedDurationMinutes?: number | undefined; isActive?: boolean | undefined }) {
    if (data.id) {
      return this.prisma.serviceMaintenanceType.update({
        where: { id: data.id },
        data: {
          nameEn: data.nameEn,
          nameAr: data.nameAr,
          ...(data.estimatedDurationMinutes ? { estimatedDurationMinutes: data.estimatedDurationMinutes } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        },
      });
    }
    return this.prisma.serviceMaintenanceType.create({
      data: {
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        estimatedDurationMinutes: data.estimatedDurationMinutes ?? 30,
        isActive: data.isActive ?? true,
      },
    });
  }
}
