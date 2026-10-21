import { Injectable } from '@nestjs/common';
import { ComplaintSeverity, RoleCode, ComplaintType } from '@prisma/client';
import type { StaffPrincipal } from '../../core/auth.guard.js';
import { PrismaService } from '../../core/http-kernel.js';

function hasGlobalView(principal: StaffPrincipal): boolean {
  if (principal.roleCode === RoleCode.ADMIN || principal.roleCode === RoleCode.CR_MANAGER || principal.roleCode === RoleCode.CR_OFFICER) return true;
  return principal.permissions?.includes('COMPLAINT_VIEW_ALL') ?? false;
}

export type ComplaintFormOptions = {
  branches: Array<{ id: string; code: string; nameEn: string; nameAr: string }>;
  categories: Array<{ id: string; code: string; nameEn: string; nameAr: string; departmentId: string | null; branchId: string | null }>;
  departments: Array<{ id: string; code: string; nameEn: string; nameAr: string; branchId: string | null }>;
  severities: ComplaintSeverity[];
  types: ComplaintType[];
  rootCauses: Array<{ id: string; nameEn: string; nameAr: string; order: number }>;
  salesAdvisors: Array<{ id: string; nameEn: string; nameAr: string; order: number }>;
  users: Array<{ id: string; nameEn: string; nameAr: string; email: string | null; phone?: string | null; departmentId: string | null; branchId: string | null; roleCode: RoleCode }>;
};

export type PublicComplaintFormOptions = {
  branches: Array<{ id: string; nameEn: string; nameAr: string }>;
  departments: Array<{ id: string; nameEn: string; nameAr: string; branchId: string | null }>;
  categories: Array<{ id: string; nameEn: string; nameAr: string; departmentId: string | null; branchId: string | null }>;
  severities: ComplaintSeverity[];
  types: ComplaintType[];
};

@Injectable()
export class ComplaintFormOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(): Promise<PublicComplaintFormOptions> {
    const [branches, departments, categories] = await Promise.all([
      this.prisma.branch.findMany({
        orderBy: [{ nameEn: 'asc' }, { id: 'asc' }],
        select: { id: true, nameEn: true, nameAr: true },
        where: { isActive: true },
      }),
      this.prisma.department.findMany({
        orderBy: [{ nameEn: 'asc' }, { id: 'asc' }],
        select: { id: true, nameEn: true, nameAr: true, branchId: true },
        where: { isActive: true },
      }),
      this.prisma.category.findMany({
        orderBy: [{ nameEn: 'asc' }, { id: 'asc' }],
        select: { id: true, nameEn: true, nameAr: true, departmentId: true, branchId: true },
        where: { isActive: true },
      }),
    ]);
    return { branches, departments, categories, severities: Object.values(ComplaintSeverity), types: Object.values(ComplaintType) };
  }

  async list(principal: StaffPrincipal): Promise<ComplaintFormOptions> {
    const isGlobal = hasGlobalView(principal);
    const branchScope = isGlobal ? {} : { id: principal.branchId ?? '' };
    const [branches, categories, departments, rootCauses, salesAdvisors, users] = await Promise.all([
      this.prisma.branch.findMany({
        orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
        select: { id: true, code: true, nameEn: true, nameAr: true },
        where: { isActive: true, ...branchScope },
      }),
      this.prisma.category.findMany({
        orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
        select: { id: true, code: true, nameEn: true, nameAr: true, departmentId: true, branchId: true },
        where: { isActive: true },
      }),
      this.prisma.department.findMany({
        orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
        select: { id: true, code: true, nameEn: true, nameAr: true, branchId: true },
        where: { isActive: true, ...(isGlobal ? {} : { OR: [{ branchId: principal.branchId ?? '' }, { branchId: null }] }) },
      }),
      this.prisma.complaintRootCause?.findMany({
        orderBy: [{ order: 'asc' }, { nameEn: 'asc' }],
        select: { id: true, nameEn: true, nameAr: true, order: true, complaintType: true },
        where: { isActive: true },
      })?.catch?.(() => []) ?? [],
      this.prisma.complaintSalesAdvisor?.findMany({
        orderBy: [{ order: 'asc' }, { nameEn: 'asc' }],
        select: { id: true, nameEn: true, nameAr: true, order: true },
        where: { isActive: true },
      })?.catch?.(() => []) ?? [],
      this.prisma.user?.findMany({
        orderBy: [{ nameEn: 'asc' }],
        select: { id: true, nameEn: true, nameAr: true, email: true, phone: true, departmentId: true, branchId: true, role: { select: { code: true } } },
        where: { isActive: true },
      })?.catch?.(() => []) ?? [],
    ]);
    const mappedUsers = (users || []).map((u: any) => ({
      id: u.id,
      nameEn: u.nameEn,
      nameAr: u.nameAr,
      email: u.email,
      phone: u.phone ?? null,
      departmentId: u.departmentId,
      branchId: u.branchId,
      roleCode: u.role.code as RoleCode,
    }));
    return { branches, categories, departments, severities: Object.values(ComplaintSeverity), types: Object.values(ComplaintType), rootCauses, salesAdvisors, users: mappedUsers };
  }
}
