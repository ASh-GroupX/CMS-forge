import assert from 'node:assert/strict';
import test from 'node:test';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AttachmentScanStatus, ComplaintStatus, RoleCode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { RbacGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import type { AttachmentStoragePort } from '../../src/modules/attachments/attachment-storage.port.ts';
import { AttachmentsController, PortalAttachmentsController } from '../../src/modules/attachments/attachments.controller.ts';
import { AttachmentsRepository } from '../../src/modules/attachments/attachments.repository.ts';
import { AttachmentsService } from '../../src/modules/attachments/attachments.service.ts';
import type { AttachmentUploadResult } from '../../src/modules/attachments/attachments.service.ts';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.ts';
import { PortalService } from '../../src/modules/portal/portal.service.ts';

const service = new AttachmentsService(new AttachmentsRepository());

test('attachment policy accepts allowed image, PDF, audio, and video metadata within limits', () => {
  assert.equal(service.validateUploadMetadata({ fileName: 'photo.JPG', contentType: 'image/jpeg', sizeBytes: mb(10) }).kind, 'image');
  assert.equal(service.validateUploadMetadata({ fileName: 'repair.pdf', contentType: 'application/pdf', sizeBytes: mb(10) }).kind, 'pdf');
  assert.equal(service.validateUploadMetadata({ fileName: 'call.mp3', contentType: 'audio/mpeg', sizeBytes: mb(50) }).kind, 'audio');
  assert.equal(service.validateUploadMetadata({ fileName: 'walkaround.mp4', contentType: 'video/mp4', sizeBytes: mb(50) }).kind, 'video');
});

test('attachment policy rejects executable metadata before storage or persistence', () => {
  assertDenied({ fileName: 'invoice.exe', contentType: 'application/x-msdownload', sizeBytes: 100 }, 'ATTACHMENT_TYPE_BLOCKED');
});

test('attachment policy rejects oversize metadata before storage or persistence', () => {
  assertDenied({ fileName: 'photo.png', contentType: 'image/png', sizeBytes: mb(10) + 1 }, 'ATTACHMENT_SIZE_EXCEEDED');
  assertDenied({ fileName: 'walkaround.mp4', contentType: 'video/mp4', sizeBytes: mb(50) + 1 }, 'ATTACHMENT_SIZE_EXCEEDED');
});

test('attachment policy rejects mismatched extension and content type before storage or persistence', () => {
  assertDenied({ fileName: 'photo.jpg', contentType: 'application/pdf', sizeBytes: 100 }, 'ATTACHMENT_TYPE_BLOCKED');
  assertDenied({ fileName: 'repair.pdf', contentType: 'image/png', sizeBytes: 100 }, 'ATTACHMENT_TYPE_BLOCKED');
});

test('attachment storage stores bytes through the service boundary', async () => {
  const stored = await service.storeObject({
    storageKey: 'complaints/cmp_1/photo.png',
    bytes: Buffer.from('file-bytes'),
    contentType: 'image/png',
  });

  assert.equal(stored.storageKey, 'complaints/cmp_1/photo.png');
  assert.equal(stored.contentType, 'image/png');
  assert.equal(stored.sizeBytes, 10);
});

test('attachment storage prepares a non-public download token shape', async () => {
  const stored = await service.storeObject({ bytes: Buffer.from('pdf'), contentType: 'application/pdf' });
  const download = await service.prepareDownload(stored.storageKey);

  assert.equal(download.storageKey, stored.storageKey);
  assert.match(download.token, /^attdl_[a-f0-9]{32}$/);
  assert.ok(download.expiresAt > new Date());
  assert.equal(Object.hasOwn(download, 'url'), false);
});

test('attachment storage denies missing objects with a stable safe error', async () => {
  await assert.rejects(
    () => service.prepareDownload('missing/object.png'),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_NOT_FOUND',
  );
});

test('attachment storage does not expose provider credentials', async () => {
  process.env.AWS_SECRET_ACCESS_KEY = 'do-not-return';

  const stored = await service.storeObject({ bytes: Buffer.from('secret-free'), contentType: 'image/png' });
  const download = await service.prepareDownload(stored.storageKey);
  const response = JSON.stringify({ stored, download });

  assert.equal(response.includes('do-not-return'), false);
  assert.equal(/secret|credential|accessKey|bucket/i.test(response), false);
});

test('attachment upload stores bytes then persists metadata and audit in one transaction', async () => {
  const txClient = {};
  const calls: unknown[] = [];
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const uploadService = new AttachmentsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => {
      calls.push('transaction');
      return work(txClient as never);
    },
    createMetadata: async (data, client) => {
      assert.equal(client, txClient);
      calls.push({ metadata: data });
      return {
        id: 'att_1',
        ...data,
        uploadedById: data.uploadedById ?? null,
        customerVisible: data.customerVisible ?? false,
        scanStatus: 'PENDING',
        createdAt: new Date('2026-06-19T10:00:00.000Z'),
      };
    },
  } as AttachmentsRepository, {
    record: async (input, client) => auditRecords.push({ input, client }),
  } as unknown as AuditService, storage(calls));

  const result = await uploadService.createUpload({
    complaintId: 'cmp_1',
    uploadedById: 'usr_1',
    actorId: 'usr_1',
    branchId: 'branch_main',
    fileName: ' photo.PNG ',
    contentType: 'image/png',
    sizeBytes: 10,
    bytes: Buffer.from('file-bytes'),
    customerVisible: true,
    correlationId: 'req_upload',
    ipAddress: '203.0.113.10',
    userAgent: 'node:test',
  });

  assert.deepEqual(calls, [
    { storage: { contentType: 'image/png', sizeBytes: 10 } },
    'transaction',
    {
      metadata: {
        complaintId: 'cmp_1',
        uploadedById: 'usr_1',
        storageKey: 'objects/att_1',
        fileName: 'photo.PNG',
        contentType: 'image/png',
        sizeBytes: 10,
        customerVisible: true,
      },
    },
  ]);
  assert.deepEqual(result, {
    id: 'att_1',
    complaintId: 'cmp_1',
    storageKey: 'objects/att_1',
    fileName: 'photo.PNG',
    contentType: 'image/png',
    sizeBytes: 10,
    scanStatus: 'PENDING',
    customerVisible: true,
  });
  assert.equal(auditRecords[0]?.client, txClient);
  assert.equal(auditRecords[0]?.input.eventType, 'ATTACHMENT');
  assert.equal(auditRecords[0]?.input.action, 'attachment_uploaded');
  assert.equal(auditRecords[0]?.input.actorId, 'usr_1');
  assert.equal(auditRecords[0]?.input.branchId, 'branch_main');
  assert.equal(auditRecords[0]?.input.targetId, 'att_1');
  assert.deepEqual(auditRecords[0]?.input.metadata, {
    complaintId: 'cmp_1',
    contentType: 'image/png',
    sizeBytes: 10,
    customerVisible: true,
  });
});

