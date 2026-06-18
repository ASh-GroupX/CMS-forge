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

@Injectable()
export class BranchesRepository {
  constructor(private readonly prisma: PrismaService) {}

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
}
