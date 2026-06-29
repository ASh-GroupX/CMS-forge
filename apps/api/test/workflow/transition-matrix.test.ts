import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA, MODULE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import {
  ComplaintSeverity,
  ComplaintStatus,
  ComplaintTransitionAction,
  ComplaintTransitionRequestSource,
  RoleCode,
  SlaEventType,
  SlaStage,
} from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import {
  DynamicPermissionGuard,
  PermissionGuard,
  RbacGuard,
  SESSION_AUTH_SERVICE,
  SessionAuthGuard,
} from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { CsrfGuard } from '../../src/core/csrf.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { AuthModule } from '../../src/modules/auth/auth.module.ts';
import { CasesModule } from '../../src/modules/cases/cases.module.ts';
import { ComplaintsController } from '../../src/modules/complaints/complaints.controller.ts';
import { ComplaintsModule } from '../../src/modules/complaints/complaints.module.ts';
import { ComplaintsRepository } from '../../src/modules/complaints/complaints.repository.ts';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.ts';
import { NotificationsModule } from '../../src/modules/notifications/notifications.module.ts';
import { SlaModule } from '../../src/modules/sla/sla.module.ts';

const noopAudit = { record: async () => undefined } as unknown as AuditService;
const service = new ComplaintsService(new ComplaintsRepository({} as never), noopAudit);
type ComplaintStatusStub = {
  id: string;
  branchId: string;
  status: ComplaintStatus;
  ownerId?: string | null;
  severity?: ComplaintSeverity;
  categoryId?: string;
  departmentId?: string | null;
};

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
    {
      updateStatus: {
        complaintId: 'cmp_1',
        fromStatus: ComplaintStatus.DRAFT,
        toStatus: ComplaintStatus.SUBMITTED,
      },
    },
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
        resolutionType: null,
        customerCommunicationStatus: null,
      },
    },
  }]);
});

test('workflow audit metadata excludes resolution summary free text', async () => {
  const calls: string[] = [];
  const auditRecords: AuditRecordInput[] = [];
  const serviceWithAudit = new ComplaintsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => {
      const result = await work({} as never);
      calls.push('commit');
      return result;
    },
    updateStatus: async (data) => {
      calls.push('status');
      return complaintStatus({ status: data.toStatus });
    },
    createStatusHistory: async () => { calls.push('history'); },
  } as ComplaintsRepository, { record: async (input) => { calls.push('audit'); auditRecords.push(input); } } as unknown as AuditService);

  await serviceWithAudit.applyTransition(transitionInput(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.RESOLVE, RoleCode.CR_MANAGER, {
    resolutionType: 'repair',
    resolutionSummary: 'password hunter2 sessionToken leaked',
  }));

  assert.deepEqual(calls, ['status', 'history', 'audit', 'commit']);
  assert.equal('resolutionSummary' in (auditRecords[0]?.metadata as Record<string, unknown>), false);
  const auditJson = JSON.stringify(auditRecords[0]);
  assert.equal(auditJson.includes('hunter2'), false);
  assert.equal(auditJson.includes('sessionToken'), false);
  assert.equal(auditJson.includes('password'), false);
});

test('workflow required-data transitions persist with history and audit', async () => {
  for (const input of [
    transitionInput(ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.SEND_BACK, RoleCode.ADMIN, { reason: 'missing details' }),
    transitionInput(ComplaintStatus.CLOSED, ComplaintTransitionAction.REOPEN, RoleCode.ADMIN, { reason: 'customer replied' }),
    transitionInput(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.RESOLVE, RoleCode.CR_MANAGER, { resolutionType: 'repair', resolutionSummary: 'fixed' }),
    transitionInput(ComplaintStatus.RESOLVED, ComplaintTransitionAction.CLOSE, RoleCode.ADMIN, { reason: 'confirmed closed', customerCommunicationStatus: 'called' }),
  ]) {
    const calls: string[] = [];
    const serviceWithPersistence = new ComplaintsService({
      transaction: async <T>(work: (client: never) => Promise<T>) => work({} as never),
      updateStatus: async (data) => {
        calls.push('status');
        return { id: data.complaintId, branchId: 'branch_main', status: data.toStatus };
      },
      createStatusHistory: async () => { calls.push('history'); },
    } as ComplaintsRepository, { record: async () => { calls.push('audit'); } } as unknown as AuditService);
    await serviceWithPersistence.applyTransition(input);
    assert.deepEqual(calls, ['status', 'history', 'audit']);
  }
});

test('workflow required data rejects before transaction', async () => {
  for (const input of [
    transitionInput(ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.SEND_BACK, RoleCode.ADMIN),
    transitionInput(ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.APPROVE_AND_ROUTE, RoleCode.ADMIN),
    transitionInput(ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.ASSIGN_INVESTIGATION, RoleCode.ADMIN, { reason: 'assign it' }),
    transitionInput(ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.ASSIGN_INVESTIGATION, RoleCode.ADMIN, { ownerId: 'usr_investigator' }),
    transitionInput(ComplaintStatus.CLOSED, ComplaintTransitionAction.REOPEN, RoleCode.ADMIN),
    transitionInput(ComplaintStatus.REOPENED, ComplaintTransitionAction.ROUTE_AGAIN, RoleCode.ADMIN),
    transitionInput(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.RESOLVE, RoleCode.CR_MANAGER, { resolutionType: 'repair' }),
    transitionInput(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.RESOLVE, RoleCode.CR_MANAGER, { resolutionType: 'repair', resolutionSummary: 'fixed', actorId: null }),
    transitionInput(ComplaintStatus.RESOLVED, ComplaintTransitionAction.CLOSE, RoleCode.ADMIN, { reason: 'confirmed' }),
  ]) {
    await assertNoTransaction(input, 'VALIDATION_FAILED');
  }
});

