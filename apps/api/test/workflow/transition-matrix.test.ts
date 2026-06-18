import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ComplaintStatus,
  ComplaintTransitionAction,
  ComplaintTransitionRequestSource,
  RoleCode,
} from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { ComplaintsRepository } from '../../src/modules/complaints/complaints.repository.ts';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.ts';

const noopAudit = { record: async () => undefined } as unknown as AuditService;
const service = new ComplaintsService(new ComplaintsRepository({} as never), noopAudit);

const matrixCases = [
  [ComplaintStatus.DRAFT, ComplaintTransitionAction.SUBMIT, RoleCode.CR_OFFICER, ComplaintStatus.SUBMITTED],
  [ComplaintStatus.SUBMITTED, ComplaintTransitionAction.ACCEPT_INTAKE, RoleCode.CR_MANAGER, ComplaintStatus.MANAGER_REVIEW],
  [ComplaintStatus.SUBMITTED, ComplaintTransitionAction.REJECT_AS_INVALID, RoleCode.ADMIN, ComplaintStatus.REJECTED],
  [ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.APPROVE_AND_ROUTE, RoleCode.CR_MANAGER, ComplaintStatus.BRANCH_REVIEW],
  [ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.SEND_BACK, RoleCode.ADMIN, ComplaintStatus.DRAFT],
  [ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.REJECT_AS_INVALID, RoleCode.CR_MANAGER, ComplaintStatus.REJECTED],
  [ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.ASSIGN_INVESTIGATION, RoleCode.BRANCH_MANAGER, ComplaintStatus.IN_PROGRESS],
  [ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.RESOLVE_DIRECTLY, RoleCode.CR_MANAGER, ComplaintStatus.RESOLVED],
  [ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.REJECT_AFTER_REVIEW, RoleCode.ADMIN, ComplaintStatus.REJECTED],
  [ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.ADD_INVESTIGATION_UPDATE, RoleCode.BRANCH_MANAGER, ComplaintStatus.IN_PROGRESS],
  [ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.RESOLVE, RoleCode.CR_MANAGER, ComplaintStatus.RESOLVED],
  [ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.REJECT_AFTER_INVESTIGATION, RoleCode.ADMIN, ComplaintStatus.REJECTED],
  [ComplaintStatus.RESOLVED, ComplaintTransitionAction.CLOSE, RoleCode.BRANCH_MANAGER, ComplaintStatus.CLOSED],
  [ComplaintStatus.RESOLVED, ComplaintTransitionAction.REJECT_RESOLUTION, RoleCode.CR_MANAGER, ComplaintStatus.IN_PROGRESS],
  [ComplaintStatus.CLOSED, ComplaintTransitionAction.REOPEN, RoleCode.ADMIN, ComplaintStatus.REOPENED],
  [ComplaintStatus.REJECTED, ComplaintTransitionAction.REOPEN, RoleCode.CR_MANAGER, ComplaintStatus.REOPENED],
  [ComplaintStatus.REOPENED, ComplaintTransitionAction.ROUTE_AGAIN, RoleCode.ADMIN, ComplaintStatus.MANAGER_REVIEW],
] as const;

test('workflow validator accepts every SRS matrix transition', () => {
  for (const [fromStatus, action, actorRole, toStatus] of matrixCases) {
    assert.deepEqual(service.validateTransition({ fromStatus, action, actorRole }), {
      fromStatus,
      action,
      actorRole,
      toStatus,
    });
  }
});

test('workflow validator rejects invalid state/action combinations', () => {
  assert.throws(
    () => service.validateTransition({
      fromStatus: ComplaintStatus.DRAFT,
      action: ComplaintTransitionAction.CLOSE,
      actorRole: RoleCode.ADMIN,
    }),
    (error: unknown) =>
      error instanceof AppException &&
      error.code === 'COMPLAINT_INVALID_TRANSITION' &&
      error.getStatus() === 409,
  );
});

test('workflow validator rejects unauthorized roles', () => {
  assert.throws(
    () => service.validateTransition({
      fromStatus: ComplaintStatus.SUBMITTED,
      action: ComplaintTransitionAction.ACCEPT_INTAKE,
      actorRole: RoleCode.CR_OFFICER,
    }),
    (error: unknown) =>
      error instanceof AppException &&
      error.code === 'RBAC_FORBIDDEN' &&
      error.getStatus() === 403,
  );
});

