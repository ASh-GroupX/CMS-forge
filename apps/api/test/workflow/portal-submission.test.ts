import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { ComplaintSeverity, ComplaintStatus, ComplaintTransitionRequestSource } from '@prisma/client';
import type { AuditService } from '../../src/core/audit.service.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { ComplaintsModule } from '../../src/modules/complaints/complaints.module.ts';
import { ComplaintsRepository } from '../../src/modules/complaints/complaints.repository.ts';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.ts';
import { PortalModule } from '../../src/modules/portal/portal.module.ts';
import { PortalService } from '../../src/modules/portal/portal.service.ts';

test('portal submission delegates to complaints public service as customer portal', async () => {
  const calls: unknown[] = [];
  const service = new PortalService({
    createInternal: async (input) => {
      calls.push(input);
      return { id: 'cmp_portal', referenceNumber: 'CMP-000010', status: ComplaintStatus.SUBMITTED };
    },
  } as ComplaintsService);

  const result = await service.submitComplaint(validPortalInput());

  assert.deepEqual(result, { id: 'cmp_portal', referenceNumber: 'CMP-000010', status: ComplaintStatus.SUBMITTED });
  assert.deepEqual(calls[0], {
    ...validPortalInput(),
    actorId: null,
    requestSource: ComplaintTransitionRequestSource.CUSTOMER_PORTAL,
  });
});

test('portal submission rejects invalid complaint input before writes', async () => {
  const complaintService = new ComplaintsService({
    transaction: async () => {
      throw new Error('transaction should not start');
    },
  } as ComplaintsRepository, { record: async () => undefined } as unknown as AuditService);
  const service = new PortalService(complaintService);

  await assert.rejects(
    service.submitComplaint({ ...validPortalInput(), customerName: ' ', customerPhone: null, customerNumber: null }),
    (error: unknown) =>
      error instanceof AppException &&
      error.code === 'VALIDATION_FAILED' &&
      error.fieldErrors.some((field) => field.field === 'customerName') &&
      error.fieldErrors.some((field) => field.field === 'customerPhone'),
  );
});

test('portal module imports complaints module and exports only portal service', () => {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, PortalModule) as unknown[];
  const exports = Reflect.getMetadata(MODULE_METADATA.EXPORTS, PortalModule) as unknown[];

  assert.ok(imports.includes(ComplaintsModule));
  assert.deepEqual(exports, [PortalService]);
});

function validPortalInput() {
  return {
    customerName: 'Faisal Al-Otaibi',
    customerPhone: '+966500000001',
    customerNumber: null,
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
    correlationId: 'req_portal_submit',
    ipAddress: '203.0.113.88',
    userAgent: 'node:test',
  };
}
