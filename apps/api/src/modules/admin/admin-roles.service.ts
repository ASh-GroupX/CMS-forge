import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { AdminRolesRepository } from './admin-roles.repository.js';
import type { AdminPermissionRecord, AdminRoleRecord, CreateAdminRoleData } from './admin-roles.repository.js';

export type AdminPermissionDto = { id: string; code: string; nameEn: string; nameAr: string };
export type AdminRoleDto = AdminPermissionDto & { isActive: boolean; isSystem: boolean; permissions: AdminPermissionDto[]; updatedAt: string; affectedActiveUserCount: number };
export type AdminRolesResponse = { roles: AdminRoleDto[]; permissions: AdminPermissionDto[] };
export type CreateAdminRoleInput = { code: string; nameEn: string; nameAr: string; permissionCodes: string[] };
export type UpdateAdminRolePermissionsInput = { permissionCodes: string[]; expectedUpdatedAt: string };
export type AdminRolePermissionPreview = { addedPermissionCodes: string[]; removedPermissionCodes: string[]; affectedActiveUserCount: number; wouldRemoveActorAccess: boolean; wouldRemoveLastRoleManager: boolean; allowed: boolean; denialReason: 'ROLE_SELF_LOCKOUT' | 'ROLE_LAST_MANAGER' | null; updatedAt: string };
type AdminAudit = { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };

@Injectable()
export class AdminRolesService {
  constructor(private readonly repository: AdminRolesRepository, private readonly audit: AuditService) {}

  async list(): Promise<AdminRolesResponse> {
    const [roles, permissions, counts] = await Promise.all([this.repository.listRoles(), this.repository.listPermissions(), this.repository.activeUserCounts()]);
    return { roles: roles.map((role) => roleDto(role, counts.get(role.id) ?? 0)), permissions: permissions.map(permissionDto) };
  }

  async create(input: CreateAdminRoleInput, audit: AdminAudit = {}): Promise<AdminRoleDto> {
    const data = await this.createData(input);
    return this.repository.transaction(async (client) => {
      const role = await this.repository.create(data, client);
      await this.audit.record(auditInput(role, audit), client);
      return roleDto(role, 0);
    });
  }

  async previewPermissions(id: string, input: UpdateAdminRolePermissionsInput, audit: AdminAudit = {}): Promise<AdminRolePermissionPreview> {
    const role = await this.requiredEditableRole(id);
    this.assertVersion(role, input.expectedUpdatedAt);
    await this.permissionIds(input.permissionCodes);
    return this.permissionImpact(role, input.permissionCodes, audit.actorId ?? null);
  }

  async updatePermissions(id: string, input: UpdateAdminRolePermissionsInput, audit: AdminAudit = {}): Promise<AdminRoleDto> {
    const role = await this.requiredEditableRole(id);
    this.assertVersion(role, input.expectedUpdatedAt);
    const permissionIds = await this.permissionIds(input.permissionCodes);
    return this.repository.transaction(async (client) => {
      const current = await this.repository.findById(role.id, client);
      if (!current) throw validation('id', 'role cannot be updated.');
      this.assertVersion(current, input.expectedUpdatedAt);
      const impact = await this.permissionImpact(current, input.permissionCodes, audit.actorId ?? null, client);
      if (!impact.allowed) throw conflict(impact.denialReason!);
      const updated = await this.repository.replacePermissions(current.id, permissionIds, client);
      await this.audit.record(permissionAuditInput(current, updated, audit), client);
      return roleDto(updated, impact.affectedActiveUserCount);
    });
  }

  private async requiredEditableRole(id: string): Promise<AdminRoleRecord> {
    const role = await this.repository.findById(nonEmpty(id, 'id'));
    if (!role || role.code === 'CUSTOMER_PORTAL') throw validation('id', 'role cannot be updated.');
    return role;
  }

  private assertVersion(role: AdminRoleRecord, expectedUpdatedAt: string): void {
    if (role.updatedAt.toISOString() !== nonEmpty(expectedUpdatedAt, 'expectedUpdatedAt')) throw conflict('ROLE_VERSION_CONFLICT');
  }

