import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { PermissionGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { AuditController } from '../../src/modules/audit/audit.controller.ts';
import { AuditRepository } from '../../src/modules/audit/audit.repository.ts';
import { AuditSearchService } from '../../src/modules/audit/audit.service.ts';
import { MAX_EXPORT_ROWS } from '../../src/modules/audit/audit.service.ts';

const admin: StaffPrincipal = {
  sessionId: 'ses_admin',
  userId: 'usr_admin',
  email: 'admin@cms-auto.test',
  nameEn: 'Admin',
  nameAr: 'Admin',
  roleCode: 'ADMIN',
  permissions: ['AUDIT_VIEW', 'AUDIT_EXPORT'],
  branchId: 'branch_main',
};

const branchManager: StaffPrincipal = {
  ...admin,
  sessionId: 'ses_branch',
  userId: 'usr_branch',
  roleCode: 'BRANCH_MANAGER',
};

function request(principal: StaffPrincipal, url = '/audit/logs?branchId=branch_main'): AuthenticatedRequest {
  return {
    principal,
    method: 'GET',
    url,
    correlationId: 'req_test',
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'node:test',
    },
    socket: { remoteAddress: '127.0.0.2' },
  };
}

function context(
  req: AuthenticatedRequest,
  handler: typeof AuditController.prototype.search | typeof AuditController.prototype.export =
    AuditController.prototype.search,
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => handler,
    getClass: () => AuditController,
  } as ExecutionContext;
}

test('admin can search audit logs with filters and safe metadata', async () => {
  let receivedFilters: unknown;
  let receivedPage: unknown;
  const repository = {
    search: async (filters, page) => {
      receivedFilters = filters;
      receivedPage = page;
      return [{
        id: 'aud_1',
        eventType: 'AUTH',
        action: 'login_success',
        actorId: 'usr_admin',
        branchId: 'branch_main',
        targetType: 'staff_session',
        targetId: 'ses_admin',
        correlationId: 'req_test',
        ipAddress: '127.0.0.1',
        userAgent: 'node:test',
        metadata: { password: 'secret', nested: { tokenHash: 'hash', safe: 'ok' } },
        createdAt: new Date('2026-06-18T10:00:00.000Z'),
      }];
    },
  } as AuditRepository;

  const result = await new AuditController(new AuditSearchService(repository)).search(
    { eventType: 'AUTH', branchId: 'branch_main', page: '1', pageSize: '200' },
    request(admin),
  );

  assert.deepEqual(receivedFilters, { eventType: 'AUTH', branchId: 'branch_main' });
  assert.deepEqual(receivedPage, { page: 1, pageSize: 100 });
  assert.equal(JSON.stringify(result).includes('secret'), false);
  assert.equal(JSON.stringify(result).includes('hash'), false);
  assert.deepEqual(result, {
    items: [{
      id: 'aud_1',
      eventType: 'AUTH',
      action: 'login_success',
      actorId: 'usr_admin',
      branchId: 'branch_main',
      targetType: 'staff_session',
      targetId: 'ses_admin',
      correlationId: 'req_test',
      ipAddress: '127.0.0.1',
      userAgent: 'node:test',
      metadata: { password: '[REDACTED]', nested: { tokenHash: '[REDACTED]', safe: 'ok' } },
      createdAt: '2026-06-18T10:00:00.000Z',
    }],
    page: 1,
    pageSize: 100,
  });
});

test('audit controller routes use permission guard', () => {
  assert.deepEqual(guardNames('search'), ['SessionAuthGuard', 'PermissionGuard']);
  assert.deepEqual(guardNames('export'), ['SessionAuthGuard', 'PermissionGuard']);
});

