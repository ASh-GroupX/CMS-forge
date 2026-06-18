import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { RbacGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { AuditController } from '../../src/modules/audit/audit.controller.ts';
import { AuditRepository } from '../../src/modules/audit/audit.repository.ts';
import { AuditSearchService } from '../../src/modules/audit/audit.service.ts';

const admin: StaffPrincipal = {
  sessionId: 'ses_admin',
  userId: 'usr_admin',
  email: 'admin@cms-auto.test',
  nameEn: 'Admin',
  nameAr: 'Admin',
  roleCode: 'ADMIN',
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
    url,
    correlationId: 'req_test',
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'node:test',
    },
    socket: { remoteAddress: '127.0.0.2' },
  };
}

function context(req: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => AuditController.prototype.search,
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

test('non-admin staff is denied and audited by the RBAC guard', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(
    new Reflector(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  await assert.rejects(
    guard.canActivate(context(request({ ...admin, roleCode: 'CR_OFFICER' }))),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );

  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'rbac_forbidden');
});

test('branch manager cannot search another branch', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(
    new Reflector(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  await assert.rejects(
    guard.canActivate(context(request(branchManager, '/audit/logs?branchId=branch_other'))),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );

  assert.deepEqual(auditRecords[0]?.metadata, { deniedBranchId: 'branch_other' });
});

test('branch manager searches are scoped to their server-session branch', async () => {
  let receivedFilters: unknown;
  const repository = {
    search: async (filters) => {
      receivedFilters = filters;
      return [];
    },
  } as AuditRepository;

  const result = await new AuditSearchService(repository).search({}, branchManager);

  assert.deepEqual(receivedFilters, { branchId: 'branch_main' });
  assert.deepEqual(result, { items: [], page: 1, pageSize: 25 });
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
