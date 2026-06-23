import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const permissionSelect = { id: true, code: true, nameEn: true, nameAr: true } satisfies Prisma.PermissionSelect;
const roleSelect = {
  id: true, code: true, nameEn: true, nameAr: true, isActive: true, isSystem: true,
  permissions: { select: { permission: { select: permissionSelect } }, orderBy: { permission: { code: 'asc' } } },
} satisfies Prisma.RoleSelect;

export type AdminRoleRecord = Prisma.RoleGetPayload<{ select: typeof roleSelect }>;
export type AdminPermissionRecord = Prisma.PermissionGetPayload<{ select: typeof permissionSelect }>;
export type CreateAdminRoleData = { code: string; nameEn: string; nameAr: string; permissionIds: string[] };
type RoleClient = Pick<Prisma.TransactionClient, 'role'>;

@Injectable()
export class AdminRolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async listRoles(): Promise<AdminRoleRecord[]> {
    return this.prisma.role.findMany({ orderBy: { nameEn: 'asc' }, select: roleSelect });
  }

  async listPermissions(): Promise<AdminPermissionRecord[]> {
    return this.prisma.permission.findMany({ where: { isActive: true }, orderBy: { code: 'asc' }, select: permissionSelect });
  }

  async activePermissionIds(codes: string[]): Promise<string[]> {
    const permissions = await this.prisma.permission.findMany({ where: { isActive: true, code: { in: codes } }, select: { id: true } });
    return permissions.map(({ id }) => id);
  }

  async findById(id: string): Promise<AdminRoleRecord | null> {
    return this.prisma.role.findUnique({ where: { id }, select: roleSelect });
  }

  async create(data: CreateAdminRoleData, client: RoleClient = this.prisma): Promise<AdminRoleRecord> {
    return client.role.create({
      data: { code: data.code, nameEn: data.nameEn, nameAr: data.nameAr, permissions: { create: data.permissionIds.map((permissionId) => ({ permissionId })) } },
      select: roleSelect,
    });
  }

  async replacePermissions(id: string, permissionIds: string[], client: RoleClient = this.prisma): Promise<AdminRoleRecord> {
    return client.role.update({ data: { permissions: { deleteMany: {}, create: permissionIds.map((permissionId) => ({ permissionId })) } }, where: { id }, select: roleSelect });
  }
}
