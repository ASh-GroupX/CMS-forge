import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus, ComplaintTransitionRequestSource } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import {
  InMemoryLoginRateLimitStore,
  LOGIN_RATE_LIMIT_ATTEMPTS,
  PortalSubmissionRateLimitGuard,
} from '../../src/core/rate-limit.guard.ts';
import { ComplaintFormOptionsService } from '../../src/modules/complaints/complaint-form-options.service.ts';
import { PortalController } from '../../src/modules/portal/portal.controller.ts';
import { PortalService } from '../../src/modules/portal/portal.service.ts';
import type { ComplaintsService } from '../../src/modules/complaints/complaints.service.ts';

type PortalRequest = {
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket: { remoteAddress?: string };
  correlationId?: string;
};

test('portal submission route delegates parsed public request context', async () => {
  const calls: unknown[] = [];
  const controller = controllerWith({
    submitComplaint: async (input) => {
      calls.push(input);
      return { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: ComplaintStatus.SUBMITTED };
    },
  });

  const response = await controller.submitComplaint({
    ...validBody(),
    customerName: ' Faisal Al-Otaibi ',
    branchId: ' branch_main ',
    actorId: 'spoofed',
    customerNumber: 'DMS-SECRET',
  }, request());

  assert.deepEqual(response, {
    complaint: { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: ComplaintStatus.SUBMITTED },
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

test('portal privacy regression strips DMS customer identifiers from public submission', async () => {
  const calls: unknown[] = [];
  const controller = controllerWith({
    submitComplaint: async (input) => {
      calls.push(input);
      return { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: ComplaintStatus.SUBMITTED };
    },
  });

  await controller.submitComplaint({
    ...validBody(),
    customerNumber: 'DMS-SECRET',
    customerCode: 'DMS-CODE-SECRET',
    dmsCustomerCode: 'DMS-CUSTOMER-SECRET',
  }, request());

  const input = calls[0] as Record<string, unknown>;
  assert.equal('customerNumber' in input, false);
  assert.equal('customerCode' in input, false);
  assert.equal('dmsCustomerCode' in input, false);
  assert.equal(JSON.stringify(input).includes('DMS-'), false);
});

test('portal submission route parses initial attachments without storage or staff authority', async () => {
  const calls: unknown[] = [];
  const controller = controllerWith({
    submitComplaint: async (input) => {
      calls.push(input);
      return { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: ComplaintStatus.SUBMITTED };
    },
  });

  await controller.submitComplaint({
    ...validBody(),
    attachments: [{ ...validAttachmentBody(), storageKey: 'private/key', token: 'secret', actorId: 'staff', customerVisible: false }],
  }, request());

  const input = calls[0] as Record<string, unknown>;
  assert.deepEqual(input.attachments, [{ ...validAttachmentBody(), customerVisible: false }]);
  assert.equal(JSON.stringify(input).includes('private/key'), false);
  assert.equal(JSON.stringify(input).includes('secret'), false);
  assert.equal(JSON.stringify(input).includes('staff'), false);
});

test('portal service always submits and cannot create staff drafts', async () => {
  const calls: unknown[] = [];
  const service = new PortalService({
    createInternal: async (input) => {
      calls.push(input);
      return { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: ComplaintStatus.SUBMITTED };
    },
  } as ComplaintsService, {} as never, {} as never, {} as never);

  await service.submitComplaint({ ...validBody(), saveAsDraft: true } as never);

  assert.equal((calls[0] as { saveAsDraft: boolean }).saveAsDraft, false);
});

test('portal manual triage fills missing catalog IDs from active defaults', async () => {
  const calls: unknown[] = [];
  const service = new PortalService({
    createInternal: async (input) => {
      calls.push(input);
      return { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000011', status: ComplaintStatus.SUBMITTED };
    },
  } as ComplaintsService, {
    findManualTriageDefaults: async () => ({ branchId: 'branch_default', categoryId: 'cat_default', subcategoryId: 'subcat_default' }),
  } as never, {} as never, {} as never);

  const result = await service.submitComplaint({
    ...validBody(),
    branchId: null,
    categoryId: undefined,
    subcategoryId: ' ',
    severity: undefined,
    manualTriage: true,
  } as never);

  assert.equal(result.referenceNumber, 'CMS-2026-MAIN-000011');
  assert.deepEqual(calls[0], {
    ...validBody(),
    branchId: 'branch_default',
    categoryId: 'cat_default',
    subcategoryId: 'subcat_default',
    severity: ComplaintSeverity.MEDIUM,
    manualTriage: true,
    actorId: null,
    customerNumber: null,
    saveAsDraft: false,
    requestSource: ComplaintTransitionRequestSource.CUSTOMER_PORTAL,
  });
});

test('portal manual triage returns typed failure when defaults are unavailable', async () => {
  let created = false;
  const service = new PortalService({
    createInternal: async () => {
      created = true;
      return { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000011', status: ComplaintStatus.SUBMITTED };
    },
  } as ComplaintsService, {
    findManualTriageDefaults: async () => null,
  } as never, {} as never, {} as never);

  await assert.rejects(
    service.submitComplaint({ ...validBody(), branchId: null, categoryId: null, subcategoryId: null, manualTriage: true } as never),
    (error: unknown) =>
      error instanceof AppException &&
      error.code === 'PORTAL_OPTIONS_REQUIRED' &&
      error.getStatus() === 400 &&
      error.fieldErrors.some((field) => field.field === 'manualTriage' && field.code === 'UNAVAILABLE'),
  );
  assert.equal(created, false);
});

test('portal service returns reference and attachment count when initial attachments upload', async () => {
  const service = new PortalService({
    createInternal: async () => ({ id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: ComplaintStatus.SUBMITTED }),
  } as ComplaintsService, {} as never, {} as never, {} as never, {
    validateUploadMetadata: () => ({ fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 7, extension: 'pdf', kind: 'pdf', maxSizeBytes: 10 * 1024 * 1024 }),
    createUpload: async () => ({ id: 'att_1', complaintId: 'cmp_portal', storageKey: 'private/key', fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 7, scanStatus: 'PENDING', customerVisible: true }),
  } as never);

  const result = await service.submitComplaint({ ...validBody(), attachments: [validAttachmentBody()] });

  assert.equal(result.referenceNumber, 'CMS-2026-MAIN-000010');
  assert.equal(result.attachments?.length, 1);
  assert.equal(result.attachmentWarning, undefined);
  assert.doesNotMatch(JSON.stringify(result), /storageKey|private\/key|credential|provider|bucket|uploadUrl|publicUrl/i);
});

test('portal service preserves reference and warns when attachment upload fails after creation', async () => {
  let createCount = 0;
  const service = new PortalService({
    createInternal: async () => {
      createCount += 1;
      return { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: ComplaintStatus.SUBMITTED };
    },
  } as ComplaintsService, {} as never, {} as never, {} as never, {
    validateUploadMetadata: () => ({ fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 7, extension: 'pdf', kind: 'pdf', maxSizeBytes: 10 * 1024 * 1024 }),
    createUpload: async () => {
      throw new Error('storage provider private/key secret');
    },
  } as never);

  const result = await service.submitComplaint({ ...validBody(), attachments: [validAttachmentBody()] });

  assert.equal(createCount, 1);
  assert.equal(result.referenceNumber, 'CMS-2026-MAIN-000010');
  assert.deepEqual(result.attachmentWarning, {
    code: 'PORTAL_ATTACHMENT_UPLOAD_FAILED',
    message: 'Complaint submitted, but one or more attachments could not be uploaded.',
    failedCount: 1,
    uploadedCount: 0,
  });
  assert.equal(result.attachments, undefined);
  assert.doesNotMatch(JSON.stringify(result), /storage|private|secret|credential|provider|bucket|uploadUrl|publicUrl/i);
});

test('portal service rejects invalid attachment bytes before complaint creation', async () => {
  let created = false;
  const service = new PortalService({
    createInternal: async () => {
      created = true;
      return { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: ComplaintStatus.SUBMITTED };
    },
  } as ComplaintsService, {} as never, {} as never, {} as never, {
    validateUploadMetadata: () => {
      throw new Error('metadata validation should not run');
    },
    createUpload: async () => {
      throw new Error('upload should not run');
    },
  } as never);

  await assert.rejects(
    service.submitComplaint({ ...validBody(), attachments: [{ ...validAttachmentBody(), sizeBytes: 999 }] }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(created, false);
});

test('portal submission route rejects invalid body before service call', async () => {
  let called = false;
  const controller = controllerWith({
    submitComplaint: async () => {
      called = true;
      throw new Error('service should not be called');
    },
  });

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

test('portal options route returns only public-safe catalog fields', async () => {
  const controller = controllerWith({}, {
    listPublic: async () => ({
      branches: [{ id: 'branch_service', nameEn: 'Service Branch', nameAr: 'فرع الصيانة' }],
      categories: [{ id: 'cat_engine', nameEn: 'Engine', nameAr: 'المحرك', parentId: 'cat_vehicle' }],
      severities: [ComplaintSeverity.HIGH, ComplaintSeverity.LOW],
    }),
  });

  const response = await controller.options();

  assert.deepEqual(response, {
    branches: [{ id: 'branch_service', nameEn: 'Service Branch', nameAr: 'فرع الصيانة' }],
    categories: [{ id: 'cat_engine', nameEn: 'Engine', nameAr: 'المحرك', parentId: 'cat_vehicle' }],
    severities: [ComplaintSeverity.HIGH, ComplaintSeverity.LOW],
  });
  assert.doesNotMatch(JSON.stringify(response), /department|staff|owner|code|branchScope/i);
});

test('public complaint options query omits departments and internal codes', async () => {
  const calls: Array<{ model: string; args: unknown }> = [];
  const service = new ComplaintFormOptionsService({
    branch: { findMany: async (args: unknown) => { calls.push({ model: 'branch', args }); return [{ id: 'branch_service', nameEn: 'Service Branch', nameAr: 'فرع الصيانة' }]; } },
    category: { findMany: async (args: unknown) => { calls.push({ model: 'category', args }); return [{ id: 'cat_engine', nameEn: 'Engine', nameAr: 'المحرك', parentId: 'cat_vehicle' }]; } },
  } as never);

  const response = await service.listPublic();

  assert.deepEqual(calls.map((call) => call.model), ['branch', 'category']);
  assert.deepEqual((calls[0]?.args as { select: unknown }).select, { id: true, nameEn: true, nameAr: true });
  assert.deepEqual((calls[1]?.args as { select: unknown }).select, { id: true, nameEn: true, nameAr: true, parentId: true });
  assert.doesNotMatch(JSON.stringify(response), /department|code/i);
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
    vehiclePlate: 'ABC123',
    vehicleBrand: 'Nissan',
    vehicleModel: 'Patrol',
    vehicleModelYear: 2024,
    vehicleId: null,
    departmentId: 'dep_service',
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

function controllerWith(service: Partial<PortalService>, formOptions: Partial<ComplaintFormOptionsService> = {}): PortalController {
  return new PortalController(
    service as PortalService,
    { listPublic: async () => ({ branches: [], categories: [], severities: [] }), ...formOptions } as ComplaintFormOptionsService,
  );
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
