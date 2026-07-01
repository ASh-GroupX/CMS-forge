import { Injectable } from '@nestjs/common';
import { ComplaintSeverity, RoleCode } from '@prisma/client';
import type { StaffPrincipal } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';

export type ComplaintFormOptions = {
  branches: Array<{ id: string; code: string; nameEn: string; nameAr: string }>;
  categories: Array<{ id: string; code: string; nameEn: string; nameAr: string; parentId: string | null }>;
  departments: Array<{ id: string; code: string; nameEn: string; nameAr: string }>;
  severities: ComplaintSeverity[];
};

@Injectable()
export class ComplaintFormOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(principal: StaffPrincipal): Promise<ComplaintFormOptions> {
    const branchScope = principal.roleCode === RoleCode.ADMIN ? {} : { id: principal.branchId ?? '' };
    const departmentScope = principal.roleCode === RoleCode.ADMIN ? {} : { OR: [{ branchId: principal.branchId ?? '' }, { branchId: null }] };
    const [branches, categories, departments] = await Promise.all([
      this.prisma.branch.findMany({
        orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
        select: { id: true, code: true, nameEn: true, nameAr: true },
        where: { isActive: true, ...branchScope },
      }),
      this.prisma.category.findMany({
        orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
        select: { id: true, code: true, nameEn: true, nameAr: true, parentId: true },
        where: { isActive: true },
      }),
      this.prisma.department.findMany({
        orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
        select: { id: true, code: true, nameEn: true, nameAr: true },
        where: { isActive: true, ...departmentScope },
      }),
    ]);
    return { branches, categories, departments, severities: Object.values(ComplaintSeverity) };
  }
}
