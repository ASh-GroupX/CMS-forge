import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleCode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../core/audit.service.js';
import { PermissionGuard, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest, StaffPrincipal } from '../../core/auth.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { CasesController } from './cases.controller.js';
import { CasesModule } from './cases.module.js';

test('case routes require permissions and CSRF for CAPA writes', async () => {
  assert.deepEqual(guardNames('timeline'), ['SessionAuthGuard', 'PermissionGuard']);
  assert.deepEqual(guardNames('confidentialTimeline'), ['SessionAuthGuard', 'PermissionGuard']);
  assert.deepEqual(guardNames('capa'), ['SessionAuthGuard', 'PermissionGuard']);
  assert.deepEqual(guardNames('createCapa'), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);

  const auditRecords: AuditRecordInput[] = [];
  const guard = new PermissionGuard(new Reflector(), { record: async (input: AuditRecordInput) => auditRecords.push(input) } as unknown as AuditService);
  assert.equal(await guard.canActivate(context(request(['COMPLAINT_VIEW_BRANCH']), 'timeline')), true);
  assert.equal(await guard.canActivate(context(request(['COMPLAINT_COMMENT_INTERNAL']), 'createCapa')), true);

  await assert.rejects(
    guard.canActivate(context(request([]), 'createCapa')),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'permission_forbidden');
  assert.deepEqual((auditRecords[0]?.metadata as { requiredPermissions?: string[] })?.requiredPermissions, ['COMPLAINT_COMMENT_INTERNAL']);
});

test('cases module wires permission guard for runtime denies', () => {
  const providers = Reflect.getMetadata('providers', CasesModule) as unknown[];
  assert.ok(providers.includes(SessionAuthGuard));
  assert.ok(providers.includes(PermissionGuard));
});

const principal: StaffPrincipal = {
  sessionId: 'ses_case',
  userId: 'usr_case',
  email: 'case@example.test',
  nameEn: 'Case User',
  nameAr: 'Case User',
  roleCode: RoleCode.MGMT_READONLY,
  branchId: 'branch_a',
};

function request(permissions: string[]): AuthenticatedRequest {
  return {
    principal: { ...principal, permissions },
    method: 'GET',
    url: '/cases/case_1/capa',
    correlationId: 'req_cases',
    headers: { 'x-forwarded-for': '203.0.113.44', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.44' },
  };
}

function context(req: AuthenticatedRequest, handler: keyof CasesController): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => CasesController.prototype[handler],
    getClass: () => CasesController,
  } as unknown as ExecutionContext;
}

function guardNames(handler: keyof CasesController): string[] {
  const guards = Reflect.getMetadata('__guards__', CasesController.prototype[handler]) as Array<{ name: string }>;
  return guards.map((guard) => guard.name);
}
