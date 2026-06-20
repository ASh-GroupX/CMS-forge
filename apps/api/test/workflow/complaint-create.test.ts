import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import {
  CommentVisibility,
  ComplaintSeverity,
  ComplaintStatus,
  ComplaintTransitionAction,
  ComplaintTransitionRequestSource,
  RoleCode,
} from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { RbacGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { ComplaintsController } from '../../src/modules/complaints/complaints.controller.ts';
import { ComplaintsRepository } from '../../src/modules/complaints/complaints.repository.ts';
import type { ComplaintDetailRecord, ComplaintQueueRecord, ComplaintSearchRecord } from '../../src/modules/complaints/complaints.repository.ts';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.ts';

test('complaint creation validates required fields before transaction', async () => {
  const service = new ComplaintsService({
    transaction: async () => {
      throw new Error('transaction should not start');
    },
  } as ComplaintsRepository, { record: async () => undefined } as unknown as AuditService);

  await assert.rejects(
    service.createInternal({
      customerName: ' ',
      categoryId: 'cat_parent',
      subcategoryId: 'cat_engine',
      description: 'Noise at cold start',
      incidentAt: '2026-06-18T09:00:00.000Z',
      branchId: 'branch_main',
      subject: 'Engine noise',
      severity: ComplaintSeverity.HIGH,
      vehicleRelated: true,
    }),
    (error: unknown) =>
      error instanceof AppException &&
      error.code === 'VALIDATION_FAILED' &&
      error.fieldErrors.some((field) => field.field === 'customerName') &&
      error.fieldErrors.some((field) => field.field === 'customerPhone') &&
      error.fieldErrors.some((field) => field.field === 'vehicleVin'),
  );
});

test('complaint creation persists complaint, initial history, and audit in one transaction', async () => {
  const txClient = {};
  const calls: unknown[] = [];
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const service = new ComplaintsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => {
      calls.push('transaction');
      return work(txClient as never);
    },
    nextReferenceNumber: async (client) => {
      assert.equal(client, txClient);
      calls.push('reference');
      return 'CMP-000001';
    },
    create: async (data, client) => {
      assert.equal(client, txClient);
      calls.push({ create: data });
      return {
        id: 'cmp_1',
        referenceNumber: data.referenceNumber,
        branchId: data.branchId,
        status: data.status,
        subject: data.subject,
        severity: data.severity,
      };
    },
    createStatusHistory: async (data, client) => {
      assert.equal(client, txClient);
      calls.push({ history: data });
    },
  } as ComplaintsRepository, {
    record: async (input, client) => auditRecords.push({ input, client }),
  } as unknown as AuditService);

  const result = await service.createInternal({
    customerName: ' Faisal Al-Otaibi ',
    customerPhone: '+966500000001',
    categoryId: 'cat_parent',
    subcategoryId: 'cat_engine',
    description: ' Engine makes a knocking noise. ',
    incidentAt: '2026-06-18T09:00:00.000Z',
    branchId: 'branch_main',
    subject: ' Engine noise ',
    severity: ComplaintSeverity.HIGH,
    vehicleRelated: true,
    vehicleVin: 'SEEDDEMO00001',
    vehicleId: 'veh_1',
    actorId: 'usr_1',
    correlationId: 'req_create',
    ipAddress: '203.0.113.55',
    userAgent: 'node:test',
  });

  assert.deepEqual(result, {
    id: 'cmp_1',
    referenceNumber: 'CMP-000001',
    status: ComplaintStatus.SUBMITTED,
  });
  assert.deepEqual(calls, [
    'transaction',
    'reference',
    {
      create: {
        referenceNumber: 'CMP-000001',
        status: ComplaintStatus.SUBMITTED,
        subject: 'Engine noise',
        severity: ComplaintSeverity.HIGH,
        branchId: 'branch_main',
        categoryId: 'cat_engine',
        customerName: 'Faisal Al-Otaibi',
        customerPhone: '+966500000001',
        customerNumber: null,
        vehicleId: 'veh_1',
        createdById: 'usr_1',
        descriptionEn: 'Engine makes a knocking noise.',
        incidentAt: new Date('2026-06-18T09:00:00.000Z'),
      },
    },
    {
      history: {
        complaintId: 'cmp_1',
        fromStatus: null,
        toStatus: ComplaintStatus.SUBMITTED,
        action: ComplaintTransitionAction.SUBMIT,
        actorId: 'usr_1',
        actorRole: null,
        requestSource: ComplaintTransitionRequestSource.STAFF_API,
        reason: null,
        correlationId: 'req_create',
      },
    },
  ]);
  assert.equal(auditRecords[0]?.client, txClient);
  assert.equal(auditRecords[0]?.input.eventType, 'COMPLAINT');
  assert.equal(auditRecords[0]?.input.action, 'complaint_created');
  assert.equal(auditRecords[0]?.input.actorId, 'usr_1');
  assert.equal(auditRecords[0]?.input.branchId, 'branch_main');
  assert.equal(auditRecords[0]?.input.targetId, 'cmp_1');
  assert.deepEqual(auditRecords[0]?.input.metadata, {
    referenceNumber: 'CMP-000001',
    status: ComplaintStatus.SUBMITTED,
    severity: ComplaintSeverity.HIGH,
  });
});

