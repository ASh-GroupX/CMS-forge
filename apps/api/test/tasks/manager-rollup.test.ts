import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA, MODULE_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import {
  RoleCode,
  TaskConfidentialityLevel,
  TaskLinkEntityType,
  TaskStatus,
  TaskVisibility,
} from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { AuditService as CoreAuditService } from '../../src/core/audit.service.ts';
import { PermissionGuard, RbacGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException, PrismaService } from '../../src/core/http-kernel.ts';
import { TasksController } from '../../src/modules/tasks/tasks.controller.ts';
import { TasksModule } from '../../src/modules/tasks/tasks.module.ts';
import { promiseKeptOnTime } from '../../src/modules/tasks/tasks.promise.ts';
import type { TaskRecord, TasksRepository } from '../../src/modules/tasks/tasks.repository.ts';
import { TasksService } from '../../src/modules/tasks/tasks.service.ts';

test('manager sees branch-scoped rollup derived from task rows', async () => {
  let scopedBranch: string | null | undefined;
  const service = new TasksService({
    listManagerRollup: async (branchId: string | null) => {
      scopedBranch = branchId;
      return [
        taskRecord({ id: 'late_a', assigneeId: 'user_a', dueAt: new Date('2026-06-19T08:00:00.000Z') }),
        taskRecord({ id: 'today_b', assigneeId: 'user_b', dueAt: new Date('2026-06-20T08:00:00.000Z') }),
        taskRecord({ id: 'promise_late', assigneeId: 'user_a', dueAt: new Date('2026-06-20T10:00:00.000Z'), isCustomerPromise: true }),
        taskRecord({ id: 'stuck_a', assigneeId: 'user_a', nextActionWhen: new Date('2026-06-20T07:00:00.000Z') }),
      ];
    },
  } as unknown as TasksRepository, {} as never);

  const result = await service.managerControlRoom({ roleCode: RoleCode.BRANCH_MANAGER, branchId: 'branch_a' }, new Date('2026-06-20T12:00:00.000Z'));

  assert.equal(scopedBranch, 'branch_a');
  assert.deepEqual(result.overdueByEmployee, [{ assigneeId: 'user_a', assigneeName: 'Assignee User', count: 1 }]);
  assert.deepEqual(result.dueToday.map((task) => task.id), ['today_b', 'promise_late']);
  assert.deepEqual(result.overduePromises.map((task) => task.id), ['promise_late']);
  assert.deepEqual(result.workloadByAssignee, [{ assigneeId: 'user_a', assigneeName: 'Assignee User', count: 3 }, { assigneeId: 'user_b', assigneeName: 'Assignee User', count: 1 }]);
  assert.deepEqual(result.stuck.map((task) => task.id), ['stuck_a']);
  assert.deepEqual(result.promiseKpi, { openPromiseCount: 1, overduePromiseCount: 1 });
});

test('manager rollup route derives scope from the staff session', async () => {
  let capturedScope: unknown;
  const controller = new TasksController({
    managerControlRoom: async (scope: unknown) => {
      capturedScope = scope;
      return { overdueByEmployee: [], dueToday: [], overduePromises: [], stuck: [], workloadByAssignee: [], escalated: [], promiseKpi: { openPromiseCount: 0, overduePromiseCount: 0 } };
    },
  } as unknown as TasksService);

  await controller.managerRollup(request(branchManager));

  assert.deepEqual(capturedScope, { roleCode: RoleCode.BRANCH_MANAGER, branchId: 'branch_a' });
});

test('promise tracker route derives actor from the staff session', async () => {
  let capturedActor: unknown;
  const controller = new TasksController({
    promiseTracker: async (actor: unknown) => {
      capturedActor = actor;
      return { openPromiseCount: 0, overduePromiseCount: 0, keptOnTimePercent: 0, promises: [] };
    },
  } as unknown as TasksService);

  await controller.promises(request(branchManager, '/tasks/promises'));

  assert.deepEqual(capturedActor, { userId: 'user_manager', roleCode: RoleCode.BRANCH_MANAGER, branchId: 'branch_a' });
});

