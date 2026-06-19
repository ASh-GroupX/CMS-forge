import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ComplaintSeverity, ComplaintStatus, SlaEventType, SlaStage } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const slaPolicySelect = {
  id: true,
  severity: true,
  stage: true,
  branchId: true,
  departmentId: true,
  categoryId: true,
  durationMinutes: true,
  warningPercent: true,
  branchTimezone: true,
  workingCalendarMode: true,
  isActive: true,
  updatedAt: true,
} satisfies Prisma.SlaPolicySelect;

export type SlaPolicyRecord = Prisma.SlaPolicyGetPayload<{ select: typeof slaPolicySelect }>;

const slaEventSelect = {
  complaintId: true,
  policyId: true,
  stage: true,
  dueAt: true,
  idempotencyKey: true,
} satisfies Prisma.SlaEventSelect;

export type SlaDeadlineEventRecord = Prisma.SlaEventGetPayload<{ select: typeof slaEventSelect }>;

export type CreateSlaDeadlineEventData = {
  complaintId: string;
  policyId: string | null;
  stage: SlaStage;
  dueAt: Date;
  idempotencyKey: string;
};

const slaDeadlineWarningSelect = {
  complaintId: true,
  policyId: true,
  stage: true,
  dueAt: true,
  idempotencyKey: true,
  policy: {
    select: {
      durationMinutes: true,
      warningPercent: true,
    },
  },
} satisfies Prisma.SlaEventSelect;

export type SlaDeadlineWarningRecord = Prisma.SlaEventGetPayload<{ select: typeof slaDeadlineWarningSelect }>;

const slaDeadlineBreachSelect = {
  complaintId: true,
  policyId: true,
  stage: true,
  dueAt: true,
  idempotencyKey: true,
  complaint: { select: { status: true } },
} satisfies Prisma.SlaEventSelect;

export type SlaDeadlineBreachRecord = Prisma.SlaEventGetPayload<{ select: typeof slaDeadlineBreachSelect }>;

@Injectable()
export class SlaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveBySeverityAndStage(severity: ComplaintSeverity, stage: SlaStage): Promise<SlaPolicyRecord[]> {
    return this.prisma.slaPolicy.findMany({
      where: { severity, stage, isActive: true },
      orderBy: [{ updatedAt: 'desc' }],
      select: slaPolicySelect,
    });
  }

  async createDeadlineEvent(data: CreateSlaDeadlineEventData): Promise<SlaDeadlineEventRecord> {
    return this.prisma.slaEvent.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      update: {},
      create: { ...data, type: SlaEventType.DEADLINE_SET },
      select: slaEventSelect,
    });
  }

  async findDeadlineEventsForWarning(): Promise<SlaDeadlineWarningRecord[]> {
    return this.prisma.slaEvent.findMany({
      where: { type: SlaEventType.DEADLINE_SET, dueAt: { not: null }, policy: { isNot: null } },
      select: slaDeadlineWarningSelect,
    });
  }

  async createWarningEvent(data: CreateSlaDeadlineEventData): Promise<boolean> {
    const result = await this.prisma.slaEvent.createMany({
      data: { ...data, type: SlaEventType.WARNING },
      skipDuplicates: true,
    });
    return result.count === 1;
  }

  async findDeadlineEventsForBreach(): Promise<SlaDeadlineBreachRecord[]> {
    return this.prisma.slaEvent.findMany({
      where: { type: SlaEventType.DEADLINE_SET, dueAt: { not: null }, complaint: { status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.REJECTED] } } },
      select: slaDeadlineBreachSelect,
    });
  }

  async createBreachEvent(data: CreateSlaDeadlineEventData): Promise<boolean> {
    const result = await this.prisma.slaEvent.createMany({
      data: { ...data, type: SlaEventType.BREACH },
      skipDuplicates: true,
    });
    return result.count === 1;
  }
}
