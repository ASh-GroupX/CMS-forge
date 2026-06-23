import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { RbacGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { AdminRolesController } from '../../src/modules/admin/admin-roles.controller.ts';
import { AdminRolesRepository } from '../../src/modules/admin/admin-roles.repository.ts';
import type { AdminPermissionRecord, AdminRoleRecord } from '../../src/modules/admin/admin-roles.repository.ts';
import { AdminRolesService } from '../../src/modules/admin/admin-roles.service.ts';

const login: AdminPermissionRecord = { id: 'per_login', code: 'STAFF_LOGIN', nameEn: 'Log in', nameAr: 'تسجيل الدخول' };
const role: AdminRoleRecord = { id: 'role_custom', code: 'SERVICE_LEAD', nameEn: 'Service lead', nameAr: 'قائد الخدمة', isActive: true, isSystem: false, permissions: [{ permission: login }] };
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

test('admin role controller routes are admin-only, with CSRF required for creates', async () => {
  assert.deepEqual(guardNames('list'), ['SessionAuthGuard', 'RbacGuard']);
  assert.deepEqual(guardNames('create'), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);
  const audits: AuditRecordInput[] = [];
  const guard = new RbacGuard(new Reflector(), { record: async (input) => audits.push(input) } as AuditService);
  assert.equal(await guard.canActivate(context(request(RoleCode.ADMIN), 'create')), true);
  await assert.rejects(guard.canActivate(context(request(RoleCode.CR_MANAGER), 'create')), (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN');
  assert.equal(audits[0]?.action, 'rbac_forbidden');
});

function noopAudit(): AuditService { return { record: async () => undefined } as unknown as AuditService; }
function auditContext() { return { actorId: 'usr_admin', correlationId: 'req_roles', ipAddress: '127.0.0.1', userAgent: 'node:test' }; }
function request(roleCode: RoleCode): AuthenticatedRequest { return { principal: { ...admin, roleCode }, url: '/admin/roles', correlationId: 'req_roles', headers: {}, socket: { remoteAddress: '127.0.0.1' } }; }
function context(req: AuthenticatedRequest, handler: keyof AdminRolesController): ExecutionContext { return { switchToHttp: () => ({ getRequest: () => req }), getHandler: () => AdminRolesController.prototype[handler], getClass: () => AdminRolesController } as ExecutionContext; }
function guardNames(handler: keyof AdminRolesController): string[] { return (Reflect.getMetadata(GUARDS_METADATA, AdminRolesController.prototype[handler]) as Array<{ name: string }>).map(({ name }) => name); }
