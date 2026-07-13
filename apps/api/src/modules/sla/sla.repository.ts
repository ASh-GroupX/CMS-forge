import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ComplaintSeverity, ComplaintStatus, SlaEventType, SlaStage, WorkingCalendarMode } from '@prisma/client';
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
  pausePolicy: true,
  escalationLevel1: true,
  escalationLevel2: true,
  escalationLevel3: true,
  escalationLevel2AfterBreachMinutes: true,
  escalationLevel3AfterBreachMinutes: true,
  totalTargetMinutes: true,
  isActive: true,
  updatedAt: true,
} satisfies Prisma.SlaPolicySelect;

type SlaPolicyClient = Pick<Prisma.TransactionClient, 'slaPolicy'>;

const slaEventSelect = {
  complaintId: true,
  policyId: true,
  stage: true,
  dueAt: true,
  idempotencyKey: true,
} satisfies Prisma.SlaEventSelect;

const slaLifecycleEventSelect = { ...slaEventSelect, type: true, occurredAt: true } satisfies Prisma.SlaEventSelect;

export type SlaDeadlineEventRecord = Prisma.SlaEventGetPayload<{ select: typeof slaEventSelect }>;
export type SlaLifecycleEventRecord = Prisma.SlaEventGetPayload<{ select: typeof slaLifecycleEventSelect }>;
export type SlaLifecycleEventType = typeof SlaEventType.PAUSED | typeof SlaEventType.RESUMED;

export type CreateSlaDeadlineEventData = {
  complaintId: string;
  policyId: string | null;
  stage: SlaStage;
  dueAt: Date;
  idempotencyKey: string;
};

export type CreateSlaLifecycleEventData = {
  complaintId: string;
  type: SlaLifecycleEventType;
  stage: SlaStage;
  occurredAt: Date;
  idempotencyKey: string;
};

export type UpdateSlaPolicyEscalationData = {
  escalationLevel1: string;
  escalationLevel2: string | null;
  escalationLevel3: string | null;
  escalationLevel2AfterBreachMinutes: number | null;
  escalationLevel3AfterBreachMinutes: number | null;
};

export type UpdateSlaPolicyConfigData = UpdateSlaPolicyEscalationData & {
  durationMinutes: number;
  warningPercent: number;
  branchTimezone: string;
  workingCalendarMode: WorkingCalendarMode;
};

const slaPolicyEscalationSelect = {
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
  pausePolicy: true,
  escalationLevel1: true,
  escalationLevel2: true,
  escalationLevel3: true,
  escalationLevel2AfterBreachMinutes: true,
  escalationLevel3AfterBreachMinutes: true,
  totalTargetMinutes: true,
  isActive: true,
} satisfies Prisma.SlaPolicySelect;

export type SlaPolicyRecord = Prisma.SlaPolicyGetPayload<{ select: typeof slaPolicySelect }>;
export type SlaPolicyEscalationRecord = Prisma.SlaPolicyGetPayload<{ select: typeof slaPolicyEscalationSelect }>;

const slaDeadlineWarningSelect = {
  complaintId: true,
  policyId: true,
  stage: true,
  dueAt: true,
  occurredAt: true,
  idempotencyKey: true,
  policy: {
    select: {
      durationMinutes: true,
      warningPercent: true,
    },
  },
  complaint: { select: { status: true, ownerId: true, slaEvents: { where: { type: SlaEventType.PAUSED }, select: { type: true, stage: true, occurredAt: true } } } },
} satisfies Prisma.SlaEventSelect;

export type SlaDeadlineWarningRecord = Prisma.SlaEventGetPayload<{ select: typeof slaDeadlineWarningSelect }>;

const slaDeadlineBreachSelect = {
  complaintId: true,
  policyId: true,
  stage: true,
  dueAt: true,
  occurredAt: true,
  idempotencyKey: true,
  policy: {
    select: {
      escalationLevel1: true,
      escalationLevel2: true,
      escalationLevel3: true,
      escalationLevel2AfterBreachMinutes: true,
      escalationLevel3AfterBreachMinutes: true,
    },
  },
  complaint: { select: { status: true, slaEvents: { where: { type: SlaEventType.PAUSED }, select: { type: true, stage: true, occurredAt: true } } } },
} satisfies Prisma.SlaEventSelect;

export type SlaDeadlineBreachRecord = Prisma.SlaEventGetPayload<{ select: typeof slaDeadlineBreachSelect }>;

@Injectable()
export class SlaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async findActiveBySeverityAndStage(severity: ComplaintSeverity, stage: SlaStage): Promise<SlaPolicyRecord[]> {
    return this.prisma.slaPolicy.findMany({
      where: { severity, stage, isActive: true },
      orderBy: [{ updatedAt: 'desc' }],
      select: slaPolicySelect,
    });
  }

  async listPolicies(): Promise<SlaPolicyRecord[]> {
    return this.prisma.slaPolicy.findMany({
      orderBy: [{ isActive: 'desc' }, { severity: 'asc' }, { stage: 'asc' }, { updatedAt: 'desc' }],
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

  async createLifecycleEvent(data: CreateSlaLifecycleEventData): Promise<SlaLifecycleEventRecord> {
    return this.prisma.slaEvent.upsert({
      where: { idempotencyKey: data.idempotencyKey },
      update: {},
      create: { ...data, policyId: null, dueAt: null },
      select: slaLifecycleEventSelect,
    });
  }

  async findDeadlineEventsForWarning(): Promise<SlaDeadlineWarningRecord[]> {
    return this.prisma.slaEvent.findMany({
      where: { type: SlaEventType.DEADLINE_SET, dueAt: { not: null }, policy: { isNot: null }, complaint: { status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.REJECTED] } } },
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

  async findBreachEventsForEscalation(): Promise<SlaDeadlineBreachRecord[]> {
    return this.prisma.slaEvent.findMany({
      where: { type: SlaEventType.BREACH, dueAt: { not: null }, complaint: { status: { notIn: [ComplaintStatus.CLOSED, ComplaintStatus.REJECTED] } } },
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

  async updatePolicyEscalationConfig(id: string, data: UpdateSlaPolicyEscalationData, client: SlaPolicyClient = this.prisma): Promise<SlaPolicyEscalationRecord> {
    return client.slaPolicy.update({ where: { id }, data, select: slaPolicyEscalationSelect });
  }

  async updatePolicyConfig(id: string, data: UpdateSlaPolicyConfigData, client: SlaPolicyClient = this.prisma): Promise<SlaPolicyEscalationRecord> {
    return client.slaPolicy.update({ where: { id }, data, select: slaPolicyEscalationSelect });
  }
}