test('workflow transition persistence uses one transaction for status history and audit', async () => {
  const txClient = {};
  const calls: unknown[] = [];
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const serviceWithPersistence = new ComplaintsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => {
      calls.push('transaction');
      return work(txClient as never);
    },
    updateStatus: async (data, client) => {
      assert.equal(client, txClient);
      calls.push({ updateStatus: data });
      return { id: data.complaintId, branchId: 'branch_main', status: data.toStatus };
    },
    createStatusHistory: async (data, client) => {
      assert.equal(client, txClient);
      calls.push({ history: data });
    },
  } as ComplaintsRepository, {
    record: async (input, client) => {
      assert.equal(client, txClient);
      auditRecords.push({ input, client });
    },
  } as unknown as AuditService);

  const result = await serviceWithPersistence.applyTransition({
    complaintId: 'cmp_1',
    fromStatus: ComplaintStatus.DRAFT,
    action: ComplaintTransitionAction.SUBMIT,
    actorRole: RoleCode.CR_OFFICER,
    actorId: 'usr_1',
    requestSource: ComplaintTransitionRequestSource.STAFF_API,
    reason: 'ready',
    correlationId: 'req_1',
    ipAddress: '203.0.113.50',
    userAgent: 'node:test',
  });

  assert.deepEqual(result, {
    complaintId: 'cmp_1',
    fromStatus: ComplaintStatus.DRAFT,
    action: ComplaintTransitionAction.SUBMIT,
    actorRole: RoleCode.CR_OFFICER,
    toStatus: ComplaintStatus.SUBMITTED,
  });
  assert.deepEqual(calls, [
    'transaction',
    { updateStatus: { complaintId: 'cmp_1', toStatus: ComplaintStatus.SUBMITTED } },
    {
      history: {
        complaintId: 'cmp_1',
        fromStatus: ComplaintStatus.DRAFT,
        toStatus: ComplaintStatus.SUBMITTED,
        action: ComplaintTransitionAction.SUBMIT,
        actorId: 'usr_1',
        actorRole: RoleCode.CR_OFFICER,
        requestSource: ComplaintTransitionRequestSource.STAFF_API,
        reason: 'ready',
        correlationId: 'req_1',
      },
    },
  ]);
  assert.deepEqual(auditRecords, [{
    client: txClient,
    input: {
      eventType: 'WORKFLOW',
      action: 'transition_submit',
      actorId: 'usr_1',
      branchId: 'branch_main',
      targetType: 'complaint',
      targetId: 'cmp_1',
      correlationId: 'req_1',
      ipAddress: '203.0.113.50',
      userAgent: 'node:test',
      metadata: {
        fromStatus: ComplaintStatus.DRAFT,
        toStatus: ComplaintStatus.SUBMITTED,
        action: ComplaintTransitionAction.SUBMIT,
        actorRole: RoleCode.CR_OFFICER,
        requestSource: ComplaintTransitionRequestSource.STAFF_API,
      },
    },
  }]);
});

test('workflow transition persistence rejects invalid transitions before transaction', async () => {
  await assertNoTransaction({
    complaintId: 'cmp_1',
    fromStatus: ComplaintStatus.DRAFT,
    action: ComplaintTransitionAction.CLOSE,
    actorRole: RoleCode.ADMIN,
    requestSource: ComplaintTransitionRequestSource.STAFF_API,
  }, 'COMPLAINT_INVALID_TRANSITION');
});

test('workflow transition persistence rejects unauthorized roles before transaction', async () => {
  await assertNoTransaction({
    complaintId: 'cmp_1',
    fromStatus: ComplaintStatus.SUBMITTED,
    action: ComplaintTransitionAction.ACCEPT_INTAKE,
    actorRole: RoleCode.CR_OFFICER,
    requestSource: ComplaintTransitionRequestSource.STAFF_API,
  }, 'RBAC_FORBIDDEN');
});

async function assertNoTransaction(
  input: Parameters<ComplaintsService['applyTransition']>[0],
  code: string,
): Promise<void> {
  const serviceWithFailingRepository = new ComplaintsService({
    transaction: async () => {
      throw new Error('transaction should not start');
    },
  } as ComplaintsRepository, noopAudit);

  await assert.rejects(
    serviceWithFailingRepository.applyTransition(input),
    (error: unknown) => error instanceof AppException && error.code === code,
  );
}