test('workflow route and assignment required data returns field errors before transaction', async () => {
  await assertValidationFieldsNoTransaction(
    transitionInput(ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.APPROVE_AND_ROUTE, RoleCode.ADMIN),
    ['reason', 'targetBranchId', 'targetDepartmentId', 'ownerId'],
  );
  await assertValidationFieldsNoTransaction(
    transitionInput(ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.ASSIGN_INVESTIGATION, RoleCode.ADMIN),
    ['reason', 'ownerId'],
  );
  await assertValidationFieldsNoTransaction(
    transitionInput(ComplaintStatus.REOPENED, ComplaintTransitionAction.ROUTE_AGAIN, RoleCode.ADMIN),
    ['reason'],
  );
});

test('workflow approve and route persists route fields with history and audit', async () => {
  const txClient = {};
  const calls: unknown[] = [];
  const audits: AuditRecordInput[] = [];
  const serviceWithRoute = new ComplaintsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    updateStatus: async (data, client) => {
      assert.equal(client, txClient);
      calls.push({ status: data });
      return { id: data.complaintId, branchId: data.targetBranchId, status: data.toStatus, ownerId: data.ownerId };
    },
    createStatusHistory: async (data, client) => {
      assert.equal(client, txClient);
      calls.push({ history: data });
    },
  } as ComplaintsRepository, { record: async (input, client) => { assert.equal(client, txClient); audits.push(input); calls.push('audit'); } } as unknown as AuditService);

  await serviceWithRoute.applyTransition(transitionInput(ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.APPROVE_AND_ROUTE, RoleCode.ADMIN, {
    reason: 'route to service',
    targetBranchId: 'branch_service',
    targetDepartmentId: 'dept_service',
    ownerId: 'usr_owner',
  }));

  assert.deepEqual(calls[0], { status: { complaintId: 'cmp_1', fromStatus: ComplaintStatus.MANAGER_REVIEW, toStatus: ComplaintStatus.BRANCH_REVIEW, targetBranchId: 'branch_service', targetDepartmentId: 'dept_service', ownerId: 'usr_owner' } });
  assert.deepEqual(calls[1], { history: { complaintId: 'cmp_1', fromStatus: ComplaintStatus.MANAGER_REVIEW, toStatus: ComplaintStatus.BRANCH_REVIEW, action: ComplaintTransitionAction.APPROVE_AND_ROUTE, actorId: 'usr_1', actorRole: RoleCode.ADMIN, requestSource: ComplaintTransitionRequestSource.STAFF_API, reason: 'route to service', correlationId: null } });
  assert.equal(audits[0]?.branchId, 'branch_service');
});

test('workflow approve and route queues notification and SLA only after commit', async () => {
  const calls: string[] = [];
  const queued: unknown[] = [];
  const deadlines: unknown[] = [];
  const serviceWithSideEffects = transitionService(calls, queued, complaintStatus({
    status: ComplaintStatus.BRANCH_REVIEW,
    branchId: 'branch_service',
    departmentId: 'dept_service',
    ownerId: 'usr_owner',
  }), undefined, undefined, deadlines);

  const result = await serviceWithSideEffects.applyTransition(transitionInput(ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.APPROVE_AND_ROUTE, RoleCode.ADMIN, {
    reason: 'route to service',
    targetBranchId: 'branch_service',
    targetDepartmentId: 'dept_service',
    ownerId: 'usr_owner',
  }));

  assert.deepEqual(result, {
    complaintId: 'cmp_1',
    fromStatus: ComplaintStatus.MANAGER_REVIEW,
    action: ComplaintTransitionAction.APPROVE_AND_ROUTE,
    actorRole: RoleCode.ADMIN,
    toStatus: ComplaintStatus.BRANCH_REVIEW,
  });
  assert.deepEqual(calls, ['status', 'history', 'audit', 'commit', 'queue', 'sla']);
  assert.deepEqual(queued, [{
    complaintId: 'cmp_1',
    recipientUserId: 'usr_owner',
    templateCode: 'workflow.approved-routed.internal',
    payload: {
      complaintId: 'cmp_1',
      fromStatus: ComplaintStatus.MANAGER_REVIEW,
      toStatus: ComplaintStatus.BRANCH_REVIEW,
      action: ComplaintTransitionAction.APPROVE_AND_ROUTE,
      actorId: 'usr_1',
      targetBranchId: 'branch_service',
      targetDepartmentId: 'dept_service',
      ownerId: 'usr_owner',
    },
  }]);
  assert.equal((deadlines[0] as { enteredAt?: unknown }).enteredAt instanceof Date, true);
  assert.deepEqual({ ...(deadlines[0] as Record<string, unknown>), enteredAt: 'date' }, {
    complaintId: 'cmp_1',
    severity: ComplaintSeverity.HIGH,
    stage: SlaStage.BRANCH_REVIEW,
    branchId: 'branch_service',
    departmentId: 'dept_service',
    categoryId: 'cat_service',
    enteredAt: 'date',
  });
});

