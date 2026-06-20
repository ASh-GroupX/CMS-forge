import { HttpStatus, Injectable } from '@nestjs/common';
import { CaseConfidentialityLevel, CaseLifecycleStatus, CaseLinkEntityType, CaseParticipantRole, CaseType, ComplaintStatus, TaskLinkEntityType } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { CapaActionDto, CaseRepeatIssueDto, CaseRestrictedNoteDto, CaseResponseDto, CaseTimelineResponseDto, TaskCaseLinkDto } from './dto/case-response.dto.js';
import { assertCanReadCase, assertLifecycle, caseAudit } from './cases.policy.js';
import type { CaseReadActor, CaseReadAudit } from './cases.policy.js';
import { CasesRepository } from './cases.repository.js';
import type { CapaActionRecord, CaseRecord } from './cases.repository.js';

export type CreateCaseDraftInput = {
  branchId: string;
  ownerId?: string | null;
  subject: string;
  descriptionEn: string;
  descriptionAr?: string | null;
  confidentialityLevel?: CaseConfidentialityLevel;
  links: { entityType: CaseLinkEntityType; entityId: string }[];
  participants?: { userId: string; role: CaseParticipantRole }[];
};
export type CreateEmployeeGrievanceInput = Omit<CreateCaseDraftInput, 'confidentialityLevel' | 'links'> & {
  employeeUserId: string;
  links?: { entityType: CaseLinkEntityType; entityId: string }[];
};

export type CreateCapaActionInput = {
  caseId: string;
  rootCause: string;
  responsibleDepartmentId: string;
  correctiveAction: string;
  preventiveAction: string;
  dueAt: Date | string;
  effectivenessCheck?: string | null;
  repeatFlag?: boolean;
};

export type CapaActionResponse = CapaActionDto;
export type UpdateEmployeeGrievanceLifecycleInput = { caseId: string; toStatus: CaseLifecycleStatus };

@Injectable()
export class CasesService {
  constructor(
    private readonly casesRepository: CasesRepository,
    private readonly auditService?: AuditService,
  ) {}

  async createDraft(input: CreateCaseDraftInput): Promise<CaseResponseDto> {
    const links = normalizeLinks(input.links);
    return toResponse(await this.casesRepository.create({
      type: CaseType.CUSTOMER_COMPLAINT,
      status: ComplaintStatus.DRAFT,
      lifecycleStatus: CaseLifecycleStatus.DRAFT,
      confidentialityLevel: input.confidentialityLevel ?? CaseConfidentialityLevel.NORMAL,
      branchId: requiredText(input.branchId, 'branchId'),
      ownerId: input.ownerId ? requiredText(input.ownerId, 'ownerId') : null,
      subject: requiredText(input.subject, 'subject'),
      descriptionEn: requiredText(input.descriptionEn, 'descriptionEn'),
      descriptionAr: input.descriptionAr?.trim() || null,
      links,
      participants: normalizeParticipants(input.participants ?? []),
    }));
  }

  async createEmployeeGrievance(input: CreateEmployeeGrievanceInput): Promise<CaseResponseDto> {
    const links = normalizeLinks([
      { entityType: CaseLinkEntityType.EMPLOYEE, entityId: requiredText(input.employeeUserId, 'employeeUserId') },
      ...(input.links ?? []),
    ]);
    return toResponse(await this.casesRepository.create({
      type: CaseType.EMPLOYEE_GRIEVANCE,
      status: ComplaintStatus.IN_PROGRESS,
      lifecycleStatus: CaseLifecycleStatus.HR_REVIEW,
      confidentialityLevel: CaseConfidentialityLevel.CONFIDENTIAL,
      branchId: requiredText(input.branchId, 'branchId'),
      ownerId: input.ownerId ? requiredText(input.ownerId, 'ownerId') : null,
      subject: requiredText(input.subject, 'subject'),
      descriptionEn: requiredText(input.descriptionEn, 'descriptionEn'),
      descriptionAr: input.descriptionAr?.trim() || null,
      links,
      participants: normalizeParticipants(input.participants ?? []),
    }));
  }

  async timeline(caseId: string): Promise<CaseTimelineResponseDto> {
    const record = await this.casesRepository.findById(requiredText(caseId, 'caseId'));
    if (!record) throw new AppException('CASE_NOT_FOUND', 'Case was not found', HttpStatus.NOT_FOUND);
    return this.timelineFromRecord(record, false);
  }

  async timelineForActor(caseId: string, actor: CaseReadActor, audit: CaseReadAudit = {}): Promise<CaseTimelineResponseDto> {
    const record = await this.casesRepository.findById(requiredText(caseId, 'caseId'));
    if (!record) throw new AppException('CASE_NOT_FOUND', 'Case was not found', HttpStatus.NOT_FOUND);
    await assertCanReadCase(record, actor, audit, this.auditService);
    return this.timelineFromRecord(record, true);
  }

  async updateEmployeeGrievanceLifecycle(input: UpdateEmployeeGrievanceLifecycleInput, actor: CaseReadActor, audit: CaseReadAudit = {}): Promise<CaseResponseDto> {
    return this.casesRepository.transaction(async (client) => {
      const record = await this.casesRepository.findByIdInTransaction(requiredText(input.caseId, 'caseId'), client);
      if (!record) throw new AppException('CASE_NOT_FOUND', 'Case was not found', HttpStatus.NOT_FOUND);
      if (record.type !== CaseType.EMPLOYEE_GRIEVANCE) throw invalid('caseId');
      await assertCanReadCase(record, actor, audit, this.auditService);
      assertLifecycle(record.lifecycleStatus, input.toStatus);
      const updated = await this.casesRepository.updateLifecycleStatus({
        id: record.id,
        fromStatus: record.lifecycleStatus,
        toStatus: input.toStatus,
        actorId: actor.userId,
        correlationId: audit.correlationId ?? null,
      }, client);
      await this.auditService?.record(caseAudit('case_lifecycle_updated', updated, actor, audit, { fromStatus: record.lifecycleStatus, toStatus: input.toStatus }), client);
      return toResponse(updated);
    });
  }