test('attachment upload rejects invalid metadata before storage persistence or audit', async () => {
  let storageCalled = false;
  let transactionCalled = false;
  let auditCalled = false;
  const uploadService = new AttachmentsService({
    transaction: async () => {
      transactionCalled = true;
      throw new Error('transaction should not start');
    },
  } as AttachmentsRepository, {
    record: async () => {
      auditCalled = true;
    },
  } as unknown as AuditService, {
    putObject: async () => {
      storageCalled = true;
      throw new Error('storage should not be called');
    },
    createDownloadToken: async () => {
      throw new Error('download should not be called');
    },
  });

  await assert.rejects(
    uploadService.createUpload({
      complaintId: 'cmp_1',
      fileName: 'invoice.exe',
      contentType: 'application/x-msdownload',
      sizeBytes: 100,
      bytes: Buffer.from('bad'),
    }),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_TYPE_BLOCKED',
  );

  assert.equal(storageCalled, false);
  assert.equal(transactionCalled, false);
  assert.equal(auditCalled, false);
});

test('staff upload route verifies scoped complaint and derives authority from the server request', async () => {
  const calls: unknown[] = [];
  const controller = new AttachmentsController({
    createUpload: async (input) => {
      calls.push({ upload: { ...input, bytes: input.bytes.toString() } });
      return attachmentResult(input.complaintId);
    },
  } as AttachmentsService, {
    getDetail: async (id, filter) => {
      calls.push({ detail: { id, filter } });
      return complaintDetail('branch_main');
    },
  } as ComplaintsService);

  const response = await controller.create('cmp_1', 'branch_main', {
    ...validAttachmentBody(),
    actorId: 'spoofed_actor',
    branchId: 'spoofed_branch',
    roleCode: RoleCode.ADMIN,
  }, request());

  assert.deepEqual(response, {
    attachment: {
      id: 'att_1',
      complaintId: 'cmp_1',
      fileName: 'photo.png',
      contentType: 'image/png',
      sizeBytes: 10,
      scanStatus: 'PENDING',
      customerVisible: false,
    },
  });
  assert.deepEqual(calls, [
    { detail: { id: 'cmp_1', filter: { branchId: 'branch_main' } } },
    {
      upload: {
        complaintId: 'cmp_1',
        fileName: 'photo.png',
        contentType: 'image/png',
        sizeBytes: 10,
        bytes: 'file-bytes',
        uploadedById: 'usr_officer',
        actorId: 'usr_officer',
        branchId: 'branch_main',
        customerVisible: false,
        correlationId: 'req_attachment',
        ipAddress: '203.0.113.99',
        userAgent: 'node:test',
      },
    },
  ]);
});

