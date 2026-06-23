import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import argon2 from 'argon2';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { AdminUsersRepository } from './admin-users.repository.js';
import type { AdminBranchOption, AdminRoleOption, AdminUserRecord, AssignableStaffRecord } from './admin-users.repository.js';

export type AdminUserDto = {
  id: string; email: string; username: string | null; nameEn: string; nameAr: string; roleCode: string; roleName: string;
  branchId: string | null; branchName: string | null; isActive: boolean; lockedAt: string | null; lastLoginAt: string | null;
};
export type AdminUsersResponse = { users: AdminUserDto[]; roles: AdminRoleOption[]; branches: AdminBranchOption[] };
export type CreateAdminUserInput = { email: string; nameEn: string; nameAr: string; roleCode: string; branchId?: string | null; initialPassword: string };
export type StaffLookupActor = { userId: string; roleCode: string; branchId: string | null };
export type AssignableStaffDto = { userId: string; displayName: string; displayNameAr: string; role: string; roleAr: string; branchLabel: string | null; branchLabelAr: string | null };
export type AssignableStaffResponse = { staff: AssignableStaffDto[] };
type AdminAudit = { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };

@Injectable()
export class AdminUsersService {
  constructor(@Inject(AdminUsersRepository) private readonly repository: AdminUsersRepository, @Inject(AuditService) private readonly audit: AuditService) {}

  async list(): Promise<AdminUsersResponse> {
    const [users, options] = await Promise.all([this.repository.listUsers(), this.repository.options()]);
    return { users: users.map(userDto), ...options };
  }

  async assignableStaff(actor: StaffLookupActor): Promise<AssignableStaffResponse> {
    const branchId = actor.roleCode === RoleCode.ADMIN ? null : requiredBranch(actor);
    return { staff: (await this.repository.listAssignableStaff(branchId)).map(assignableStaffDto) };
  }

  async assertAssignable(actor: StaffLookupActor, userId: string): Promise<void> {
    const user = await this.repository.findAssignableStaff(nonEmpty(userId, 'userId'));
    if (!user || (actor.roleCode !== RoleCode.ADMIN && user.branch?.id !== requiredBranch(actor))) {
      throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
    }
  }

  async create(input: CreateAdminUserInput, audit: AdminAudit = {}): Promise<AdminUserDto> {
    const data = await this.createData(input);
    return this.repository.transaction(async (client) => {
      const user = await this.repository.create(data, client);
      await this.audit.record(auditInput('admin_user_created', user, audit, { email: user.email, roleCode: user.role.code, branchId: user.branch?.id ?? null }), client);
      return userDto(user);
    });
  }

  async setActive(id: string, active: boolean, audit: AdminAudit = {}): Promise<AdminUserDto> {
    return this.repository.transaction(async (client) => {
      const user = await this.repository.setActive(nonEmpty(id, 'id'), active, client);
      await this.audit.record(auditInput(active ? 'admin_user_reactivated' : 'admin_user_deactivated', user, audit), client);
      return userDto(user);
    });
  }

  private async createData(input: CreateAdminUserInput) {
    const email = nonEmpty(input.email, 'email').toLowerCase();
    if (!email.includes('@')) throw validation('email', 'email is invalid.');
    const roleId = await this.repository.roleId(input.roleCode);
    if (!roleId || input.roleCode === RoleCode.CUSTOMER_PORTAL) throw validation('roleCode', 'roleCode is invalid.');
    const branchId = optionalText(input.branchId, 'branchId');
    if (branchId && !(await this.repository.branchExists(branchId))) throw validation('branchId', 'branchId is invalid.');
    const password = nonEmpty(input.initialPassword, 'initialPassword');
    if (password.length < 12) throw validation('initialPassword', 'initialPassword must be at least 12 characters.');
    return {
      email, nameEn: nonEmpty(input.nameEn, 'nameEn'), nameAr: nonEmpty(input.nameAr, 'nameAr'),
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }), roleId, branchId,
    };
  }
}

function userDto(user: AdminUserRecord): AdminUserDto {
  return {
    id: user.id, email: user.email, username: user.username, nameEn: user.nameEn, nameAr: user.nameAr, roleCode: user.role.code, roleName: user.role.nameEn,
    branchId: user.branch?.id ?? null, branchName: user.branch?.nameEn ?? null, isActive: user.isActive,
    lockedAt: user.lockedAt?.toISOString() ?? null, lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

function assignableStaffDto(user: AssignableStaffRecord): AssignableStaffDto {
  return {
    userId: user.id, displayName: user.nameEn, displayNameAr: user.nameAr, role: user.role.nameEn, roleAr: user.role.nameAr,
    branchLabel: user.branch?.nameEn ?? null, branchLabelAr: user.branch?.nameAr ?? null,
  };
}

function requiredBranch(actor: StaffLookupActor): string {
  if (!actor.branchId) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  return actor.branchId;
}

function auditInput(action: string, user: AdminUserRecord, audit: AdminAudit, metadata?: Record<string, unknown>): AuditRecordInput {
  return {
    eventType: 'CONFIG', action, actorId: audit.actorId ?? null, branchId: user.branch?.id ?? null,
    targetType: 'user', targetId: user.id, correlationId: audit.correlationId ?? null,
    ipAddress: audit.ipAddress ?? null, userAgent: audit.userAgent ?? null,
    ...(metadata ? { metadata: { changedFields: Object.keys(metadata), ...metadata } } : {}),
  };
}

function nonEmpty(value: string | undefined | null, field: string): string {
  const text = value?.trim() ?? '';
  if (!text) throw validation(field, `${field} is required.`);
  return text;
}

function optionalText(value: string | undefined | null, field: string): string | null {
  const text = value?.trim() ?? '';
  if (!text) return null;
  return nonEmpty(text, field);
}

function validation(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid admin user request', HttpStatus.BAD_REQUEST, [{ field, code: 'REQUIRED', message }]);
}
