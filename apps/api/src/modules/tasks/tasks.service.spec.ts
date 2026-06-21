import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RoleCode,
  TaskConfidentialityLevel,
  TaskLinkEntityType,
  TaskParticipantRole,
  TaskStatus,
  TaskVisibility,
} from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import { promiseKeptOnTime } from './tasks.promise.js';
import { TasksService } from './tasks.service.js';
import { TasksRepository, type CreateTaskStatusHistoryData, type PromiseTaskRecord, type TaskRecord, type UpdateTaskStatusData } from './tasks.repository.js';

test('open task without next action is rejected', async () => {
  const service = new TasksService(txOnlyRepository(), {} as never);

  await assert.rejects(
    service.create({
      title: 'Call customer',
      ownerId: 'user_owner',
      assigneeId: 'user_assignee',
      dueAt: '2026-06-21T09:00:00.000Z',
      status: TaskStatus.OPEN,
    }),
    (error) => error instanceof AppException && error.code === 'TASK_NEXT_ACTION_REQUIRED',
  );
});

test('status Done clears next action and audits inside the transaction', async () => {
  const txClient = { task: {} };
  const seen: { updateInput?: UpdateTaskStatusData } = {};
  let auditClient: unknown;
  let auditAction = '';
  let historyClient: unknown;
  let historyInput: CreateTaskStatusHistoryData | undefined;
  const repository = {
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    findById: async () => taskRecord({ status: TaskStatus.IN_PROGRESS }),
    updateStatus: async (input: UpdateTaskStatusData) => {
      seen.updateInput = input;
      return taskRecord({ status: input.status ?? TaskStatus.DONE, nextActionWhat: null, nextActionWhoId: null, nextActionWhen: null });
    },
    createStatusHistory: async (input: CreateTaskStatusHistoryData, client: unknown) => {
      historyInput = input;
      historyClient = client;
    },
  } as unknown as TasksRepository;
  const audit = {
    record: async (input: { action: string }, client: unknown) => {
      auditAction = input.action;
      auditClient = client;
    },
  };
  const service = new TasksService(repository, audit as never);

  const result = await service.updateStatus({ taskId: 'task_1', status: TaskStatus.DONE }, { actorId: 'user_owner' });

  assert.equal(result.nextAction, null);
  assert.equal(seen.updateInput?.nextActionWhat, null);
  assert.equal(seen.updateInput?.nextActionWhoId, null);
  assert.equal(seen.updateInput?.nextActionWhen, null);
  assert.equal(historyInput?.fromStatus, TaskStatus.IN_PROGRESS);
  assert.equal(historyInput?.toStatus, TaskStatus.DONE);
  assert.equal(historyClient, txClient);
  assert.equal(auditAction, 'task_status_updated');
  assert.equal(auditClient, txClient);
});

test('participant can read a visible task', async () => {
  const repository = {
    findForParticipant: async (taskId: string, actorId: string) =>
      taskId === 'task_1' && actorId === 'user_participant'
        ? taskRecord({ participants: [{ userId: 'user_participant', role: TaskParticipantRole.PARTICIPANT }] })
        : null,
  } as unknown as TasksRepository;
  const service = new TasksService(repository, {} as never);

  const result = await service.getForParticipant('task_1', 'user_participant');

  assert.equal(result.id, 'task_1');
  assert.deepEqual(result.participantUserIds, ['user_participant']);
});

