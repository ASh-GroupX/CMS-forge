import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA, MODULE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import {
  ComplaintStatus,
  ComplaintTransitionAction,
  ComplaintTransitionRequestSource,
  RoleCode,
} from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import {
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
        resolutionSummary: null,
        customerCommunicationStatus: null,
      },
    },
  }]);
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
    transitionInput(ComplaintStatus.CLOSED, ComplaintTransitionAction.REOPEN, RoleCode.ADMIN),
    transitionInput(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.RESOLVE, RoleCode.CR_MANAGER, { resolutionType: 'repair' }),
    transitionInput(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.RESOLVE, RoleCode.CR_MANAGER, { resolutionType: 'repair', resolutionSummary: 'fixed', actorId: null }),
    transitionInput(ComplaintStatus.RESOLVED, ComplaintTransitionAction.CLOSE, RoleCode.ADMIN, { reason: 'confirmed' }),
  ]) {
    await assertNoTransaction(input, 'VALIDATION_FAILED');
  }
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

test('workflow side effects do not queue on validation or stale status failure', async () => {
  const queued: unknown[] = [];
  await assertNoTransaction(transitionInput(ComplaintStatus.RESOLVED, ComplaintTransitionAction.CLOSE, RoleCode.ADMIN, { reason: 'confirmed' }), 'VALIDATION_FAILED', queued);

  const serviceWithStaleStatus = transitionService([], queued, null);
  await assert.rejects(
    serviceWithStaleStatus.applyTransition(transitionInput(ComplaintStatus.CLOSED, ComplaintTransitionAction.REOPEN, RoleCode.ADMIN, { reason: 'customer replied' })),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_INVALID_TRANSITION',
  );
  assert.deepEqual(queued, []);
});

test('workflow side effects do not queue when transaction fails', async () => {
  const queued: unknown[] = [];
  const serviceWithFailingTransaction = new ComplaintsService({
    transaction: async () => {
      throw new Error('database failed');
    },
  } as ComplaintsRepository, noopAudit, notificationSink([], queued));

  await assert.rejects(
    serviceWithFailingTransaction.applyTransition(transitionInput(ComplaintStatus.CLOSED, ComplaintTransitionAction.REOPEN, RoleCode.ADMIN, { reason: 'customer replied' })),
    /database failed/,
  );
  assert.deepEqual(queued, []);
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

test('complaint transition route uses auth, RBAC, branch-scope, and CSRF guards', () => {
  assert.deepEqual(guardNames('transition'), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);

  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, ComplaintsModule) as unknown[];
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ComplaintsModule) as unknown[];

  assert.ok(imports.includes(AuthModule));
  assert.ok(imports.includes(NotificationsModule));
  assert.ok(imports.includes(CasesModule));
  assert.ok(providers.includes(SessionAuthGuard));
  assert.equal(providers.some((provider) => providerObject(provider)?.provide === RbacGuard), true);
  assert.ok(providers.includes(CsrfGuard));
  assert.equal(providers.some((provider) => providerObject(provider)?.provide === SESSION_AUTH_SERVICE), true);
});

test('complaint transition route allows scoped staff and audits branch-scope denials', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(
    new Reflector(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  assert.equal(await guard.canActivate(context(request())), true);

  await assert.rejects(
    guard.canActivate(context(request(RoleCode.BRANCH_MANAGER, 'branch_other'))),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );

  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'branch_scope_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata, { deniedBranchId: 'branch_other' });
});

async function assertNoTransaction(
  input: Parameters<ComplaintsService['applyTransition']>[0],
  code: string,
  queued: unknown[] = [],
): Promise<void> {
  const serviceWithFailingRepository = new ComplaintsService({
    transaction: async () => {
      throw new Error('transaction should not start');
    },
  } as ComplaintsRepository, noopAudit, notificationSink([], queued));

  await assert.rejects(
    serviceWithFailingRepository.applyTransition(input),
    (error: unknown) => error instanceof AppException && error.code === code,
  );
}

function request(roleCode = RoleCode.CR_OFFICER, branchId = 'branch_main'): AuthenticatedRequest {
  return {
    principal: principal(roleCode),
    url: `/complaints/cmp_1/transitions?branchId=${branchId}`,
    correlationId: 'req_workflow',
    headers: { 'x-forwarded-for': '203.0.113.44, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.44' },
  };
}

function principal(roleCode: RoleCode): StaffPrincipal {
  return {
    sessionId: 'ses_workflow',
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
    getHandler: () => ComplaintsController.prototype.transition,
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

function transitionService(calls: string[], queued: unknown[], updateResult: { id: string; branchId: string; status: ComplaintStatus } | null = { id: 'cmp_1', branchId: 'branch_main', status: ComplaintStatus.CLOSED }): ComplaintsService {
  return new ComplaintsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => {
      const result = await work({} as never);
      calls.push('commit');
      return result;
    },
    updateStatus: async (data) => {
      calls.push('status');
      return updateResult && { ...updateResult, status: data.toStatus };
    },
    createStatusHistory: async () => { calls.push('history'); },
  } as ComplaintsRepository, { record: async () => { calls.push('audit'); } } as unknown as AuditService, notificationSink(calls, queued));
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

function transitionInput(fromStatus: ComplaintStatus, action: ComplaintTransitionAction, actorRole: RoleCode, extra: Partial<Parameters<ComplaintsService['applyTransition']>[0]> = {}): Parameters<ComplaintsService['applyTransition']>[0] {
  return { complaintId: 'cmp_1', fromStatus, action, actorRole, actorId: 'usr_1', requestSource: ComplaintTransitionRequestSource.STAFF_API, ...extra };
}
