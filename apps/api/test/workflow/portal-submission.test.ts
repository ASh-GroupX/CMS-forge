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
import { AttachmentsModule } from '../../src/modules/attachments/attachments.module.ts';
import { AttachmentsService } from '../../src/modules/attachments/attachments.service.ts';
import { PortalModule } from '../../src/modules/portal/portal.module.ts';
import { PortalService } from '../../src/modules/portal/portal.service.ts';

test('portal submission delegates to complaints public service as customer portal', async () => {
  const calls: unknown[] = [];
  const service = new PortalService({
    createInternal: async (input) => {
      calls.push(input);
      return { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: ComplaintStatus.SUBMITTED };
    },
  } as ComplaintsService);

  const result = await service.submitComplaint(validPortalInput());

  assert.deepEqual(result, { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: ComplaintStatus.SUBMITTED });
  assert.deepEqual(calls[0], {
    ...validPortalInput(),
    actorId: null,
    customerNumber: null,
    saveAsDraft: false,
    requestSource: ComplaintTransitionRequestSource.CUSTOMER_PORTAL,
  });
});

test('portal submission stores initial attachments as customer visible without leaking storage data', async () => {
  const complaintCalls: unknown[] = [];
  const attachmentCalls: unknown[] = [];
  const service = new PortalService({
    createInternal: async (input) => {
      complaintCalls.push(input);
      return { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: ComplaintStatus.SUBMITTED };
    },
  } as ComplaintsService, {} as never, {} as never, {} as never, {
    validateUploadMetadata: (input) => {
      attachmentCalls.push({ validate: input });
      return { ...input, extension: 'pdf', kind: 'pdf', maxSizeBytes: 10 * 1024 * 1024 };
    },
    createUpload: async (input) => {
      attachmentCalls.push({ upload: { ...input, bytes: Buffer.from(input.bytes).toString() } });
      return {
        id: 'att_1',
        complaintId: input.complaintId,
        storageKey: 'private/storage/key.pdf',
        fileName: input.fileName,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        scanStatus: 'PENDING',
        customerVisible: input.customerVisible ?? false,
      };
    },
  } as AttachmentsService);

  const result = await service.submitComplaint({ ...validPortalInput(), attachments: [validAttachmentBody()] });

  assert.deepEqual(result, {
    id: 'cmp_portal',
    referenceNumber: 'CMS-2026-MAIN-000010',
    status: ComplaintStatus.SUBMITTED,
    attachments: [{
      id: 'att_1',
      complaintId: 'cmp_portal',
      fileName: 'invoice.pdf',
      contentType: 'application/pdf',
      sizeBytes: 7,
      scanStatus: 'PENDING',
      customerVisible: true,
    }],
  });
  assert.equal('attachments' in (complaintCalls[0] as Record<string, unknown>), false);
  assert.equal(JSON.stringify(result).includes('private/storage'), false);
  assert.deepEqual(attachmentCalls, [
    { validate: { complaintId: '__pending__', fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 7, bytes: Buffer.from('invoice'), uploadedById: null, actorId: null, branchId: 'branch_main', customerVisible: true, correlationId: 'req_portal_submit', ipAddress: '203.0.113.88', userAgent: 'node:test' } },
    { upload: { complaintId: 'cmp_portal', fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 7, bytes: 'invoice', uploadedById: null, actorId: null, branchId: 'branch_main', customerVisible: true, correlationId: 'req_portal_submit', ipAddress: '203.0.113.88', userAgent: 'node:test' } },
  ]);
});

test('portal submission rejects invalid complaint input before writes', async () => {
  const complaintService = new ComplaintsService({
    transaction: async () => {
      throw new Error('transaction should not start');
    },
  } as ComplaintsRepository, { record: async () => undefined } as unknown as AuditService);
  const service = new PortalService(complaintService);

  await assert.rejects(
    service.submitComplaint({ ...validPortalInput(), customerName: ' ', customerPhone: null }),
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
  assert.ok(imports.some((item) => typeof item === 'object' && item !== null && 'forwardRef' in item && (item as { forwardRef: () => unknown }).forwardRef() === AttachmentsModule));
  assert.deepEqual(exports, [PortalService]);
});

function validPortalInput() {
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
    correlationId: 'req_portal_submit',
    ipAddress: '203.0.113.88',
    userAgent: 'node:test',
  };
}

function validAttachmentBody() {
  return {
    fileName: 'invoice.pdf',
    contentType: 'application/pdf',
    sizeBytes: 7,
    contentBase64: Buffer.from('invoice').toString('base64'),
  };
}
