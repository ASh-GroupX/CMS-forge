import type { ComplaintStatus, ComplaintTransitionAction } from '@prisma/client';
import type { ComplaintQueueItemDto } from './complaint-response.dto.js';

// Ticket board (Kanban) read contract — docs/CMSS_REVAMP_PLAN.md B4.
// The server returns one column per active TICKETS stage plus the session-scoped
// complaints distributed into those columns by their mapped status. Each card
// carries the workflow transitions the actor may fire from its current status —
// derived on the backend so React never decides complaint state; a drop onto a
// column runs the matching transition through POST /complaints/:id/transitions.

export type ComplaintBoardStageDto = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  color: string;
  position: number;
  mappedComplaintStatus: ComplaintStatus | null;
};

// action → the status the card would enter; lets the UI grey illegal columns and
// map a drop to the right transition without reconstructing the state machine.
export type ComplaintBoardTransitionDto = {
  action: ComplaintTransitionAction;
  toStatus: ComplaintStatus;
};

export type ComplaintBoardCardDto = ComplaintQueueItemDto & {
  stageId: string;
  allowedTransitions: ComplaintBoardTransitionDto[];
};

export type ComplaintBoardColumnDto = {
  stageId: string;
  cards: ComplaintBoardCardDto[];
};

export type ComplaintBoardResponseDto = {
  stages: ComplaintBoardStageDto[];
  columns: ComplaintBoardColumnDto[];
};
