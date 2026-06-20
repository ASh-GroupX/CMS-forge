import type { TaskConfidentialityLevel, TaskLinkEntityType, TaskStatus, TaskVisibility } from '@prisma/client';

export type TaskNextActionDto = {
  what: string;
  whoId: string;
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
  assigneeId!: string;
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
  dueToday: TaskResponseDto[];
  overdue: TaskResponseDto[];
  overduePromises: TaskResponseDto[];
  assignedToMe: TaskResponseDto[];
  waitingOnMe: TaskResponseDto[];
};

export type ManagerRollupCountDto = {
  assigneeId: string;
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
