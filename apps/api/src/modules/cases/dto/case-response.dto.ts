import type { CaseConfidentialityLevel, CaseLifecycleStatus, CaseLinkEntityType, CaseType, ComplaintStatus, TaskLinkEntityType } from '@prisma/client';

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
  ownerId!: string | null;
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
  responsibleDepartmentId: string;
  correctiveAction: string;
  preventiveAction: string;
  dueAt: string;
  effectivenessCheck: string | null;
  repeatFlag: boolean;
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
  type: 'CASE_CREATED' | 'CASE_LINKED' | 'CAPA_ACTION_CREATED';
  occurredAt: string;
  entityType?: CaseLinkEntityType;
  entityId?: string;
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