  private async permissionImpact(role: AdminRoleRecord, values: string[], actorId: string | null, client?: Parameters<AdminRolesRepository['findById']>[1]): Promise<AdminRolePermissionPreview> {
    const current = new Set(role.permissions.map(({ permission }) => permission.code));
    const next = new Set(values);
    const removesRoleManager = current.has('ROLES_MANAGE') && !next.has('ROLES_MANAGE');
    const [affectedActiveUserCount, actorRoleId, otherManagers] = await Promise.all([
      this.repository.countActiveUsersForRole(role.id, client),
      actorId ? this.repository.activeUserRoleId(actorId, client) : Promise.resolve(null),
      removesRoleManager ? this.repository.countOtherActiveRoleManagers(role.id, client) : Promise.resolve(1),
    ]);
    const wouldRemoveActorAccess = removesRoleManager && actorRoleId === role.id;
    const wouldRemoveLastRoleManager = removesRoleManager && affectedActiveUserCount > 0 && otherManagers === 0;
    const denialReason = wouldRemoveActorAccess ? 'ROLE_SELF_LOCKOUT' as const : wouldRemoveLastRoleManager ? 'ROLE_LAST_MANAGER' as const : null;
    return {
      addedPermissionCodes: [...next].filter((code) => !current.has(code)),
      removedPermissionCodes: [...current].filter((code) => !next.has(code)),
      affectedActiveUserCount,
      wouldRemoveActorAccess,
      wouldRemoveLastRoleManager,
      allowed: denialReason === null,
      denialReason,
      updatedAt: role.updatedAt.toISOString(),
    };
  }

  private async createData(input: CreateAdminRoleInput): Promise<CreateAdminRoleData> {
    const code = nonEmpty(input.code, 'code').toUpperCase();
    if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(code) || reservedCodes.has(code)) throw validation('code', 'code is invalid.');
    const permissionIds = await this.permissionIds(input.permissionCodes);
    return { code, nameEn: nonEmpty(input.nameEn, 'nameEn'), nameAr: nonEmpty(input.nameAr, 'nameAr'), permissionIds };
  }

  private async permissionIds(values: string[]): Promise<string[]> {
    const permissionCodes = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
    if (!permissionCodes.includes('STAFF_LOGIN')) throw validation('permissionCodes', 'STAFF_LOGIN is required.');
    if (permissionCodes.includes('PORTAL_SUBMIT')) throw validation('permissionCodes', 'PORTAL_SUBMIT cannot be assigned to a staff role.');
    const permissionIds = await this.repository.activePermissionIds(permissionCodes);
    if (permissionIds.length !== permissionCodes.length) throw validation('permissionCodes', 'permissionCodes contains an invalid permission.');
    return permissionIds;
  }
}

const reservedCodes = new Set(['CR_OFFICER', 'CR_MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'MGMT_READONLY', 'CUSTOMER_PORTAL']);

function permissionDto(permission: AdminPermissionRecord): AdminPermissionDto {
  return { id: permission.id, code: permission.code, nameEn: permission.nameEn, nameAr: permission.nameAr };
}

function roleDto(role: AdminRoleRecord, affectedActiveUserCount: number): AdminRoleDto {
  return { id: role.id, code: role.code, nameEn: role.nameEn, nameAr: role.nameAr, isActive: role.isActive, isSystem: role.isSystem, permissions: role.permissions.map(({ permission }) => permissionDto(permission)), updatedAt: role.updatedAt.toISOString(), affectedActiveUserCount };
}

function auditInput(role: AdminRoleRecord, audit: AdminAudit): AuditRecordInput {
  return { eventType: 'CONFIG', action: 'admin_role_created', actorId: audit.actorId ?? null, branchId: null, targetType: 'role', targetId: role.id, correlationId: audit.correlationId ?? null, ipAddress: audit.ipAddress ?? null, userAgent: audit.userAgent ?? null, metadata: { changedFields: ['code', 'nameEn', 'nameAr', 'permissionCodes'], code: role.code, nameEn: role.nameEn, nameAr: role.nameAr, permissionCodes: role.permissions.map(({ permission }) => permission.code) } };
}

function permissionAuditInput(before: AdminRoleRecord, after: AdminRoleRecord, audit: AdminAudit): AuditRecordInput {
  return { eventType: 'CONFIG', action: 'admin_role_permissions_updated', actorId: audit.actorId ?? null, branchId: null, targetType: 'role', targetId: after.id, correlationId: audit.correlationId ?? null, ipAddress: audit.ipAddress ?? null, userAgent: audit.userAgent ?? null, metadata: { changedFields: ['permissionCodes'], code: after.code, previousPermissionCodes: before.permissions.map(({ permission }) => permission.code), permissionCodes: after.permissions.map(({ permission }) => permission.code) } };
}

function nonEmpty(value: string | undefined | null, field: string): string {
  const text = value?.trim() ?? '';
  if (!text) throw validation(field, `${field} is required.`);
  return text;
}

function validation(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid admin role request', HttpStatus.BAD_REQUEST, [{ field, code: 'REQUIRED', message }]);
}

function conflict(code: 'ROLE_SELF_LOCKOUT' | 'ROLE_LAST_MANAGER' | 'ROLE_VERSION_CONFLICT'): AppException {
  return new AppException(code, 'Role permissions changed or would remove required access', HttpStatus.CONFLICT);
}