test('complaint creation route delegates with guarded branch and server actor context', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({
    createInternal: async (input) => {
      calls.push(input);
      return { id: 'cmp_1', referenceNumber: 'CMP-000001', status: ComplaintStatus.SUBMITTED };
    },
  } as ComplaintsService);

  const response = await controller.create('branch_main', {
    ...validBody(),
    branchId: 'spoofed_branch',
    actorId: 'spoofed',
  }, request());

  assert.deepEqual(response.complaint, {
    id: 'cmp_1',
    referenceNumber: 'CMP-000001',
    status: ComplaintStatus.SUBMITTED,
  });
  assert.deepEqual(calls[0], {
    ...validBody(),
    branchId: 'branch_main',
    actorId: 'usr_officer',
    correlationId: 'req_create_route',
    ipAddress: '203.0.113.66',
    userAgent: 'node:test',
  });
});

test('complaint creation route rejects missing branch query with stable validation error', async () => {
  const controller = new ComplaintsController({} as ComplaintsService);

  await assert.rejects(
    controller.create(undefined, validBody(), request()),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('complaint creation route audits branch-scope denials', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(
    new Reflector(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  assert.equal(await guard.canActivate(context(request())), true);
  await assert.rejects(
    guard.canActivate(context(request(RoleCode.CR_OFFICER, 'branch_other'))),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );

  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'branch_scope_forbidden');
});

test('complaint workflow rejects invalid transitions before repository writes', async () => {
  const service = new ComplaintsService({
    transaction: async () => {
      throw new Error('transaction should not start');
    },
  } as ComplaintsRepository, { record: async () => undefined } as unknown as AuditService);

  await assert.rejects(
    service.applyTransition({
      complaintId: 'cmp_1',
      fromStatus: ComplaintStatus.SUBMITTED,
      action: ComplaintTransitionAction.CLOSE,
      actorRole: RoleCode.CR_OFFICER,
      actorId: 'usr_officer',
      requestSource: ComplaintTransitionRequestSource.STAFF_API,
      correlationId: 'req_invalid_transition',
    }),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_INVALID_TRANSITION',
  );
});

test('complaint transition route uses server role instead of client-owned authority', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({
    getDetail: async (id, filter) => {
      calls.push({ method: 'getDetail', id, filter });
      return { ...validQueueItem(), description: 'Engine noise', incidentAt: null, statusHistory: [] };
    },
    applyTransition: async (input) => {
      calls.push({ method: 'applyTransition', input });
      return { complaintId: input.complaintId, fromStatus: input.fromStatus, action: input.action, actorRole: input.actorRole, toStatus: ComplaintStatus.MANAGER_REVIEW };
    },
  } as ComplaintsService);

  await controller.transition('cmp_1', undefined, {
    fromStatus: ComplaintStatus.SUBMITTED,
    action: ComplaintTransitionAction.ACCEPT_INTAKE,
    actorRole: RoleCode.ADMIN,
    actorId: 'spoofed',
  }, request(RoleCode.CR_MANAGER));

  assert.deepEqual(calls[1], {
    method: 'applyTransition',
    input: {
      complaintId: 'cmp_1',
      fromStatus: ComplaintStatus.SUBMITTED,
      action: ComplaintTransitionAction.ACCEPT_INTAKE,
      actorRole: RoleCode.CR_MANAGER,
      actorId: 'usr_officer',
      requestSource: ComplaintTransitionRequestSource.STAFF_API,
      reason: null,
      correlationId: 'req_create_route',
      ipAddress: '203.0.113.66',
      userAgent: 'node:test',
    },
  });
});

test('complaint queue service returns explicit branch-scoped response objects', async () => {
  const service = new ComplaintsService({
    listQueue: async (filter) => {
      assert.deepEqual(filter, { branchId: 'branch_main' });
      return [queueRecord];
    },
  } as ComplaintsRepository, { record: async () => undefined } as unknown as AuditService);

  assert.deepEqual(await service.listQueue({ branchId: 'branch_main' }), [{
    id: 'cmp_1',
    referenceNumber: 'CMP-000001',
    status: ComplaintStatus.SUBMITTED,
    severity: ComplaintSeverity.HIGH,
    subject: 'Engine noise',
    branchId: 'branch_main',
    ownerId: null,
    createdAt: '2026-06-18T09:00:00.000Z',
    updatedAt: '2026-06-18T10:00:00.000Z',
  }]);
});

test('complaint search service maps required filters into safe branch-scoped rows', async () => {
  const calls: unknown[] = [];
  const service = new ComplaintsService({
    search: async (filter) => {
      calls.push(filter);
      return [searchRecord('cmp_1', 'branch_main')];
    },
  } as ComplaintsRepository, { record: async () => undefined } as unknown as AuditService);

  const rows = await service.search({
    branchId: 'branch_main',
    referenceNumber: 'CMP-000001',
    customer: 'Faisal',
    status: ComplaintStatus.SUBMITTED,
    severity: ComplaintSeverity.HIGH,
    ownerId: 'usr_owner',
    dateFrom: '2026-06-18T00:00:00.000Z',
    dateTo: '2026-06-19T00:00:00.000Z',
  });

  assert.deepEqual(calls[0], {
    branchId: 'branch_main',
    referenceNumber: 'CMP-000001',
    customer: 'Faisal',
    status: ComplaintStatus.SUBMITTED,
    severity: ComplaintSeverity.HIGH,
    ownerId: 'usr_owner',
    dateFrom: '2026-06-18T00:00:00.000Z',
    dateTo: '2026-06-19T00:00:00.000Z',
  });
  assert.deepEqual(rows, [{
    ...validQueueItem(),
    categoryId: 'cat_engine',
    ownerId: 'usr_owner',
    customerName: 'Faisal Al-Otaibi',
    customerPhone: '+966500000001',
    customerIdentifier: 'CUST-001',
  }]);
});

test('complaint search service hides out-of-branch rows when branch scope is supplied', async () => {
  const records = [
    searchRecord('cmp_allowed', 'branch_main'),
    searchRecord('cmp_hidden', 'branch_other'),
  ];
  const service = new ComplaintsService({
    search: async (filter) => records.filter((record) => !filter.branchId || record.branchId === filter.branchId),
  } as ComplaintsRepository, { record: async () => undefined } as unknown as AuditService);

  assert.deepEqual((await service.search({ branchId: 'branch_main' })).map((row) => row.id), ['cmp_allowed']);
});

test('complaint queue route derives branch scope from query or server principal', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({
    listQueue: async (filter) => {
      calls.push(filter);
      return [];
    },
  } as ComplaintsService);

  assert.deepEqual(await controller.list(undefined, request(RoleCode.CR_OFFICER)), { items: [] });
  assert.deepEqual(await controller.list('branch_any', request(RoleCode.ADMIN)), { items: [] });
  assert.deepEqual(calls, [{ branchId: 'branch_main' }, { branchId: 'branch_any' }]);
});

test('complaint detail service returns explicit timeline and hides missing scoped complaints', async () => {
  const service = new ComplaintsService({
    findDetail: async (id, filter) => (id === 'cmp_1' && filter.branchId === 'branch_main' ? detailRecord : null),
  } as ComplaintsRepository, { record: async () => undefined } as unknown as AuditService);

  const detail = await service.getDetail('cmp_1', { branchId: 'branch_main' });
  assert.equal(detail.referenceNumber, 'CMP-000001');
  assert.equal(detail.description, 'Engine makes a knocking noise.');
  assert.equal(detail.statusHistory[0]?.toStatus, ComplaintStatus.SUBMITTED);
  assert.equal(detail.statusHistory[0]?.createdAt, '2026-06-18T09:01:00.000Z');
  assert.equal('customer' in detail, false);

  await assert.rejects(
    service.getDetail('cmp_1', { branchId: 'branch_other' }),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_NOT_FOUND',
  );
});

test('complaint detail route delegates with server-derived branch scope', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({
    getDetail: async (id, filter) => {
      calls.push({ id, filter });
      return {
        ...validQueueItem(),
        description: 'Engine makes a knocking noise.',
        incidentAt: '2026-06-18T09:00:00.000Z',
        statusHistory: [],
      };
    },
  } as ComplaintsService);

  assert.equal((await controller.get('cmp_1', undefined, request(RoleCode.CR_OFFICER))).complaint.id, 'cmp_1');
  assert.deepEqual(calls[0], { id: 'cmp_1', filter: { branchId: 'branch_main' } });
});

