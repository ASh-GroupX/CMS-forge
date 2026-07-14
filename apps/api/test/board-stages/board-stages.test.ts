import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { PermissionGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { BoardStagesController } from '../../src/modules/board-stages/board-stages.controller.ts';
import { BoardStagesRepository } from '../../src/modules/board-stages/board-stages.repository.ts';
import type { BoardStageRecord } from '../../src/modules/board-stages/board-stages.repository.ts';
import { BoardStagesService } from '../../src/modules/board-stages/board-stages.service.ts';
import {
  parseCreateBoardStageBody,
  parseReorderBoardStagesBody,
} from '../../src/modules/board-stages/dto/board-stage-write.dto.ts';
import type { TasksBoardService } from '../../src/modules/tasks/tasks.board.service.ts';

const taskStage: BoardStageRecord = {
  id: 'stage_open',
  code: 'TASKS_OPEN',
  scope: 'TASKS',
  nameEn: 'Open',
  nameAr: 'مفتوحة',
  color: 'slate',
  position: 0,
  isDefault: true,
  mappedTaskStatus: 'OPEN',
  mappedComplaintStatus: null,
  archivedAt: null,
  createdAt: new Date('2026-07-01T08:00:00.000Z'),
  updatedAt: new Date('2026-07-01T08:00:00.000Z'),
};

const ticketStage: BoardStageRecord = {
  ...taskStage,
  id: 'stage_submitted',
  code: 'TICKETS_SUBMITTED',
  scope: 'TICKETS',
  nameEn: 'Submitted',
  nameAr: 'مقدمة',
  color: 'blue',
  mappedTaskStatus: null,
  mappedComplaintStatus: 'SUBMITTED',
};

const admin: StaffPrincipal = {
  sessionId: 'ses_admin',
  userId: 'usr_admin',
  email: 'admin@cms-auto.test',
  nameEn: 'Admin',
  nameAr: 'Admin',
  roleCode: 'ADMIN',
  permissions: ['MASTER_DATA_MANAGE', 'COMPLAINT_COMMENT_INTERNAL'],
  branchId: null,
};

const noopAudit = { record: async () => undefined } as unknown as AuditService;
const noopTasksBoard = { reassignStage: async () => 0 } as unknown as TasksBoardService;

function request(permissions: readonly string[]): AuthenticatedRequest {
  return {
    principal: { ...admin, permissions: [...permissions] },
    url: '/board-stages',
    correlationId: 'req_test',
    headers: { 'user-agent': 'node:test' },
    socket: { remoteAddress: '127.0.0.1' },
  } as AuthenticatedRequest;
}

function context(req: AuthenticatedRequest, handler: 'list' | 'create' | 'update' | 'reorder' | 'archive'): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => BoardStagesController.prototype[handler],
    getClass: () => BoardStagesController,
  } as ExecutionContext;
}

test('stage routes guard reads with staff permission and writes with master-data plus CSRF', () => {
  const guards = (handler: 'list' | 'create' | 'update' | 'reorder' | 'archive') =>
    (Reflect.getMetadata(GUARDS_METADATA, BoardStagesController.prototype[handler]) as Array<{ name: string }>).map((guard) => guard.name);
  assert.deepEqual(guards('list'), ['SessionAuthGuard', 'PermissionGuard']);
  for (const handler of ['create', 'update', 'reorder', 'archive'] as const) {
    assert.deepEqual(guards(handler), ['SessionAuthGuard', 'PermissionGuard', 'CsrfGuard']);
  }
});

test('staff may read stages; non-admin stage writes are denied and audited', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new PermissionGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  assert.equal(await guard.canActivate(context(request(['COMPLAINT_COMMENT_INTERNAL']), 'list')), true);
  assert.equal(await guard.canActivate(context(request(['MASTER_DATA_MANAGE']), 'create')), true);

  await assert.rejects(
    guard.canActivate(context(request(['COMPLAINT_COMMENT_INTERNAL']), 'create')),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.deepEqual(auditRecords[0]?.metadata?.requiredPermissions, ['MASTER_DATA_MANAGE']);
});

test('create appends the stage at the end of its scope and audits on the same transaction', async () => {
  const txClient = {};
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const service = new BoardStagesService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    nextPosition: async (scope: string, client: unknown) => {
      assert.equal(scope, 'TICKETS');
      assert.equal(client, txClient);
      return 9;
    },
    create: async (data: BoardStageRecord, client: unknown) => {
      assert.equal(client, txClient);
      assert.equal(data.position, 9);
      return { ...ticketStage, id: 'stage_new', code: data.code, position: 9 };
    },
  } as unknown as BoardStagesRepository, {
    record: async (input: AuditRecordInput, client?: unknown) => auditRecords.push({ input, client }),
  } as unknown as AuditService, noopTasksBoard);

  const created = await service.create(
    parseCreateBoardStageBody({ code: 'tickets_escalated', scope: 'TICKETS', nameEn: 'Escalated', nameAr: 'مصعدة', color: 'red', mappedComplaintStatus: 'SUBMITTED' }),
    { actorId: 'usr_admin' },
  );

  assert.equal(created.code, 'TICKETS_ESCALATED');
  assert.equal(created.position, 9);
  assert.equal(auditRecords[0]?.client, txClient);
  assert.equal(auditRecords[0]?.input.action, 'board_stage_created');
  assert.equal(auditRecords[0]?.input.eventType, 'CONFIG');
});

