import { HttpStatus, Injectable } from '@nestjs/common';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { AdminRolesRepository } from './admin-roles.repository.js';
import type { AdminPermissionRecord, AdminRoleRecord, CreateAdminRoleData } from './admin-roles.repository.js';

export type AdminPermissionDto = { id: string; code: string; nameEn: string; nameAr: string };
export type AdminRoleDto = AdminPermissionDto & { isActive: boolean; isSystem: boolean; permissions: AdminPermissionDto[] };
export type AdminRolesResponse = { roles: AdminRoleDto[]; permissions: AdminPermissionDto[] };
export type CreateAdminRoleInput = { code: string; nameEn: string; nameAr: string; permissionCodes: string[] };
export type UpdateAdminRolePermissionsInput = { permissionCodes: string[] };
type AdminAudit = { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };

@Injectable()
export class AdminRolesService {
  constructor(private readonly repository: AdminRolesRepository, private readonly audit: AuditService) {}

  async list(): Promise<AdminRolesResponse> {
    const [roles, permissions] = await Promise.all([this.repository.listRoles(), this.repository.listPermissions()]);
    return { roles: roles.map(roleDto), permissions: permissions.map(permissionDto) };
  }

  async create(input: CreateAdminRoleInput, audit: AdminAudit = {}): Promise<AdminRoleDto> {
    const data = await this.createData(input);
    return this.repository.transaction(async (client) => {
      const role = await this.repository.create(data, client);
      await this.audit.record(auditInput(role, audit), client);
      return roleDto(role);
    });
  }

  async updatePermissions(id: string, input: UpdateAdminRolePermissionsInput, audit: AdminAudit = {}): Promise<AdminRoleDto> {
    const role = await this.repository.findById(nonEmpty(id, 'id'));
    if (!role || role.code === 'CUSTOMER_PORTAL') throw validation('id', 'role cannot be updated.');
    const permissionIds = await this.permissionIds(input.permissionCodes);
    return this.repository.transaction(async (client) => {
      const updated = await this.repository.replacePermissions(role.id, permissionIds, client);
      await this.audit.record(permissionAuditInput(role, updated, audit), client);
      return roleDto(updated);
    });
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

function roleDto(role: AdminRoleRecord): AdminRoleDto {
  return { id: role.id, code: role.code, nameEn: role.nameEn, nameAr: role.nameAr, isActive: role.isActive, isSystem: role.isSystem, permissions: role.permissions.map(({ permission }) => permissionDto(permission)) };
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