test('participant can update task status with history and audit in one transaction', async () => {
  const txClient = { task: {} };
  let historyClient: unknown;
  let auditClient: unknown;
  let updateInput: UpdateTaskStatusData | undefined;
  let auditAction = '';
  const repository = {
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    findById: async () => taskRecord({ assigneeId: 'user_assignee', status: TaskStatus.IN_PROGRESS }),
    updateStatus: async (input: UpdateTaskStatusData) => {
      updateInput = input;
      return taskRecord({ assigneeId: 'user_assignee', status: input.status ?? TaskStatus.DONE, nextActionWhat: null, nextActionWhoId: null, nextActionWhen: null });
    },
    createStatusHistory: async (_input: CreateTaskStatusHistoryData, client: unknown) => {
      historyClient = client;
    },
  } as unknown as TasksRepository;
  const audit = {
    record: async (input: { action: string }, client: unknown) => {
      auditAction = input.action;
      auditClient = client;
    },
  };
  const service = new TasksService(repository, audit as never);

  const result = await service.updateForActor(
    { taskId: 'task_1', status: TaskStatus.DONE },
    { userId: 'user_assignee', roleCode: 'CR_OFFICER', branchId: 'branch_1' },
    { actorId: 'user_assignee', correlationId: 'req_1' },
  );

  assert.equal(result.status, TaskStatus.DONE);
  assert.equal(updateInput?.id, 'task_1');
  assert.equal(updateInput?.status, TaskStatus.DONE);
  assert.equal(updateInput?.nextActionWhat, null);
  assert.equal(historyClient, txClient);
  assert.equal(auditClient, txClient);
  assert.equal(auditAction, 'task_updated');
});

