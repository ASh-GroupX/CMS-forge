import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ComplaintStatus, ComplaintTransitionAction, RoleCode } from '@prisma/client';
import type { AuditService } from '../../src/core/audit.service.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { ComplaintsController } from '../../src/modules/complaints/complaints.controller.ts';
import { ComplaintsBoardService, buildComplaintBoard } from '../../src/modules/complaints/complaints.board.service.ts';
import type { ComplaintBoardActor } from '../../src/modules/complaints/complaints.board.service.ts';
import type { ComplaintsBoardRepository, ComplaintBoardStageRecord } from '../../src/modules/complaints/complaints.board.repository.ts';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.ts';
import { ComplaintsRepository } from '../../src/modules/complaints/complaints.repository.ts';
import type { ComplaintBoardTransitionDto } from '../../src/modules/complaints/dto/complaint-board.dto.ts';
import type { ComplaintQueueItemDto } from '../../src/modules/complaints/dto/complaint-response.dto.ts';

const NOW = new Date('2026-06-20T12:00:00.000Z');
const noopAudit = { record: async () => undefined } as unknown as AuditService;

test('board route requires the session, branch-view permission, and RBAC guard, no CSRF', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, ComplaintsController.prototype.board) as Array<{ name: string }>;
  assert.deepEqual(guards.map((guard) => guard.name), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard']);
});

test('board route scopes to the caller branch from the session; admins are unrestricted', async () => {
  const officer = await captureActor(principal({ userId: 'user_officer', roleCode: RoleCode.CR_OFFICER, branchId: 'branch_a' }));
  assert.deepEqual(officer, { userId: 'user_officer', roleCode: RoleCode.CR_OFFICER, branchId: 'branch_a' });

  const admin = await captureActor(principal({ userId: 'user_admin', roleCode: RoleCode.ADMIN, branchId: 'branch_a' }));
  // ADMIN board query drops the branch filter (all branches), matching the queue route.
  assert.deepEqual(admin, { userId: 'user_admin', roleCode: RoleCode.ADMIN, branchId: null });
});

test('board service passes the actor branch and role straight to the scoped queue', async () => {
  let captured: unknown;
  const service = new ComplaintsBoardService(
    { listStages: async () => [] } as unknown as ComplaintsBoardRepository,
    { listQueue: async (filter: unknown) => { captured = filter; return []; } } as unknown as ComplaintsService,
  );

  await service.board({ userId: 'user_officer', roleCode: RoleCode.CR_OFFICER, branchId: 'branch_a' }, NOW);
  assert.deepEqual(captured, { branchId: 'branch_a', role: RoleCode.CR_OFFICER });
});

test('board groups complaints into the stage that maps their status, keeping empty columns', () => {
  const stages = [
    stage({ id: 's_submitted', code: 'TICKETS_SUBMITTED', position: 0, mappedComplaintStatus: ComplaintStatus.SUBMITTED }),
    stage({ id: 's_progress', code: 'TICKETS_IN_PROGRESS', position: 1, mappedComplaintStatus: ComplaintStatus.IN_PROGRESS }),
    stage({ id: 's_resolved', code: 'TICKETS_RESOLVED', position: 2, mappedComplaintStatus: ComplaintStatus.RESOLVED }),
  ];
  const cards = [
    card({ id: 'c_new', status: ComplaintStatus.SUBMITTED }),
    card({ id: 'c_work', status: ComplaintStatus.IN_PROGRESS }),
  ];

  const board = buildComplaintBoard(stages, cards, () => []);

  assert.deepEqual(board.stages.map((s) => s.id), ['s_submitted', 's_progress', 's_resolved']);
  assert.deepEqual(cardIds(board, 's_submitted'), ['c_new']);
  assert.deepEqual(cardIds(board, 's_progress'), ['c_work']);
  assert.deepEqual(cardIds(board, 's_resolved'), []); // empty column preserved
});

