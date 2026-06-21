import assert from 'node:assert/strict';
import test from 'node:test';
import { CapaActionStatus, CaseConfidentialityLevel, CaseLifecycleStatus, CaseLinkEntityType, CaseParticipantRole, CaseType, ComplaintStatus, RoleCode, TaskLinkEntityType } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { CasesRepository } from './cases.repository.js';
import type { CapaActionRecord, CaseRecord, CreateCapaActionData, CreateCaseData } from './cases.repository.js';
import { CasesService } from './cases.service.js';

test('case draft accepts customer link without requiring a vehicle', async () => {
  let captured: CreateCaseData | undefined;
  const service = new CasesService({
    create: async (data: CreateCaseData) => {
      captured = data;
      return caseRecord({ ...data, id: 'case_1', links: withCreatedAt(data.links) });
    },
  } as unknown as CasesRepository);

  const result = await service.createDraft({
    branchId: 'branch_1',
    ownerId: 'owner_1',
    subject: 'Late delivery',
    descriptionEn: 'Customer delivery promise missed',
    links: [{ entityType: CaseLinkEntityType.CUSTOMER, entityId: 'customer_1' }],
  });

  assert.equal(captured?.type, CaseType.CUSTOMER_COMPLAINT);
  assert.equal(captured?.status, ComplaintStatus.DRAFT);
  assert.equal(captured?.lifecycleStatus, CaseLifecycleStatus.DRAFT);
  assert.equal(captured?.confidentialityLevel, CaseConfidentialityLevel.NORMAL);
  assert.deepEqual(result.links, [{ entityType: CaseLinkEntityType.CUSTOMER, entityId: 'customer_1' }]);
});

