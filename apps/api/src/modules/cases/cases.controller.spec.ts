import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { CapaActionStatus, CaseConfidentialityLevel, CaseLifecycleStatus, CaseLinkEntityType, CaseParticipantRole, CaseType, ComplaintStatus, RoleCode } from '@prisma/client';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AuditService } from '../../core/audit.service.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { CsrfGuard } from '../../core/csrf.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { CasesController } from './cases.controller.js';
import type { CapaActionDto } from './dto/case-response.dto.js';
import { CasesRepository } from './cases.repository.js';
import type { CaseRecord } from './cases.repository.js';
import { CasesService } from './cases.service.js';

test('cases controller can be constructed', () => {
  assert.ok(new CasesController(new CasesService(new CasesRepository({} as never))));
});

test('case CAPA csrf guard declares audit injection for Nest runtime', () => {
  assert.deepEqual(Reflect.getMetadata('self:paramtypes', CsrfGuard), [
    { index: 0, param: AuditService },
  ]);
});

test('confidential timeline route uses the session actor and returns restricted notes only when allowed', async () => {
  const controller = new CasesController(new CasesService({
    findById: async () => caseRecord({
      participants: [{ userId: 'session_user', role: CaseParticipantRole.PARTICIPANT }],
      restrictedNotes: [restrictedNote()],
    }),
    countRepeatCustomerRootCause: async () => 0,
  } as unknown as CasesRepository));

  const result = await controller.confidentialTimeline('case_1', request({
    roleCode: RoleCode.CR_OFFICER,
    url: '/cases/case_1/confidential-timeline?roleCode=ADMIN&branchId=other_branch',
  }));

  assert.equal(result.case.confidentialityLevel, CaseConfidentialityLevel.CONFIDENTIAL);
  assert.deepEqual(result.restrictedNotes.map((note) => note.body), ['Private HR note']);
  assert.equal(result.taskLink.entityId, 'case_1');
});

test('staff case timeline route uses session actor and suppresses restricted notes', async () => {
  const calls: unknown[] = [];
  const controller = new CasesController({
    timelineForActor: async (caseId: string, actor: unknown, audit: unknown, includeRestrictedNotes: boolean) => {
      calls.push({ caseId, actor, audit, includeRestrictedNotes });
      return {
        case: { id: caseId, type: CaseType.CUSTOMER_COMPLAINT, status: ComplaintStatus.SUBMITTED, lifecycleStatus: CaseLifecycleStatus.DRAFT, confidentialityLevel: CaseConfidentialityLevel.NORMAL, branchId: 'branch_1', branchName: 'Main Branch', ownerId: null, ownerName: null, subject: 'Engine noise', descriptionEn: 'Noise', descriptionAr: null, links: [], createdAt: '2026-06-20T08:00:00.000Z', updatedAt: '2026-06-20T08:00:00.000Z' },
        taskLink: { entityType: 'CASE', entityId: caseId },
        capaActions: [],
        restrictedNotes: [],
        repeatIssue: { isRepeat: false, rootCauses: [] },
        events: [],
      };
    },
  } as unknown as CasesService);

  const result = await controller.timeline('case_public', request({ roleCode: RoleCode.CR_MANAGER, url: '/cases/case_public/timeline?roleCode=ADMIN&branchId=other' }));

  assert.equal(result.case.id, 'case_public');
  assert.deepEqual((calls[0] as { actor: unknown; includeRestrictedNotes: boolean }).actor, { userId: 'session_user', role: RoleCode.CR_MANAGER, branchId: 'branch_1' });
  assert.equal((calls[0] as { includeRestrictedNotes: boolean }).includeRestrictedNotes, false);
});