test('workflow assign investigation persists owner with history and audit', async () => {
  const updates: unknown[] = [];
  const calls: string[] = [];
  const serviceWithAssignment = transitionService(calls, [], { id: 'cmp_1', branchId: 'branch_main', status: ComplaintStatus.IN_PROGRESS, ownerId: 'usr_investigator' }, undefined, updates);

  await serviceWithAssignment.applyTransition(transitionInput(ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.ASSIGN_INVESTIGATION, RoleCode.ADMIN, {
    reason: 'assign to investigator',
    ownerId: 'usr_investigator',
  }));

  assert.deepEqual(updates, [{ complaintId: 'cmp_1', fromStatus: ComplaintStatus.BRANCH_REVIEW, toStatus: ComplaintStatus.IN_PROGRESS, ownerId: 'usr_investigator' }]);
  assert.deepEqual(calls, ['status', 'history', 'audit', 'commit', 'queue']);
});

test('workflow assign investigation queues investigator notification and SLA only after commit', async () => {
  const calls: string[] = [];
  const queued: unknown[] = [];
  const deadlines: unknown[] = [];
  const serviceWithSideEffects = transitionService(calls, queued, complaintStatus({
    status: ComplaintStatus.IN_PROGRESS,
    ownerId: 'usr_investigator',
  }), undefined, undefined, deadlines);

  await serviceWithSideEffects.applyTransition(transitionInput(ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.ASSIGN_INVESTIGATION, RoleCode.ADMIN, {
    reason: 'assign to investigator',
    ownerId: 'usr_investigator',
  }));

  assert.deepEqual(calls, ['status', 'history', 'audit', 'commit', 'queue', 'sla']);
  assert.deepEqual(queued, [{
    complaintId: 'cmp_1',
    recipientUserId: 'usr_investigator',
    templateCode: 'workflow.investigation-assigned.internal',
    payload: {
      complaintId: 'cmp_1',
      fromStatus: ComplaintStatus.BRANCH_REVIEW,
      toStatus: ComplaintStatus.IN_PROGRESS,
      action: ComplaintTransitionAction.ASSIGN_INVESTIGATION,
      actorId: 'usr_1',
      ownerId: 'usr_investigator',
    },
  }]);
  assert.equal((deadlines[0] as { enteredAt?: unknown }).enteredAt instanceof Date, true);
  assert.deepEqual({ ...(deadlines[0] as Record<string, unknown>), enteredAt: 'date' }, {
    complaintId: 'cmp_1',
    severity: ComplaintSeverity.HIGH,
    stage: SlaStage.INVESTIGATION,
    branchId: 'branch_main',
    departmentId: 'dept_service',
    categoryId: 'cat_service',
    enteredAt: 'date',
  });
});

test('workflow SLA deadline stage mapping follows P14D transition map', async () => {
  const cases: Array<[ComplaintStatus, ComplaintTransitionAction, SlaStage, Partial<Parameters<ComplaintsService['applyTransition']>[0]>]> = [
    [ComplaintStatus.DRAFT, ComplaintTransitionAction.SUBMIT, SlaStage.INTAKE, {}],
    [ComplaintStatus.SUBMITTED, ComplaintTransitionAction.ACCEPT_INTAKE, SlaStage.MANAGER_REVIEW, {}],
    [ComplaintStatus.REOPENED, ComplaintTransitionAction.ROUTE_AGAIN, SlaStage.MANAGER_REVIEW, { reason: 'new cycle' }],
    [ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.APPROVE_AND_ROUTE, SlaStage.BRANCH_REVIEW, { reason: 'route', targetBranchId: 'branch_service', targetDepartmentId: 'dept_service', ownerId: 'usr_owner' }],
    [ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.ASSIGN_INVESTIGATION, SlaStage.INVESTIGATION, { reason: 'assign', ownerId: 'usr_investigator' }],
    [ComplaintStatus.RESOLVED, ComplaintTransitionAction.REJECT_RESOLUTION, SlaStage.INVESTIGATION, { reason: 'needs more work' }],
    [ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.RESOLVE, SlaStage.RESOLUTION, { resolutionType: 'repair', resolutionSummary: 'fixed' }],
    [ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.RESOLVE_DIRECTLY, SlaStage.RESOLUTION, { resolutionType: 'refund', resolutionSummary: 'resolved at branch' }],
  ];

  for (const [fromStatus, action, stage, extra] of cases) {
    const calls: string[] = [];
    const deadlines: unknown[] = [];
    await transitionService(calls, [], complaintStatus({ status: expectedStatus(action), ownerId: extra.ownerId ?? 'usr_owner' }), undefined, undefined, deadlines)
      .applyTransition(transitionInput(fromStatus, action, RoleCode.ADMIN, extra));
    assert.equal((deadlines[0] as { stage?: SlaStage }).stage, stage, action);
    assert.deepEqual(calls.filter((call) => call === 'sla'), ['sla'], action);
  }
});

