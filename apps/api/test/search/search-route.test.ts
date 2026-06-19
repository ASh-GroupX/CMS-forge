import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus, RoleCode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { RbacGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { ComplaintsController } from '../../src/modules/complaints/complaints.controller.ts';
import type { ComplaintSearchRow } from '../../src/modules/complaints/complaints.service.ts';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.ts';

test('complaint search route derives scoped filters and paginates safe rows', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({
    search: async (input) => {
      calls.push(input);
      return [row('cmp_1'), row('cmp_2')];
    },
  } as ComplaintsService);

  const response = await controller.search({
    branchId: 'branch_other',
    referenceNumber: 'CMP',
    customer: 'Faisal',
    status: ComplaintStatus.SUBMITTED,
    severity: ComplaintSeverity.HIGH,
    ownerId: 'usr_owner',
    dateFrom: '2026-06-18T00:00:00.000Z',
    dateTo: '2026-06-19T00:00:00.000Z',
    limit: '1',
    offset: '1',
  }, request(branchManager));

  assert.deepEqual(calls[0], {
    branchId: 'branch_main',
    referenceNumber: 'CMP',
    customer: 'Faisal',
    status: ComplaintStatus.SUBMITTED,
    severity: ComplaintSeverity.HIGH,
    ownerId: 'usr_owner',
    dateFrom: '2026-06-18T00:00:00.000Z',
    dateTo: '2026-06-19T00:00:00.000Z',
  });
  assert.deepEqual(response, { items: [row('cmp_2')], limit: 1, offset: 1 });
});

test('complaint search route hides out-of-branch rows through server branch scope', async () => {
  const records = [row('cmp_allowed', 'branch_main'), row('cmp_hidden', 'branch_other')];
  const controller = new ComplaintsController({
    search: async (input) => records.filter((item) => item.branchId === input.branchId),
  } as ComplaintsService);

  assert.deepEqual((await controller.search({}, request(branchManager))).items.map((item) => item.id), ['cmp_allowed']);
});

test('complaint search branch-scope denial is audited by the RBAC guard', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  await assert.rejects(
    guard.canActivate(context(request(branchManager, '/complaints/search?branchId=branch_other'))),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'branch_scope_forbidden');
});

test('complaint search rejects invalid pagination and enums', async () => {
  const controller = new ComplaintsController({ search: async () => [] } as unknown as ComplaintsService);

  await assert.rejects(controller.search({ limit: '0' }, request(branchManager)), (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED');
  await assert.rejects(controller.search({ offset: '-1' }, request(branchManager)), (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED');
  await assert.rejects(controller.search({ status: 'BAD' }, request(branchManager)), (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED');
});

function row(id: string, branchId = 'branch_main'): ComplaintSearchRow {
  return {
    id,
    referenceNumber: id,
    status: ComplaintStatus.SUBMITTED,
    severity: ComplaintSeverity.HIGH,
    subject: 'Engine noise',
    branchId,
    ownerId: 'usr_owner',
    categoryId: 'cat_engine',
    customerName: 'Faisal Al-Otaibi',
    customerPhone: '+966500000001',
    customerIdentifier: 'CUST-001',
    createdAt: '2026-06-18T09:00:00.000Z',
    updatedAt: '2026-06-18T10:00:00.000Z',
  };
}

const branchManager: StaffPrincipal = {
  sessionId: 'ses_search',
  userId: 'usr_branch',
  email: 'branch@cms-auto.test',
  nameEn: 'Branch Manager',
  nameAr: 'Branch Manager',
  roleCode: RoleCode.BRANCH_MANAGER,
  branchId: 'branch_main',
};

function request(principal: StaffPrincipal, url = '/complaints/search'): AuthenticatedRequest {
  return {
    principal,
    url,
    correlationId: 'req_search',
    headers: { 'x-forwarded-for': '203.0.113.99, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.99' },
  };
}

function context(req: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ComplaintsController.prototype.search,
    getClass: () => ComplaintsController,
  } as ExecutionContext;
}
