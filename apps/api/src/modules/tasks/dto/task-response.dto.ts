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
  assignedToMe: TaskResponseDto[];
  waitingOnMe: TaskResponseDto[];
};