test('staff upload route denies branch-hidden complaints before upload', async () => {
  const controller = new AttachmentsController({
    createUpload: async () => {
      throw new Error('upload should not run');
    },
  } as unknown as AttachmentsService, {
    getDetail: async () => {
      throw new AppException('COMPLAINT_NOT_FOUND', 'Complaint not found', 404);
    },
  } as ComplaintsService);

  await assert.rejects(
    controller.create('cmp_1', 'branch_other', validAttachmentBody(), request()),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_NOT_FOUND',
  );
});

test('staff upload route rejects invalid file metadata before storage persistence or audit', async () => {
  let storageCalled = false;
  const uploadService = new AttachmentsService({} as AttachmentsRepository, { record: async () => undefined } as unknown as AuditService, {
    putObject: async () => {
      storageCalled = true;
      throw new Error('storage should not run');
    },
    createDownloadToken: async () => {
      throw new Error('download should not run');
    },
  });
  const controller = new AttachmentsController(uploadService, {
    getDetail: async () => complaintDetail('branch_main'),
  } as ComplaintsService);

  await assert.rejects(
    controller.create('cmp_1', 'branch_main', { ...validAttachmentBody(), fileName: 'bad.exe', contentType: 'application/x-msdownload' }, request()),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_TYPE_BLOCKED',
  );
  assert.equal(storageCalled, false);
});