test('case CAPA routes use session actor and parse minimal create body', async () => {
  const calls: unknown[] = [];
  const controller = new CasesController({
    listCapaActionsForActor: async (caseId: string, actor: unknown, audit: unknown) => {
      calls.push({ list: caseId, actor, audit });
      return [capaDto()];
    },
    createCapaAction: async (input: unknown, actor: unknown, audit: unknown) => {
      calls.push({ create: input, actor, audit });
      return capaDto({ id: 'capa_created', status: CapaActionStatus.DONE });
    },
  } as unknown as CasesService);

  assert.deepEqual((await controller.capa('case_1', request({ roleCode: RoleCode.CR_MANAGER, url: '/cases/case_1/capa?roleCode=ADMIN&branchId=other' }))).items.map((item) => item.id), ['capa_1']);
  const created = await controller.createCapa('case_1', {
    ownerId: 'owner_2',
    rootCause: 'Late parts confirmation',
    correctiveAction: 'Call customer',
    preventiveAction: 'Daily review',
    dueAt: '2026-06-25T09:00:00.000Z',
    status: CapaActionStatus.DONE,
    actorId: 'spoofed',
    branchId: 'other',
  }, request({ roleCode: RoleCode.CR_MANAGER, url: '/cases/case_1/capa?roleCode=ADMIN&branchId=other' }));

  assert.equal(created.capa.id, 'capa_created');
  assert.deepEqual((calls[0] as { actor: unknown }).actor, { userId: 'session_user', role: RoleCode.CR_MANAGER, branchId: 'branch_1' });
  assert.deepEqual((calls[1] as { create: unknown }).create, {
    caseId: 'case_1',
    ownerId: 'owner_2',
    rootCause: 'Late parts confirmation',
    correctiveAction: 'Call customer',
    preventiveAction: 'Daily review',
    dueAt: '2026-06-25T09:00:00.000Z',
    status: CapaActionStatus.DONE,
  });
  assert.deepEqual((calls[1] as { actor: unknown }).actor, { userId: 'session_user', role: RoleCode.CR_MANAGER, branchId: 'branch_1' });
});

test('confidential timeline route preserves accused denial and audit before restricted notes escape', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const controller = new CasesController(new CasesService({
    findById: async () => caseRecord({
      ownerId: 'session_user',
      participants: [{ userId: 'session_user', role: CaseParticipantRole.ACCUSED }],
      restrictedNotes: [restrictedNote()],
    }),
    countRepeatCustomerRootCause: async () => 0,
  } as unknown as CasesRepository, { record: async (input) => { auditRecords.push(input); } } as AuditService));

  await assert.rejects(
    controller.confidentialTimeline('case_1', request({ roleCode: RoleCode.ADMIN, correlationId: 'req_confidential' })),
    (error) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );

  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'case_confidential_access_denied');
  assert.equal(auditRecords[0]?.correlationId, 'req_confidential');
  assert.deepEqual(auditRecords[0]?.metadata, { reason: 'accused_conflict', caseBranchId: 'branch_1' });
});

function request({
  roleCode,
  correlationId,
  url = '/cases/case_1/confidential-timeline',
}: {
  roleCode: RoleCode;
  correlationId?: string;
  url?: string;
}): AuthenticatedRequest {
  return {
    ...(correlationId === undefined ? {} : { correlationId }),
    headers: { 'user-agent': 'node-test' },
    url,
    principal: {
      sessionId: 'session_1',
      userId: 'session_user',
      email: 'staff@cms-auto.test',
      nameEn: 'Staff User',
      nameAr: 'موظف',
      roleCode,
      branchId: 'branch_1',
    },
  };
}

function caseRecord(overrides: Partial<CaseRecord> = {}): CaseRecord {
  const now = new Date('2026-06-20T08:00:00.000Z');
  return {
    id: 'case_1',
    type: CaseType.EMPLOYEE_GRIEVANCE,
    status: ComplaintStatus.IN_PROGRESS,
    lifecycleStatus: CaseLifecycleStatus.HR_REVIEW,
    confidentialityLevel: CaseConfidentialityLevel.CONFIDENTIAL,
    branchId: 'branch_1',
    ownerId: 'hr_owner',
    subject: 'Workplace grievance',
    descriptionEn: 'Confidential HR review',
    descriptionAr: null,
    createdAt: now,
    updatedAt: now,
    branch: { nameEn: 'Main Branch', nameAr: 'Main Branch' },
    owner: { nameEn: 'Owner User' },
    links: [{ entityType: CaseLinkEntityType.EMPLOYEE, entityId: 'session_user', createdAt: now }],
    participants: [],
    restrictedNotes: [],
    lifecycleHistory: [],
    capaActions: [],
    ...overrides,
  };
}

function restrictedNote(): CaseRecord['restrictedNotes'][number] {
  return {
    id: 'note_1',
    authorId: 'hr_owner',
    body: 'Private HR note',
    createdAt: new Date('2026-06-20T08:10:00.000Z'),
  };
}

function capaDto(overrides: Partial<CapaActionDto> = {}): CapaActionDto {
  return {
    id: 'capa_1',
    caseId: 'case_1',
    rootCause: 'Late parts confirmation',
    correctiveAction: 'Call customer',
    preventiveAction: 'Daily review',
    ownerId: 'owner_1',
    ownerName: 'Owner User',
    dueAt: '2026-06-25T09:00:00.000Z',
    status: CapaActionStatus.OPEN,
    createdAt: '2026-06-20T08:00:00.000Z',
    updatedAt: '2026-06-20T08:00:00.000Z',
    ...overrides,
  };
}
