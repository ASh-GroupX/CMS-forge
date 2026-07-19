import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import type { DealStageCode } from './deals.service.js';

const dealSelect = {
  id: true,
  title: true,
  branchId: true,
  ownerId: true,
  currentHolderId: true,
  assignedDepartmentId: true,
  stage: true,
  stageDueAt: true,
  blocker: true,
  createdAt: true,
  updatedAt: true,
  branch: { select: { nameEn: true } },
  owner: { select: { nameEn: true } },
  currentHolder: { select: { nameEn: true } },
  assignedDepartment: { select: { nameEn: true, nameAr: true } },
} satisfies Prisma.DealSelect;

const dealAuditSelect = { id: true, action: true, actorId: true, targetId: true, metadata: true, createdAt: true, actor: { select: { nameEn: true } } } satisfies Prisma.AuditLogSelect;

export type DealRow = Prisma.DealGetPayload<{ select: typeof dealSelect }>;
export type DealAuditRow = Prisma.AuditLogGetPayload<{ select: typeof dealAuditSelect }>;
type DealClient = Pick<Prisma.TransactionClient, 'deal'>;

export type CreateDealData = {
  title: string;
  branchId: string;
  ownerId: string;
  currentHolderId: string | null;
  assignedDepartmentId?: string | null;
  stage: DealStageCode;
  stageDueAt: Date;
  blocker?: string | null;
};

export type UpdateDealStageData = {
  id: string;
  stage: DealStageCode;
  currentHolderId: string | null;
  assignedDepartmentId?: string | null;
  stageDueAt: Date;
  blocker?: string | null;
};

export type UpdateDealDetailsData = {
  id: string;
  currentHolderId: string | null;
  assignedDepartmentId?: string | null;
  stageDueAt: Date;
};

@Injectable()
export class DealsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async create(data: CreateDealData, client: DealClient = this.prisma): Promise<DealRow> {
    return client.deal.create({ data: {
      title: data.title, branchId: data.branchId, ownerId: data.ownerId,
      currentHolderId: data.currentHolderId, assignedDepartmentId: data.assignedDepartmentId ?? null,
      stage: data.stage, stageDueAt: data.stageDueAt, blocker: data.blocker ?? null,
    }, select: dealSelect });
  }

  async findById(id: string, client: DealClient = this.prisma): Promise<DealRow | null> {
    return client.deal.findUnique({ where: { id }, select: dealSelect });
  }

  async updateStage(data: UpdateDealStageData, client: DealClient = this.prisma): Promise<DealRow> {
    return client.deal.update({
      where: { id: data.id },
      data: {
        stage: data.stage,
        currentHolderId: data.currentHolderId,
        assignedDepartmentId: data.assignedDepartmentId ?? null,
        stageDueAt: data.stageDueAt,
        blocker: data.blocker ?? null,
      },
      select: dealSelect,
    });
  }

  async updateBlocker(data: { id: string; blocker: string | null }, client: DealClient = this.prisma): Promise<DealRow> {
    return client.deal.update({
      where: { id: data.id },
      data: { blocker: data.blocker },
      select: dealSelect,
    });
  }

  async updateDetails(data: UpdateDealDetailsData, client: DealClient = this.prisma): Promise<DealRow> {
    return client.deal.update({
      where: { id: data.id },
      data: {
        currentHolderId: data.currentHolderId,
        assignedDepartmentId: data.assignedDepartmentId ?? null,
        stageDueAt: data.stageDueAt,
      },
      select: dealSelect,
    });
  }

  async listHandoffBoard(branchId: string | null): Promise<DealRow[]> {
    return this.prisma.deal.findMany({
      where: branchId ? { branchId } : {},
      orderBy: [{ stageDueAt: 'asc' }, { updatedAt: 'asc' }],
      select: dealSelect,
    });
  }

  async listHandoffHistory(dealIds: string[]): Promise<DealAuditRow[]> {
    if (dealIds.length === 0) return [];
    return this.prisma.auditLog.findMany({
      where: { targetType: 'deal', targetId: { in: dealIds } },
      orderBy: { createdAt: 'desc' },
      select: dealAuditSelect,
    });
  }
}