test('complaint comments validate body and audit creation in one transaction', async () => {
  const txClient = {};
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const service = new ComplaintsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    createComment: async (data, client) => {
      assert.equal(client, txClient);
      assert.deepEqual(data, {
        complaintId: 'cmp_1',
        authorId: 'usr_officer',
        body: 'Customer called back.',
        visibility: CommentVisibility.PUBLIC,
      });
      return {
        id: 'cmt_1',
        complaintId: data.complaintId,
        authorId: data.authorId ?? null,
        body: data.body,
        visibility: data.visibility,
        createdAt: new Date('2026-06-18T11:00:00.000Z'),
      };
    },
  } as ComplaintsRepository, {
    record: async (input, client) => auditRecords.push({ input, client }),
  } as unknown as AuditService);

  await assert.rejects(
    service.createComment({ complaintId: 'cmp_1', body: ' ', visibility: CommentVisibility.INTERNAL }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );

  assert.deepEqual(await service.createComment({
    complaintId: 'cmp_1',
    body: ' Customer called back. ',
    visibility: CommentVisibility.PUBLIC,
    actorId: 'usr_officer',
    correlationId: 'req_comment',
    ipAddress: '203.0.113.77',
    userAgent: 'node:test',
  }), {
    id: 'cmt_1',
    complaintId: 'cmp_1',
    authorId: 'usr_officer',
    body: 'Customer called back.',
    visibility: CommentVisibility.PUBLIC,
    createdAt: '2026-06-18T11:00:00.000Z',
  });
  assert.equal(auditRecords[0]?.client, txClient);
  assert.equal(auditRecords[0]?.input.eventType, 'COMMENT');
  assert.equal(auditRecords[0]?.input.action, 'public_comment_created');
  assert.deepEqual(auditRecords[0]?.input.metadata, { complaintId: 'cmp_1', visibility: CommentVisibility.PUBLIC });
});