test('case draft rejects empty or invalid links', async () => {
  const service = new CasesService({ create: async () => caseRecord() } as unknown as CasesRepository);

  await assert.rejects(
    service.createDraft({ branchId: 'branch_1', subject: 'Late delivery', descriptionEn: 'Missing link', links: [] }),
    (error) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.createDraft({
      branchId: 'branch_1',
      subject: 'Late delivery',
      descriptionEn: 'Bad link',
      links: [{ entityType: 'BAD' as CaseLinkEntityType, entityId: 'customer_1' }],
    }),
    (error) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('customer complaint wrapper is idempotent and writes initial case lifecycle', async () => {
  const calls: unknown[] = [];
  const tx = {};
  const service = new CasesService({
    findCustomerComplaintByComplaintId: async (complaintId: string, client: unknown) => {
      calls.push({ find: complaintId, client });
      return null;
    },
    create: async (data: CreateCaseData, client: unknown) => {
      calls.push({ create: data, client });
      return caseRecord({ ...data, id: 'case_from_cmp', links: withCreatedAt(data.links) });
    },
    createInitialLifecycleHistory: async (data: unknown, client: unknown) => { calls.push({ lifecycle: data, client }); },
  } as unknown as CasesRepository, { record: async (input: AuditRecordInput, client: unknown) => { calls.push({ audit: input, client }); } } as unknown as AuditService);

  const result = await service.ensureCustomerComplaintCaseForComplaint({
    complaintId: 'cmp_1',
    branchId: 'branch_1',
    subject: 'Engine noise',
    descriptionEn: 'Knocking noise',
    status: ComplaintStatus.SUBMITTED,
    actorId: 'usr_1',
    correlationId: 'req_1',
  }, tx as never);

  assert.equal(result.id, 'case_from_cmp');
  assert.equal(result.type, CaseType.CUSTOMER_COMPLAINT);
  assert.deepEqual(calls[0], { find: 'cmp_1', client: tx });
  assert.deepEqual(calls[2], { lifecycle: { caseId: 'case_from_cmp', toStatus: CaseLifecycleStatus.DRAFT, actorId: 'usr_1', correlationId: 'req_1' }, client: tx });
  assert.equal((calls[3] as { audit: { action: string } }).audit.action, 'case_created_from_complaint');

  const existing = caseRecord({ id: 'case_existing' });
  const idempotent = new CasesService({ findCustomerComplaintByComplaintId: async () => existing } as unknown as CasesRepository);
  assert.equal((await idempotent.ensureCustomerComplaintCaseForComplaint({ complaintId: 'cmp_1', branchId: 'branch_1', subject: 'Engine noise', descriptionEn: 'Knocking noise', status: ComplaintStatus.SUBMITTED }, tx as never)).id, 'case_existing');
});

test('case timeline returns metadata links and task link shape', async () => {
  const service = new CasesService({
    findById: async () => caseRecord({
      id: 'case_1',
      links: [{ entityType: CaseLinkEntityType.COMPLAINT, entityId: 'complaint_1', createdAt: new Date('2026-06-20T09:00:00.000Z') }],
    }),
    countRepeatCustomerRootCause: async () => 0,
    listComplaintLifecycle: async () => [{ complaintId: 'complaint_1', fromStatus: null, toStatus: ComplaintStatus.SUBMITTED, action: null, createdAt: new Date('2026-06-20T09:05:00.000Z') }],
  } as unknown as CasesRepository);

  const result = await service.timeline('case_1');

  assert.equal(result.case.id, 'case_1');
  assert.deepEqual(result.taskLink, { entityType: TaskLinkEntityType.CASE, entityId: 'case_1' });
  assert.deepEqual(result.events.map((event) => event.type), ['CASE_CREATED', 'CASE_LINKED', 'COMPLAINT_STATUS']);
  assert.deepEqual(result.capaActions, []);
  assert.deepEqual(result.restrictedNotes, []);
  assert.deepEqual(result.repeatIssue, { isRepeat: false, rootCauses: [] });
});

test('task link for case rejects blank ids', () => {
  const service = new CasesService({} as CasesRepository);

  assert.throws(
    () => service.taskLinkForCase(' '),
    (error) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('case CAPA action validates and returns accountability fields', async () => {
  let captured: CreateCapaActionData | undefined;
  const calls: unknown[] = [];
  const service = new CasesService({
    transaction: async (work: (client: unknown) => Promise<unknown>) => work('tx'),
    findByIdInTransaction: async (_caseId: string, client: unknown) => {
      calls.push({ findClient: client });
      return caseRecord();
    },
    createCapaAction: async (data: CreateCapaActionData, client: unknown) => {
      captured = data;
      calls.push({ createClient: client });
      return capaRecord(data);
    },
  } as unknown as CasesRepository, { record: async (input: AuditRecordInput, client: unknown) => { calls.push({ audit: input, client }); } } as AuditService);

  const result = await service.createCapaAction({
    caseId: 'case_1',
    rootCause: 'Late parts confirmation',
    correctiveAction: 'Call customer before 10 AM',
    preventiveAction: 'Daily parts delay review',
    dueAt: '2026-06-25T09:00:00.000Z',
    status: CapaActionStatus.IN_PROGRESS,
  }, { userId: 'usr_actor', role: RoleCode.CR_MANAGER, branchId: 'branch_1' }, { correlationId: 'req_capa' });

  assert.equal(captured?.ownerId, 'owner_1');
  assert.equal(captured?.rootCause, 'Late parts confirmation');
  assert.equal(captured?.dueAt.toISOString(), '2026-06-25T09:00:00.000Z');
  assert.equal(result.ownerName, 'Owner User');
  assert.equal(result.status, CapaActionStatus.IN_PROGRESS);
  assert.equal((calls[2] as { audit: AuditRecordInput }).audit.action, 'case_capa_created');
  assert.equal((calls[2] as { client: unknown }).client, 'tx');
});

test('case CAPA action rejects missing required accountability fields and can be read', async () => {
  const service = new CasesService({
    transaction: async (work: (client: unknown) => Promise<unknown>) => work({}),
    findByIdInTransaction: async () => caseRecord(),
    findById: async () => caseRecord({ capaActions: [capaRecord()] }),
    createCapaAction: async (data: CreateCapaActionData) => capaRecord(data),
  } as unknown as CasesRepository);

  await assert.rejects(
    service.createCapaAction({
      caseId: 'case_1',
      rootCause: ' ',
      correctiveAction: 'Call customer',
      preventiveAction: 'Daily review',
      dueAt: '2026-06-25T09:00:00.000Z',
    }, { userId: 'usr_actor', role: RoleCode.CR_MANAGER, branchId: 'branch_1' }),
    (error) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );

  assert.deepEqual((await service.listCapaActionsForActor('case_1', { userId: 'usr_actor', role: RoleCode.CR_MANAGER, branchId: 'branch_1' })).map((item) => item.id), ['capa_1']);
});

test('case CAPA write denies readonly actors before create', async () => {
  const service = new CasesService({ transaction: async () => assert.fail('transaction should not start') } as unknown as CasesRepository);

  await assert.rejects(
    service.createCapaAction({
      caseId: 'case_1',
      rootCause: 'Late parts confirmation',
      correctiveAction: 'Call customer',
      preventiveAction: 'Daily review',
      dueAt: '2026-06-25T09:00:00.000Z',
    }, { userId: 'usr_readonly', role: RoleCode.MGMT_READONLY, branchId: 'branch_1' }),
    (error) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
});

test('case CAPA write denies different branch before create and audits', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const service = new CasesService({
    transaction: async (work: (client: unknown) => Promise<unknown>) => work('tx'),
    findByIdInTransaction: async () => caseRecord(),
    createCapaAction: async () => assert.fail('create should not run'),
  } as unknown as CasesRepository, { record: async (input) => { auditRecords.push(input); } } as AuditService);

  await assert.rejects(
    service.createCapaAction({
      caseId: 'case_1',
      rootCause: 'Late parts confirmation',
      correctiveAction: 'Call customer',
      preventiveAction: 'Daily review',
      dueAt: '2026-06-25T09:00:00.000Z',
    }, { userId: 'usr_other', role: RoleCode.CR_MANAGER, branchId: 'branch_other' }, { correlationId: 'req_branch' }),
    (error) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );

  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'case_confidential_access_denied');
  assert.deepEqual(auditRecords[0]?.metadata, { reason: 'branch_scope', caseBranchId: 'branch_1' });
});

test('case timeline surfaces CAPA actions and repeat customer root cause signal', async () => {
  let repeatInput: unknown;
  const service = new CasesService({
    findById: async () => caseRecord({
      links: [{ entityType: CaseLinkEntityType.CUSTOMER, entityId: 'customer_1', createdAt: new Date('2026-06-20T08:00:00.000Z') }],
      capaActions: [capaRecord({ rootCause: 'Late parts confirmation' })],
    }),
    countRepeatCustomerRootCause: async (input: unknown) => {
      repeatInput = input;
      return 1;
    },
  } as unknown as CasesRepository);

  const result = await service.timeline('case_1');

  assert.deepEqual(repeatInput, { caseId: 'case_1', customerIds: ['customer_1'], rootCauses: ['Late parts confirmation'] });
  assert.equal(result.capaActions[0]?.rootCause, 'Late parts confirmation');
  assert.deepEqual(result.repeatIssue, { isRepeat: true, rootCauses: ['Late parts confirmation'] });
  assert.ok(result.events.some((event) => event.type === 'CAPA_ACTION_CREATED' && event.capaActionId === 'capa_1'));
});

test('case timeline marks non-repeat when customer root cause is unique', async () => {
  const service = new CasesService({
    findById: async () => caseRecord({
      links: [{ entityType: CaseLinkEntityType.CUSTOMER, entityId: 'customer_1', createdAt: new Date('2026-06-20T08:00:00.000Z') }],
      capaActions: [capaRecord({ rootCause: 'Unique delivery issue' })],
    }),
    countRepeatCustomerRootCause: async () => 0,
  } as unknown as CasesRepository);

  assert.deepEqual((await service.timeline('case_1')).repeatIssue, { isRepeat: false, rootCauses: ['Unique delivery issue'] });
});

test('participant can read a confidential case timeline', async () => {
  const service = new CasesService({
    findById: async () => caseRecord({
      confidentialityLevel: CaseConfidentialityLevel.CONFIDENTIAL,
      participants: [{ userId: 'user_participant', role: CaseParticipantRole.PARTICIPANT }],
    }),
    countRepeatCustomerRootCause: async () => 0,
  } as unknown as CasesRepository);

  const result = await service.timelineForActor('case_1', {
    userId: 'user_participant',
    role: RoleCode.CR_OFFICER,
    branchId: 'branch_1',
  });

  assert.equal(result.case.id, 'case_1');
  assert.equal(result.case.confidentialityLevel, CaseConfidentialityLevel.CONFIDENTIAL);
});

test('employee grievance cases default to confidential HR review', async () => {
  let captured: CreateCaseData | undefined;
  const service = new CasesService({
    create: async (data: CreateCaseData) => {
      captured = data;
      return caseRecord({ ...data, id: 'case_hr', links: withCreatedAt(data.links) });
    },
  } as unknown as CasesRepository);

  const result = await service.createEmployeeGrievance({
    branchId: 'branch_1',
    ownerId: 'hr_owner',
    employeeUserId: 'employee_1',
    subject: 'Workplace grievance',
    descriptionEn: 'Confidential HR review',
    participants: [{ userId: 'hr_owner', role: CaseParticipantRole.OWNER }],
  });

  assert.equal(captured?.type, CaseType.EMPLOYEE_GRIEVANCE);
  assert.equal(captured?.confidentialityLevel, CaseConfidentialityLevel.CONFIDENTIAL);
  assert.equal(captured?.lifecycleStatus, CaseLifecycleStatus.HR_REVIEW);
  assert.deepEqual(result.links[0], { entityType: CaseLinkEntityType.EMPLOYEE, entityId: 'employee_1' });
});

test('confidential participant can read restricted notes', async () => {
  const service = new CasesService({
    findById: async () => caseRecord({
      type: CaseType.EMPLOYEE_GRIEVANCE,
      confidentialityLevel: CaseConfidentialityLevel.CONFIDENTIAL,
      participants: [{ userId: 'hr_owner', role: CaseParticipantRole.OWNER }],
      restrictedNotes: [restrictedNote()],
    }),
    countRepeatCustomerRootCause: async () => 0,
  } as unknown as CasesRepository);

  const result = await service.timelineForActor('case_1', { userId: 'hr_owner', role: RoleCode.CR_MANAGER, branchId: 'branch_1' });

  assert.deepEqual(result.restrictedNotes.map((note) => note.body), ['Private HR note']);
  assert.deepEqual((await service.timeline('case_1')).restrictedNotes, []);
});

test('accused confidential case participant is denied before restricted notes are returned and audited', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const service = new CasesService({
    findById: async () => caseRecord({
      confidentialityLevel: CaseConfidentialityLevel.CONFIDENTIAL,
      ownerId: 'user_accused',
      participants: [{ userId: 'user_accused', role: CaseParticipantRole.ACCUSED }],
      restrictedNotes: [restrictedNote()],
    }),
    countRepeatCustomerRootCause: async () => 0,
  } as unknown as CasesRepository, { record: async (input) => { auditRecords.push(input); } } as AuditService);

  await assert.rejects(
    service.timelineForActor('case_1', {
      userId: 'user_accused',
      role: RoleCode.ADMIN,
      branchId: 'branch_1',
    }, { correlationId: 'req_acl' }),
    (error) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );

  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'case_confidential_access_denied');
  assert.deepEqual(auditRecords[0]?.metadata, { reason: 'accused_conflict', caseBranchId: 'branch_1' });
  assert.equal(auditRecords[0]?.correlationId, 'req_acl');
});

test('employee grievance lifecycle rejects invalid confidential moves', async () => {
  const service = new CasesService({
    transaction: async (work: (client: unknown) => Promise<unknown>) => work({}),
    findByIdInTransaction: async () => caseRecord({
      type: CaseType.EMPLOYEE_GRIEVANCE,
      lifecycleStatus: CaseLifecycleStatus.HR_REVIEW,
      confidentialityLevel: CaseConfidentialityLevel.CONFIDENTIAL,
      participants: [{ userId: 'hr_owner', role: CaseParticipantRole.OWNER }],
    }),
  } as unknown as CasesRepository);

  await assert.rejects(
    service.updateEmployeeGrievanceLifecycle(
      { caseId: 'case_1', toStatus: CaseLifecycleStatus.CLOSED },
      { userId: 'hr_owner', role: RoleCode.CR_MANAGER, branchId: 'branch_1' },
    ),
    (error) => error instanceof AppException && error.code === 'CASE_INVALID_LIFECYCLE_TRANSITION',
  );
});

function caseRecord(overrides: Partial<CaseRecord> & { links?: CaseRecord['links'] } = {}): CaseRecord {
  const now = new Date('2026-06-20T08:00:00.000Z');
  return {
    id: 'case_1',
    type: CaseType.CUSTOMER_COMPLAINT,
    status: ComplaintStatus.DRAFT,
    lifecycleStatus: CaseLifecycleStatus.DRAFT,
    confidentialityLevel: CaseConfidentialityLevel.NORMAL,
    branchId: 'branch_1',
    ownerId: 'owner_1',
    subject: 'Late delivery',
    descriptionEn: 'Customer delivery promise missed',
    descriptionAr: null,
    createdAt: now,
    updatedAt: now,
    branch: { nameEn: 'Main Branch', nameAr: 'Main Branch' },
    owner: { nameEn: 'Owner User' },
    links: [{ entityType: CaseLinkEntityType.CUSTOMER, entityId: 'customer_1', createdAt: now }],
    participants: [],
    restrictedNotes: [],
    lifecycleHistory: [],
    capaActions: [],
    ...overrides,
  };
}

function restrictedNote(overrides: Partial<CaseRecord['restrictedNotes'][number]> = {}): CaseRecord['restrictedNotes'][number] {
  return {
    id: 'note_1',
    authorId: 'hr_owner',
    body: 'Private HR note',
    createdAt: new Date('2026-06-20T08:10:00.000Z'),
    ...overrides,
  };
}

function withCreatedAt(links: CreateCaseData['links']): CaseRecord['links'] {
  return links.map((link) => ({ ...link, createdAt: new Date('2026-06-20T08:00:00.000Z') }));
}

function capaRecord(overrides: Partial<CapaActionRecord> & Partial<CreateCapaActionData> = {}): CapaActionRecord {
  const now = new Date('2026-06-20T08:00:00.000Z');
  return {
    id: 'capa_1',
    caseId: 'case_1',
    ownerId: 'owner_1',
    owner: { nameEn: 'Owner User' },
    rootCause: 'Late parts confirmation',
    responsibleDepartmentId: null,
    correctiveAction: 'Call customer before 10 AM',
    preventiveAction: 'Daily parts delay review',
    dueAt: new Date('2026-06-25T09:00:00.000Z'),
    status: CapaActionStatus.OPEN,
    effectivenessCheck: null,
    repeatFlag: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
