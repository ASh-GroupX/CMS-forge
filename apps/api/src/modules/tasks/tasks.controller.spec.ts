import assert from 'node:assert/strict';
import test from 'node:test';
import { TaskConfidentialityLevel, TaskStatus, TaskVisibility } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import type { CreateTaskInput } from './tasks.service.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

test('quick-add derives owner and audit actor from the staff session', async () => {
  let capturedInput: CreateTaskInput | undefined;
  let capturedAudit: { actorId?: string | null; correlationId?: string | null } | undefined;
  const service = {
    create: async (input: CreateTaskInput, audit: { actorId?: string | null; correlationId?: string | null }) => {
      capturedInput = input;
      capturedAudit = audit;
      return taskResponse();
    },
  } as unknown as TasksService;
  const controller = new TasksController(service);

  const result = await controller.quickAdd(
    {
      title: 'Call customer',
      what: 'Confirm delivery time',
      whoId: 'user_assignee',
      when: '2026-06-21T09:00:00.000Z',
    },
    request(),
  );

  assert.equal(result.task.id, 'task_1');
  assert.equal(capturedInput?.ownerId, 'user_owner');
  assert.equal(capturedInput?.assigneeId, 'user_assignee');
  assert.deepEqual(capturedInput?.nextAction, {
    what: 'Confirm delivery time',
    whoId: 'user_assignee',
    when: '2026-06-21T09:00:00.000Z',
  });
  assert.equal(capturedInput?.dueAt, '2026-06-21T09:00:00.000Z');
  assert.equal(capturedAudit?.actorId, 'user_owner');
  assert.equal(capturedAudit?.correlationId, 'req_test');
});

test('quick-add rejects client-owned task authority fields', async () => {
  const controller = new TasksController({ create: async () => taskResponse() } as unknown as TasksService);

  await assert.rejects(
    controller.quickAdd(
      {
        title: 'Call customer',
        what: 'Confirm delivery time',
        whoId: 'user_assignee',
        when: '2026-06-21T09:00:00.000Z',
        ownerId: 'user_other',
      },
      request(),
    ),
    (error) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('today derives employee identity from the staff session', async () => {
  let capturedActor = '';
  const controller = new TasksController({
    employeeToday: async (actorId: string) => {
      capturedActor = actorId;
      return { dueToday: [], overdue: [], overduePromises: [], assignedToMe: [], waitingOnMe: [] };
    },
  } as unknown as TasksService);

  const result = await controller.today(request());

  assert.equal(capturedActor, 'user_owner');
  assert.deepEqual(result, { dueToday: [], overdue: [], overduePromises: [], assignedToMe: [], waitingOnMe: [] });
});

test('today rejects missing principal instead of accepting client identity', async () => {
  const controller = new TasksController({ employeeToday: async () => ({ dueToday: [], overdue: [], overduePromises: [], assignedToMe: [], waitingOnMe: [] }) } as unknown as TasksService);

  await assert.rejects(
    controller.today({ headers: {} } as AuthenticatedRequest),
    (error) => error instanceof AppException && error.code === 'AUTH_INVALID_CREDENTIALS',
  );
});

test('manager rollup derives role and branch from the staff session', async () => {
  let capturedScope: unknown;
  const controller = new TasksController({
    managerControlRoom: async (scope: unknown) => {
      capturedScope = scope;
      return { overdueByEmployee: [], dueToday: [], overduePromises: [], stuck: [], workloadByAssignee: [], escalated: [], promiseKpi: { openPromiseCount: 0, overduePromiseCount: 0 } };
    },
  } as unknown as TasksService);

  const result = await controller.managerRollup(request('BRANCH_MANAGER'));

  assert.deepEqual(capturedScope, { roleCode: 'BRANCH_MANAGER', branchId: 'branch_1' });
  assert.deepEqual(result, { overdueByEmployee: [], dueToday: [], overduePromises: [], stuck: [], workloadByAssignee: [], escalated: [], promiseKpi: { openPromiseCount: 0, overduePromiseCount: 0 } });
});

function request(roleCode = 'CR_OFFICER'): AuthenticatedRequest {
  return {
    headers: { 'x-correlation-id': 'req_test', 'user-agent': 'node-test' },
    correlationId: 'req_test',
    principal: {
      sessionId: 'session_1',
      userId: 'user_owner',
      email: 'owner@example.test',
      nameEn: 'Owner',
      nameAr: 'Owner',
      roleCode,
      branchId: 'branch_1',
    },
  };
}

function taskResponse() {
  return {
    id: 'task_1',
    title: 'Call customer',
    ownerId: 'user_owner',
    assigneeId: 'user_assignee',
    dueAt: '2026-06-21T09:00:00.000Z',
    status: TaskStatus.OPEN,
    nextAction: {
      what: 'Confirm delivery time',
      whoId: 'user_assignee',
      when: '2026-06-21T09:00:00.000Z',
    },
    isCustomerPromise: false,
    visibility: TaskVisibility.PARTICIPANTS,
    confidentialityLevel: TaskConfidentialityLevel.NORMAL,
    links: [],
    participantUserIds: ['user_owner', 'user_assignee'],
    createdAt: '2026-06-20T08:00:00.000Z',
    updatedAt: '2026-06-20T08:00:00.000Z',
  };
}
