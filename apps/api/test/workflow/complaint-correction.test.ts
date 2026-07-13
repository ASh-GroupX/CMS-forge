import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { PermissionGuard, RbacGuard, SessionAuthGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { CsrfGuard } from '../../src/core/csrf.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { ComplaintsController } from '../../src/modules/complaints/complaints.controller.ts';
import { ComplaintsRepository } from '../../src/modules/complaints/complaints.repository.ts';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.ts';

test('complaint correction persists provenance update and safe audit in one transaction', async () => {
  const txClient = {};
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const service = new ComplaintsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    updateCorrection: async (data, client) => {
      assert.equal(client, txClient);
      assert.deepEqual(data, {
        complaintId: 'cmp_1',
        expectedUpdatedAt: new Date('2026-06-18T10:00:00.000Z'),
        changedFields: ['customerSource', 'manualCustomer', 'vehicleId', 'vehicleSource', 'manualVehicle', 'vehicleRelated', 'vehicleDataUnavailableReason'],
        customerDataSource: 'MANUAL',
        manualCustomerFlag: true,
        vehicleId: null,
        vehicleDataSource: 'MANUAL',
        manualVehicleFlag: true,
        vehicleRelated: true,
        vehicleDataUnavailableReason: 'Customer mentioned VIN SECRET and plate ABC123',
      });
      return { id: 'cmp_1', branchId: 'branch_main' };
    },
  } as ComplaintsRepository, { record: async (input, client) => auditRecords.push({ input, client }) } as unknown as AuditService);

  const result = await service.correctProvenance({
    complaintId: 'cmp_1',
    expectedUpdatedAt: new Date('2026-06-18T10:00:00.000Z'),
    reason: 'remove token hunter2',
    customerSource: 'MANUAL',
    manualCustomer: true,
    vehicleId: null,
    vehicleSource: 'MANUAL',
    manualVehicle: true,
    vehicleRelated: true,
    vehicleDataUnavailableReason: 'Customer mentioned VIN SECRET and plate ABC123',
    actorId: 'usr_1',
    actorRole: RoleCode.CR_MANAGER,
    correlationId: 'req_1',
    ipAddress: '203.0.113.10',
    userAgent: 'node:test',
  });

  assert.deepEqual(result, { complaintId: 'cmp_1', changedFields: ['customerSource', 'manualCustomer', 'vehicleId', 'vehicleSource', 'manualVehicle', 'vehicleRelated', 'vehicleDataUnavailableReason'] });
  assert.equal(auditRecords[0]?.client, txClient);
  assert.deepEqual(auditRecords[0]?.input, {
    eventType: 'COMPLAINT',
    action: 'complaint_updated',
    actorId: 'usr_1',
    branchId: 'branch_main',
    targetType: 'complaint',
    targetId: 'cmp_1',
    correlationId: 'req_1',
    ipAddress: '203.0.113.10',
    userAgent: 'node:test',
    metadata: { changedFields: ['customerSource', 'manualCustomer', 'vehicleId', 'vehicleSource', 'manualVehicle', 'vehicleRelated', 'vehicleDataUnavailableReason'] },
  });
  const auditJson = JSON.stringify(auditRecords[0]?.input);
  for (const forbidden of ['hunter2', 'token', 'VIN SECRET', 'ABC123', 'Customer mentioned']) assert.equal(auditJson.includes(forbidden), false);
});

test('complaint correction repository persists provided fields with optimistic precondition', async () => {
  const calls: unknown[] = [];
  const repository = new ComplaintsRepository({
    complaint: {
      updateMany: async (input: unknown) => { calls.push({ updateMany: input }); return { count: 1 }; },
      findUniqueOrThrow: async (input: unknown) => { calls.push({ findUniqueOrThrow: input }); return { id: 'cmp_1', branchId: 'branch_main' }; },
    },
  } as never);

  const result = await repository.updateCorrection({
    complaintId: 'cmp_1',
    expectedUpdatedAt: new Date('2026-06-18T10:00:00.000Z'),
    changedFields: ['customerId', 'vehicleId', 'vehicleSource', 'manualVehicle'],
    customerId: 'cust_2',
    vehicleId: null,
    vehicleDataSource: 'MANUAL',
    manualVehicleFlag: true,
  });

  assert.deepEqual(result, { id: 'cmp_1', branchId: 'branch_main' });
  assert.deepEqual(calls, [
    {
      updateMany: {
        where: { id: 'cmp_1', updatedAt: new Date('2026-06-18T10:00:00.000Z') },
        data: { version: { increment: 1 }, customerId: 'cust_2', vehicleId: null, vehicleDataSource: 'MANUAL', manualVehicleFlag: true },
      },
    },
    { findUniqueOrThrow: { where: { id: 'cmp_1' }, select: { id: true, branchId: true } } },
  ]);
});

test('complaint correction rejects stale expectedUpdatedAt before audit', async () => {
  const service = new ComplaintsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work({} as never),
    updateCorrection: async () => null,
  } as ComplaintsRepository, { record: async () => { throw new Error('audit should not be recorded'); } } as unknown as AuditService);

  await assert.rejects(
    service.correctProvenance({ complaintId: 'cmp_1', expectedUpdatedAt: new Date('2026-06-18T10:00:00.000Z'), reason: 'stale', customerSource: 'MANUAL', actorId: 'usr_1', actorRole: RoleCode.CR_MANAGER }),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_INVALID_TRANSITION' && error.getStatus() === 409,
  );
});