test('public comment reads exclude internal comments', async () => {
  const service = new ComplaintsService({
    listPublicComments: async (complaintId) => {
      assert.equal(complaintId, 'cmp_1');
      return [{
        id: 'cmt_public',
        complaintId,
        authorId: 'usr_officer',
        body: 'Visible update',
        visibility: CommentVisibility.PUBLIC,
        createdAt: new Date('2026-06-18T11:10:00.000Z'),
      }];
    },
  } as ComplaintsRepository, { record: async () => undefined } as unknown as AuditService);

  assert.deepEqual(await service.listPublicComments('cmp_1'), [{
    id: 'cmt_public',
    complaintId: 'cmp_1',
    authorId: 'usr_officer',
    body: 'Visible update',
    visibility: CommentVisibility.PUBLIC,
    createdAt: '2026-06-18T11:10:00.000Z',
  }]);
});

test('customer portal public follow-up comment audits safely in the complaint transaction', async () => {
  const txClient = {};
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const service = new ComplaintsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    createComment: async (data, client) => {
      assert.equal(client, txClient);
      assert.deepEqual(data, { complaintId: 'cmp_1', authorId: null, body: 'Customer update', visibility: CommentVisibility.PUBLIC });
      return { id: 'cmt_portal', complaintId: data.complaintId, authorId: null, body: data.body, visibility: data.visibility, createdAt: new Date('2026-06-18T11:20:00.000Z') };
    },
  } as ComplaintsRepository, {
    record: async (input, client) => auditRecords.push({ input, client }),
  } as unknown as AuditService);

  assert.deepEqual(await service.createComment({
    complaintId: 'cmp_1',
    body: ' Customer update ',
    visibility: CommentVisibility.PUBLIC,
    actorId: null,
    correlationId: 'req_portal_follow',
    ipAddress: '203.0.113.88',
    userAgent: 'node:test',
  }), {
    id: 'cmt_portal',
    complaintId: 'cmp_1',
    authorId: null,
    body: 'Customer update',
    visibility: CommentVisibility.PUBLIC,
    createdAt: '2026-06-18T11:20:00.000Z',
  });
  assert.equal(auditRecords[0]?.client, txClient);
  assert.equal(auditRecords[0]?.input.eventType, 'COMMENT');
  assert.equal(auditRecords[0]?.input.action, 'public_comment_created');
  assert.equal(auditRecords[0]?.input.actorId, null);
  assert.deepEqual(auditRecords[0]?.input.metadata, { complaintId: 'cmp_1', visibility: CommentVisibility.PUBLIC });
});