test('unrelated user is denied task update', async () => {
  const repository = {
    transaction: async <T>(work: (client: never) => Promise<T>) => work({} as never),
    findById: async () => taskRecord({ assigneeId: 'user_assignee' }),
  } as unknown as TasksRepository;
  const service = new TasksService(repository, { record: async () => undefined } as never);

  await assert.rejects(
    service.updateForActor(
      { taskId: 'task_1', status: TaskStatus.DONE },
      { userId: 'user_other', roleCode: 'CR_OFFICER', branchId: 'branch_1' },
    ),
    (error) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
});

test('unrelated user is denied task access', async () => {
  const repository = { findForParticipant: async () => null } as unknown as TasksRepository;
  const service = new TasksService(repository, {} as never);

  await assert.rejects(
    service.getForParticipant('task_1', 'user_other'),
    (error) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
});

test('employee today buckets only tasks visible to the actor', async () => {
  let queriedUserId = '';
  const repository = {
    listEmployeeToday: async (userId: string) => {
      queriedUserId = userId;
      return [
        taskRecord({ id: 'due_today', assigneeId: 'user_owner', dueAt: new Date('2026-06-20T15:00:00.000Z') }),
        taskRecord({ id: 'overdue', assigneeId: 'user_owner', dueAt: new Date('2026-06-19T15:00:00.000Z') }),
        taskRecord({ id: 'promise_late', assigneeId: 'user_owner', dueAt: new Date('2026-06-20T10:00:00.000Z'), isCustomerPromise: true }),
        taskRecord({ id: 'waiting', assigneeId: 'user_other', nextActionWhoId: 'user_owner', dueAt: new Date('2026-06-20T16:00:00.000Z') }),
      ];
    },
  } as unknown as TasksRepository;
  const service = new TasksService(repository, {} as never);

  const result = await service.employeeToday('user_owner', new Date('2026-06-20T12:00:00.000Z'));

  assert.equal(queriedUserId, 'user_owner');
  assert.deepEqual(result.dueToday.map((task) => task.id), ['due_today', 'promise_late', 'waiting']);
  assert.deepEqual(result.overdue.map((task) => task.id), ['overdue']);
  assert.deepEqual(result.overduePromises.map((task) => task.id), ['promise_late']);
  assert.deepEqual(result.assignedToMe.map((task) => task.id), ['due_today', 'overdue', 'promise_late']);
  assert.deepEqual(result.waitingOnMe.map((task) => task.id), ['waiting']);
});

test('manager control room derives scoped rollup counts from active tasks', async () => {
  let scopedBranch: string | null | undefined;
  let includeConfidential: boolean | undefined;
  const repository = {
    listManagerRollup: async (branchId: string | null, includeConfidentialRows?: boolean) => {
      scopedBranch = branchId;
      includeConfidential = includeConfidentialRows;
      return [
        taskRecord({ id: 'overdue_a', assigneeId: 'user_a', dueAt: new Date('2026-06-19T15:00:00.000Z') }),
        taskRecord({ id: 'promise_late', assigneeId: 'user_b', dueAt: new Date('2026-06-20T10:00:00.000Z'), isCustomerPromise: true }),
        taskRecord({ id: 'due_today', assigneeId: 'user_b', dueAt: new Date('2026-06-20T16:00:00.000Z') }),
        taskRecord({ id: 'stuck', assigneeId: 'user_a', nextActionWhen: new Date('2026-06-20T08:00:00.000Z'), updatedAt: new Date('2026-06-16T08:00:00.000Z') }),
      ];
    },
  } as unknown as TasksRepository;
  const service = new TasksService(repository, {} as never);

  const result = await service.managerControlRoom({ roleCode: 'BRANCH_MANAGER', branchId: 'branch_1' }, new Date('2026-06-20T12:00:00.000Z'));

  assert.equal(scopedBranch, 'branch_1');
  assert.equal(includeConfidential, false);
  assert.deepEqual(result.overdueByEmployee, [{ assigneeId: 'user_a', assigneeName: 'Assignee User', count: 1 }]);
  assert.deepEqual(result.dueToday.map((task) => task.id), ['promise_late', 'due_today']);
  assert.deepEqual(result.overduePromises.map((task) => task.id), ['promise_late']);
  assert.deepEqual(result.workloadByAssignee, [{ assigneeId: 'user_a', assigneeName: 'Assignee User', count: 2 }, { assigneeId: 'user_b', assigneeName: 'Assignee User', count: 2 }]);
  assert.deepEqual(result.stuck.map((task) => [task.id, task.stuckReasons]), [['stuck', ['NEXT_ACTION_OVERDUE', 'NO_MOVEMENT']]]);
  assert.deepEqual(result.escalated.map((task) => task.id), ['overdue_a', 'promise_late', 'due_today', 'stuck']);
  assert.deepEqual(result.promiseKpi, { openPromiseCount: 1, overduePromiseCount: 1 });
});

test('admin manager control room can include confidential task rows', async () => {
  let includeConfidential: boolean | undefined;
  const repository = {
    listManagerRollup: async (_branchId: string | null, includeConfidentialRows?: boolean) => {
      includeConfidential = includeConfidentialRows;
      return [];
    },
  } as unknown as TasksRepository;
  const service = new TasksService(repository, {} as never);

  await service.managerControlRoom({ roleCode: RoleCode.ADMIN, branchId: null }, new Date('2026-06-20T12:00:00.000Z'));

  assert.equal(includeConfidential, true);
});

test('promise tracker returns server-scoped promises with labels and kept KPI', async () => {
  let query: unknown;
  const repository = {
    listPromiseTracker: async (input: unknown) => {
      query = input;
      return [
        promiseRecord({ id: 'open_ok', isCustomerPromise: true, dueAt: new Date('2026-06-21T09:00:00.000Z'), links: [{ entityType: TaskLinkEntityType.CUSTOMER, entityId: 'customer_1' }] }),
        promiseRecord({ id: 'open_late', isCustomerPromise: true, dueAt: new Date('2026-06-20T09:00:00.000Z'), links: [{ entityType: TaskLinkEntityType.DEAL, entityId: 'deal_1' }] }),
        promiseRecord({ id: 'done_kept', isCustomerPromise: true, status: TaskStatus.DONE, dueAt: new Date('2026-06-19T09:00:00.000Z'), statusHistory: [{ toStatus: TaskStatus.DONE, createdAt: new Date('2026-06-19T08:00:00.000Z') }] }),
      ];
    },
  } as unknown as TasksRepository;
  const service = new TasksService(repository, {} as never);

  const result = await service.promiseTracker({ userId: 'user_owner', roleCode: RoleCode.BRANCH_MANAGER, branchId: 'branch_1' }, new Date('2026-06-20T12:00:00.000Z'));

  assert.deepEqual(query, { userId: 'user_owner', branchId: 'branch_1', isAdmin: false, isManager: true });
  assert.equal(result.openPromiseCount, 2);
  assert.equal(result.overduePromiseCount, 1);
  assert.equal(result.keptOnTimePercent, 100);
  assert.equal(result.promises[0]?.customerLabel, 'customer_1');
  assert.equal(result.promises[1]?.dealLabel, 'deal_1');
  assert.equal(result.promises[2]?.keptOnTime, true);
});

test('promise tracker repository limits confidential branch-wide rows to participants or admin', async () => {
  let captured: unknown;
  const repository = new TasksRepository({
    task: {
      findMany: async (args: unknown) => {
        captured = args;
        return [];
      },
    },
  } as never);

  await repository.listPromiseTracker({ userId: 'user_owner', branchId: 'branch_1', isAdmin: false, isManager: true });

  const query = JSON.stringify(captured);
  assert.match(query, /"isCustomerPromise":true/);
  assert.match(query, /"confidentialityLevel":"NORMAL"/);
  assert.match(query, /"ownerId":"user_owner"/);
  assert.match(query, /"participants":\{"some":\{"userId":"user_owner"\}\}/);
  assert.doesNotMatch(query, /\{\}/);
});

test('ordinary employee is denied manager control room access in service', async () => {
  const service = new TasksService({ listManagerRollup: async () => [] } as unknown as TasksRepository, {} as never);

  await assert.rejects(
    service.managerControlRoom({ roleCode: 'CR_OFFICER', branchId: 'branch_1' }),
    (error) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
});

test('customer promise task requires a customer, complaint, or deal link', async () => {
  const service = new TasksService(txOnlyRepository(), {} as never);

  await assert.rejects(
    service.create({
      title: 'Deliver car',
      ownerId: 'user_owner',
      assigneeId: 'user_assignee',
      dueAt: '2026-06-21T09:00:00.000Z',
      nextAction: { what: 'Deliver car', whoId: 'user_assignee', when: '2026-06-21T09:00:00.000Z' },
      isCustomerPromise: true,
    }),
    (error) => error instanceof AppException && error.code === 'TASK_PROMISE_LINK_REQUIRED',
  );
});

test('promise kept on time derives from task status history', () => {
  assert.equal(promiseKeptOnTime(
    { isCustomerPromise: true, dueAt: new Date('2026-06-21T09:00:00.000Z') },
    [{ toStatus: TaskStatus.DONE, createdAt: new Date('2026-06-21T08:59:00.000Z') }],
  ), true);
  assert.equal(promiseKeptOnTime(
    { isCustomerPromise: true, dueAt: new Date('2026-06-21T09:00:00.000Z') },
    [{ toStatus: TaskStatus.DONE, createdAt: new Date('2026-06-21T09:01:00.000Z') }],
  ), false);
  assert.equal(promiseKeptOnTime({ isCustomerPromise: true, dueAt: new Date('2026-06-21T09:00:00.000Z') }, []), false);
  assert.equal(promiseKeptOnTime({ isCustomerPromise: false, dueAt: new Date('2026-06-21T09:00:00.000Z') }, []), null);
});

function taskRecord(overrides: Partial<TaskRecord> = {}): TaskRecord {
  const now = new Date('2026-06-20T08:00:00.000Z');
  return {
    id: 'task_1',
    title: 'Call customer',
    ownerId: 'user_owner',
    assigneeId: 'user_assignee',
    dueAt: new Date('2026-06-21T09:00:00.000Z'),
    status: TaskStatus.OPEN,
    nextActionWhat: 'Call customer',
    nextActionWhoId: 'user_assignee',
    nextActionWhen: new Date('2026-06-21T08:30:00.000Z'),
    isCustomerPromise: false,
    visibility: TaskVisibility.PARTICIPANTS,
    confidentialityLevel: TaskConfidentialityLevel.NORMAL,
    createdAt: now,
    updatedAt: now,
    owner: { nameEn: 'Owner User', branchId: 'branch_1', branch: { nameEn: 'Main Branch' } },
    assignee: { nameEn: 'Assignee User', branchId: 'branch_1', branch: { nameEn: 'Main Branch' } },
    nextActionWho: { nameEn: 'Assignee User', branchId: 'branch_1' },
    links: [{ entityType: TaskLinkEntityType.CUSTOMER, entityId: 'customer_1' }],
    participants: [],
    ...overrides,
  };
}

function promiseRecord(overrides: Partial<PromiseTaskRecord> = {}): PromiseTaskRecord {
  return { ...taskRecord({ isCustomerPromise: true }), statusHistory: [], ...overrides };
}

function txOnlyRepository(): TasksRepository {
  return { transaction: async <T>(work: (client: never) => Promise<T>) => work({} as never) } as unknown as TasksRepository;
}
