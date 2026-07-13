import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { PermissionGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { AdminRolesController } from '../../src/modules/admin/admin-roles.controller.ts';
import { AdminRolesRepository } from '../../src/modules/admin/admin-roles.repository.ts';
import type { AdminPermissionRecord, AdminRoleRecord } from '../../src/modules/admin/admin-roles.repository.ts';
import { AdminRolesService } from '../../src/modules/admin/admin-roles.service.ts';

const login: AdminPermissionRecord = { id: 'per_login', code: 'STAFF_LOGIN', nameEn: 'Log in', nameAr: 'تسجيل الدخول' };
const updatedAt = new Date('2026-07-13T12:00:00.000Z');
const role: AdminRoleRecord = { id: 'role_custom', code: 'SERVICE_LEAD', nameEn: 'Service lead', nameAr: 'قائد الخدمة', isActive: true, isSystem: false, updatedAt, permissions: [{ permission: login }] };
const admin: StaffPrincipal = { sessionId: 'ses_admin', userId: 'usr_admin', email: 'admin@cms-auto.test', nameEn: 'Admin', nameAr: 'مدير', roleCode: RoleCode.ADMIN, permissions: ['ROLES_MANAGE'], branchId: null };

test('admin role service creates a selectable role and CONFIG audit in one transaction', async () => {
  const txClient = {};
  const audits: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const service = new AdminRolesService({
    activePermissionIds: async (codes) => codes.map((code) => `per_${code}`),
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    create: async (data, client) => {
      assert.equal(client, txClient);
      assert.deepEqual(data.permissionIds, ['per_STAFF_LOGIN', 'per_REPORT_VIEW']);
      return { ...role, permissions: [{ permission: login }, { permission: { ...login, id: 'per_REPORT_VIEW', code: 'REPORT_VIEW' } }] };
    },
  } as AdminRolesRepository, { record: async (input: AuditRecordInput, client?: unknown) => audits.push({ input, client }) } as AuditService);

  const created = await service.create({ code: ' service_lead ', nameEn: ' Service lead ', nameAr: ' قائد الخدمة ', permissionCodes: ['STAFF_LOGIN', 'REPORT_VIEW'] }, auditContext());

  assert.equal(created.code, 'SERVICE_LEAD');
  assert.deepEqual(created.permissions.map(({ code }) => code), ['STAFF_LOGIN', 'REPORT_VIEW']);
  assert.equal(audits[0]?.client, txClient);
  assert.equal(audits[0]?.input.action, 'admin_role_created');
  assert.equal(audits[0]?.input.eventType, 'CONFIG');
  assert.deepEqual(audits[0]?.input.metadata?.permissionCodes, ['STAFF_LOGIN', 'REPORT_VIEW']);
});

test('admin role service rejects reserved, unauthenticated, portal, and unknown permission selections', async () => {
  const service = new AdminRolesService({ activePermissionIds: async () => [] } as AdminRolesRepository, noopAudit());
  for (const input of [
    { code: 'ADMIN', permissionCodes: ['STAFF_LOGIN'] },
    { code: 'SERVICE_LEAD', permissionCodes: [] },
    { code: 'SERVICE_LEAD', permissionCodes: ['STAFF_LOGIN', 'PORTAL_SUBMIT'] },
    { code: 'SERVICE_LEAD', permissionCodes: ['STAFF_LOGIN', 'UNKNOWN'] },
  ]) {
    await assert.rejects(service.create({ ...input, nameEn: 'Service lead', nameAr: 'قائد الخدمة' }), (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED');
  }
});

test('admin role service replaces selected permissions and audits the change in one transaction', async () => {
  const txClient = {};
  const audits: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const service = new AdminRolesService({
    findById: async () => role,
    countActiveUsersForRole: async () => 2,
    activeUserRoleId: async () => 'role_admin',
    activePermissionIds: async (codes) => codes.map((code) => `per_${code}`),
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    replacePermissions: async (id, ids, client) => {
      assert.equal(id, role.id);
      assert.deepEqual(ids, ['per_STAFF_LOGIN', 'per_REPORT_VIEW']);
      assert.equal(client, txClient);
      return { ...role, permissions: [{ permission: login }, { permission: { ...login, id: 'per_report', code: 'REPORT_VIEW', nameEn: 'View reports' } }] };
    },
  } as AdminRolesRepository, { record: async (input: AuditRecordInput, client?: unknown) => audits.push({ input, client }) } as AuditService);

  const updated = await service.updatePermissions(role.id, { permissionCodes: ['STAFF_LOGIN', 'REPORT_VIEW'], expectedUpdatedAt: updatedAt.toISOString() }, auditContext());

  assert.deepEqual(updated.permissions.map(({ code }) => code), ['STAFF_LOGIN', 'REPORT_VIEW']);
  assert.equal(audits[0]?.client, txClient);
  assert.equal(audits[0]?.input.action, 'admin_role_permissions_updated');
  assert.deepEqual(audits[0]?.input.metadata?.previousPermissionCodes, ['STAFF_LOGIN']);
});

test('admin role service blocks stale edits, self lockout, and removal of the last role manager', async () => {
  const manage = { ...login, id: 'per_manage', code: 'ROLES_MANAGE', nameEn: 'Manage roles' };
  const managedRole: AdminRoleRecord = { ...role, permissions: [{ permission: login }, { permission: manage }] };
  const repository = {
    findById: async () => managedRole,
    activePermissionIds: async (codes: string[]) => codes.map((code) => `per_${code}`),
    countActiveUsersForRole: async () => 1,
    activeUserRoleId: async () => managedRole.id,
    countOtherActiveRoleManagers: async () => 0,
  } as unknown as AdminRolesRepository;
  const service = new AdminRolesService(repository, noopAudit());
  await assert.rejects(
    service.previewPermissions(managedRole.id, { permissionCodes: ['STAFF_LOGIN'], expectedUpdatedAt: '2026-07-12T00:00:00.000Z' }, auditContext()),
    (error: unknown) => error instanceof AppException && error.code === 'ROLE_VERSION_CONFLICT',
  );
  const selfLockout = await service.previewPermissions(managedRole.id, { permissionCodes: ['STAFF_LOGIN'], expectedUpdatedAt: updatedAt.toISOString() }, auditContext());
  assert.equal(selfLockout.allowed, false);
  assert.equal(selfLockout.denialReason, 'ROLE_SELF_LOCKOUT');
  repository.activeUserRoleId = async () => 'role_other';
  const lastManager = await service.previewPermissions(managedRole.id, { permissionCodes: ['STAFF_LOGIN'], expectedUpdatedAt: updatedAt.toISOString() }, auditContext());
  assert.equal(lastManager.allowed, false);
  assert.equal(lastManager.denialReason, 'ROLE_LAST_MANAGER');
});

test('admin role controller routes require ROLES_MANAGE permission and CSRF for writes', async () => {
  assert.deepEqual(guardNames('list'), ['SessionAuthGuard', 'PermissionGuard']);
  assert.deepEqual(guardNames('create'), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('updatePermissions'), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('previewPermissions'), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);
  for (const handler of ['list', 'create', 'updatePermissions', 'previewPermissions'] as Array<keyof AdminRolesController>) {
    assert.equal(guardNames(handler).includes('RbacGuard'), false);
  }
  const audits: AuditRecordInput[] = [];
  const guard = new PermissionGuard(new Reflector(), { record: async (input) => audits.push(input) } as AuditService);
  assert.equal(await guard.canActivate(context(request(RoleCode.CR_MANAGER, ['ROLES_MANAGE']), 'create')), true);
  await assert.rejects(
    guard.canActivate(context(request(RoleCode.ADMIN, [], '/admin/roles?password=leaked&sessionToken=leaked', 'node:test token secret'), 'create')),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(audits[0]?.eventType, 'SECURITY');
  assert.equal(audits[0]?.action, 'permission_forbidden');
  assert.deepEqual(audits[0]?.metadata?.requiredPermissions, ['ROLES_MANAGE']);
  const auditJson = JSON.stringify(audits).toLowerCase();
  for (const forbidden of ['password', 'otp', 'token', 'reset token', 'session token', 'hash', 'secret', 'credential', 'provider']) {
    assert.equal(auditJson.includes(forbidden), false);
  }
});

function noopAudit(): AuditService { return { record: async () => undefined } as unknown as AuditService; }
function auditContext() { return { actorId: 'usr_admin', correlationId: 'req_roles', ipAddress: '127.0.0.1', userAgent: 'node:test' }; }
function request(roleCode: RoleCode, permissions = admin.permissions, url = '/admin/roles', userAgent = 'node:test'): AuthenticatedRequest { return { principal: { ...admin, roleCode, permissions }, method: 'POST', url, correlationId: 'req_roles', headers: { 'user-agent': userAgent }, socket: { remoteAddress: '127.0.0.1' } }; }
function context(req: AuthenticatedRequest, handler: keyof AdminRolesController): ExecutionContext { return { switchToHttp: () => ({ getRequest: () => req }), getHandler: () => AdminRolesController.prototype[handler], getClass: () => AdminRolesController } as ExecutionContext; }
function guardNames(handler: keyof AdminRolesController): string[] { return (Reflect.getMetadata(GUARDS_METADATA, AdminRolesController.prototype[handler]) as Array<{ name: string }>).map(({ name }) => name); }
