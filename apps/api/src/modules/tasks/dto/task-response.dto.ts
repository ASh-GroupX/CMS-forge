import type { TaskConfidentialityLevel, TaskLinkEntityType, TaskParticipantRole, TaskStatus, TaskVisibility } from '@prisma/client';

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

export type TaskParticipantDto = { userId: string; role: TaskParticipantRole; name: string | null; nameAr: string | null };
export type TaskCapabilitiesDto = { canComment: boolean; canManage: boolean; canManageWatchers: boolean };

export class TaskResponseDto {
  id!: string;
  title!: string;
  ownerId!: string;
  ownerName?: string | null;
  assigneeId!: string | null;
  assigneeName?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  displayTimeZone!: string;
  dueAt!: string;
  status!: TaskStatus;
  assignedDepartmentId?: string | null;
  assignedDepartmentName?: string | null;
  assignedDepartmentNameAr?: string | null;
  nextAction!: TaskNextActionDto | null;
  isCustomerPromise!: boolean;
  visibility!: TaskVisibility;
  confidentialityLevel!: TaskConfidentialityLevel;
  links!: TaskLinkDto[];
  participantUserIds!: string[];
  participants!: TaskParticipantDto[];
  capabilities?: TaskCapabilitiesDto;
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
  authorNameAr?: string | null;
  body: string;
  mentions: { userId: string; name: string | null; nameAr: string | null; source: string; sourceLabel: string }[];
  createdAt: string;
};

export type TaskCommentsResponseDto = {
  comments: TaskCommentResponseDto[];
};

export type ManagerRollupCountDto = {
  assigneeId: string;
  assigneeName?: string | null;
  assignmentType?: 'USER' | 'DEPARTMENT';
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

export type ManagerTaskDetailDto = {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  assignedDepartmentId: string | null;
  assignedDepartmentName: string | null;
  branchId: string | null;
  branchName: string | null;
  displayTimeZone: string;
  dueAt: string;
  status: TaskStatus;
  nextAction: TaskNextActionDto | null;
  isCustomerPromise: boolean;
  links: TaskLinkDto[];
  stuckReasons: ('NEXT_ACTION_OVERDUE' | 'NO_MOVEMENT')[];
  createdAt: string;
  updatedAt: string;
  capabilities: { canOpenInteractive: boolean };
};

export type ManagerTaskDetailResponseDto = { task: ManagerTaskDetailDto };

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