test('task routes require permissions and keep CSRF/branch-scope guards', async () => {
  assert.deepEqual(guardNames('quickAdd'), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('today'), ['SessionAuthGuard', 'PermissionGuard']);
  assert.deepEqual(guardNames('sentByMe'), ['SessionAuthGuard', 'PermissionGuard']);
  assert.deepEqual(guardNames('managerRollup'), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard']);
  assert.deepEqual(guardNames('managerDetail'), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard']);
  assert.deepEqual(guardNames('promises'), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard']);
  assert.deepEqual(guardNames('relatedRecords'), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard']);
  assert.deepEqual(guardNames('get'), ['SessionAuthGuard', 'PermissionGuard']);
  assert.deepEqual(guardNames('comments'), ['SessionAuthGuard', 'PermissionGuard']);
  assert.deepEqual(guardNames('createComment'), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('nudge'), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('update'), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);

  const auditRecords: AuditRecordInput[] = [];
  const guard = new PermissionGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);
  assert.equal(await guard.canActivate(context(request({ ...employee, permissions: ['COMPLAINT_COMMENT_INTERNAL'] }, '/tasks/today'), 'today')), true);
  assert.equal(await guard.canActivate(context(request({ ...branchManager, permissions: ['REPORT_VIEW'] }), 'managerRollup')), true);

  await assert.rejects(
    guard.canActivate(context(request({ ...branchManager, permissions: [] }), 'managerRollup')),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.action, 'permission_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata?.requiredPermissions, ['REPORT_VIEW']);
});

test('management read-only can open an in-scope normal task without collaboration data', async () => {
  const calls: unknown[] = [];
  const service = new TasksService({
    findManagerDetail: async (id, branchId, includeConfidential) => {
      calls.push({ id, branchId, includeConfidential });
      return taskRecord({ participants: [{ userId: 'user_private', role: 'WATCHER', user: { email: 'private@example.test', nameEn: 'Private User', nameAr: 'Private User' } }] });
    },
  } as unknown as TasksRepository, {} as never);

  const result = await service.managerTaskDetail('task_1', {
    userId: 'user_readonly', roleCode: RoleCode.MGMT_READONLY, branchId: 'branch_a', permissions: ['REPORT_VIEW'],
  }, new Date('2026-06-20T12:00:00.000Z'));

  assert.deepEqual(calls, [{ id: 'task_1', branchId: 'branch_a', includeConfidential: false }]);
  assert.equal(result.task.capabilities.canOpenInteractive, false);
  assert.equal('participants' in result.task, false);
  assert.equal(JSON.stringify(result).includes('private@example.test'), false);
});

test('manager detail fails closed when the scoped or confidentiality query finds no task', async () => {
  const service = new TasksService({ findManagerDetail: async () => null } as unknown as TasksRepository, {} as never);

  await assert.rejects(
    service.managerTaskDetail('task_other_branch', { userId: 'user_manager', roleCode: RoleCode.BRANCH_MANAGER, branchId: 'branch_a' }),
    (error: unknown) => error instanceof AppException && error.code === 'TASK_NOT_FOUND',
  );
});

test('administrator manager detail may query confidential tasks without a branch override', async () => {
  let received: unknown;
  const service = new TasksService({
    findManagerDetail: async (id, branchId, includeConfidential) => {
      received = { id, branchId, includeConfidential };
      return taskRecord({ confidentialityLevel: TaskConfidentialityLevel.CONFIDENTIAL });
    },
  } as unknown as TasksRepository, {} as never);

  await service.managerTaskDetail('task_confidential', {
    userId: 'user_admin', roleCode: RoleCode.ADMIN, branchId: null, permissions: ['REPORT_VIEW', 'COMPLAINT_COMMENT_INTERNAL'],
  });
  assert.deepEqual(received, { id: 'task_confidential', branchId: null, includeConfidential: true });
});

test('tasks module wires audit service and permission guard for runtime denies', () => {
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, TasksModule) as unknown[];
  assert.ok(providers.includes(PermissionGuard));
  assert.ok(providers.some((provider) => {
    if (!provider || typeof provider !== 'object') return false;
    const wired = provider as { provide?: unknown; inject?: unknown[] };
    return wired.provide === CoreAuditService && wired.inject?.includes(PrismaService);
  }));
});

test('cross-branch manager rollup request is denied and audited', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  await assert.rejects(
    guard.canActivate(context(request(branchManager, '/tasks/manager-rollup?branchId=branch_b'))),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.action, 'branch_scope_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata, { deniedBranchId: 'branch_b' });
});

test('promise task requires a customer complaint or deal link', async () => {
  const service = new TasksService(txOnlyRepository(), {} as never);

  await assert.rejects(
    service.create({
      title: 'Deliver car',
      ownerId: 'user_owner',
      assigneeId: 'user_a',
      dueAt: '2026-06-21T09:00:00.000Z',
      nextAction: { what: 'Deliver car', whoId: 'user_a', when: '2026-06-21T09:00:00.000Z' },
      isCustomerPromise: true,
    }),
    (error: unknown) => error instanceof AppException && error.code === 'TASK_PROMISE_LINK_REQUIRED',
  );
});

test('promise kept on time is computed from task status events', () => {
  const task = { isCustomerPromise: true, dueAt: new Date('2026-06-21T09:00:00.000Z') };

  assert.equal(promiseKeptOnTime(task, [{ toStatus: TaskStatus.DONE, createdAt: new Date('2026-06-21T08:00:00.000Z') }]), true);
  assert.equal(promiseKeptOnTime(task, [{ toStatus: TaskStatus.DONE, createdAt: new Date('2026-06-21T10:00:00.000Z') }]), false);
  assert.equal(promiseKeptOnTime(task, []), false);
});

const branchManager: StaffPrincipal = {
  sessionId: 'ses_manager',
  userId: 'user_manager',
  email: 'manager@example.test',
  nameEn: 'Manager',
  nameAr: 'Manager',
  roleCode: RoleCode.BRANCH_MANAGER,
  branchId: 'branch_a',
};

const employee: StaffPrincipal = { ...branchManager, userId: 'user_employee', roleCode: RoleCode.CR_OFFICER };

function request(principal: StaffPrincipal, url = '/tasks/manager-rollup'): AuthenticatedRequest {
  return {
    principal,
    url,
    correlationId: 'req_tasks',
    headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.10' },
  };
}

function context(req: AuthenticatedRequest, handler: keyof TasksController = 'managerRollup'): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => TasksController.prototype[handler],
    getClass: () => TasksController,
  } as ExecutionContext;
}

function guardNames(handler: keyof TasksController): string[] {
  const guards = Reflect.getMetadata(GUARDS_METADATA, TasksController.prototype[handler]) as Array<{ name: string }>;
  return guards.map((guard) => guard.name);
}

function taskRecord(overrides: Partial<TaskRecord> = {}): TaskRecord {
  const now = new Date('2026-06-20T08:00:00.000Z');
  return {
    id: 'task_1',
    title: 'Call customer',
    ownerId: 'user_owner',
    assigneeId: 'user_a',
    dueAt: new Date('2026-06-21T09:00:00.000Z'),
    status: TaskStatus.OPEN,
    stageId: null,
    nextActionWhat: 'Call customer',
    nextActionWhoId: 'user_a',
    nextActionWhen: new Date('2026-06-21T08:30:00.000Z'),
    isCustomerPromise: false,
    visibility: TaskVisibility.PARTICIPANTS,
    confidentialityLevel: TaskConfidentialityLevel.NORMAL,
    createdAt: now,
    updatedAt: now,
    owner: { nameEn: 'Owner User', branchId: 'branch_a', branch: { nameEn: 'Main Branch' } },
    assignee: { nameEn: 'Assignee User', branchId: 'branch_a', branch: { nameEn: 'Main Branch' } },
    nextActionWho: { nameEn: 'Assignee User', branchId: 'branch_a' },
    links: [{ entityType: TaskLinkEntityType.CUSTOMER, entityId: 'customer_1' }],
    participants: [],
    ...overrides,
  };
}

function txOnlyRepository(): TasksRepository {
  return { transaction: async <T>(work: (client: never) => Promise<T>) => work({} as never) } as unknown as TasksRepository;
}
