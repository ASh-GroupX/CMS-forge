import { Injectable } from '@nestjs/common';
import { ComplaintStatus } from '@prisma/client';
import type { ComplaintTransitionAction, RoleCode } from '@prisma/client';
import { ComplaintsBoardRepository } from './complaints.board.repository.js';
import type { ComplaintBoardStageRecord } from './complaints.board.repository.js';
import { ComplaintsService, WORKFLOW_TRANSITIONS } from './complaints.service.js';
import type { ComplaintBoardCardDto, ComplaintBoardResponseDto, ComplaintBoardStageDto, ComplaintBoardTransitionDto } from './dto/complaint-board.dto.js';
import type { ComplaintQueueItemDto } from './dto/complaint-response.dto.js';

// Terminal columns (CLOSED/REJECTED) would otherwise grow without bound; the board
// windows them to the last 14 days by last activity, mirroring the task board's
// completed-window projection. The complaint queue itself keeps every complaint.
const TERMINAL_STATUSES = new Set<ComplaintStatus>([ComplaintStatus.CLOSED, ComplaintStatus.REJECTED]);
const TERMINAL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

// (fromStatus, action) -> the status the transition lands in. Built once from the
// backend workflow so the board can label each allowed action with its target
// column without the frontend reconstructing the state machine.
const TRANSITION_TARGET = new Map<string, ComplaintStatus>(WORKFLOW_TRANSITIONS.map((item) => [`${item.fromStatus}:${item.action}`, item.toStatus]));

export type ComplaintBoardActor = { userId: string | null; roleCode: RoleCode; branchId: string | null; permissions?: string[] };

@Injectable()
export class ComplaintsBoardService {
  constructor(
    private readonly boardRepository: ComplaintsBoardRepository,
    private readonly complaintsService: ComplaintsService,
  ) {}

  async board(actor: ComplaintBoardActor, now: Date = new Date()): Promise<ComplaintBoardResponseDto> {
    const [stages, queue] = await Promise.all([
      this.boardRepository.listStages(),
      // Identical branch/role scoping as GET /complaints — from the server session only.
      this.complaintsService.listQueue({ branchId: actor.branchId, role: actor.roleCode, userId: actor.userId }),
    ]);
    return buildComplaintBoard(stages, recentQueue(queue, now), (card) => allowedTransitionsFor(this.complaintsService, card, actor));
  }

  async boardByDepartment(actor: ComplaintBoardActor, now: Date = new Date()): Promise<ComplaintBoardResponseDto> {
    const [departments, queue] = await Promise.all([
      this.boardRepository.listActiveDepartments(),
      this.complaintsService.listQueue({ branchId: actor.branchId, role: actor.roleCode, userId: actor.userId }),
    ]);
    return buildComplaintBoardByDepartment(departments, recentQueue(queue, now), (card) => allowedTransitionsFor(this.complaintsService, card, actor));
  }

  async boardByBranch(actor: ComplaintBoardActor, now: Date = new Date()): Promise<ComplaintBoardResponseDto> {
    const [branches, queue] = await Promise.all([
      this.boardRepository.listActiveBranches(),
      this.complaintsService.listQueue({ branchId: actor.branchId, role: actor.roleCode, userId: actor.userId }),
    ]);
    return buildComplaintBoardByBranch(branches, recentQueue(queue, now), (card) => allowedTransitionsFor(this.complaintsService, card, actor));
  }

  async boardByCategory(actor: ComplaintBoardActor, now: Date = new Date()): Promise<ComplaintBoardResponseDto> {
    const [categories, queue] = await Promise.all([
      this.boardRepository.listActiveCategories(),
      this.complaintsService.listQueue({ branchId: actor.branchId, role: actor.roleCode, userId: actor.userId }),
    ]);
    return buildComplaintBoardByCategory(categories, recentQueue(queue, now), (card) => allowedTransitionsFor(this.complaintsService, card, actor));
  }
}

