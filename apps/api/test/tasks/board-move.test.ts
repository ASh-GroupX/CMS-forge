import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { RoleCode, TaskConfidentialityLevel, TaskStatus, TaskVisibility } from '@prisma/client';
import type { AdminUsersService } from '../../src/modules/admin/admin-users.service.ts';
import type { AuditService } from '../../src/core/audit.service.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { TasksController } from '../../src/modules/tasks/tasks.controller.ts';
import { TasksBoardService } from '../../src/modules/tasks/tasks.board.service.ts';
import type { BoardStageTarget, BoardTaskRecord, MoveTaskData, TasksBoardRepository } from '../../src/modules/tasks/tasks.board.repository.ts';
import type { TaskRecord, TasksRepository } from '../../src/modules/tasks/tasks.repository.ts';

const NOW = new Date('2026-06-20T12:00:00.000Z');

test('move route requires the session, internal-comment permission, and CSRF', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, TasksController.prototype.move) as Array<{ name: string }>;
  assert.deepEqual(guards.map((guard) => guard.name), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);
});

test('move route parses the body and derives the actor from the staff session', async () => {
  let captured: { input: unknown; actor: unknown; audit: unknown } | undefined;
  const controller = new TasksController({} as never, {
    move: async (input: unknown, actor: unknown, audit: unknown) => {
      captured = { input, actor, audit };
      return { card: {} as never };
    },
  } as unknown as TasksBoardService);

  await controller.move('task_1', { stageId: 'stage_done', boardPosition: 3 }, request(owner));

  assert.deepEqual(captured?.input, { taskId: 'task_1', stageId: 'stage_done', boardPosition: 3 });
  assert.deepEqual(captured?.actor, { userId: 'user_owner', roleCode: RoleCode.CR_OFFICER, branchId: 'branch_a', departmentId: null, permissions: [] });
  assert.equal((captured?.audit as { actorId?: string }).actorId, 'user_owner');
});

test('move to a done-mapped stage derives status and writes move+history+comment+audit in one transaction', async () => {
  const harness = buildService({ stage: stage('stage_done', TaskStatus.DONE), current: fullTask({ status: TaskStatus.OPEN, stageId: 'stage_open' }) });

  const result = await harness.service.move(
    { taskId: 'task_1', stageId: 'stage_done', boardPosition: 2, statusNote: 'Customer confirmed the fix' },
    owner,
    { actorId: 'user_owner', correlationId: 'req_move' },
    NOW,
  );

  // Status is derived from the stage mapping and next-action is cleared on DONE.
  assert.equal(harness.calls.moves[0]?.data.status, TaskStatus.DONE);
  assert.equal(harness.calls.moves[0]?.data.stageId, 'stage_done');
  assert.equal(harness.calls.moves[0]?.data.boardPosition, 2);
  assert.equal(harness.calls.moves[0]?.data.nextAction, null);
  // History + outcome comment recorded because the status changed.
  assert.deepEqual({ from: harness.calls.history[0]?.data.fromStatus, to: harness.calls.history[0]?.data.toStatus }, { from: TaskStatus.OPEN, to: TaskStatus.DONE });
  assert.match(harness.calls.comments[0]?.data.body ?? '', /Customer confirmed the fix/);
  // Audit trail with stage/status transition metadata.
  assert.equal(harness.calls.audit[0]?.input.action, 'task_moved');
  assert.deepEqual(harness.calls.audit[0]?.input.metadata, { fromStage: 'stage_open', toStage: 'stage_done', fromStatus: TaskStatus.OPEN, toStatus: TaskStatus.DONE });
  // Every write shares the SAME transaction client.
  assert.ok([...harness.calls.moves, ...harness.calls.history, ...harness.calls.comments, ...harness.calls.audit].every((call) => call.client === harness.client));
  // Response is the moved board card.
  assert.deepEqual({ id: result.card.id, stageId: result.card.stageId, status: result.card.status, dueState: result.card.dueState }, { id: 'task_1', stageId: 'stage_done', status: TaskStatus.DONE, dueState: null });
});

test('reordering within the same status updates position, skips history/comment, still audits', async () => {
  const harness = buildService({ stage: stage('stage_open', TaskStatus.OPEN), current: fullTask({ status: TaskStatus.OPEN, stageId: 'stage_open' }) });

  await harness.service.move({ taskId: 'task_1', stageId: 'stage_open', boardPosition: 5 }, owner, { actorId: 'user_owner' }, NOW);

  assert.equal(harness.calls.moves[0]?.data.boardPosition, 5);
  assert.equal(harness.calls.history.length, 0);
  assert.equal(harness.calls.comments.length, 0);
  assert.equal(harness.calls.audit[0]?.input.metadata?.fromStatus, TaskStatus.OPEN);
  assert.equal(harness.calls.audit[0]?.input.metadata?.toStatus, TaskStatus.OPEN);
});

