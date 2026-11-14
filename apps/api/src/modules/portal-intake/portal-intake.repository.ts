import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

@Injectable()
export class PortalIntakeRepository {
  constructor(private readonly prisma: PrismaService) {}
  form(tx: Prisma.TransactionClient | PrismaService = this.prisma) { return tx.portalIntakeForm.findUnique({ where: { id: 'default' } }); }
  async saveForm(fields: Prisma.InputJsonValue, version: number | null, tx: Prisma.TransactionClient) {
    if (version === null) return tx.portalIntakeForm.create({ data: { id: 'default', fields } });
    const changed = await tx.portalIntakeForm.updateMany({ where: { id: 'default', version }, data: { fields, version: { increment: 1 } } });
    return changed.count === 1 ? tx.portalIntakeForm.findUniqueOrThrow({ where: { id: 'default' } }) : null;
  }
  transaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) { return this.prisma.$transaction(work); }
  get(tx: Prisma.TransactionClient | PrismaService = this.prisma) { return tx.portalIntakeSetting.findUnique({ where: { id: 'default' }, include: { members: { where: { removedAt: null }, select: { id: true, userId: true } } } }); }
  async advance(input: { branchId: string; categoryId: string; redirectBranchId: string; redirectDepartmentId: string; phoneCountryCode: string }, expectedVersion: number | null, tx: Prisma.TransactionClient) {
    if (expectedVersion === null) return tx.portalIntakeSetting.create({ data: { id: 'default', ...input } });
    const update = await tx.portalIntakeSetting.updateMany({ where: { id: 'default', version: expectedVersion }, data: { ...input, version: { increment: 1 } } });
    return update.count === 1 ? tx.portalIntakeSetting.findUniqueOrThrow({ where: { id: 'default' } }) : null;
  }
  remove(id: string, tx: Prisma.TransactionClient) { return tx.portalIntakeMember.update({ where: { id }, data: { removedAt: new Date() } }); }
  add(userId: string, tx: Prisma.TransactionClient) { return tx.portalIntakeMember.create({ data: { settingId: 'default', userId } }); }
  defaults() { return this.prisma.portalIntakeSetting.findUnique({ where: { id: 'default' }, select: { branchId: true, categoryId: true, phoneCountryCode: true, branch: { select: { isActive: true, timezone: true, departments: { where: { isActive: true }, select: { id: true }, orderBy: { id: 'asc' }, take: 1 } } }, category: { select: { isActive: true, branchId: true, department: { select: { id: true, isActive: true } } } } } }); }
  recipients() { return this.prisma.portalIntakeMember.findMany({ where: { settingId: 'default', removedAt: null, user: { isActive: true, lockedAt: null, role: { OR: [{ code: { in: ['ADMIN', 'CR_MANAGER'] } }, { permissions: { some: { permission: { code: 'COMPLAINT_MANAGE', isActive: true } } } }] } } }, select: { userId: true } }); }
}
