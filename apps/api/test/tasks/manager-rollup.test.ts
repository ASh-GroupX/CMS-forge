import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { MODULE_METADATA } from '@nestjs/common/constants';
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
import { RbacGuard } from '../../src/core/auth.guard.ts';
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
  assert.deepEqual(result.overdueByEmployee, [{ assigneeId: 'user_a', count: 1 }]);
  assert.deepEqual(result.dueToday.map((task) => task.id), ['today_b', 'promise_late']);
  assert.deepEqual(result.overduePromises.map((task) => task.id), ['promise_late']);
  assert.deepEqual(result.workloadByAssignee, [{ assigneeId: 'user_a', count: 3 }, { assigneeId: 'user_b', count: 1 }]);
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

test('ordinary employee is denied by manager rollup RBAC', async () => {
  const guard = new RbacGuard(new Reflector(), { record: async () => undefined } as AuditService);

  await assert.rejects(
    guard.canActivate(context(request(employee))),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
});

test('tasks module wires audit service with Prisma for runtime RBAC denies', () => {
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, TasksModule) as unknown[];
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

function context(req: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => TasksController.prototype.managerRollup,
    getClass: () => TasksController,
  } as ExecutionContext;
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
    nextActionWhat: 'Call customer',
    nextActionWhoId: 'user_a',
    nextActionWhen: new Date('2026-06-21T08:30:00.000Z'),
    isCustomerPromise: false,
    visibility: TaskVisibility.PARTICIPANTS,
    confidentialityLevel: TaskConfidentialityLevel.NORMAL,
    createdAt: now,
    updatedAt: now,
    links: [{ entityType: TaskLinkEntityType.CUSTOMER, entityId: 'customer_1' }],
    participants: [],
    ...overrides,
  };
}

function txOnlyRepository(): TasksRepository {
  return { transaction: async <T>(work: (client: never) => Promise<T>) => work({} as never) } as unknown as TasksRepository;
}
