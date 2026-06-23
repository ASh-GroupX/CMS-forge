import type { TaskConfidentialityLevel, TaskLinkEntityType, TaskStatus, TaskVisibility } from '@prisma/client';

export type TaskNextActionDto = {
  what: string;
  whoId: string;
  whoName?: string | null;
  when: string;
};

export type TaskLinkDto = {
  entityType: TaskLinkEntityType;
  entityId: string;
};

export class TaskResponseDto {
  id!: string;
  title!: string;
  ownerId!: string;
  ownerName?: string | null;
  assigneeId!: string;
  assigneeName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  dueAt!: string;
  status!: TaskStatus;
  nextAction!: TaskNextActionDto | null;
  isCustomerPromise!: boolean;
  visibility!: TaskVisibility;
  confidentialityLevel!: TaskConfidentialityLevel;
  links!: TaskLinkDto[];
  participantUserIds!: string[];
  createdAt!: string;
  updatedAt!: string;
}

export type EmployeeTodayResponseDto = {
  completed: TaskResponseDto[];
  dueToday: TaskResponseDto[];
  overdue: TaskResponseDto[];
  overduePromises: TaskResponseDto[];
  assignedToMe: TaskResponseDto[];
  waitingOnMe: TaskResponseDto[];
};

export type SentTasksResponseDto = {
  tasks: TaskResponseDto[];
};

export type TaskCommentResponseDto = {
  id: string;
  taskId: string;
  authorId: string;
  authorName?: string | null;
  body: string;
  createdAt: string;
};

export type TaskCommentsResponseDto = {
  comments: TaskCommentResponseDto[];
};

export type ManagerRollupCountDto = {
  assigneeId: string;
  assigneeName?: string | null;
  count: number;
};

export type ManagerStuckTaskDto = TaskResponseDto & {
  stuckReasons: ('NEXT_ACTION_OVERDUE' | 'NO_MOVEMENT')[];
};

export type ManagerControlRoomResponseDto = {
  overdueByEmployee: ManagerRollupCountDto[];
  dueToday: TaskResponseDto[];
  overduePromises: TaskResponseDto[];
  stuck: ManagerStuckTaskDto[];
  workloadByAssignee: ManagerRollupCountDto[];
  escalated: TaskResponseDto[];
  promiseKpi: {
    openPromiseCount: number;
    overduePromiseCount: number;
  };
};

export type PromiseTrackerTaskDto = TaskResponseDto & {
  customerLabel?: string | null;
  dealLabel?: string | null;
  keptOnTime?: boolean | null;
};

export type PromiseTrackerResponseDto = {
  openPromiseCount: number;
  overduePromiseCount: number;
  keptOnTimePercent: number;
  promises: PromiseTrackerTaskDto[];
};
