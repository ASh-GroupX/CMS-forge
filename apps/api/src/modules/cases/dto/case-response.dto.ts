import type { CapaActionStatus, CaseConfidentialityLevel, CaseLifecycleStatus, CaseLinkEntityType, CaseType, ComplaintStatus, TaskLinkEntityType } from '@prisma/client';

export type CaseLinkDto = {
  entityType: CaseLinkEntityType;
  entityId: string;
};

export class CaseResponseDto {
  id!: string;
  type!: CaseType;
  status!: ComplaintStatus;
  lifecycleStatus!: CaseLifecycleStatus;
  confidentialityLevel!: CaseConfidentialityLevel;
  branchId!: string;
  branchName!: string;
  ownerId!: string | null;
  ownerName!: string | null;
  subject!: string;
  descriptionEn!: string;
  descriptionAr!: string | null;
  links!: CaseLinkDto[];
  createdAt!: string;
  updatedAt!: string;
}

export type CapaActionDto = {
  id: string;
  caseId: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  ownerId: string;
  ownerName: string;
  dueAt: string;
  status: CapaActionStatus;
  createdAt: string;
  updatedAt: string;
};

export type CaseRepeatIssueDto = {
  isRepeat: boolean;
  rootCauses: string[];
};

export type CaseRestrictedNoteDto = {
  id: string;
  authorId: string | null;
  body: string;
  createdAt: string;
};

export type CaseTimelineEventDto = {
  type: 'CASE_CREATED' | 'CASE_LINKED' | 'CASE_LIFECYCLE' | 'COMPLAINT_STATUS' | 'CAPA_ACTION_CREATED';
  occurredAt: string;
  entityType?: CaseLinkEntityType;
  entityId?: string;
  fromStatus?: string | null;
  toStatus?: string;
  action?: string | null;
  capaActionId?: string;
};

export type TaskCaseLinkDto = {
  entityType: TaskLinkEntityType;
  entityId: string;
};

export type CaseTimelineResponseDto = {
  case: CaseResponseDto;
  taskLink: TaskCaseLinkDto;
  capaActions: CapaActionDto[];
  restrictedNotes: CaseRestrictedNoteDto[];
  repeatIssue: CaseRepeatIssueDto;
  events: CaseTimelineEventDto[];
};