test('when several columns map one status the default wins, else the lowest position', () => {
  const withDefault = buildComplaintBoard(
    [
      stage({ id: 's_first', position: 0, isDefault: false, mappedComplaintStatus: ComplaintStatus.SUBMITTED }),
      stage({ id: 's_default', position: 1, isDefault: true, mappedComplaintStatus: ComplaintStatus.SUBMITTED }),
    ],
    [card({ id: 'c1', status: ComplaintStatus.SUBMITTED })],
    () => [],
  );
  assert.deepEqual(cardIds(withDefault, 's_default'), ['c1']);

  const noDefault = buildComplaintBoard(
    [
      stage({ id: 's_low', position: 0, isDefault: false, mappedComplaintStatus: ComplaintStatus.SUBMITTED }),
      stage({ id: 's_high', position: 1, isDefault: false, mappedComplaintStatus: ComplaintStatus.SUBMITTED }),
    ],
    [card({ id: 'c1', status: ComplaintStatus.SUBMITTED })],
    () => [],
  );
  assert.deepEqual(cardIds(noDefault, 's_low'), ['c1']);
});

test('a status with no active column falls back to the first stage; never throws on no stages', () => {
  const board = buildComplaintBoard(
    [stage({ id: 's_only', position: 0, mappedComplaintStatus: ComplaintStatus.SUBMITTED })],
    [card({ id: 'c_orphan', status: ComplaintStatus.REOPENED })],
    () => [],
  );
  assert.deepEqual(cardIds(board, 's_only'), ['c_orphan']);

  assert.deepEqual(buildComplaintBoard([], [card({ id: 'c_x', status: ComplaintStatus.SUBMITTED })], () => []), { stages: [], columns: [] });
});

test('per-card allowedTransitions carry the target status; managers act where officers cannot', async () => {
  const stages = [stage({ id: 's_review', position: 0, mappedComplaintStatus: ComplaintStatus.BRANCH_REVIEW })];
  const cards = [card({ id: 'c_review', status: ComplaintStatus.BRANCH_REVIEW, ownerId: null })];

  const managerBoard = await realBoard(stages, cards, { userId: 'user_manager', roleCode: RoleCode.BRANCH_MANAGER, branchId: 'branch_a' });
  const managerCard = firstCard(managerBoard);
  assert.deepEqual(managerCard.allowedTransitions, [
    { action: ComplaintTransitionAction.ASSIGN_INVESTIGATION, toStatus: ComplaintStatus.IN_PROGRESS },
    { action: ComplaintTransitionAction.RESOLVE_DIRECTLY, toStatus: ComplaintStatus.RESOLVED },
    { action: ComplaintTransitionAction.REJECT_AFTER_REVIEW, toStatus: ComplaintStatus.REJECTED },
  ]);
  assert.equal(managerCard.stageId, 's_review');

  // Branch-review actions are branch-manager only: a CR officer is offered none (denied case).
  const officerBoard = await realBoard(stages, cards, { userId: 'user_officer', roleCode: RoleCode.CR_OFFICER, branchId: 'branch_a' });
  assert.deepEqual(firstCard(officerBoard).allowedTransitions, []);
});

test('terminal columns are windowed: recent closed cards stay, stale ones drop off', async () => {
  const stages = [stage({ id: 's_closed', position: 0, mappedComplaintStatus: ComplaintStatus.CLOSED })];
  const cards = [
    card({ id: 'c_recent', status: ComplaintStatus.CLOSED, updatedAt: new Date(NOW.getTime() - 3 * 86400000).toISOString() }),
    card({ id: 'c_stale', status: ComplaintStatus.CLOSED, updatedAt: new Date(NOW.getTime() - 30 * 86400000).toISOString() }),
  ];
  const board = await realBoard(stages, cards, { userId: 'user_admin', roleCode: RoleCode.ADMIN, branchId: null });
  assert.deepEqual(cardIds(board, 's_closed'), ['c_recent']);
});

