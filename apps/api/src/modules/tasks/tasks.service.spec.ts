import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TaskConfidentialityLevel,
  TaskLinkEntityType,
  TaskParticipantRole,
  TaskStatus,
  TaskVisibility,
} from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import { TasksService } from './tasks.service.js';
import type { CreateTaskStatusHistoryData, TasksRepository, TaskRecord, UpdateTaskStatusData } from './tasks.repository.js';

test('open task without next action is rejected', async () => {
  const service = new TasksService({} as TasksRepository, {} as never);

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
      return taskRecord({ status: input.status, nextActionWhat: null, nextActionWhoId: null, nextActionWhen: null });
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
        taskRecord({ id: 'waiting', assigneeId: 'user_other', nextActionWhoId: 'user_owner', dueAt: new Date('2026-06-20T16:00:00.000Z') }),
      ];
    },
  } as unknown as TasksRepository;
  const service = new TasksService(repository, {} as never);

  const result = await service.employeeToday('user_owner', new Date('2026-06-20T12:00:00.000Z'));

  assert.equal(queriedUserId, 'user_owner');
  assert.deepEqual(result.dueToday.map((task) => task.id), ['due_today', 'waiting']);
  assert.deepEqual(result.overdue.map((task) => task.id), ['overdue']);
  assert.deepEqual(result.assignedToMe.map((task) => task.id), ['due_today', 'overdue']);
  assert.deepEqual(result.waitingOnMe.map((task) => task.id), ['waiting']);
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
    visibility: TaskVisibility.PARTICIPANTS,
    confidentialityLevel: TaskConfidentialityLevel.NORMAL,
    createdAt: now,
    updatedAt: now,
    links: [{ entityType: TaskLinkEntityType.CUSTOMER, entityId: 'customer_1' }],
    participants: [],
    ...overrides,
  };
}
