import type { TaskConfidentialityLevel, TaskStatus, TaskVisibility } from '@prisma/client';

// Task board (Kanban) read contract — docs/CMSS_REVAMP_PLAN.md A2.
// The server returns one column per active TASKS stage plus the session-scoped
// cards distributed into those columns; the frontend never filters for privacy.

export type BoardStageDto = {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  color: string;
  position: number;
  mappedTaskStatus: TaskStatus | null;
};

export type BoardCardDueState = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';

export type BoardDepartmentDto = { id: string; nameEn: string; nameAr: string };

export type BoardCardDto = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string | null;
  ownerNameAr: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeNameAr: string | null;
  assignedDepartmentId: string | null;
  departmentName: string | null;
  departmentNameAr: string | null;
  branchId: string | null;
  dueAt: string;
  status: TaskStatus;
  stageId: string;
  boardPosition: number;
  isCustomerPromise: boolean;
  visibility: TaskVisibility;
  confidentialityLevel: TaskConfidentialityLevel;
  daysActive: number;
  dueState: BoardCardDueState | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BoardColumnDto = {
  stageId: string;
  cards: BoardCardDto[];
};

export type TaskBoardResponseDto = {
  stages: BoardStageDto[];
  columns: BoardColumnDto[];
  // Active departments for the board's assignment control (reference data, no PII).
  departments: BoardDepartmentDto[];
};

export type MoveTaskResponseDto = {
  card: BoardCardDto;
};
