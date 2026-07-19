import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import { BoardScope, RoleCode, TaskConfidentialityLevel, TaskStatus, TaskVisibility } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { PermissionGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { TasksController } from '../../src/modules/tasks/tasks.controller.ts';
import { TasksBoardService, buildTaskBoard } from '../../src/modules/tasks/tasks.board.service.ts';
import type { BoardScopeQuery, BoardStageRecord, BoardTaskRecord, TasksBoardRepository } from '../../src/modules/tasks/tasks.board.repository.ts';

const NOW = new Date('2026-06-20T12:00:00.000Z');

test('board route requires the session and internal-comment permission, no CSRF/branch guard', () => {
  assert.deepEqual(guardNames('board'), ['SessionAuthGuard', 'PermissionGuard']);
});

test('board route without the internal-comment permission is denied and audited', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new PermissionGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  assert.equal(await guard.canActivate(context(request({ ...employee, permissions: ['COMPLAINT_COMMENT_INTERNAL'] }, '/tasks/board'), 'board')), true);
  await assert.rejects(
    guard.canActivate(context(request({ ...employee, permissions: [] }, '/tasks/board'), 'board')),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.action, 'permission_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata?.requiredPermissions, ['COMPLAINT_COMMENT_INTERNAL']);
});

test('board route derives the actor from the staff session', async () => {
  let capturedActor: unknown;
  const controller = new TasksController({} as never, {
    board: async (actor: unknown) => {
      capturedActor = actor;
      return { stages: [], columns: [] };
    },
  } as unknown as TasksBoardService);

  await controller.board(request(branchManager, '/tasks/board'));

  assert.deepEqual(capturedActor, { userId: 'user_manager', roleCode: RoleCode.BRANCH_MANAGER, branchId: 'branch_a', departmentId: null, permissions: [] });
});

test('employee board query is participant-scoped (no manager or admin reach)', async () => {
  const captured = await captureBoardQuery({ userId: 'user_employee', roleCode: RoleCode.CR_OFFICER, branchId: 'branch_a' });

  assert.equal(captured.stagesScope, BoardScope.TASKS);
  assert.deepEqual(captured.scope, { userId: 'user_employee', branchId: 'branch_a', departmentId: null, isAdmin: false, isManager: false });
  // 14-day completed window computed on the server clock, passed to the repository.
  assert.equal(captured.completedSince?.toISOString(), new Date(NOW.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString());
});

test('manager board query carries branch scope; admin board query is unrestricted', async () => {
  const manager = await captureBoardQuery({ userId: 'user_manager', roleCode: RoleCode.BRANCH_MANAGER, branchId: 'branch_a' });
  assert.deepEqual(manager.scope, { userId: 'user_manager', branchId: 'branch_a', departmentId: null, isAdmin: false, isManager: true });

  const admin = await captureBoardQuery({ userId: 'user_admin', roleCode: RoleCode.ADMIN, branchId: null });
  assert.deepEqual(admin.scope, { userId: 'user_admin', branchId: null, departmentId: null, isAdmin: true, isManager: true });
});

test('department members are scoped to their own department only, from the session', async () => {
  const member = await captureBoardQuery({ userId: 'user_member', roleCode: RoleCode.CR_OFFICER, branchId: 'branch_a', departmentId: 'dept_service' });
  assert.deepEqual(member.scope, { userId: 'user_member', branchId: 'branch_a', departmentId: 'dept_service', isAdmin: false, isManager: false });
});

test('board groups cards into every active stage, keeping empty columns and sorting by position', () => {
  const stages = [
    stageRecord({ id: 'custom_open', code: 'CUSTOM_OPEN', position: 0, isDefault: false, mappedTaskStatus: TaskStatus.OPEN }),
    stageRecord({ id: 'def_open', code: 'TASKS_OPEN', position: 1, isDefault: true, mappedTaskStatus: TaskStatus.OPEN }),
    stageRecord({ id: 'def_prog', code: 'TASKS_IN_PROGRESS', position: 2, isDefault: true, mappedTaskStatus: TaskStatus.IN_PROGRESS }),
    stageRecord({ id: 'def_done', code: 'TASKS_DONE', position: 3, isDefault: true, mappedTaskStatus: TaskStatus.DONE }),
  ];
  const tasks = [
    taskRecord({ id: 't_late', stageId: 'custom_open', status: TaskStatus.OPEN, boardPosition: 5 }),
    taskRecord({ id: 't_early', stageId: 'custom_open', status: TaskStatus.OPEN, boardPosition: 1 }),
    taskRecord({ id: 't_null', stageId: null, status: TaskStatus.OPEN, boardPosition: 0 }),
    taskRecord({ id: 't_archived', stageId: 'gone', status: TaskStatus.DONE, boardPosition: 0 }),
  ];

  const board = buildTaskBoard(stages, tasks, NOW);

  assert.deepEqual(board.stages.map((stage) => stage.id), ['custom_open', 'def_open', 'def_prog', 'def_done']);
  assert.deepEqual(cardIds(board, 'custom_open'), ['t_early', 't_late']); // sorted by boardPosition
  assert.deepEqual(cardIds(board, 'def_open'), ['t_null']); // null stage -> default stage for its status
  assert.deepEqual(cardIds(board, 'def_prog'), []); // empty column preserved
  assert.deepEqual(cardIds(board, 'def_done'), ['t_archived']); // unknown/archived stage -> default for status
});

test('board falls back to the first stage when no stage maps the status, and never throws on no stages', () => {
  const stages = [stageRecord({ id: 'first', mappedTaskStatus: TaskStatus.OPEN, isDefault: true })];
  const board = buildTaskBoard(stages, [taskRecord({ id: 't_waiting', stageId: null, status: TaskStatus.WAITING })], NOW);
  assert.deepEqual(cardIds(board, 'first'), ['t_waiting']);

  assert.deepEqual(buildTaskBoard([], [taskRecord({ id: 't_orphan', stageId: null })], NOW), { stages: [], columns: [] });
});

test('card metrics derive days-active and due-state from the server clock', () => {
  const stages = [stageRecord({ id: 'only', mappedTaskStatus: TaskStatus.OPEN, isDefault: true })];
  const tasks = [
    taskRecord({ id: 't_overdue', stageId: 'only', boardPosition: 0, status: TaskStatus.OPEN, dueAt: new Date('2026-06-19T23:00:00.000Z'), createdAt: new Date('2026-06-17T12:00:00.000Z') }),
    taskRecord({ id: 't_today', stageId: 'only', boardPosition: 1, status: TaskStatus.OPEN, dueAt: new Date('2026-06-20T15:00:00.000Z') }),
    taskRecord({ id: 't_upcoming', stageId: 'only', boardPosition: 2, status: TaskStatus.OPEN, dueAt: new Date('2026-06-22T09:00:00.000Z') }),
    taskRecord({ id: 't_done', stageId: 'only', boardPosition: 3, status: TaskStatus.DONE, dueAt: new Date('2026-06-18T09:00:00.000Z') }),
  ];

  const cards = buildTaskBoard(stages, tasks, NOW).columns[0]!.cards;
  const byId = new Map(cards.map((card) => [card.id, card]));

  assert.equal(byId.get('t_overdue')?.dueState, 'OVERDUE');
  assert.equal(byId.get('t_overdue')?.daysActive, 3);
  assert.equal(byId.get('t_today')?.dueState, 'DUE_TODAY');
  assert.equal(byId.get('t_upcoming')?.dueState, 'UPCOMING');
  assert.equal(byId.get('t_done')?.dueState, null); // done cards carry no due pressure
});

test('board cards omit staff PII (emails) and expose bilingual names', () => {
  const stages = [stageRecord({ id: 'only', mappedTaskStatus: TaskStatus.OPEN, isDefault: true })];
  const board = buildTaskBoard(stages, [taskRecord({ id: 't1', stageId: 'only' })], NOW);
  const card = board.columns[0]!.cards[0]!;

  assert.equal(card.assigneeName, 'Assignee User');
  assert.equal(card.assigneeNameAr, 'المكلف');
  assert.equal(card.commentCount, 2);
  assert.equal(JSON.stringify(board).includes('@'), false);
});

async function captureBoardQuery(actor: { userId: string; roleCode: string; branchId: string | null; departmentId?: string | null }) {
  const captured: { stagesScope?: BoardScope; scope?: BoardScopeQuery; completedSince?: Date } = {};
  const service = new TasksBoardService({
    listStages: async (scope: BoardScope) => {
      captured.stagesScope = scope;
      return [];
    },
    listBoardTasks: async (scope: BoardScopeQuery, completedSince: Date) => {
      captured.scope = scope;
      captured.completedSince = completedSince;
      return [];
    },
    listActiveDepartments: async () => [],
  } as unknown as TasksBoardRepository);

  await service.board(actor, NOW);
  return captured;
}

function cardIds(board: { columns: { stageId: string; cards: { id: string }[] }[] }, stageId: string): string[] {
  return (board.columns.find((column) => column.stageId === stageId)?.cards ?? []).map((card) => card.id);
}

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

function request(principal: StaffPrincipal, url = '/tasks/board'): AuthenticatedRequest {
  return {
    principal,
    url,
    correlationId: 'req_board',
    headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.10' },
  };
}

function context(req: AuthenticatedRequest, handler: keyof TasksController): ExecutionContext {
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

function stageRecord(overrides: Partial<BoardStageRecord> = {}): BoardStageRecord {
  return {
    id: 'stage_1',
    code: 'TASKS_OPEN',
    nameEn: 'Open',
    nameAr: 'مفتوحة',
    color: 'slate',
    position: 0,
    isDefault: true,
    mappedTaskStatus: TaskStatus.OPEN,
    ...overrides,
  };
}

function taskRecord(overrides: Partial<BoardTaskRecord> = {}): BoardTaskRecord {
  return {
    id: 'task_1',
    title: 'Call customer',
    ownerId: 'user_owner',
    assigneeId: 'user_a',
    dueAt: new Date('2026-06-21T09:00:00.000Z'),
    status: TaskStatus.OPEN,
    stageId: null,
    boardPosition: 0,
    assignedDepartmentId: null,
    assignedDepartment: null,
    isCustomerPromise: false,
    visibility: TaskVisibility.PARTICIPANTS,
    confidentialityLevel: TaskConfidentialityLevel.NORMAL,
    createdAt: new Date('2026-06-20T08:00:00.000Z'),
    updatedAt: new Date('2026-06-20T08:00:00.000Z'),
    owner: { nameEn: 'Owner User', nameAr: 'المالك', branchId: 'branch_a' },
    assignee: { nameEn: 'Assignee User', nameAr: 'المكلف', branchId: 'branch_a' },
    _count: { comments: 2 },
    ...overrides,
  };
}