test('complaint comment route verifies scoped detail then delegates creation', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({
    getDetail: async (id, filter) => {
      calls.push({ method: 'getDetail', id, filter });
      return { ...validQueueItem(), description: 'Engine noise', incidentAt: null, statusHistory: [] };
    },
    createComment: async (input) => {
      calls.push({ method: 'createComment', input });
      return {
        id: 'cmt_1',
        complaintId: input.complaintId,
        authorId: input.actorId ?? null,
        body: input.body,
        visibility: input.visibility,
        createdAt: '2026-06-18T11:00:00.000Z',
      };
    },
  } as ComplaintsService);

  const response = await controller.createComment('cmp_1', undefined, {
    body: ' Public update ',
    visibility: CommentVisibility.PUBLIC,
  }, request());

  assert.equal(response.comment.body, 'Public update');
  assert.deepEqual(calls[0], { method: 'getDetail', id: 'cmp_1', filter: { branchId: 'branch_main' } });
  assert.deepEqual(calls[1], {
    method: 'createComment',
    input: {
      complaintId: 'cmp_1',
      body: 'Public update',
      visibility: CommentVisibility.PUBLIC,
      actorId: 'usr_officer',
      correlationId: 'req_create_route',
      ipAddress: '203.0.113.66',
      userAgent: 'node:test',
    },
  });
});