test('board cards expose no staff PII (no emails leak through the projection)', async () => {
  const stages = [stage({ id: 's_review', position: 0, mappedComplaintStatus: ComplaintStatus.BRANCH_REVIEW })];
  const board = await realBoard(stages, [card({ id: 'c1', status: ComplaintStatus.BRANCH_REVIEW })], { userId: 'user_admin', roleCode: RoleCode.ADMIN, branchId: null });
  assert.equal(JSON.stringify(board).includes('@'), false);
});

// --- helpers -------------------------------------------------------------

async function captureActor(caller: StaffPrincipal): Promise<ComplaintBoardActor> {
  let captured: ComplaintBoardActor | undefined;
  const controller = new ComplaintsController({} as never, {} as never, {} as never, {
    board: async (actor: ComplaintBoardActor) => { captured = actor; return { stages: [], columns: [] }; },
  } as unknown as ComplaintsBoardService);

  await controller.board(request(caller));
  return captured!;
}

// Real ComplaintsService for the allowedActionsFor logic; only listQueue is faked
// so the board's transition derivation runs against the authoritative workflow.
async function realBoard(stages: ComplaintBoardStageRecord[], cards: ComplaintQueueItemDto[], actor: ComplaintBoardActor) {
  const real = new ComplaintsService(new ComplaintsRepository({} as never), noopAudit);
  const service = new ComplaintsBoardService(
    { listStages: async () => stages } as unknown as ComplaintsBoardRepository,
    { listQueue: async () => cards, allowedActionsFor: real.allowedActionsFor.bind(real) } as unknown as ComplaintsService,
  );
  return service.board(actor, NOW);
}

function firstCard(board: { columns: { cards: { id: string; stageId: string; allowedTransitions: ComplaintBoardTransitionDto[] }[] }[] }) {
  const found = board.columns.flatMap((column) => column.cards)[0];
  assert.ok(found, 'expected at least one card');
  return found;
}

function cardIds(board: { columns: { stageId: string; cards: { id: string }[] }[] }, stageId: string): string[] {
  return (board.columns.find((column) => column.stageId === stageId)?.cards ?? []).map((c) => c.id);
}

function stage(overrides: Partial<ComplaintBoardStageRecord> = {}): ComplaintBoardStageRecord {
  return {
    id: 'stage_1',
    code: 'TICKETS_SUBMITTED',
    nameEn: 'Submitted',
    nameAr: 'مُرسلة',
    color: 'blue',
    position: 0,
    isDefault: true,
    mappedComplaintStatus: ComplaintStatus.SUBMITTED,
    ...overrides,
  };
}

function card(overrides: Partial<ComplaintQueueItemDto> = {}): ComplaintQueueItemDto {
  return {
    id: 'complaint_1',
    referenceNumber: 'CMP-2026-0001',
    status: ComplaintStatus.SUBMITTED,
    severity: 'MEDIUM',
    subject: 'Delayed delivery',
    branchId: 'branch_a',
    branchName: 'Riyadh',
    displayTimeZone: 'Asia/Riyadh',
    ownerId: 'user_owner',
    ownerName: 'Owner User',
    slaState: 'ON_TRACK',
    slaDueAt: null,
    slaStage: 'RESOLUTION',
    slaPercentElapsed: 10,
    nextAction: 'Manager intake review',
    createdAt: '2026-06-18T09:00:00.000Z',
    updatedAt: '2026-06-19T09:00:00.000Z',
    ...overrides,
  };
}

function principal(overrides: Partial<StaffPrincipal>): StaffPrincipal {
  return { sessionId: 'ses_1', userId: 'user_1', email: 'staff@example.test', nameEn: 'Staff', nameAr: 'موظف', roleCode: RoleCode.CR_OFFICER, branchId: 'branch_a', permissions: [], ...overrides };
}

function request(caller: StaffPrincipal): AuthenticatedRequest {
  return {
    principal: caller,
    url: '/complaints/board',
    correlationId: 'req_board',
    headers: { 'x-forwarded-for': '203.0.113.10', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.10' },
  } as AuthenticatedRequest;
}