test('workflow terminal transitions persist business timestamps', async () => {
  const resolvedUpdates: Array<Record<string, unknown>> = [];
  await transitionService([], [], { id: 'cmp_1', branchId: 'branch_main', status: ComplaintStatus.RESOLVED, ownerId: 'usr_1' }, undefined, resolvedUpdates)
    .applyTransition(transitionInput(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.RESOLVE, RoleCode.CR_MANAGER, { resolutionType: 'repair', resolutionSummary: 'fixed' }));
  assert.equal(resolvedUpdates[0]?.resolvedAt instanceof Date, true);

  const closedUpdates: Array<Record<string, unknown>> = [];
  await transitionService([], [], { id: 'cmp_1', branchId: 'branch_main', status: ComplaintStatus.CLOSED }, undefined, closedUpdates)
    .applyTransition(transitionInput(ComplaintStatus.RESOLVED, ComplaintTransitionAction.CLOSE, RoleCode.ADMIN, { reason: 'confirmed closed', customerCommunicationStatus: 'called' }));
  assert.equal(closedUpdates[0]?.closedAt instanceof Date, true);
});

test('workflow allows assigned owner investigation update and rejects other staff', async () => {
  const calls: string[] = [];
  const serviceWithAssignedOwner = transitionService(calls, [], { id: 'cmp_1', branchId: 'branch_main', status: ComplaintStatus.IN_PROGRESS, ownerId: 'usr_owner' });

  await serviceWithAssignedOwner.applyTransition(transitionInput(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.ADD_INVESTIGATION_UPDATE, RoleCode.CR_OFFICER, {
    actorId: 'usr_owner',
    reason: 'customer called with more detail',
  }));
  assert.deepEqual(calls, ['status', 'history', 'audit', 'commit']);

  const deniedCalls: string[] = [];
  const deniedAudits: AuditRecordInput[] = [];
  const deniedService = transitionService(deniedCalls, [], { id: 'cmp_1', branchId: 'branch_main', status: ComplaintStatus.IN_PROGRESS, ownerId: 'usr_owner' }, deniedAudits);
  await assert.rejects(
    deniedService.applyTransition(transitionInput(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.ADD_INVESTIGATION_UPDATE, RoleCode.CR_OFFICER, {
      actorId: 'usr_other',
      reason: 'not my complaint',
    })),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.deepEqual(deniedCalls, ['status', 'audit']);
  assert.equal(deniedAudits[0]?.eventType, 'SECURITY');
  assert.equal(deniedAudits[0]?.action, 'workflow_role_forbidden');
});

test('workflow close queues survey scheduling after transaction commit', async () => {
  const calls: string[] = [];
  const queued: unknown[] = [];
  const serviceWithNotifications = transitionService(calls, queued);

  await serviceWithNotifications.applyTransition(transitionInput(ComplaintStatus.RESOLVED, ComplaintTransitionAction.CLOSE, RoleCode.ADMIN, {
    reason: 'confirmed closed',
    customerCommunicationStatus: 'called',
  }));

  assert.deepEqual(calls, ['status', 'history', 'audit', 'commit', 'queue']);
  assert.deepEqual(queued, [{
    complaintId: 'cmp_1',
    templateCode: 'survey.schedule.internal',
    payload: {
      complaintId: 'cmp_1',
      fromStatus: ComplaintStatus.RESOLVED,
      toStatus: ComplaintStatus.CLOSED,
      action: ComplaintTransitionAction.CLOSE,
      actorId: 'usr_1',
      reason: 'confirmed closed',
      customerCommunicationStatus: 'called',
    },
  }]);
});

test('workflow close records paused SLA lifecycle only after transaction commit', async () => {
  const calls: string[] = [];
  const queued: unknown[] = [];
  const lifecycle: unknown[] = [];
  const serviceWithLifecycle = transitionService(calls, queued, complaintStatus({ status: ComplaintStatus.CLOSED }), undefined, undefined, undefined, lifecycle);

  await serviceWithLifecycle.applyTransition(transitionInput(ComplaintStatus.RESOLVED, ComplaintTransitionAction.CLOSE, RoleCode.ADMIN, {
    reason: 'confirmed closed',
    customerCommunicationStatus: 'called',
  }));

  assert.deepEqual(calls, ['status', 'history', 'audit', 'commit', 'queue', 'slaLifecycle']);
  assert.equal((lifecycle[0] as { occurredAt?: unknown }).occurredAt instanceof Date, true);
  assert.deepEqual({ ...(lifecycle[0] as Record<string, unknown>), occurredAt: 'date' }, {
    complaintId: 'cmp_1',
    type: SlaEventType.PAUSED,
    stage: SlaStage.RESOLUTION,
    occurredAt: 'date',
  });
});

test('workflow reject records paused SLA lifecycle only after transaction commit', async () => {
  const calls: string[] = [];
  const queued: unknown[] = [];
  const lifecycle: unknown[] = [];
  const serviceWithLifecycle = transitionService(calls, queued, complaintStatus({ status: ComplaintStatus.REJECTED }), undefined, undefined, undefined, lifecycle);

  await serviceWithLifecycle.applyTransition(transitionInput(ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.REJECT_AFTER_REVIEW, RoleCode.ADMIN, {
    reason: 'not a valid complaint',
  }));

  assert.deepEqual(calls, ['status', 'history', 'audit', 'commit', 'queue', 'slaLifecycle']);
  assert.equal((lifecycle[0] as { occurredAt?: unknown }).occurredAt instanceof Date, true);
  assert.deepEqual({ ...(lifecycle[0] as Record<string, unknown>), occurredAt: 'date' }, {
    complaintId: 'cmp_1',
    type: SlaEventType.PAUSED,
    stage: SlaStage.BRANCH_REVIEW,
    occurredAt: 'date',
  });
});

test('workflow reopen queues internal notification after transaction commit', async () => {
  const calls: string[] = [];
  const queued: unknown[] = [];
  const serviceWithNotifications = transitionService(calls, queued);

  await serviceWithNotifications.applyTransition(transitionInput(ComplaintStatus.CLOSED, ComplaintTransitionAction.REOPEN, RoleCode.ADMIN, { reason: 'customer replied' }));

  assert.deepEqual(calls, ['status', 'history', 'audit', 'commit', 'queue']);
  assert.deepEqual(queued, [{
    complaintId: 'cmp_1',
    templateCode: 'workflow.reopened.internal',
    payload: {
      complaintId: 'cmp_1',
      fromStatus: ComplaintStatus.CLOSED,
      toStatus: ComplaintStatus.REOPENED,
      action: ComplaintTransitionAction.REOPEN,
      actorId: 'usr_1',
      reason: 'customer replied',
      customerCommunicationStatus: null,
    },
  }]);
});

test('workflow reopen records resumed SLA lifecycle only after transaction commit', async () => {
  const calls: string[] = [];
  const queued: unknown[] = [];
  const lifecycle: unknown[] = [];
  const serviceWithLifecycle = transitionService(calls, queued, complaintStatus({ status: ComplaintStatus.REOPENED }), undefined, undefined, undefined, lifecycle);

  await serviceWithLifecycle.applyTransition(transitionInput(ComplaintStatus.CLOSED, ComplaintTransitionAction.REOPEN, RoleCode.ADMIN, { reason: 'customer replied' }));

  assert.deepEqual(calls, ['status', 'history', 'audit', 'commit', 'queue', 'slaLifecycle']);
  assert.equal((lifecycle[0] as { occurredAt?: unknown }).occurredAt instanceof Date, true);
  assert.deepEqual({ ...(lifecycle[0] as Record<string, unknown>), occurredAt: 'date' }, {
    complaintId: 'cmp_1',
    type: SlaEventType.RESUMED,
    stage: SlaStage.MANAGER_REVIEW,
    occurredAt: 'date',
  });
});

test('workflow side effects do not queue or record on validation, invalid transition, or stale status failure', async () => {
  const queued: unknown[] = [];
  const deadlines: unknown[] = [];
  const lifecycle: unknown[] = [];
  await assertNoTransaction(transitionInput(ComplaintStatus.RESOLVED, ComplaintTransitionAction.CLOSE, RoleCode.ADMIN, { reason: 'confirmed' }), 'VALIDATION_FAILED', queued, deadlines, lifecycle);
  await assertNoTransaction(transitionInput(ComplaintStatus.DRAFT, ComplaintTransitionAction.CLOSE, RoleCode.ADMIN, { reason: 'bad move', customerCommunicationStatus: 'called' }), 'COMPLAINT_INVALID_TRANSITION', queued, deadlines, lifecycle);

  const serviceWithStaleStatus = transitionService([], queued, null, undefined, undefined, deadlines, lifecycle);
  await assert.rejects(
    serviceWithStaleStatus.applyTransition(transitionInput(ComplaintStatus.CLOSED, ComplaintTransitionAction.REOPEN, RoleCode.ADMIN, { reason: 'customer replied' })),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_INVALID_TRANSITION',
  );
  assert.deepEqual(queued, []);
  assert.deepEqual(deadlines, []);
  assert.deepEqual(lifecycle, []);
});

test('workflow side effects do not queue or record when transaction fails', async () => {
  const queued: unknown[] = [];
  const deadlines: unknown[] = [];
  const lifecycle: unknown[] = [];
  const serviceWithFailingTransaction = complaintService({
    transaction: async () => {
      throw new Error('database failed');
    },
  } as ComplaintsRepository, noopAudit, notificationSink([], queued), undefined, slaSink([], deadlines, lifecycle));

  await assert.rejects(
    serviceWithFailingTransaction.applyTransition(transitionInput(ComplaintStatus.CLOSED, ComplaintTransitionAction.REOPEN, RoleCode.ADMIN, { reason: 'customer replied' })),
    /database failed/,
  );
  assert.deepEqual(queued, []);
  assert.deepEqual(deadlines, []);
  assert.deepEqual(lifecycle, []);
});

test('workflow transition persistence rejects stale persisted status before history and audit', async () => {
  const txClient = {};
  const calls: unknown[] = [];
  const serviceWithStaleStatus = new ComplaintsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => {
      calls.push('transaction');
      return work(txClient as never);
    },
    updateStatus: async (data, client) => {
      assert.equal(client, txClient);
      calls.push({ updateStatus: data });
      return null;
    },
    createStatusHistory: async () => {
      throw new Error('history should not be written');
    },
  } as ComplaintsRepository, {
    record: async () => {
      throw new Error('audit should not be written');
    },
  } as unknown as AuditService);

  await assert.rejects(
    serviceWithStaleStatus.applyTransition({
      complaintId: 'cmp_1',
      fromStatus: ComplaintStatus.DRAFT,
      action: ComplaintTransitionAction.SUBMIT,
      actorRole: RoleCode.CR_OFFICER,
      requestSource: ComplaintTransitionRequestSource.STAFF_API,
    }),
    (error: unknown) =>
      error instanceof AppException &&
      error.code === 'COMPLAINT_INVALID_TRANSITION' &&
      error.getStatus() === 409,
  );
  assert.deepEqual(calls, [
    'transaction',
    {
      updateStatus: {
        complaintId: 'cmp_1',
        fromStatus: ComplaintStatus.DRAFT,
        toStatus: ComplaintStatus.SUBMITTED,
      },
    },
  ]);
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
  const auditRecords: AuditRecordInput[] = [];
  const serviceWithFailingRepository = new ComplaintsService({
    transaction: async () => {
      throw new Error('transaction should not start');
    },
  } as ComplaintsRepository, { record: async (input) => auditRecords.push(input) } as unknown as AuditService);

  await assert.rejects(
    serviceWithFailingRepository.applyTransition({
    complaintId: 'cmp_1',
    fromStatus: ComplaintStatus.SUBMITTED,
    action: ComplaintTransitionAction.ACCEPT_INTAKE,
    actorRole: RoleCode.CR_OFFICER,
      actorId: 'usr_officer',
    requestSource: ComplaintTransitionRequestSource.STAFF_API,
      correlationId: 'req_denied',
      ipAddress: '203.0.113.45',
      userAgent: 'node:test',
    }),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.deepEqual(auditRecords, [{
    eventType: 'SECURITY',
    action: 'workflow_role_forbidden',
    actorId: 'usr_officer',
    branchId: null,
    targetType: 'complaint',
    targetId: 'cmp_1',
    correlationId: 'req_denied',
    ipAddress: '203.0.113.45',
    userAgent: 'node:test',
    metadata: {
      fromStatus: ComplaintStatus.SUBMITTED,
      action: ComplaintTransitionAction.ACCEPT_INTAKE,
      actorRole: RoleCode.CR_OFFICER,
      requestSource: ComplaintTransitionRequestSource.STAFF_API,
    },
  }]);
});

