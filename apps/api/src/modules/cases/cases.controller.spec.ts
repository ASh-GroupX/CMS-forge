import assert from 'node:assert/strict';
import test from 'node:test';
import { CaseConfidentialityLevel, CaseLifecycleStatus, CaseLinkEntityType, CaseParticipantRole, CaseType, ComplaintStatus, RoleCode } from '@prisma/client';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AuditService } from '../../core/audit.service.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { CasesController } from './cases.controller.js';
import { CasesRepository } from './cases.repository.js';
import type { CaseRecord } from './cases.repository.js';
import { CasesService } from './cases.service.js';

test('cases controller can be constructed', () => {
  assert.ok(new CasesController(new CasesService(new CasesRepository({} as never))));
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
    links: [{ entityType: CaseLinkEntityType.EMPLOYEE, entityId: 'session_user', createdAt: now }],
    participants: [],
    restrictedNotes: [],
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
