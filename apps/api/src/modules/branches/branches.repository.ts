import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const branchSelect = {
  id: true,
  code: true,
  nameEn: true,
  nameAr: true,
  timezone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BranchSelect;

export type BranchRecord = Prisma.BranchGetPayload<{ select: typeof branchSelect }>;
type BranchClient = Pick<Prisma.TransactionClient, 'branch'>;

export type CreateBranchData = {
  code: string;
  nameEn: string;
  nameAr: string;
  timezone?: string;
};

export type UpdateBranchData = Partial<CreateBranchData>;

@Injectable()
export class BranchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async listActive(): Promise<BranchRecord[]> {
    return this.prisma.branch.findMany({
      where: { isActive: true },
      orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
      select: branchSelect,
    });
  }

  async findByIdOrCode(idOrCode: string): Promise<BranchRecord | null> {
    return this.prisma.branch.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
      select: branchSelect,
    });
  }

  async create(data: CreateBranchData, client: BranchClient = this.prisma): Promise<BranchRecord> {
    return client.branch.create({
      data,
      select: branchSelect,
    });
  }

  async update(id: string, data: UpdateBranchData, client: BranchClient = this.prisma): Promise<BranchRecord> {
    return client.branch.update({
      where: { id },
      data,
      select: branchSelect,
    });
  }

  async deactivate(id: string, client: BranchClient = this.prisma): Promise<BranchRecord> {
    return client.branch.update({
      where: { id },
      data: { isActive: false },
      select: branchSelect,
    });
  }
}
