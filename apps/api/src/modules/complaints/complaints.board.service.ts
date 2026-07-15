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

export type ComplaintBoardActor = { userId: string | null; roleCode: RoleCode; branchId: string | null };

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
      this.complaintsService.listQueue({ branchId: actor.branchId, role: actor.roleCode }),
    ]);
    return buildComplaintBoard(stages, recentQueue(queue, now), (card) => allowedTransitionsFor(this.complaintsService, card, actor));
  }
}

// Per-card allowed transitions: the actor's permitted actions (role + owner rules
// enforced by ComplaintsService), each tagged with its target status.
function allowedTransitionsFor(service: ComplaintsService, card: ComplaintQueueItemDto, actor: ComplaintBoardActor): ComplaintBoardTransitionDto[] {
  return service
    .allowedActionsFor(card, { roleCode: actor.roleCode, userId: actor.userId })
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