test('audit search permission allows AUDIT_VIEW and denies missing permission safely', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new PermissionGuard(
    new Reflector(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  assert.equal(await guard.canActivate(context(request({ ...branchManager, permissions: ['AUDIT_VIEW'] }))), true);

  await assert.rejects(
    guard.canActivate(context(request({ ...admin, permissions: [] }, '/audit/logs?password=leaked&sessionToken=leaked'))),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );

  assertSafePermissionAudit(auditRecords, 'AUDIT_VIEW');
});

test('audit export permission allows AUDIT_EXPORT and denies missing permission safely', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new PermissionGuard(
    new Reflector(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  assert.equal(await guard.canActivate(context(request({ ...branchManager, permissions: ['AUDIT_EXPORT'] }, '/audit/logs/export'), AuditController.prototype.export)), true);

  await assert.rejects(
    guard.canActivate(context(request({ ...admin, permissions: [] }, '/audit/logs/export?password=leaked&sessionToken=leaked'), AuditController.prototype.export)),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );

  assertSafePermissionAudit(auditRecords, 'AUDIT_EXPORT');
});

test('audit search service allows required permission and denies missing permission', async () => {
  const repository = {
    search: async () => {
      return [];
    },
  } as AuditRepository;

  await assert.doesNotReject(
    new AuditSearchService(repository).search({}, { ...branchManager, permissions: ['AUDIT_VIEW'] }),
  );
  await assert.rejects(
    new AuditSearchService(repository).search({}, { ...admin, permissions: [] }),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
});

test('admin can export capped redacted audit logs and writes export audit', async () => {
  let receivedFilters: unknown;
  let receivedPage: unknown;
  const auditRecords: AuditRecordInput[] = [];
  const headers: Record<string, string> = {};
  const repository = {
    search: async (filters, page) => {
      receivedFilters = filters;
      receivedPage = page;
      return [{
        id: 'aud_1',
        eventType: 'SECURITY',
        action: 'rbac_forbidden',
        actorId: 'usr_branch',
        branchId: 'branch_main',
        targetType: 'api_route',
        targetId: '/audit/logs',
        correlationId: 'req_test',
        ipAddress: '127.0.0.1',
        userAgent: 'node:test',
        metadata: { credentialSecret: 'nope', safe: 'ok' },
        createdAt: new Date('2026-06-18T10:00:00.000Z'),
      }];
    },
  } as AuditRepository;

  const body = await new AuditController(new AuditSearchService(
    repository,
    { record: async (input) => auditRecords.push(input) } as AuditService,
  )).export(
    { eventType: 'SECURITY', branchId: 'branch_main', page: '10', pageSize: '1' },
    request(admin, '/audit/logs/export?branchId=branch_main'),
    { setHeader: (name, value) => { headers[name] = value; } },
  );

  assert.deepEqual(receivedFilters, { eventType: 'SECURITY', branchId: 'branch_main' });
  assert.deepEqual(receivedPage, { page: 1, pageSize: MAX_EXPORT_ROWS });
  assert.equal(headers['Content-Type'], 'application/json');
  assert.equal(headers['Content-Disposition'], 'attachment; filename="audit-logs.json"');
  assert.equal(body.includes('nope'), false);
  assert.equal(body.includes('[REDACTED]'), true);
  assert.equal(JSON.parse(body).rowLimit, MAX_EXPORT_ROWS);
  assert.deepEqual(auditRecords, [{
    eventType: 'REPORT',
    action: 'audit_log_exported',
    actorId: 'usr_admin',
    branchId: 'branch_main',
    targetType: 'audit_logs',
    correlationId: 'req_test',
    ipAddress: '127.0.0.1',
    userAgent: 'node:test',
    metadata: {
      filters: { eventType: 'SECURITY', branchId: 'branch_main' },
      rowCount: 1,
      fileType: 'json',
      rowLimit: MAX_EXPORT_ROWS,
    },
  }]);
});

test('audit export service allows required permission and denies missing permission', async () => {
  const repository = {
    search: async () => {
      return [];
    },
  } as AuditRepository;

  await assert.doesNotReject(
    new AuditSearchService(repository).export({}, { ...branchManager, permissions: ['AUDIT_EXPORT'] }),
  );
  await assert.rejects(
    new AuditSearchService(repository).export({}, { ...admin, permissions: [] }),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
});

test('invalid query values use the stable validation error code', async () => {
  await assert.rejects(
    new AuditController({ search: async () => ({}) } as AuditSearchService).search(
      { eventType: 'BAD_EVENT' },
      request(admin),
    ),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

function guardNames(handler: keyof AuditController): string[] {
  return (Reflect.getMetadata(GUARDS_METADATA, AuditController.prototype[handler]) as Array<{ name: string }>).map(({ name }) => name);
}

function assertSafePermissionAudit(auditRecords: AuditRecordInput[], permission: string): void {
  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'permission_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata?.requiredPermissions, [permission]);
  const auditJson = JSON.stringify(auditRecords).toLowerCase();
  for (const forbidden of ['password', 'otp', 'token', 'reset token', 'session token', 'hash', 'secret', 'credential', 'provider']) {
    assert.equal(auditJson.includes(forbidden), false);
  }
}
