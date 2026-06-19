import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import {
  InMemoryLoginRateLimitStore,
  LOGIN_RATE_LIMIT_ATTEMPTS,
  PortalSubmissionRateLimitGuard,
} from '../../src/core/rate-limit.guard.ts';
import { PortalController } from '../../src/modules/portal/portal.controller.ts';
import { PortalService } from '../../src/modules/portal/portal.service.ts';

type PortalRequest = {
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket: { remoteAddress?: string };
  correlationId?: string;
};

test('portal submission route delegates parsed public request context', async () => {
  const calls: unknown[] = [];
  const controller = new PortalController({
    submitComplaint: async (input) => {
      calls.push(input);
      return { id: 'cmp_portal', referenceNumber: 'CMP-000010', status: ComplaintStatus.SUBMITTED };
    },
  } as PortalService);

  const response = await controller.submitComplaint({
    ...validBody(),
    customerName: ' Faisal Al-Otaibi ',
    branchId: ' branch_main ',
    actorId: 'spoofed',
    customerNumber: 'DMS-SECRET',
  }, request());

  assert.deepEqual(response, {
    complaint: { id: 'cmp_portal', referenceNumber: 'CMP-000010', status: ComplaintStatus.SUBMITTED },
  });
  assert.deepEqual(calls[0], {
    ...validBody(),
    customerName: 'Faisal Al-Otaibi',
    branchId: 'branch_main',
    correlationId: 'req_portal',
    ipAddress: '203.0.113.90',
    userAgent: 'node:test',
  });
  assert.equal('actorId' in (calls[0] as Record<string, unknown>), false);
  assert.equal('customerNumber' in (calls[0] as Record<string, unknown>), false);
});

test('portal submission route rejects invalid body before service call', async () => {
  let called = false;
  const controller = new PortalController({
    submitComplaint: async () => {
      called = true;
      throw new Error('service should not be called');
    },
  } as unknown as PortalService);

  await assert.rejects(
    controller.submitComplaint({ ...validBody(), customerPhone: ' ' }, request()),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(called, false);
});

test('portal submission route uses the portal rate limit guard', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, PortalController.prototype.submitComplaint) as Array<{ name: string }>;
  assert.deepEqual(guards.map((guard) => guard.name), ['PortalSubmissionRateLimitGuard']);
});

test('portal submission rate limit denies repeated phone/ip submissions and audits safely', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new PortalSubmissionRateLimitGuard(
    new InMemoryLoginRateLimitStore(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );
  const req = request();

  for (let index = 0; index < LOGIN_RATE_LIMIT_ATTEMPTS; index += 1) {
    assert.equal(await guard.canActivate(context(req)), true);
  }

  await assert.rejects(
    guard.canActivate(context(req)),
    (error: unknown) => error instanceof AppException && error.code === 'RATE_LIMITED' && error.getStatus() === 429,
  );
  assert.deepEqual(auditRecords[0], {
    eventType: 'SECURITY',
    action: 'rate_limit_triggered',
    targetType: 'portal_submission',
    correlationId: 'req_portal',
    ipAddress: '203.0.113.90',
    userAgent: 'node:test',
    metadata: { limit: LOGIN_RATE_LIMIT_ATTEMPTS, windowSeconds: 60, keyTypes: ['ip', 'phone'] },
  });
});

function validBody() {
  return {
    customerName: 'Faisal Al-Otaibi',
    customerPhone: '+966500000001',
    categoryId: 'cat_parent',
    subcategoryId: 'cat_engine',
    description: 'Engine makes a knocking noise.',
    incidentAt: '2026-06-18T09:00:00.000Z',
    branchId: 'branch_main',
    subject: 'Engine noise',
    severity: ComplaintSeverity.HIGH,
    vehicleRelated: true,
    vehicleVin: 'SEEDDEMO00001',
    vehicleId: null,
  };
}

function request(input: Partial<PortalRequest> = {}): PortalRequest {
  return {
    body: validBody(),
    correlationId: 'req_portal',
    headers: { 'x-forwarded-for': '203.0.113.90, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.90' },
    ...input,
  };
}

function context(req: PortalRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => PortalController.prototype.submitComplaint,
    getClass: () => PortalController,
  } as ExecutionContext;
}
