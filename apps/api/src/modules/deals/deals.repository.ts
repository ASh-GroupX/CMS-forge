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
  stage: true,
  stageDueAt: true,
  blocker: true,
  createdAt: true,
  updatedAt: true,
  branch: { select: { nameEn: true } },
  owner: { select: { nameEn: true } },
  currentHolder: { select: { nameEn: true } },
} satisfies Prisma.DealSelect;

export type DealRow = Prisma.DealGetPayload<{ select: typeof dealSelect }>;
type DealClient = Pick<Prisma.TransactionClient, 'deal'>;

export type CreateDealData = {
  title: string;
  branchId: string;
  ownerId: string;
  currentHolderId: string;
  stage: DealStageCode;
  stageDueAt: Date;
  blocker?: string | null;
};

export type UpdateDealStageData = {
  id: string;
  stage: DealStageCode;
  currentHolderId: string;
  stageDueAt: Date;
  blocker?: string | null;
};

@Injectable()
export class DealsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async create(data: CreateDealData, client: DealClient = this.prisma): Promise<DealRow> {
    return client.deal.create({ data, select: dealSelect });
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

  async listHandoffBoard(branchId: string | null): Promise<DealRow[]> {
    return this.prisma.deal.findMany({
      where: branchId ? { branchId } : {},
      orderBy: [{ stageDueAt: 'asc' }, { updatedAt: 'asc' }],
      select: dealSelect,
    });
  }
}