test('complaint correction route delegates with server branch and actor context', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({
    getDetail: async (id, filter) => { calls.push({ getDetail: { id, filter } }); return {} as never; },
    correctProvenance: async (input) => { calls.push({ correctProvenance: input }); return { complaintId: input.complaintId, changedFields: ['customerSource'] }; },
  } as ComplaintsService);

  const response = await controller.correct('cmp_1', undefined, {
    expectedUpdatedAt: '2026-06-18T10:00:00.000Z',
    reason: 'fixed',
    customerSource: 'MANUAL',
    actorId: 'spoofed',
    branchId: 'spoofed',
  }, request(RoleCode.CR_MANAGER, 'branch_main', ['COMPLAINT_EDIT']));

  assert.deepEqual(response, { correction: { complaintId: 'cmp_1', changedFields: ['customerSource'] } });
  assert.deepEqual(calls[0], { getDetail: { id: 'cmp_1', filter: { branchId: 'branch_main' } } });
  assert.deepEqual(calls[1], { correctProvenance: {
    complaintId: 'cmp_1',
    expectedUpdatedAt: new Date('2026-06-18T10:00:00.000Z'),
    reason: 'fixed',
    customerSource: 'MANUAL',
    actorId: 'usr_1',
    actorRole: RoleCode.CR_MANAGER,
    sessionId: 'sess_1',
    correlationId: 'req_1',
    ipAddress: '203.0.113.9',
    userAgent: 'node:test',
  } });
});

test('complaint correction route checks scope before correction write', async () => {
  const controller = new ComplaintsController({
    getDetail: async () => { throw new AppException('COMPLAINT_NOT_FOUND', 'Complaint not found', 404); },
    correctProvenance: async () => { throw new Error('correction should not write'); },
  } as ComplaintsService);

  await assert.rejects(
    controller.correct('cmp_other', undefined, { expectedUpdatedAt: '2026-06-18T10:00:00.000Z', reason: 'fixed', customerSource: 'MANUAL' }, request()),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_NOT_FOUND',
  );
});

test('complaint correction route uses edit permission, CSRF, and branch-scope guard', async () => {
  assert.deepEqual(guardNames('correct'), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('correct').includes(SessionAuthGuard.name), true);
  assert.deepEqual(guardNames('correct').includes(CsrfGuard.name), true);

  const permissionAudits: AuditRecordInput[] = [];
  const permissionGuard = new PermissionGuard(new Reflector(), { record: async (input) => permissionAudits.push(input) } as AuditService);
  await assert.rejects(
    permissionGuard.canActivate(context(request(RoleCode.ADMIN, 'branch_main', [], '/complaints/cmp_1/corrections?token=leaked'), ComplaintsController.prototype.correct)),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.deepEqual(permissionAudits[0]?.metadata?.requiredPermissions, ['COMPLAINT_EDIT']);
  assert.equal(JSON.stringify(permissionAudits[0]).includes('leaked'), false);

  const branchAudits: AuditRecordInput[] = [];
  const rbacGuard = new RbacGuard(new Reflector(), { record: async (input) => branchAudits.push(input) } as AuditService);
  await assert.rejects(
    rbacGuard.canActivate(context(request(RoleCode.CR_MANAGER, 'branch_other', ['COMPLAINT_EDIT'], '/complaints/cmp_1/corrections?branchId=branch_other&sessionToken=leaked'), ComplaintsController.prototype.correct)),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );
  assert.equal(branchAudits[0]?.action, 'branch_scope_forbidden');
  assert.deepEqual(branchAudits[0]?.metadata, { deniedBranchId: 'branch_other' });
  assert.equal(JSON.stringify(branchAudits[0]).includes('leaked'), false);
});

function request(roleCode: RoleCode = RoleCode.CR_MANAGER, branchId = 'branch_main', permissions = ['COMPLAINT_EDIT'], url = `/complaints/cmp_1/corrections?branchId=${branchId}`): AuthenticatedRequest {
  return {
    principal: principal(roleCode, permissions),
    headers: { 'x-correlation-id': 'req_1', 'user-agent': 'node:test', 'x-forwarded-for': '203.0.113.9' },
    socket: { remoteAddress: '203.0.113.10' },
    correlationId: 'req_1',
    url,
    query: Object.fromEntries(new URL(`https://cms.local${url}`).searchParams),
    body: {},
  } as unknown as AuthenticatedRequest;
}

function principal(roleCode: RoleCode, permissions: string[]): StaffPrincipal {
  return { userId: 'usr_1', employeeId: 'emp_1', roleId: 'role_1', roleCode, branchId: 'branch_main', locale: 'en', permissions, sessionId: 'sess_1' };
}

function context(req: AuthenticatedRequest, handler = ComplaintsController.prototype.correct): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => req }), getHandler: () => handler, getClass: () => ComplaintsController } as ExecutionContext;
}

function guardNames(handler: keyof ComplaintsController): string[] {
  const guards = Reflect.getMetadata(GUARDS_METADATA, ComplaintsController.prototype[handler]) as Array<{ name: string }>;
  return guards.map((guard) => guard.name);
}
