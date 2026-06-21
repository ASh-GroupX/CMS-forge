import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA, MODULE_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '@prisma/client';
import argon2 from 'argon2';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { AuthModule } from '../../src/modules/auth/auth.module.ts';
import { AdminModule } from '../../src/modules/admin/admin.module.ts';
import { AdminUsersController } from '../../src/modules/admin/admin-users.controller.ts';
import { AdminUsersRepository } from '../../src/modules/admin/admin-users.repository.ts';
import type { AdminUserRecord } from '../../src/modules/admin/admin-users.repository.ts';
import { AdminUsersService } from '../../src/modules/admin/admin-users.service.ts';

const userRecord: AdminUserRecord = {
  id: 'usr_1',
  email: 'advisor@cms-auto.test',
  nameEn: 'Service Advisor',
  nameAr: 'Service Advisor',
  isActive: true,
  lockedAt: null,
  lastLoginAt: null,
  createdAt: new Date('2026-06-20T10:00:00.000Z'),
  updatedAt: new Date('2026-06-20T11:00:00.000Z'),
  role: { id: 'role_cr', code: RoleCode.CR_OFFICER, nameEn: 'CR Officer', nameAr: 'CR Officer' },
  branch: { id: 'branch_main', code: 'MAIN', nameEn: 'Main branch', nameAr: 'Main branch' },
};

const admin: StaffPrincipal = {
  sessionId: 'ses_admin',
  userId: 'usr_admin',
  email: 'admin@cms-auto.test',
  nameEn: 'Admin',
  nameAr: 'Admin',
  roleCode: RoleCode.ADMIN,
  branchId: null,
};

test('admin user service lists users and option data without credential material', async () => {
  const service = new AdminUsersService({
    listUsers: async () => [userRecord],
    options: async () => ({
      roles: [userRecord.role],
      branches: [userRecord.branch!],
    }),
  } as AdminUsersRepository, noopAudit());

  const result = await service.list();

  assert.equal(result.users[0]?.email, 'advisor@cms-auto.test');
  assert.equal(result.users[0]?.branchName, 'Main branch');
  assert.equal(result.roles[0]?.code, RoleCode.CR_OFFICER);
  assert.equal(JSON.stringify(result).includes('password'), false);
  assert.equal(JSON.stringify(result).includes('hash'), false);
});

test('admin user service creates an account with hashed password and CONFIG audit in one transaction', async () => {
  const txClient = {};
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  let passwordHash = '';
  const service = new AdminUsersService({
    roleId: async (code) => code === RoleCode.CR_OFFICER ? 'role_cr' : null,
    branchExists: async (id) => id === 'branch_main',
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    create: async (data, client) => {
      assert.equal(client, txClient);
      passwordHash = data.passwordHash;
      return { ...userRecord, email: data.email, nameEn: data.nameEn, nameAr: data.nameAr };
    },
  } as AdminUsersRepository, {
    record: async (input: AuditRecordInput, client?: unknown) => auditRecords.push({ input, client }),
  } as AuditService);

  const created = await service.create(
    {
      email: ' ADVISOR@CMS-AUTO.TEST ',
      nameEn: ' Service Advisor ',
      nameAr: ' Service Advisor ',
      roleCode: RoleCode.CR_OFFICER,
      branchId: 'branch_main',
      initialPassword: 'ChangeMe12345!',
    },
    auditContext(),
  );

  assert.equal(created.email, 'advisor@cms-auto.test');
  assert.notEqual(passwordHash, 'ChangeMe12345!');
  assert.equal(await argon2.verify(passwordHash, 'ChangeMe12345!'), true);
  assert.equal(auditRecords[0]?.client, txClient);
  assert.equal(auditRecords[0]?.input.eventType, 'CONFIG');
  assert.equal(auditRecords[0]?.input.action, 'admin_user_created');
  assert.equal(auditRecords[0]?.input.actorId, 'usr_admin');
  assert.equal(JSON.stringify(auditRecords).includes('ChangeMe12345!'), false);
  assert.equal(JSON.stringify(auditRecords).includes(passwordHash), false);
});

test('admin user service deactivates and reactivates with audit entries', async () => {
  const txClient = {};
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const service = new AdminUsersService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    setActive: async (id, active, client) => {
      assert.equal(id, 'usr_1');
      assert.equal(client, txClient);
      return { ...userRecord, isActive: active, lockedAt: active ? null : new Date('2026-06-20T12:00:00.000Z') };
    },
  } as AdminUsersRepository, {
    record: async (input: AuditRecordInput, client?: unknown) => auditRecords.push({ input, client }),
  } as AuditService);

  assert.equal((await service.setActive('usr_1', false, auditContext())).isActive, false);
  assert.equal((await service.setActive('usr_1', true, auditContext())).isActive, true);
  assert.deepEqual(auditRecords.map((record) => record.input.action), ['admin_user_deactivated', 'admin_user_reactivated']);
  assert.equal(auditRecords.every((record) => record.client === txClient), true);
});

test('admin users controller routes are admin-only and CSRF guarded for writes', async () => {
  assert.deepEqual(guardNames('list'), ['SessionAuthGuard', 'RbacGuard']);
  assert.deepEqual(guardNames('create'), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('deactivate'), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('reactivate'), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);

  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);
  assert.equal(await guard.canActivate(context(request(RoleCode.ADMIN), 'create')), true);

  await assert.rejects(
    guard.canActivate(context(request(RoleCode.CR_MANAGER), 'create')),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'rbac_forbidden');
});

test('admin module wires auth guard providers for runtime requests', () => {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AdminModule) as unknown[];
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AdminModule) as unknown[];

  assert.ok(imports.includes(AuthModule));
  assert.ok(providers.includes(SessionAuthGuard));
  assert.ok(providers.includes(RbacGuard));
  assert.equal(providers.some((provider) => providerObject(provider)?.provide === SESSION_AUTH_SERVICE), true);
});

function noopAudit(): AuditService {
  return { record: async () => undefined } as unknown as AuditService;
}

function auditContext() {
  return { actorId: 'usr_admin', correlationId: 'req_admin_user', ipAddress: '127.0.0.1', userAgent: 'node:test' };
}

function request(roleCode: RoleCode): AuthenticatedRequest {
  return {
    principal: { ...admin, roleCode },
    url: '/admin/users',
    correlationId: 'req_admin_user',
    headers: { 'x-forwarded-for': '127.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '127.0.0.2' },
  };
}

function context(req: AuthenticatedRequest, handler: keyof AdminUsersController): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => AdminUsersController.prototype[handler],
    getClass: () => AdminUsersController,
  } as ExecutionContext;
}

function guardNames(handler: keyof AdminUsersController): string[] {
  const guards = Reflect.getMetadata(GUARDS_METADATA, AdminUsersController.prototype[handler]) as Array<{ name: string }>;
  return guards.map((guard) => guard.name);
}

function providerObject(provider: unknown): { provide?: unknown } | null {
  return provider && typeof provider === 'object' ? provider as { provide?: unknown } : null;
}