test('a non-participant, non-manager actor is denied and no writes happen', async () => {
  const harness = buildService({ stage: stage('stage_done', TaskStatus.DONE), current: fullTask() });

  await assert.rejects(
    harness.service.move({ taskId: 'task_1', stageId: 'stage_done', boardPosition: 0, statusNote: 'x' }, stranger, {}, NOW),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(harness.calls.moves.length, 0);
  assert.equal(harness.calls.history.length, 0);
  assert.equal(harness.calls.audit.length, 0);
});

test('an unknown or archived target stage fails closed with BOARD_STAGE_NOT_FOUND', async () => {
  const harness = buildService({ stage: null, current: fullTask() });

  await assert.rejects(
    harness.service.move({ taskId: 'task_1', stageId: 'gone', boardPosition: 0 }, owner, {}, NOW),
    (error: unknown) => error instanceof AppException && error.code === 'BOARD_STAGE_NOT_FOUND',
  );
  assert.equal(harness.findByIdCalls, 0);
  assert.equal(harness.calls.moves.length, 0);
});

test('a missing task fails closed with TASK_NOT_FOUND', async () => {
  const harness = buildService({ stage: stage('stage_done', TaskStatus.DONE), current: null });

  await assert.rejects(
    harness.service.move({ taskId: 'ghost', stageId: 'stage_done', boardPosition: 0, statusNote: 'x' }, owner, {}, NOW),
    (error: unknown) => error instanceof AppException && error.code === 'TASK_NOT_FOUND',
  );
});

test('moving to done without an outcome note is rejected', async () => {
  const harness = buildService({ stage: stage('stage_done', TaskStatus.DONE), current: fullTask({ status: TaskStatus.OPEN }) });

  await assert.rejects(
    harness.service.move({ taskId: 'task_1', stageId: 'stage_done', boardPosition: 0 }, owner, { actorId: 'user_owner' }, NOW),
    (error: unknown) => error instanceof AppException && error.code === 'TASK_STATUS_NOTE_REQUIRED',
  );
  assert.equal(harness.calls.audit.length, 0);
});

test('reopening a done task into an open column requires a next action', async () => {
  const harness = buildService({
    stage: stage('stage_open', TaskStatus.OPEN),
    current: fullTask({ status: TaskStatus.DONE, stageId: 'stage_done', nextActionWhat: null, nextActionWhoId: null, nextActionWhen: null }),
  });

  await assert.rejects(
    harness.service.move({ taskId: 'task_1', stageId: 'stage_open', boardPosition: 0 }, owner, { actorId: 'user_owner' }, NOW),
    (error: unknown) => error instanceof AppException && error.code === 'TASK_NEXT_ACTION_REQUIRED',
  );
});

test('reopening with an in-scope next-action assignee succeeds and records the transition', async () => {
  const assignableCalls: string[] = [];
  const harness = buildService({
    stage: stage('stage_open', TaskStatus.OPEN),
    current: fullTask({ status: TaskStatus.DONE, stageId: 'stage_done', nextActionWhat: null, nextActionWhoId: null, nextActionWhen: null }),
    users: { assertAssignable: async (_actor, userId) => { assignableCalls.push(userId); } },
  });

  await harness.service.move(
    { taskId: 'task_1', stageId: 'stage_open', boardPosition: 0, nextAction: { what: 'Follow up', whoId: 'user_assignee', when: '2026-06-22T09:00:00.000Z' } },
    owner,
    { actorId: 'user_owner' },
    NOW,
  );

  assert.deepEqual(assignableCalls, ['user_assignee']);
  assert.equal(harness.calls.moves[0]?.data.nextAction?.whoId, 'user_assignee');
  assert.deepEqual({ from: harness.calls.history[0]?.data.fromStatus, to: harness.calls.history[0]?.data.toStatus }, { from: TaskStatus.DONE, to: TaskStatus.OPEN });
});

test('a move that routes the next action to an out-of-scope user is denied with no writes', async () => {
  const harness = buildService({
    stage: stage('stage_open', TaskStatus.OPEN),
    current: fullTask({ status: TaskStatus.DONE, stageId: 'stage_done', nextActionWhat: null, nextActionWhoId: null, nextActionWhen: null }),
    users: { assertAssignable: async () => { throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', 403); } },
  });

  await assert.rejects(
    harness.service.move(
      { taskId: 'task_1', stageId: 'stage_open', boardPosition: 0, nextAction: { what: 'Follow up', whoId: 'user_branch_z', when: '2026-06-22T09:00:00.000Z' } },
      owner,
      { actorId: 'user_owner' },
      NOW,
    ),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );
  assert.equal(harness.calls.moves.length, 0);
  assert.equal(harness.calls.history.length, 0);
  assert.equal(harness.calls.audit.length, 0);
});

type MoveCall = { data: MoveTaskData; client: unknown };
type WriteCall = { data: { fromStatus?: TaskStatus; toStatus?: TaskStatus; body?: string }; client: unknown };
type AuditCall = { input: { action: string; metadata?: Record<string, unknown> }; client: unknown };

function buildService(opts: { stage: BoardStageTarget | null; current: TaskRecord | null; users?: Pick<AdminUsersService, 'assertAssignable'> }) {
  const client = { tx: true };
  const calls = { moves: [] as MoveCall[], history: [] as WriteCall[], comments: [] as WriteCall[], audit: [] as AuditCall[] };
  const state = { findByIdCalls: 0 };

  const boardRepository = {
    findStage: async () => opts.stage,
    moveTask: async (data: MoveTaskData, txClient: unknown) => {
      calls.moves.push({ data, client: txClient });
      return movedRecord(data);
    },
  } as unknown as TasksBoardRepository;

  const tasksRepository = {
    transaction: async <T>(work: (c: unknown) => Promise<T>) => work(client),
    findById: async () => {
      state.findByIdCalls += 1;
      return opts.current;
    },
    createStatusHistory: async (data: WriteCall['data'], txClient: unknown) => {
      calls.history.push({ data, client: txClient });
    },
    createComment: async (data: WriteCall['data'], txClient: unknown) => {
      calls.comments.push({ data, client: txClient });
      return {} as never;
    },
  } as unknown as TasksRepository;

  const auditService = {
    record: async (input: AuditCall['input'], txClient: unknown) => {
      calls.audit.push({ input, client: txClient });
    },
  } as unknown as AuditService;

  return { service: new TasksBoardService(boardRepository, tasksRepository, auditService, opts.users), calls, client, get findByIdCalls() { return state.findByIdCalls; } };
}

function stage(id: string, mappedTaskStatus: TaskStatus | null): BoardStageTarget {
  return { id, code: id.toUpperCase(), mappedTaskStatus };
}

function movedRecord(data: MoveTaskData): BoardTaskRecord {
  return {
    id: data.id,
    title: 'Call customer',
    ownerId: 'user_owner',
    assigneeId: 'user_assignee',
    dueAt: new Date('2026-06-21T09:00:00.000Z'),
    status: data.status,
    stageId: data.stageId,
    boardPosition: data.boardPosition,
    assignedDepartmentId: null,
    assignedDepartment: null,
    isCustomerPromise: false,
    visibility: TaskVisibility.PARTICIPANTS,
    confidentialityLevel: TaskConfidentialityLevel.NORMAL,
    createdAt: new Date('2026-06-20T08:00:00.000Z'),
    updatedAt: new Date('2026-06-20T08:00:00.000Z'),
    owner: { nameEn: 'Owner User', nameAr: 'المالك', branchId: 'branch_a' },
    assignee: { nameEn: 'Assignee User', nameAr: 'المكلف', branchId: 'branch_a' },
    _count: { comments: 1 },
  };
}

function fullTask(overrides: Partial<TaskRecord> = {}): TaskRecord {
  const now = new Date('2026-06-20T08:00:00.000Z');
  return {
    id: 'task_1',
    title: 'Call customer',
    ownerId: 'user_owner',
    assigneeId: 'user_assignee',
    dueAt: new Date('2026-06-21T09:00:00.000Z'),
    status: TaskStatus.OPEN,
    stageId: 'stage_open',
    assignedDepartmentId: null,
    nextActionWhat: 'Call customer',
    nextActionWhoId: 'user_assignee',
    nextActionWhen: new Date('2026-06-21T08:30:00.000Z'),
    isCustomerPromise: false,
    visibility: TaskVisibility.PARTICIPANTS,
    confidentialityLevel: TaskConfidentialityLevel.NORMAL,
    createdAt: now,
    updatedAt: now,
    owner: { nameEn: 'Owner User', branchId: 'branch_a', branch: { nameEn: 'Main Branch', timezone: 'UTC' } },
    assignee: { nameEn: 'Assignee User', branchId: 'branch_a', branch: { nameEn: 'Main Branch', timezone: 'UTC' } },
    nextActionWho: { nameEn: 'Assignee User', branchId: 'branch_a' },
    links: [],
    participants: [],
    ...overrides,
  };
}

const owner: StaffPrincipal = {
  sessionId: 'ses_owner',
  userId: 'user_owner',
  email: 'owner@example.test',
  nameEn: 'Owner',
  nameAr: 'Owner',
  roleCode: RoleCode.CR_OFFICER,
  branchId: 'branch_a',
};

const stranger: StaffPrincipal = { ...owner, sessionId: 'ses_stranger', userId: 'user_stranger', branchId: 'branch_z' };

function request(principal: StaffPrincipal): AuthenticatedRequest {
  return {
    principal,
    url: '/tasks/task_1/move',
    correlationId: 'req_move',
    headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.10' },
  } as AuthenticatedRequest;
}