test('staff upload route RBAC allows staff roles and audits denied roles', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(
    new Reflector(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  assert.equal(await guard.canActivate(context(request(RoleCode.CR_OFFICER))), true);
  await assert.rejects(
    guard.canActivate(context(request(RoleCode.MGMT_READONLY))),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'rbac_forbidden');
});

test('staff download preparation returns a backend token and audits access', async () => {
  const txClient = {};
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const downloadService = new AttachmentsService({
    findMetadata: async (id) => ({ ...attachmentRecord(AttachmentScanStatus.CLEAN), id }),
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
  } as AttachmentsRepository, {
    record: async (input, client) => auditRecords.push({ input, client }),
  } as unknown as AuditService, {
    putObject: async () => {
      throw new Error('upload should not run');
    },
    createDownloadToken: async (storageKey) => ({
      storageKey,
      token: 'attdl_0123456789abcdef0123456789abcdef',
      expiresAt: new Date('2026-06-19T10:05:00.000Z'),
    }),
  });

  const result = await downloadService.prepareStaffDownload({
    complaintId: 'cmp_1',
    attachmentId: 'att_1',
    actorId: 'usr_officer',
    branchId: 'branch_main',
    correlationId: 'req_download',
    ipAddress: '203.0.113.99',
    userAgent: 'node:test',
  });

  assert.deepEqual(result, {
    attachmentId: 'att_1',
    token: 'attdl_0123456789abcdef0123456789abcdef',
    expiresAt: new Date('2026-06-19T10:05:00.000Z'),
  });
  assert.equal(auditRecords[0]?.client, txClient);
  assert.equal(auditRecords[0]?.input.eventType, 'ATTACHMENT');
  assert.equal(auditRecords[0]?.input.action, 'attachment_download_prepared');
  assert.equal(auditRecords[0]?.input.targetId, 'att_1');
  assert.deepEqual(auditRecords[0]?.input.metadata, {
    complaintId: 'cmp_1',
    contentType: 'image/png',
    sizeBytes: 10,
  });
});

test('staff download route verifies complaint scope and returns no public URL', async () => {
  const calls: unknown[] = [];
  process.env.AWS_SECRET_ACCESS_KEY = 'do-not-return';
  const controller = new AttachmentsController({
    prepareStaffDownload: async (input) => {
      calls.push({ download: input });
      return {
        attachmentId: 'att_1',
        token: 'attdl_0123456789abcdef0123456789abcdef',
        expiresAt: new Date('2026-06-19T10:05:00.000Z'),
      };
    },
  } as AttachmentsService, {
    getDetail: async (id, filter) => {
      calls.push({ detail: { id, filter } });
      return complaintDetail('branch_main');
    },
  } as ComplaintsService);

  const response = await controller.prepareDownload('cmp_1', 'att_1', 'branch_main', request());
  const json = JSON.stringify(response);

  assert.deepEqual(response, {
    download: {
      attachmentId: 'att_1',
      token: 'attdl_0123456789abcdef0123456789abcdef',
      expiresAt: '2026-06-19T10:05:00.000Z',
    },
  });
  assert.deepEqual(calls, [
    { detail: { id: 'cmp_1', filter: { branchId: 'branch_main' } } },
    {
      download: {
        complaintId: 'cmp_1',
        attachmentId: 'att_1',
        actorId: 'usr_officer',
        correlationId: 'req_attachment',
        ipAddress: '203.0.113.99',
        userAgent: 'node:test',
        branchId: 'branch_main',
      },
    },
  ]);
  assert.equal(Object.hasOwn(response.download, 'url'), false);
  assert.equal(json.includes('do-not-return'), false);
  assert.equal(/credential|accessKey|bucket/i.test(json), false);
});

test('staff download route denies branch-hidden attachments before token preparation', async () => {
  const controller = new AttachmentsController({
    prepareStaffDownload: async () => {
      throw new Error('download should not run');
    },
  } as unknown as AttachmentsService, {
    getDetail: async () => {
      throw new AppException('COMPLAINT_NOT_FOUND', 'Complaint not found', 404);
    },
  } as ComplaintsService);

  await assert.rejects(
    controller.prepareDownload('cmp_1', 'att_1', 'branch_other', request()),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_NOT_FOUND',
  );
});

test('staff download route surfaces missing storage object denial', async () => {
  const controller = new AttachmentsController(new AttachmentsService({
    findMetadata: async () => attachmentRecord(AttachmentScanStatus.CLEAN),
  } as AttachmentsRepository, { record: async () => undefined } as unknown as AuditService, {
    putObject: async () => {
      throw new Error('upload should not run');
    },
    createDownloadToken: async () => {
      throw new AppException('ATTACHMENT_NOT_FOUND', 'Attachment object was not found', 404);
    },
  }), {
    getDetail: async () => complaintDetail('branch_main'),
  } as ComplaintsService);

  await assert.rejects(
    controller.prepareDownload('cmp_1', 'att_1', 'branch_main', request()),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_NOT_FOUND',
  );
});

test('staff download denies pending and rejected scan status before token or audit', async () => {
  for (const scanStatus of [AttachmentScanStatus.PENDING, AttachmentScanStatus.REJECTED]) {
    let tokenCalled = false;
    let auditCalled = false;
    const downloadService = new AttachmentsService({
      findMetadata: async () => attachmentRecord(scanStatus),
    } as AttachmentsRepository, {
      record: async () => {
        auditCalled = true;
      },
    } as unknown as AuditService, {
      putObject: async () => {
        throw new Error('upload should not run');
      },
      createDownloadToken: async () => {
        tokenCalled = true;
        throw new Error('token should not be created');
      },
    });

    await assert.rejects(
      downloadService.prepareStaffDownload({ complaintId: 'cmp_1', attachmentId: 'att_1' }),
      (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_SCAN_UNAVAILABLE',
    );
    assert.equal(tokenCalled, false);
    assert.equal(auditCalled, false);
  }
});

test('portal upload route requires verified session context and ignores spoofed authority fields', async () => {
  const calls: unknown[] = [];
  const controller = new PortalAttachmentsController({
    createUpload: async (input) => {
      calls.push({ upload: { ...input, bytes: input.bytes.toString() } });
      return { ...attachmentResult(input.complaintId), customerVisible: true };
    },
  } as AttachmentsService, {
    resolveAttachmentUpload: async (input) => {
      calls.push({ portal: input });
      return { complaintId: 'cmp_portal', customerId: 'cust_1', branchId: 'branch_portal', status: ComplaintStatus.IN_PROGRESS };
    },
  } as PortalService);

  const response = await controller.create('portal_session', {
    ...validAttachmentBody(),
    complaintId: 'spoofed_cmp',
    customerId: 'spoofed_customer',
    actorId: 'spoofed_actor',
    branchId: 'spoofed_branch',
    customerVisible: false,
  }, portalRequest());

  assert.equal(response.attachment.complaintId, 'cmp_portal');
  assert.equal(response.attachment.customerVisible, true);
  assert.equal('storageKey' in response.attachment, false);
  assert.equal('token' in response.attachment, false);
  assert.equal('url' in response.attachment, false);
  assert.deepEqual(calls, [
    { portal: { sessionToken: 'portal_session', correlationId: 'req_portal_attachment', ipAddress: '203.0.113.101', userAgent: 'node:test' } },
    {
      upload: {
        complaintId: 'cmp_portal',
        fileName: 'photo.png',
        contentType: 'image/png',
        sizeBytes: 10,
        bytes: 'file-bytes',
        uploadedById: null,
        actorId: null,
        branchId: 'branch_portal',
        customerVisible: true,
        correlationId: 'req_portal_attachment',
        ipAddress: '203.0.113.101',
        userAgent: 'node:test',
      },
    },
  ]);
});

test('portal upload route denies invalid sessions before storage persistence or audit', async () => {
  const controller = new PortalAttachmentsController({
    createUpload: async () => {
      throw new Error('upload should not run');
    },
  } as unknown as AttachmentsService, {
    resolveAttachmentUpload: async () => {
      throw new AppException('PORTAL_VERIFICATION_FAILED', 'Portal verification failed', 400);
    },
  } as PortalService);

  await assert.rejects(
    controller.create('bad_session', validAttachmentBody(), portalRequest()),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );
});

test('portal upload route rejects invalid metadata before storage persistence or audit', async () => {
  let storageCalled = false;
  const controller = new PortalAttachmentsController(new AttachmentsService({} as AttachmentsRepository, { record: async () => undefined } as unknown as AuditService, {
    putObject: async () => {
      storageCalled = true;
      throw new Error('storage should not run');
    },
    createDownloadToken: async () => {
      throw new Error('download should not run');
    },
  }), {
    resolveAttachmentUpload: async () => ({ complaintId: 'cmp_portal', customerId: 'cust_1', branchId: 'branch_portal', status: ComplaintStatus.IN_PROGRESS }),
  } as PortalService);

  await assert.rejects(
    controller.create('portal_session', { ...validAttachmentBody(), fileName: 'bad.exe', contentType: 'application/x-msdownload' }, portalRequest()),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_TYPE_BLOCKED',
  );
  assert.equal(storageCalled, false);
});

test('portal attachment context denies invalid sessions and terminal complaints', async () => {
  const invalidPortal = new PortalService({} as ComplaintsService, {
    findValidSession: async () => null,
  } as never, {} as never, {} as never);
  await assert.rejects(
    invalidPortal.resolveAttachmentUpload({ sessionToken: 'bad' }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );

  const terminalPortal = new PortalService({
    getDetail: async () => ({ ...complaintDetail('branch_main'), status: ComplaintStatus.CLOSED }),
  } as ComplaintsService, {
    findValidSession: async () => ({ id: 'session_1', complaintId: 'cmp_1', customerId: 'cust_1', expiresAt: new Date('2026-06-19T10:00:00.000Z') }),
  } as never, {} as never, {} as never);
  await assert.rejects(
    terminalPortal.resolveAttachmentUpload({ sessionToken: 'portal_session' }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );
});

test('portal attachment OpenAPI exposes upload only and no portal download token shape', () => {
  const openapi = JSON.parse(readFileSync('packages/contracts/openapi.json', 'utf8'));
  const portalUpload = openapi.paths['/portal/attachments']?.post;
  const staffDownload = openapi.paths['/complaints/{id}/attachments/{attachmentId}/download']?.get;

  assert.ok(portalUpload);
  assert.ok(staffDownload);
  assert.equal(openapi.paths['/portal/attachments']?.get, undefined);
  assert.equal(openapi.paths['/portal/attachments/{attachmentId}/download'], undefined);
  assert.equal(JSON.stringify(openapi.components.schemas.PortalTrackingResponse).includes('download'), false);
  assert.equal(JSON.stringify(openapi.components.schemas.PortalTrackingResponse).includes('attachments'), false);
});

test('portal attachment response schema excludes internal and provider fields', () => {
  const openapi = JSON.parse(readFileSync('packages/contracts/openapi.json', 'utf8'));
  const attachmentProperties = openapi.components.schemas.Attachment.properties;

  for (const field of ['storageKey', 'token', 'url', 'downloadUrl', 'internalComments', 'auditLogs', 'dmsCode', 'staffEmail', 'providerSecret', 'credentials']) {
    assert.equal(Object.hasOwn(attachmentProperties, field), false);
  }
});

test('attachment scan can transition pending attachments to clean or rejected with audit', async () => {
  for (const toStatus of [AttachmentScanStatus.CLEAN, AttachmentScanStatus.REJECTED]) {
    const txClient = {};
    const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
    const scanService = new AttachmentsService({
      findMetadata: async () => attachmentRecord(AttachmentScanStatus.PENDING),
      transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
      updateScanStatus: async (data, client) => {
        assert.equal(client, txClient);
        assert.deepEqual(data, { id: 'att_1', toStatus });
        return attachmentRecord(toStatus);
      },
    } as AttachmentsRepository, {
      record: async (input, client) => auditRecords.push({ input, client }),
    } as unknown as AuditService);

    const result = await scanService.transitionScanStatus({
      attachmentId: 'att_1',
      toStatus,
      actorId: 'scanner',
      branchId: 'branch_main',
      correlationId: 'req_scan',
    });

    assert.equal(result.scanStatus, toStatus);
    assert.equal(auditRecords[0]?.client, txClient);
    assert.equal(auditRecords[0]?.input.eventType, 'ATTACHMENT');
    assert.equal(auditRecords[0]?.input.action, `attachment_scan_${toStatus.toLowerCase()}`);
    assert.deepEqual(auditRecords[0]?.input.metadata, {
      complaintId: 'cmp_1',
      fromStatus: AttachmentScanStatus.PENDING,
      toStatus,
    });
  }
});

test('attachment scan rejects invalid transitions before write or audit', async () => {
  let transactionCalled = false;
  let auditCalled = false;
  const scanService = new AttachmentsService({
    findMetadata: async () => attachmentRecord(AttachmentScanStatus.CLEAN),
    transaction: async () => {
      transactionCalled = true;
      throw new Error('transaction should not start');
    },
  } as AttachmentsRepository, {
    record: async () => {
      auditCalled = true;
    },
  } as unknown as AuditService);

  await assert.rejects(
    scanService.transitionScanStatus({ attachmentId: 'att_1', toStatus: AttachmentScanStatus.REJECTED }),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_SCAN_INVALID_TRANSITION',
  );
  assert.equal(transactionCalled, false);
  assert.equal(auditCalled, false);
});

test('attachment scan rejects missing attachments before write or audit', async () => {
  let transactionCalled = false;
  const scanService = new AttachmentsService({
    findMetadata: async () => null,
    transaction: async () => {
      transactionCalled = true;
      throw new Error('transaction should not start');
    },
  } as AttachmentsRepository, { record: async () => undefined } as unknown as AuditService);

  await assert.rejects(
    scanService.transitionScanStatus({ attachmentId: 'missing', toStatus: AttachmentScanStatus.CLEAN }),
    (error: unknown) => error instanceof AppException && error.code === 'ATTACHMENT_NOT_FOUND',
  );
  assert.equal(transactionCalled, false);
});

function assertDenied(input: Parameters<AttachmentsService['validateUploadMetadata']>[0], code: string): void {
  assert.throws(
    () => service.validateUploadMetadata(input),
    (error: unknown) => error instanceof AppException && error.code === code,
  );
}

function mb(value: number): number {
  return value * 1024 * 1024;
}

function storage(calls: unknown[]): AttachmentStoragePort {
  return {
    putObject: async (input) => {
      calls.push({ storage: { contentType: input.contentType, sizeBytes: input.bytes.byteLength } });
      return { storageKey: 'objects/att_1', contentType: input.contentType, sizeBytes: input.bytes.byteLength };
    },
    createDownloadToken: async () => {
      throw new Error('download should not be called');
    },
  };
}

function validAttachmentBody() {
  return {
    fileName: 'photo.png',
    contentType: 'image/png',
    sizeBytes: 10,
    contentBase64: Buffer.from('file-bytes').toString('base64'),
    customerVisible: false,
  };
}

function attachmentResult(complaintId: string): AttachmentUploadResult {
  return {
    id: 'att_1',
    complaintId,
    storageKey: 'objects/att_1',
    fileName: 'photo.png',
    contentType: 'image/png',
    sizeBytes: 10,
    scanStatus: AttachmentScanStatus.PENDING,
    customerVisible: false,
  };
}

function attachmentRecord(scanStatus: AttachmentScanStatus | string = AttachmentScanStatus.PENDING) {
  return {
    id: 'att_1',
    complaintId: 'cmp_1',
    uploadedById: 'usr_officer',
    storageKey: 'objects/att_1',
    fileName: 'photo.png',
    contentType: 'image/png',
    sizeBytes: 10,
    scanStatus,
    customerVisible: false,
    createdAt: new Date('2026-06-19T10:00:00.000Z'),
  };
}

function complaintDetail(branchId: string) {
  return {
    id: 'cmp_1',
    referenceNumber: 'CMP-000001',
    status: 'SUBMITTED',
    severity: 'HIGH',
    subject: 'Engine noise',
    branchId,
    ownerId: null,
    createdAt: '2026-06-18T09:00:00.000Z',
    updatedAt: '2026-06-18T10:00:00.000Z',
    description: 'Engine noise',
    incidentAt: null,
    statusHistory: [],
  };
}

function request(roleCode: RoleCode = RoleCode.CR_OFFICER): AuthenticatedRequest {
  return {
    principal: {
      sessionId: 'ses_attachment',
      userId: 'usr_officer',
      email: 'officer@cms-auto.test',
      nameEn: 'CR Officer',
      nameAr: 'CR Officer',
      roleCode,
      branchId: 'branch_main',
    },
    url: '/complaints/cmp_1/attachments?branchId=branch_main',
    correlationId: 'req_attachment',
    headers: { 'x-forwarded-for': '203.0.113.99, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.99' },
  };
}

function portalRequest() {
  return {
    correlationId: 'req_portal_attachment',
    headers: { 'x-forwarded-for': '203.0.113.101, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.101' },
  };
}

function context(req: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => AttachmentsController.prototype.create,
    getClass: () => AttachmentsController,
  } as ExecutionContext;
}