// Per-card allowed transitions: the actor's permitted actions (role + owner rules
// enforced by ComplaintsService), each tagged with its target status.
function allowedTransitionsFor(service: ComplaintsService, card: ComplaintQueueItemDto, actor: ComplaintBoardActor): ComplaintBoardTransitionDto[] {
  return service
    .allowedActionsFor(card, { roleCode: actor.roleCode, userId: actor.userId, permissions: actor.permissions ?? [] })
    .flatMap((action) => transitionDto(card.status, action));
}

function transitionDto(fromStatus: ComplaintStatus, action: ComplaintTransitionAction): ComplaintBoardTransitionDto[] {
  const toStatus = TRANSITION_TARGET.get(`${fromStatus}:${action}`);
  return toStatus ? [{ action, toStatus }] : [];
}

function recentQueue(queue: ComplaintQueueItemDto[], now: Date): ComplaintQueueItemDto[] {
  const cutoff = now.getTime() - TERMINAL_WINDOW_MS;
  return queue.filter((card) => !TERMINAL_STATUSES.has(card.status) || new Date(card.updatedAt).getTime() >= cutoff);
}

// Pure board projection: one column per active TICKETS stage (empty columns kept).
// Each complaint is bucketed by the stage that maps its status (preferring the
// default, else the lowest position), falling back to the first stage so no card
// is silently dropped. Column placement is cosmetic — allowedTransitions derive
// from the card's real status, so the backend state machine stays authoritative.
export function buildComplaintBoard(
  stages: ComplaintBoardStageRecord[],
  cards: ComplaintQueueItemDto[],
  transitionsFor: (card: ComplaintQueueItemDto) => ComplaintBoardTransitionDto[],
): ComplaintBoardResponseDto {
  const stageByStatus = new Map<ComplaintStatus, string>();
  for (const stage of stages) {
    if (!stage.mappedComplaintStatus) continue;
    if (stage.isDefault || !stageByStatus.has(stage.mappedComplaintStatus)) stageByStatus.set(stage.mappedComplaintStatus, stage.id);
  }
  const fallbackStageId = stages[0]?.id ?? null;

  const grouped = new Map<string, ComplaintBoardCardDto[]>();
  for (const stage of stages) grouped.set(stage.id, []);
  for (const card of cards) {
    const stageId = stageByStatus.get(card.status) ?? fallbackStageId;
    if (stageId) grouped.get(stageId)!.push({ ...card, stageId, allowedTransitions: transitionsFor(card) });
  }

  return {
    stages: stages.map(toStageDto),
    columns: stages.map((stage) => ({ stageId: stage.id, cards: grouped.get(stage.id) ?? [] })),
  };
}

function toStageDto(stage: ComplaintBoardStageRecord): ComplaintBoardStageDto {
  return { id: stage.id, code: stage.code, nameEn: stage.nameEn, nameAr: stage.nameAr, color: stage.color, position: stage.position, mappedComplaintStatus: stage.mappedComplaintStatus };
}

// ── Department board projection ──

export function buildComplaintBoardByDepartment(
  departments: { id: string; code: string; nameEn: string; nameAr: string }[],
  cards: ComplaintQueueItemDto[],
  transitionsFor: (card: ComplaintQueueItemDto) => ComplaintBoardTransitionDto[],
): ComplaintBoardResponseDto {
  // Map departments to the ComplaintBoardStageDto shape for the frontend
  const stages: ComplaintBoardStageDto[] = departments.map((dept, index) => ({
    id: dept.id,
    code: dept.code,
    nameEn: dept.nameEn,
    nameAr: dept.nameAr,
    color: getDepartmentColor(dept.code),
    position: index,
    mappedComplaintStatus: null,
  }));

  // Add an "Unassigned" pseudo-department column at the end
  const unassignedId = 'UNASSIGNED_DEPT';
  stages.push({
    id: unassignedId,
    code: 'UNASSIGNED',
    nameEn: 'Unassigned',
    nameAr: 'غير مكلف بقسم',
    color: 'bg-surface-raised text-content-muted',
    position: stages.length,
    mappedComplaintStatus: null,
  });

  const grouped = new Map<string, ComplaintBoardCardDto[]>();
  for (const stage of stages) grouped.set(stage.id, []);

  for (const card of cards) {
    const stageId = card.assignedDepartmentId && grouped.has(card.assignedDepartmentId)
      ? card.assignedDepartmentId
      : unassignedId;
    grouped.get(stageId)!.push({ ...card, stageId, allowedTransitions: transitionsFor(card) });
  }

  const activeStages = stages.filter(stage => grouped.get(stage.id)!.length > 0);

  return {
    stages: activeStages,
    columns: activeStages.map((stage) => ({ stageId: stage.id, cards: grouped.get(stage.id) ?? [] })),
  };
}

