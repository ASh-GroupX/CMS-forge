import type { CaseLinkEntityType, CaseType, ComplaintStatus, TaskLinkEntityType } from '@prisma/client';

export type CaseLinkDto = {
  entityType: CaseLinkEntityType;
  entityId: string;
};

export class CaseResponseDto {
  id!: string;
  type!: CaseType;
  status!: ComplaintStatus;
  branchId!: string;
  ownerId!: string | null;
  subject!: string;
  descriptionEn!: string;
  descriptionAr!: string | null;
  links!: CaseLinkDto[];
  createdAt!: string;
  updatedAt!: string;
}

export type CaseTimelineEventDto = {
  type: 'CASE_CREATED' | 'CASE_LINKED';
  occurredAt: string;
  entityType?: CaseLinkEntityType;
  entityId?: string;
};

export type TaskCaseLinkDto = {
  entityType: TaskLinkEntityType;
  entityId: string;
};

export type CaseTimelineResponseDto = {
  case: CaseResponseDto;
  taskLink: TaskCaseLinkDto;
  events: CaseTimelineEventDto[];
};
