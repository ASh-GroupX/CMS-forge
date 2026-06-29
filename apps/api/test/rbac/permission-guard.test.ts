import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { PermissionGuard, Permissions } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';

class PermissionFixtureController {
  protectedReport() {
    return null;
  }
}

const descriptor = Object.getOwnPropertyDescriptor(PermissionFixtureController.prototype, 'protectedReport');
Permissions('REPORT_EXPORT')(PermissionFixtureController.prototype, 'protectedReport', descriptor!);

const principal: StaffPrincipal = {
  sessionId: 'ses_rbac',
  userId: 'usr_manager',
  email: 'manager@cms-auto.test',
  nameEn: 'Manager',
  nameAr: 'Manager',
  roleCode: 'CR_MANAGER',
  permissions: ['REPORT_EXPORT'],
  branchId: 'branch_main',
};

test('permission guard allows a principal with the required permission', async () => {
  const audits: AuditRecordInput[] = [];
  const guard = permissionGuard(audits);

  assert.equal(await guard.canActivate(context(request(principal))), true);
  assert.deepEqual(audits, []);
});

test('permission guard denies a missing permission with RBAC_FORBIDDEN and safe SECURITY audit', async () => {
  const audits: AuditRecordInput[] = [];
  const guard = permissionGuard(audits);

  await assert.rejects(
    guard.canActivate(context(request({ ...principal, permissions: ['REPORT_VIEW'] }))),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );

  assert.equal(audits.length, 1);
  assert.deepEqual(audits[0], {
    eventType: 'SECURITY',
    action: 'permission_forbidden',
    actorId: 'usr_manager',
    branchId: 'branch_main',
    targetType: 'api_route',
    targetId: '/reports/export',
    correlationId: 'req_permission',
    ipAddress: '203.0.113.9',
    userAgent: '[REDACTED]',
    metadata: {
      actorId: 'usr_manager',
      branchId: 'branch_main',
      requiredPermissions: ['REPORT_EXPORT'],
      method: 'GET',
      path: '/reports/export',
      handler: 'PermissionFixtureController.protectedReport',
      correlationId: 'req_permission',
      ipAddress: '203.0.113.9',
      userAgent: '[REDACTED]',
    },
  });

  const auditJson = JSON.stringify(audits);
  for (const forbidden of ['password', 'otp', 'token', 'reset token', 'session token', 'hash', 'secret', 'credential', 'provider']) {
    assert.equal(auditJson.toLowerCase().includes(forbidden), false);
  }
});

function permissionGuard(audits: AuditRecordInput[]): PermissionGuard {
  return new PermissionGuard(new Reflector(), { record: async (input) => audits.push(input) } as AuditService);
}

function request(inputPrincipal: StaffPrincipal): AuthenticatedRequest {
  return {
    principal: inputPrincipal,
    method: 'get',
    url: '/reports/export?sessionToken=leaked&password=leaked',
    correlationId: 'req_permission',
    headers: {
      'x-forwarded-for': '203.0.113.9, 10.0.0.1',
      'user-agent': 'node:test token secret',
    },
    socket: { remoteAddress: '127.0.0.1' },
  };
}

function context(req: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => PermissionFixtureController.prototype.protectedReport,
    getClass: () => PermissionFixtureController,
  } as ExecutionContext;
}
