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

export type PublicComplaintFormOptions = {
  branches: Array<{ id: string; nameEn: string; nameAr: string }>;
  categories: Array<{ id: string; nameEn: string; nameAr: string; parentId: string | null }>;
  severities: ComplaintSeverity[];
};

@Injectable()
export class ComplaintFormOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(): Promise<PublicComplaintFormOptions> {
    const [branches, categories] = await Promise.all([
      this.prisma.branch.findMany({
        orderBy: [{ nameEn: 'asc' }, { id: 'asc' }],
        select: { id: true, nameEn: true, nameAr: true },
        where: { isActive: true },
      }),
      this.prisma.category.findMany({
        orderBy: [{ nameEn: 'asc' }, { id: 'asc' }],
        select: { id: true, nameEn: true, nameAr: true, parentId: true },
        where: { isActive: true },
      }),
    ]);
    return { branches, categories, severities: Object.values(ComplaintSeverity) };
  }

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