  taskLinkForCase(caseId: string): TaskCaseLinkDto {
    return { entityType: TaskLinkEntityType.CASE, entityId: requiredText(caseId, 'caseId') };
  }

  async createCapaAction(input: CreateCapaActionInput): Promise<CapaActionResponse> {
    return toCapaResponse(await this.casesRepository.createCapaAction({
      caseId: requiredText(input.caseId, 'caseId'),
      rootCause: requiredText(input.rootCause, 'rootCause'),
      responsibleDepartmentId: requiredText(input.responsibleDepartmentId, 'responsibleDepartmentId'),
      correctiveAction: requiredText(input.correctiveAction, 'correctiveAction'),
      preventiveAction: requiredText(input.preventiveAction, 'preventiveAction'),
      dueAt: validDate(input.dueAt, 'dueAt'),
      effectivenessCheck: optionalText(input.effectivenessCheck),
      repeatFlag: input.repeatFlag ?? false,
    }));
  }

  async listCapaActions(caseId: string): Promise<CapaActionResponse[]> {
    return (await this.casesRepository.listCapaActions(requiredText(caseId, 'caseId'))).map(toCapaResponse);
  }

  private async repeatIssue(record: CaseRecord): Promise<CaseRepeatIssueDto> {
    const rootCauses = unique(record.capaActions.map((action) => action.rootCause));
    if (record.capaActions.some((action) => action.repeatFlag)) return { isRepeat: true, rootCauses };
    const customerIds = record.links
      .filter((link) => link.entityType === CaseLinkEntityType.CUSTOMER)
      .map((link) => link.entityId);
    const repeatCount = await this.casesRepository.countRepeatCustomerRootCause({ caseId: record.id, customerIds, rootCauses });
    return { isRepeat: repeatCount > 0, rootCauses };
  }

  private async timelineFromRecord(record: CaseRecord, includeRestrictedNotes: boolean): Promise<CaseTimelineResponseDto> {
    const response = toResponse(record);
    const capaActions = record.capaActions.map(toCapaResponse);
    return {
      case: response,
      taskLink: this.taskLinkForCase(record.id),
      capaActions,
      restrictedNotes: includeRestrictedNotes ? record.restrictedNotes.map(toRestrictedNoteResponse) : [],
      repeatIssue: await this.repeatIssue(record),
      events: [
        { type: 'CASE_CREATED', occurredAt: response.createdAt },
        ...record.links.map((link) => ({
          type: 'CASE_LINKED' as const,
          occurredAt: link.createdAt.toISOString(),
          entityType: link.entityType,
          entityId: link.entityId,
        })),
        ...capaActions.map((action) => ({
          type: 'CAPA_ACTION_CREATED' as const,
          occurredAt: action.createdAt,
          capaActionId: action.id,
        })),
      ],
    };
  }

}

function normalizeLinks(input: { entityType: CaseLinkEntityType; entityId: string }[]) {
  if (!input.length) throw invalid('links');
  return input.map((link) => ({
    entityType: validEnum(link.entityType, CaseLinkEntityType, 'links.entityType'),
    entityId: requiredText(link.entityId, 'links.entityId'),
  }));
}

function normalizeParticipants(input: { userId: string; role: CaseParticipantRole }[]) {
  return input.map((participant) => ({
    userId: requiredText(participant.userId, 'participants.userId'),
    role: validEnum(participant.role, CaseParticipantRole, 'participants.role'),
  }));
}

function toResponse(record: CaseRecord): CaseResponseDto {
  return {
    id: record.id,
    type: record.type,
    status: record.status,
    lifecycleStatus: record.lifecycleStatus,
    confidentialityLevel: record.confidentialityLevel,
    branchId: record.branchId,
    ownerId: record.ownerId,
    subject: record.subject,
    descriptionEn: record.descriptionEn,
    descriptionAr: record.descriptionAr,
    links: record.links.map((link) => ({ entityType: link.entityType, entityId: link.entityId })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toRestrictedNoteResponse(record: CaseRecord['restrictedNotes'][number]): CaseRestrictedNoteDto {
  return { id: record.id, authorId: record.authorId, body: record.body, createdAt: record.createdAt.toISOString() };
}

function toCapaResponse(record: CapaActionRecord): CapaActionResponse {
  return {
    id: record.id,
    caseId: record.caseId,
    rootCause: record.rootCause,
    responsibleDepartmentId: record.responsibleDepartmentId,
    correctiveAction: record.correctiveAction,
    preventiveAction: record.preventiveAction,
    dueAt: record.dueAt.toISOString(),
    effectivenessCheck: record.effectivenessCheck,
    repeatFlag: record.repeatFlag,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function requiredText(value: string, field: string): string {
  const text = value.trim();
  if (!text) throw invalid(field);
  return text;
}

function optionalText(value: string | null | undefined): string | null {
  const text = value?.trim() ?? '';
  return text || null;
}

function validDate(value: Date | string, field: string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw invalid(field);
  return date;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function validEnum<T extends Record<string, string>>(value: string, options: T, field: string): T[keyof T] {
  if (!Object.values(options).includes(value)) throw invalid(field);
  return value as T[keyof T];
}


function invalid(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid case request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}
