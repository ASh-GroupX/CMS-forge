import { Injectable } from '@nestjs/common';
import { ComplaintSeverity, RoleCode } from '@prisma/client';
import type { StaffPrincipal } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';

export type ComplaintFormOptions = {
  branches: Array<{ id: string; code: string; nameEn: string; nameAr: string }>;
  categories: Array<{ id: string; code: string; nameEn: string; nameAr: string; parentId: string | null }>;
  severities: ComplaintSeverity[];
};

@Injectable()
export class ComplaintFormOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(principal: StaffPrincipal): Promise<ComplaintFormOptions> {
    const [branches, categories] = await Promise.all([
      this.prisma.branch.findMany({
        orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
        select: { id: true, code: true, nameEn: true, nameAr: true },
        where: { isActive: true, ...(principal.roleCode === RoleCode.ADMIN ? {} : { id: principal.branchId ?? '' }) },
      }),
      this.prisma.category.findMany({
        orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
        select: { id: true, code: true, nameEn: true, nameAr: true, parentId: true },
        where: { isActive: true },
      }),
    ]);
    return { branches, categories, severities: Object.values(ComplaintSeverity) };
  }
}