test('complaint transition route delegates with server principal role and audit context', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({
    getDetail: async (id, filter) => {
      calls.push({ getDetail: { id, filter } });
      return {};
    },
    applyTransition: async (input) => {
      calls.push({ applyTransition: input });
      return {
        complaintId: input.complaintId,
        fromStatus: input.fromStatus,
        action: input.action,
        actorRole: input.actorRole,
        toStatus: ComplaintStatus.SUBMITTED,
      };
    },
  } as ComplaintsService);

  const response = await controller.transition('cmp_1', undefined, {
    fromStatus: ComplaintStatus.DRAFT,
    action: ComplaintTransitionAction.SUBMIT,
    actorRole: RoleCode.ADMIN,
    actorId: 'spoofed',
    requestSource: ComplaintTransitionRequestSource.CUSTOMER_PORTAL,
    targetBranchId: 'branch_service',
    targetDepartmentId: 'dept_service',
    ownerId: 'usr_owner',
    reason: ' ready ',
  }, request());

  assert.deepEqual(response.transition, {
    complaintId: 'cmp_1',
    fromStatus: ComplaintStatus.DRAFT,
    action: ComplaintTransitionAction.SUBMIT,
    actorRole: RoleCode.CR_OFFICER,
    toStatus: ComplaintStatus.SUBMITTED,
  });
  assert.deepEqual(calls[0], { getDetail: { id: 'cmp_1', filter: { branchId: 'branch_main' } } });
  assert.deepEqual(calls[1], { applyTransition: {
    complaintId: 'cmp_1',
    fromStatus: ComplaintStatus.DRAFT,
    action: ComplaintTransitionAction.SUBMIT,
    actorRole: RoleCode.CR_OFFICER,
    actorId: 'usr_officer',
    requestSource: ComplaintTransitionRequestSource.STAFF_API,
    targetBranchId: 'branch_service',
    targetDepartmentId: 'dept_service',
    ownerId: 'usr_owner',
    reason: 'ready',
    correlationId: 'req_workflow',
    ipAddress: '203.0.113.44',
    userAgent: 'node:test',
  } });
});