test('complaint comment route rejects invalid body before service write', async () => {
  const controller = new ComplaintsController({} as ComplaintsService);

  await assert.rejects(
    controller.createComment('cmp_1', undefined, { body: ' ', visibility: CommentVisibility.PUBLIC }, request()),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('public comment route verifies scope and returns only public comments', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({
    getDetail: async (id, filter) => {
      calls.push({ method: 'getDetail', id, filter });
      return { ...validQueueItem(), description: 'Engine noise', incidentAt: null, statusHistory: [] };
    },
    listPublicComments: async (id) => {
      calls.push({ method: 'listPublicComments', id });
      return [{
        id: 'cmt_public',
        complaintId: id,
        authorId: 'usr_officer',
        body: 'Visible update',
        visibility: CommentVisibility.PUBLIC,
        createdAt: '2026-06-18T11:10:00.000Z',
      }];
    },
  } as ComplaintsService);

  const response = await controller.listPublicComments('cmp_1', 'branch_main', request());
  assert.equal(response.items.length, 1);
  assert.equal(response.items[0]?.visibility, CommentVisibility.PUBLIC);
  assert.deepEqual(calls[0], { method: 'getDetail', id: 'cmp_1', filter: { branchId: 'branch_main' } });
});

function validBody() {
  return {
    customerName: 'Faisal Al-Otaibi',
    customerPhone: '+966500000001',
    customerNumber: null,
    categoryId: 'cat_parent',
    subcategoryId: 'cat_engine',
    description: 'Engine makes a knocking noise.',
    incidentAt: '2026-06-18T09:00:00.000Z',
    subject: 'Engine noise',
    severity: ComplaintSeverity.HIGH,
    vehicleRelated: true,
    vehicleVin: 'SEEDDEMO00001',
    vehicleId: null,
  };
}

const queueRecord: ComplaintQueueRecord = {
  id: 'cmp_1',
  referenceNumber: 'CMP-000001',
  status: ComplaintStatus.SUBMITTED,
  severity: ComplaintSeverity.HIGH,
  subject: 'Engine noise',
  branchId: 'branch_main',
  ownerId: null,
  createdAt: new Date('2026-06-18T09:00:00.000Z'),
  updatedAt: new Date('2026-06-18T10:00:00.000Z'),
};

const detailRecord: ComplaintDetailRecord = {
  ...queueRecord,
  descriptionEn: 'Engine makes a knocking noise.',
  incidentAt: new Date('2026-06-18T09:00:00.000Z'),
  statusHistory: [{
    id: 'hist_1',
    fromStatus: null,
    toStatus: ComplaintStatus.SUBMITTED,
    action: ComplaintTransitionAction.SUBMIT,
    actorId: 'usr_officer',
    actorRole: null,
    requestSource: ComplaintTransitionRequestSource.STAFF_API,
    reason: null,
    correlationId: 'req_create_route',
    createdAt: new Date('2026-06-18T09:01:00.000Z'),
  }],
};

function searchRecord(id: string, branchId: string): ComplaintSearchRecord {
  return {
    id,
    referenceNumber: id === 'cmp_1' ? 'CMP-000001' : id,
    status: ComplaintStatus.SUBMITTED,
    severity: ComplaintSeverity.HIGH,
    subject: 'Engine noise',
    branchId,
    ownerId: 'usr_owner',
    categoryId: 'cat_engine',
    customerName: 'Faisal Al-Otaibi',
    customerPhone: '+966500000001',
    customerIdentifier: 'CUST-001',
    createdAt: new Date('2026-06-18T09:00:00.000Z'),
    updatedAt: new Date('2026-06-18T10:00:00.000Z'),
  };
}

function validQueueItem() {
  return {
    id: 'cmp_1',
    referenceNumber: 'CMP-000001',
    status: ComplaintStatus.SUBMITTED,
    severity: ComplaintSeverity.HIGH,
    subject: 'Engine noise',
    branchId: 'branch_main',
    ownerId: null,
    createdAt: '2026-06-18T09:00:00.000Z',
    updatedAt: '2026-06-18T10:00:00.000Z',
  };
}

function request(roleCode = RoleCode.CR_OFFICER, branchId = 'branch_main'): AuthenticatedRequest {
  return {
    principal: principal(roleCode),
    url: `/complaints?branchId=${branchId}`,
    correlationId: 'req_create_route',
    headers: { 'x-forwarded-for': '203.0.113.66, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.66' },
  };
}

function principal(roleCode: RoleCode): StaffPrincipal {
  return {
    sessionId: 'ses_create',
    userId: 'usr_officer',
    email: 'officer@cms-auto.test',
    nameEn: 'CR Officer',
    nameAr: 'CR Officer',
    roleCode,
    branchId: 'branch_main',
  };
}

function context(req: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ComplaintsController.prototype.create,
    getClass: () => ComplaintsController,
  } as ExecutionContext;
}
