import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const userSelect = {
  id: true, email: true, username: true, nameEn: true, nameAr: true, isActive: true, lockedAt: true,
  lastLoginAt: true, createdAt: true, updatedAt: true,
  role: { select: { id: true, code: true, nameEn: true, nameAr: true } },
  branch: { select: { id: true, code: true, nameEn: true, nameAr: true } },
  department: { select: { id: true, code: true, nameEn: true, nameAr: true, branchId: true } },
} satisfies Prisma.UserSelect;

const roleSelect = { id: true, code: true, nameEn: true, nameAr: true } satisfies Prisma.RoleSelect;
const branchSelect = { id: true, code: true, nameEn: true, nameAr: true } satisfies Prisma.BranchSelect;
const departmentSelect = { id: true, code: true, nameEn: true, nameAr: true, branchId: true } satisfies Prisma.DepartmentSelect;

export type AdminUserRecord = Prisma.UserGetPayload<{ select: typeof userSelect }>;
export type AdminRoleOption = Prisma.RoleGetPayload<{ select: typeof roleSelect }>;
export type AdminBranchOption = Prisma.BranchGetPayload<{ select: typeof branchSelect }>;
export type AdminDepartmentOption = Prisma.DepartmentGetPayload<{ select: typeof departmentSelect }>;
export type AssignableStaffRecord = Prisma.UserGetPayload<{ select: typeof userSelect }>;
type AdminUserClient = Pick<Prisma.TransactionClient, 'user'>;

export type CreateAdminUserData = {
  email: string; nameEn: string; nameAr: string; passwordHash: string; roleId: string; branchId: string | null; departmentId: string;
};

@Injectable()
export class AdminUsersRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async listUsers(): Promise<AdminUserRecord[]> {
    return this.prisma.user.findMany({ orderBy: [{ nameEn: 'asc' }, { email: 'asc' }], select: userSelect });
  }

  async listAssignableStaff(branchId: string | null): Promise<AssignableStaffRecord[]> {
    return this.prisma.user.findMany({
      where: { isActive: true, lockedAt: null, role: { code: { not: 'CUSTOMER_PORTAL' } }, ...(branchId ? { branchId } : {}) },
      orderBy: [{ nameEn: 'asc' }, { email: 'asc' }],
      select: userSelect,
    });
  }

  async findAssignableStaff(id: string): Promise<AssignableStaffRecord | null> {
    return this.prisma.user.findFirst({
      where: { id, isActive: true, lockedAt: null, role: { code: { not: 'CUSTOMER_PORTAL' } } },
      select: userSelect,
    });
  }

  async options(): Promise<{ roles: AdminRoleOption[]; branches: AdminBranchOption[]; departments: AdminDepartmentOption[] }> {
    const [roles, branches, departments] = await Promise.all([
      this.prisma.role.findMany({ where: { isActive: true, code: { not: 'CUSTOMER_PORTAL' } }, orderBy: { nameEn: 'asc' }, select: roleSelect }),
      this.prisma.branch.findMany({ where: { isActive: true }, orderBy: [{ nameEn: 'asc' }, { code: 'asc' }], select: branchSelect }),
      this.prisma.department.findMany({ where: { isActive: true }, orderBy: [{ nameEn: 'asc' }, { code: 'asc' }], select: departmentSelect }),
    ]);
    return { roles, branches, departments };
  }

  async roleId(code: string): Promise<string | null> {
    return (await this.prisma.role.findFirst({ where: { code, isActive: true }, select: { id: true } }))?.id ?? null;
  }

  async branchExists(id: string): Promise<boolean> {
    return Boolean(await this.prisma.branch.findUnique({ where: { id }, select: { id: true } }));
  }

  async activeDepartment(id: string): Promise<AdminDepartmentOption | null> {
    return this.prisma.department.findFirst({ where: { id, isActive: true }, select: departmentSelect });
  }

  async create(data: CreateAdminUserData, client: AdminUserClient = this.prisma): Promise<AdminUserRecord> {
    return client.user.create({ data, select: userSelect });
  }

  async setActive(id: string, active: boolean, client: AdminUserClient = this.prisma): Promise<AdminUserRecord> {
    return client.user.update({ where: { id }, data: { isActive: active, lockedAt: active ? null : new Date() }, select: userSelect });
  }

  async updateDepartment(id: string, departmentId: string, client: AdminUserClient = this.prisma): Promise<AdminUserRecord> {
    return client.user.update({ where: { id }, data: { departmentId }, select: userSelect });
  }
}