test('complaint transition route rejects out-of-scope complaint before transition write', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({
    getDetail: async (id, filter) => {
      calls.push({ getDetail: { id, filter } });
      throw new AppException('COMPLAINT_NOT_FOUND', 'Complaint not found', 404);
    },
    applyTransition: async () => {
      throw new Error('transition should not be applied');
    },
  } as ComplaintsService);

  await assert.rejects(
    controller.transition('cmp_other_branch', undefined, {
      fromStatus: ComplaintStatus.DRAFT,
      action: ComplaintTransitionAction.SUBMIT,
    }, request()),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_NOT_FOUND',
  );
  assert.deepEqual(calls, [{ getDetail: { id: 'cmp_other_branch', filter: { branchId: 'branch_main' } } }]);
});

test('complaint transition route lets admin transition without branch filter', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({
    getDetail: async (id, filter) => {
      calls.push({ getDetail: { id, filter } });
      return {};
    },
    applyTransition: async (input) => {
      calls.push({ applyTransition: input });
      return { complaintId: input.complaintId, fromStatus: input.fromStatus, action: input.action, actorRole: input.actorRole, toStatus: ComplaintStatus.SUBMITTED };
    },
  } as ComplaintsService);

  await controller.transition('cmp_1', undefined, {
    fromStatus: ComplaintStatus.DRAFT,
    action: ComplaintTransitionAction.SUBMIT,
  }, request(RoleCode.ADMIN));

  assert.deepEqual(calls[0], { getDetail: { id: 'cmp_1', filter: { branchId: null } } });
});