test('create validates scope-specific mappings and colors', () => {
  assert.throws(
    () => parseCreateBoardStageBody({ code: 'X', scope: 'TICKETS', nameEn: 'X', nameAr: 'X', color: 'blue' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.throws(
    () => parseCreateBoardStageBody({ code: 'X', scope: 'TASKS', nameEn: 'X', nameAr: 'X', color: 'blue', mappedComplaintStatus: 'SUBMITTED' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.throws(
    () => parseCreateBoardStageBody({ code: 'X', scope: 'TASKS', nameEn: 'X', nameAr: 'X', color: 'magenta' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.throws(
    () => parseReorderBoardStagesBody({ scope: 'TASKS', orderedIds: ['a', 'a'] }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('reorder requires the exact active stage set and rewrites positions in order', async () => {
  const txClient = {};
  const positions: Array<[string, number]> = [];
  const stages = [taskStage, { ...taskStage, id: 'stage_done', code: 'TASKS_DONE', position: 1 }];
  const auditRecords: AuditRecordInput[] = [];
  const service = new BoardStagesService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    listActive: async () => stages,
    setPosition: async (id: string, position: number, client: unknown) => {
      assert.equal(client, txClient);
      positions.push([id, position]);
    },
  } as unknown as BoardStagesRepository, {
    record: async (input: AuditRecordInput) => auditRecords.push(input),
  } as unknown as AuditService, noopTasksBoard);

  await service.reorder('TASKS', ['stage_done', 'stage_open']);
  assert.deepEqual(positions, [['stage_done', 0], ['stage_open', 1]]);
  assert.equal(auditRecords[0]?.action, 'board_stages_reordered');

  await assert.rejects(
    service.reorder('TASKS', ['stage_done']),
    (error: unknown) => error instanceof AppException && error.code === 'BOARD_STAGE_ORDER_MISMATCH' && error.getStatus() === 409,
  );
});

test('archiving a TASKS stage requires a same-scope destination and moves cards on the same transaction', async () => {
  const txClient = {};
  const reassignments: Array<{ from: string; to: string; client: unknown }> = [];
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const doneStage = { ...taskStage, id: 'stage_done', code: 'TASKS_DONE' };
  const service = new BoardStagesService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    findById: async (id: string) => (id === taskStage.id ? taskStage : id === doneStage.id ? doneStage : null),
    archive: async (id: string, archivedAt: Date, client: unknown) => {
      assert.equal(client, txClient);
      return { ...taskStage, id, archivedAt };
    },
  } as unknown as BoardStagesRepository, {
    record: async (input: AuditRecordInput, client?: unknown) => auditRecords.push({ input, client }),
  } as unknown as AuditService, {
    reassignStage: async (from: string, to: string, client: unknown) => {
      reassignments.push({ from, to, client });
      return 3;
    },
  } as unknown as TasksBoardService);

  const archived = await service.archive(taskStage.id, doneStage.id, { actorId: 'usr_admin' });

  assert.notEqual(archived.archivedAt, null);
  assert.deepEqual(reassignments, [{ from: 'stage_open', to: 'stage_done', client: txClient }]);
  assert.equal(auditRecords[0]?.client, txClient);
  assert.equal(auditRecords[0]?.input.action, 'board_stage_archived');
  assert.equal((auditRecords[0]?.input.metadata as { movedTasks: number }).movedTasks, 3);

  await assert.rejects(
    service.archive(taskStage.id, taskStage.id),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.archive(taskStage.id, 'missing'),
    (error: unknown) => error instanceof AppException && error.code === 'BOARD_STAGE_NOT_FOUND',
  );
});

test('archiving across scopes or onto an unmapped TICKETS destination is rejected', async () => {
  const unmappedTicketStage = { ...ticketStage, id: 'stage_unmapped', mappedComplaintStatus: null };
  const service = new BoardStagesService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work({} as never),
    findById: async (id: string) =>
      id === taskStage.id ? taskStage : id === ticketStage.id ? ticketStage : id === unmappedTicketStage.id ? unmappedTicketStage : null,
  } as unknown as BoardStagesRepository, noopAudit, noopTasksBoard);

  await assert.rejects(
    service.archive(taskStage.id, ticketStage.id),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.archive(ticketStage.id, unmappedTicketStage.id),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('stage list maps records to explicit response objects and controller validates scope', async () => {
  const service = new BoardStagesService({
    listActive: async (scope?: string) => {
      assert.equal(scope, 'TICKETS');
      return [ticketStage];
    },
  } as unknown as BoardStagesRepository, noopAudit, noopTasksBoard);
  const controller = new BoardStagesController(service);

  const result = await controller.list('TICKETS');
  assert.deepEqual(result.items[0], {
    id: 'stage_submitted',
    code: 'TICKETS_SUBMITTED',
    scope: 'TICKETS',
    nameEn: 'Submitted',
    nameAr: 'مقدمة',
    color: 'blue',
    position: 0,
    isDefault: true,
    mappedTaskStatus: null,
    mappedComplaintStatus: 'SUBMITTED',
    archivedAt: null,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-07-01T08:00:00.000Z',
  });

  await assert.rejects(
    controller.list('EVERYTHING'),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});