function getDepartmentColor(code: string): string {
  // Matches CSS variables in globals.css for department colors
  switch (code) {
    case 'SALES': return 'var(--dept-sales)';
    case 'SERVICE': return 'var(--dept-service)';
    case 'PARTS': return 'var(--dept-parts)';
    case 'BODY_PAINT': return 'var(--dept-body-paint)';
    case 'FINANCE': return 'var(--dept-finance)';
    case 'CUSTOMER_CARE': return 'var(--dept-customer-care)';
    default: return 'var(--stage-slate)';
  }
}

export function buildComplaintBoardByBranch(
  branches: { id: string; code: string; nameEn: string; nameAr: string }[],
  cards: ComplaintQueueItemDto[],
  transitionsFor: (card: ComplaintQueueItemDto) => ComplaintBoardTransitionDto[],
): ComplaintBoardResponseDto {
  const stages: ComplaintBoardStageDto[] = branches.map((b, index) => ({
    id: b.id,
    code: b.code,
    nameEn: b.nameEn,
    nameAr: b.nameAr,
    color: 'var(--stage-slate)',
    position: index,
    mappedComplaintStatus: null,
  }));

  const grouped = new Map<string, ComplaintBoardCardDto[]>();
  for (const stage of stages) grouped.set(stage.id, []);

  for (const card of cards) {
    const stageId = card.branchId && grouped.has(card.branchId) ? card.branchId : null;
    if (stageId) {
      grouped.get(stageId)!.push({ ...card, stageId, allowedTransitions: transitionsFor(card) });
    }
  }

  const activeStages = stages.filter(stage => grouped.get(stage.id)!.length > 0);

  return {
    stages: activeStages,
    columns: activeStages.map((stage) => ({ stageId: stage.id, cards: grouped.get(stage.id) ?? [] })),
  };
}

export function buildComplaintBoardByCategory(
  categories: { id: string; code: string; nameEn: string; nameAr: string }[],
  cards: ComplaintQueueItemDto[],
  transitionsFor: (card: ComplaintQueueItemDto) => ComplaintBoardTransitionDto[],
): ComplaintBoardResponseDto {
  const stages: ComplaintBoardStageDto[] = categories.map((c, index) => ({
    id: c.id,
    code: c.code,
    nameEn: c.nameEn,
    nameAr: c.nameAr,
    color: 'var(--stage-slate)',
    position: index,
    mappedComplaintStatus: null,
  }));

  const grouped = new Map<string, ComplaintBoardCardDto[]>();
  for (const stage of stages) grouped.set(stage.id, []);

  for (const card of cards) {
    const stageId = card.categoryId && grouped.has(card.categoryId) ? card.categoryId : null;
    if (stageId) {
      grouped.get(stageId)!.push({ ...card, stageId, allowedTransitions: transitionsFor(card) });
    }
  }

  const activeStages = stages.filter(stage => grouped.get(stage.id)!.length > 0);

  return {
    stages: activeStages,
    columns: activeStages.map((stage) => ({ stageId: stage.id, cards: grouped.get(stage.id) ?? [] })),
  };
}