test('complaint transition route rejects invalid request bodies', async () => {
  const controller = new ComplaintsController({} as ComplaintsService);

  await assert.rejects(
    controller.transition('cmp_1', undefined, {
      fromStatus: 'bad_status',
      action: ComplaintTransitionAction.SUBMIT,
    }, request()),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('complaint comment and transition routes use dynamic permissions and keep branch scope/CSRF', async () => {
  assert.deepEqual(guardNames('createComment'), ['SessionAuthGuard', 'DynamicPermissionGuard', 'RbacGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('transition'), ['SessionAuthGuard', 'DynamicPermissionGuard', 'RbacGuard', 'CsrfGuard']);

  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, ComplaintsModule) as unknown[];
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ComplaintsModule) as unknown[];

  assert.ok(imports.includes(AuthModule));
  assert.ok(imports.includes(NotificationsModule));
  assert.ok(imports.includes(CasesModule));
  assert.ok(imports.includes(SlaModule));
  assert.ok(providers.includes(SessionAuthGuard));
  assert.ok(providers.includes(PermissionGuard));
  assert.ok(providers.includes(DynamicPermissionGuard));
  assert.equal(providers.some((provider) => providerObject(provider)?.provide === RbacGuard), true);
  assert.ok(providers.includes(CsrfGuard));
  assert.equal(providers.some((provider) => providerObject(provider)?.provide === SESSION_AUTH_SERVICE), true);

  const auditRecords: AuditRecordInput[] = [];
  const guard = new DynamicPermissionGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);
  assert.equal(await guard.canActivate(context(request(RoleCode.CR_OFFICER, 'branch_main', ['COMPLAINT_SUBMIT'], {
    action: ComplaintTransitionAction.SUBMIT,
  }))), true);
  assert.equal(await guard.canActivate(context(request(RoleCode.CR_OFFICER, 'branch_main', ['COMPLAINT_COMMENT_PUBLIC'], {
    visibility: 'PUBLIC',
  }), ComplaintsController.prototype.createComment)), true);

  await assert.rejects(
    guard.canActivate(context(request(RoleCode.ADMIN, 'branch_main', [], {
      action: ComplaintTransitionAction.REJECT_AS_INVALID,
    }, '/complaints/cmp_1/transitions?password=leaked&sessionToken=leaked'), ComplaintsController.prototype.transition)),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'permission_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata?.requiredPermissions, ['COMPLAINT_REJECT']);
  assertSafePermissionAudit(auditRecords);
});

test('complaint transition route allows scoped staff and audits branch-scope denials', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(
    new Reflector(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  assert.equal(await guard.canActivate(context(request())), true);

  await assert.rejects(
    guard.canActivate(context(request(RoleCode.BRANCH_MANAGER, 'branch_other', ['COMPLAINT_SUBMIT'], {
      action: ComplaintTransitionAction.SUBMIT,
    }, '/complaints/cmp_1/transitions?branchId=branch_other&sessionToken=leaked'))),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );

  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'branch_scope_forbidden');
  assert.equal(auditRecords[0]?.targetId, '/complaints/cmp_1/transitions');
  assert.deepEqual(auditRecords[0]?.metadata, { deniedBranchId: 'branch_other' });
  assertSafePermissionAudit(auditRecords);
});

async function assertNoTransaction(
  input: Parameters<ComplaintsService['applyTransition']>[0],
  code: string,
  queued: unknown[] = [],
  deadlines: unknown[] = [],
  lifecycle: unknown[] = [],
): Promise<void> {
  const serviceWithFailingRepository = complaintService({
    transaction: async () => {
      throw new Error('transaction should not start');
    },
  } as ComplaintsRepository, noopAudit, notificationSink([], queued), undefined, slaSink([], deadlines, lifecycle));

  await assert.rejects(
    serviceWithFailingRepository.applyTransition(input),
    (error: unknown) => error instanceof AppException && error.code === code,
  );
}

async function assertValidationFieldsNoTransaction(input: Parameters<ComplaintsService['applyTransition']>[0], fields: string[]): Promise<void> {
  const serviceWithFailingRepository = new ComplaintsService({ transaction: async () => { throw new Error('transaction should not start'); } } as ComplaintsRepository, noopAudit);
  await assert.rejects(
    serviceWithFailingRepository.applyTransition(input),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED' && assert.deepEqual(error.fieldErrors.map((item) => item.field), fields) === undefined,
  );
}

function request(
  roleCode = RoleCode.CR_OFFICER,
  branchId = 'branch_main',
  permissions = ['COMPLAINT_SUBMIT', 'COMPLAINT_COMMENT_INTERNAL'],
  body: unknown = { action: ComplaintTransitionAction.SUBMIT },
  url = `/complaints/cmp_1/transitions?branchId=${branchId}`,
): AuthenticatedRequest {
  return {
    principal: principal(roleCode, permissions),
    body,
    url,
    correlationId: 'req_workflow',
    headers: { 'x-forwarded-for': '203.0.113.44, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.44' },
  };
}

function principal(roleCode: RoleCode, permissions: string[]): StaffPrincipal {
  return {
    sessionId: 'ses_workflow',
    userId: 'usr_officer',
    email: 'officer@cms-auto.test',
    nameEn: 'CR Officer',
    nameAr: 'CR Officer',
    roleCode,
    permissions,
    branchId: 'branch_main',
  };
}

function context(req: AuthenticatedRequest, handler = ComplaintsController.prototype.transition): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => handler,
    getClass: () => ComplaintsController,
  } as ExecutionContext;
}

function guardNames(handler: keyof ComplaintsController): string[] {
  const guards = Reflect.getMetadata(GUARDS_METADATA, ComplaintsController.prototype[handler]) as Array<{ name: string }>;
  return guards.map((guard) => guard.name);
}

function providerObject(provider: unknown): { provide?: unknown } | null {
  return provider && typeof provider === 'object' ? provider as { provide?: unknown } : null;
}

function assertSafePermissionAudit(auditRecords: AuditRecordInput[]): void {
  const auditJson = JSON.stringify(auditRecords).toLowerCase();
  for (const forbidden of ['password', 'otp', 'token', 'reset token', 'session token', 'hash', 'secret', 'credential', 'provider']) {
    assert.equal(auditJson.includes(forbidden), false);
  }
}

function transitionService(calls: string[], queued: unknown[], updateResult: ComplaintStatusStub | null = complaintStatus({ status: ComplaintStatus.CLOSED }), audits?: AuditRecordInput[], updates?: unknown[], deadlines?: unknown[], lifecycle?: unknown[]): ComplaintsService {
  return complaintService({
    transaction: async <T>(work: (client: never) => Promise<T>) => {
      const result = await work({} as never);
      calls.push('commit');
      return result;
    },
    updateStatus: async (data) => {
      calls.push('status');
      updates?.push(data);
      return updateResult && { ...updateResult, status: data.toStatus };
    },
    createStatusHistory: async () => { calls.push('history'); },
  } as ComplaintsRepository, { record: async (input) => { calls.push('audit'); audits?.push(input); } } as unknown as AuditService, notificationSink(calls, queued), undefined, deadlines || lifecycle ? slaSink(calls, deadlines ?? [], lifecycle) : undefined);
}

function notificationSink(calls: string[], queued: unknown[]) {
  return {
    queueInternal: async (input: unknown) => {
      calls.push('queue');
      queued.push(input);
      return {};
    },
  } as never;
}

function slaSink(calls: string[], deadlines: unknown[], lifecycle: unknown[] = []) {
  return {
    recordDeadlineEvent: async (input: unknown) => {
      calls.push('sla');
      deadlines.push(input);
      return {};
    },
    recordLifecycleEvent: async (input: unknown) => {
      calls.push('slaLifecycle');
      lifecycle.push(input);
      return {};
    },
  } as never;
}

function complaintService(repository: ComplaintsRepository, audit: AuditService, notifications?: unknown, cases?: unknown, sla?: unknown): ComplaintsService {
  const Service = ComplaintsService as unknown as new (...args: unknown[]) => ComplaintsService;
  return new Service(repository, audit, notifications, cases, sla);
}

function complaintStatus(overrides: Partial<ComplaintStatusStub> = {}): ComplaintStatusStub {
  return {
    id: 'cmp_1',
    branchId: 'branch_main',
    status: ComplaintStatus.CLOSED,
    ownerId: null,
    severity: ComplaintSeverity.HIGH,
    categoryId: 'cat_service',
    departmentId: 'dept_service',
    ...overrides,
  };
}

function expectedStatus(action: ComplaintTransitionAction): ComplaintStatus {
  switch (action) {
    case ComplaintTransitionAction.SUBMIT:
      return ComplaintStatus.SUBMITTED;
    case ComplaintTransitionAction.ACCEPT_INTAKE:
    case ComplaintTransitionAction.ROUTE_AGAIN:
      return ComplaintStatus.MANAGER_REVIEW;
    case ComplaintTransitionAction.APPROVE_AND_ROUTE:
      return ComplaintStatus.BRANCH_REVIEW;
    case ComplaintTransitionAction.ASSIGN_INVESTIGATION:
    case ComplaintTransitionAction.REJECT_RESOLUTION:
      return ComplaintStatus.IN_PROGRESS;
    case ComplaintTransitionAction.RESOLVE:
    case ComplaintTransitionAction.RESOLVE_DIRECTLY:
      return ComplaintStatus.RESOLVED;
    default:
      throw new Error(`No expected status for ${action}`);
  }
}

function transitionInput(fromStatus: ComplaintStatus, action: ComplaintTransitionAction, actorRole: RoleCode, extra: Partial<Parameters<ComplaintsService['applyTransition']>[0]> = {}): Parameters<ComplaintsService['applyTransition']>[0] {
  return { complaintId: 'cmp_1', fromStatus, action, actorRole, actorId: 'usr_1', requestSource: ComplaintTransitionRequestSource.STAFF_API, ...extra };
}
