import { HttpStatus, Injectable } from '@nestjs/common';
import { RoleCode, type Prisma } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import { AppException, PrismaService } from '../../core/http-kernel.js';

export type PortalIntakeSettingsInput = {
  branchId: string; categoryId: string; phoneCountryCode: string;
  memberIds: string[]; expectedVersion: number | null;
};

@Injectable()
export class PortalIntakeSettingsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async get() {
    const setting = await this.prisma.portalIntakeSetting.findUnique({
      where: { id: 'default' },
      include: { members: { where: { removedAt: null }, select: { userId: true } } },
    });
    return setting ? { branchId: setting.branchId, categoryId: setting.categoryId, phoneCountryCode: setting.phoneCountryCode, version: setting.version, memberIds: setting.members.map((member) => member.userId) } : null;
  }

  async save(input: PortalIntakeSettingsInput, actorId: string) {
    const memberIds = [...new Set(input.memberIds)];
    if (!input.branchId || !input.categoryId || !/^\+[1-9]\d{0,3}$/.test(input.phoneCountryCode) || memberIds.length < 1 || memberIds.length > 100 || memberIds.some((id) => !id.trim()) || input.expectedVersion !== null && (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1)) {
      throw invalidSettings();
    }
    return this.prisma.$transaction(async (tx) => {
      await this.validateTargets(tx, input, memberIds);
      const before = await tx.portalIntakeSetting.findUnique({ where: { id: 'default' }, include: { members: { where: { removedAt: null } } } });
      if ((before?.version ?? null) !== input.expectedVersion) throw new AppException('COMPLAINT_INVALID_TRANSITION', 'Intake settings changed. Reload and retry.', HttpStatus.CONFLICT);
      const setting = before
        ? await tx.portalIntakeSetting.update({ where: { id: 'default' }, data: { branchId: input.branchId, categoryId: input.categoryId, phoneCountryCode: input.phoneCountryCode, version: { increment: 1 } } })
        : await tx.portalIntakeSetting.create({ data: { id: 'default', branchId: input.branchId, categoryId: input.categoryId, phoneCountryCode: input.phoneCountryCode } });
      const oldIds = new Set(before?.members.map((member) => member.userId) ?? []);
      const newIds = new Set(memberIds);
      for (const member of before?.members ?? []) if (!newIds.has(member.userId)) await tx.portalIntakeMember.update({ where: { id: member.id }, data: { removedAt: new Date() } });
      for (const userId of memberIds) if (!oldIds.has(userId)) await tx.portalIntakeMember.create({ data: { settingId: setting.id, userId } });
      await this.audit.record({ eventType: 'CONFIG', action: 'portal_intake_settings_updated', actorId, targetType: 'portal_intake_settings', targetId: setting.id, branchId: input.branchId, metadata: { version: setting.version, changedFields: ['branchId', 'categoryId', 'phoneCountryCode', 'memberIds'], addedMemberIds: memberIds.filter((id) => !oldIds.has(id)), removedMemberIds: [...oldIds].filter((id) => !newIds.has(id)) } }, tx);
      return { branchId: setting.branchId, categoryId: setting.categoryId, phoneCountryCode: setting.phoneCountryCode, version: setting.version, memberIds };
    });
  }

  private async validateTargets(tx: Prisma.TransactionClient, input: PortalIntakeSettingsInput, memberIds: string[]) {
    const [branch, category, users] = await Promise.all([
      tx.branch.findFirst({ where: { id: input.branchId, isActive: true }, select: { id: true } }),
      tx.category.findFirst({ where: { id: input.categoryId, isActive: true }, select: { id: true, branchId: true } }),
      tx.user.findMany({ where: { id: { in: memberIds }, isActive: true }, select: { id: true, role: { select: { code: true, permissions: { select: { permission: { select: { code: true } } } } } } } }),
    ]);
    if (!branch || !category || category.branchId && category.branchId !== branch.id || users.length !== memberIds.length || users.some((user) => user.role.code !== RoleCode.ADMIN && user.role.code !== RoleCode.CR_MANAGER && !user.role.permissions.some((item) => item.permission.code === 'COMPLAINT_MANAGE'))) throw invalidSettings();
  }
}

function invalidSettings() {
  return new AppException('VALIDATION_FAILED', 'Invalid portal intake settings', HttpStatus.BAD_REQUEST);
}
