import { HttpStatus, Injectable } from '@nestjs/common';
import { CapaActionStatus, CaseConfidentialityLevel, CaseLifecycleStatus, CaseLinkEntityType, CaseParticipantRole, CaseType, ComplaintStatus, RoleCode, TaskLinkEntityType } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { CapaActionDto, CaseRepeatIssueDto, CaseResponseDto, CaseTimelineResponseDto, TaskCaseLinkDto } from './dto/case-response.dto.js';
import { assertCanReadCase, assertLifecycle, caseAudit } from './cases.policy.js';
import type { CaseReadActor, CaseReadAudit } from './cases.policy.js';
import { CasesRepository } from './cases.repository.js';
import type { CapaActionRecord, CaseRecord } from './cases.repository.js';
import { toCapaResponse, toCaseResponse, toRestrictedNoteResponse } from './cases.response.js';

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
export type EnsureCustomerComplaintCaseInput = {
  complaintId: string;
  branchId: string;
  ownerId?: string | null;
  subject: string;
  descriptionEn: string;
  status: ComplaintStatus;
  actorId?: string | null;
  correlationId?: string | null;
};

export type CreateCapaActionInput = {
  caseId: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  dueAt: Date | string;
  status?: CapaActionStatus;
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
    return toCaseResponse(await this.casesRepository.create({
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
    return toCaseResponse(await this.casesRepository.create({
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

  async ensureCustomerComplaintCaseForComplaint(input: EnsureCustomerComplaintCaseInput, client: Prisma.TransactionClient): Promise<CaseResponseDto> {
    const complaintId = requiredText(input.complaintId, 'complaintId');
    const existing = await this.casesRepository.findCustomerComplaintByComplaintId(complaintId, client);
    if (existing) return toCaseResponse(existing);
    const created = await this.casesRepository.create({
      type: CaseType.CUSTOMER_COMPLAINT,
      status: input.status,
      lifecycleStatus: CaseLifecycleStatus.DRAFT,
      confidentialityLevel: CaseConfidentialityLevel.NORMAL,
      branchId: requiredText(input.branchId, 'branchId'),
      ownerId: input.ownerId ? requiredText(input.ownerId, 'ownerId') : null,
      subject: requiredText(input.subject, 'subject'),
      descriptionEn: requiredText(input.descriptionEn, 'descriptionEn'),
      links: [{ entityType: CaseLinkEntityType.COMPLAINT, entityId: complaintId }],
      participants: [],
    }, client);
    await this.casesRepository.createInitialLifecycleHistory({ caseId: created.id, toStatus: created.lifecycleStatus, actorId: input.actorId ?? null, correlationId: input.correlationId ?? null }, client);
    await this.auditService?.record({
      eventType: 'WORKFLOW',
      action: 'case_created_from_complaint',
      actorId: input.actorId ?? null,
      branchId: created.branchId,
      targetType: 'case',
      targetId: created.id,
      correlationId: input.correlationId ?? null,
      metadata: { complaintId, type: created.type, status: created.status, lifecycleStatus: created.lifecycleStatus },
    }, client);
    return toCaseResponse(created);
  }

  async customerComplaintCaseSummary(complaintId: string): Promise<CaseResponseDto | null> {
    const record = await this.casesRepository.findCustomerComplaintByComplaintId(requiredText(complaintId, 'complaintId'));
    return record ? toCaseResponse(record) : null;
  }

  async timeline(caseId: string): Promise<CaseTimelineResponseDto> {
    const record = await this.casesRepository.findById(requiredText(caseId, 'caseId'));
    if (!record) throw new AppException('CASE_NOT_FOUND', 'Case was not found', HttpStatus.NOT_FOUND);
    return this.timelineFromRecord(record, false);
  }

  async timelineForActor(caseId: string, actor: CaseReadActor, audit: CaseReadAudit = {}, includeRestrictedNotes = true): Promise<CaseTimelineResponseDto> {
    const record = await this.casesRepository.findById(requiredText(caseId, 'caseId'));
    if (!record) throw new AppException('CASE_NOT_FOUND', 'Case was not found', HttpStatus.NOT_FOUND);
    await assertCanReadCase(record, actor, audit, this.auditService);
    return this.timelineFromRecord(record, includeRestrictedNotes);
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
      return toCaseResponse(updated);
    });
  }

  taskLinkForCase(caseId: string): TaskCaseLinkDto {
    return { entityType: TaskLinkEntityType.CASE, entityId: requiredText(caseId, 'caseId') };
  }

  async createCapaAction(input: CreateCapaActionInput, actor: CaseReadActor, audit: CaseReadAudit = {}): Promise<CapaActionResponse> {
    assertCanWriteCapa(actor);
    return this.casesRepository.transaction(async (client) => {
      const record = await this.casesRepository.findByIdInTransaction(requiredText(input.caseId, 'caseId'), client);
      if (!record) throw new AppException('CASE_NOT_FOUND', 'Case was not found', HttpStatus.NOT_FOUND);
      await assertCanReadCase(record, actor, audit, this.auditService);
      const created = await this.casesRepository.createCapaAction({
        caseId: record.id,
        ownerId: record.ownerId ?? actor.userId,
        rootCause: requiredText(input.rootCause, 'rootCause'),
        correctiveAction: requiredText(input.correctiveAction, 'correctiveAction'),
        preventiveAction: requiredText(input.preventiveAction, 'preventiveAction'),
        dueAt: validDate(input.dueAt, 'dueAt'),
        status: validEnum(input.status ?? CapaActionStatus.OPEN, CapaActionStatus, 'status'),
      }, client);
      await this.auditService?.record(caseAudit('case_capa_created', record, actor, audit, { capaActionId: created.id, status: created.status }), client);
      return toCapaResponse(created);
    });
  }

  async listCapaActionsForActor(caseId: string, actor: CaseReadActor, audit: CaseReadAudit = {}): Promise<CapaActionResponse[]> {
    const record = await this.casesRepository.findById(requiredText(caseId, 'caseId'));
    if (!record) throw new AppException('CASE_NOT_FOUND', 'Case was not found', HttpStatus.NOT_FOUND);
    await assertCanReadCase(record, actor, audit, this.auditService);
    return record.capaActions.map(toCapaResponse);
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
    const response = toCaseResponse(record);
    const capaActions = record.capaActions.map(toCapaResponse);
    const complaintIds = record.links.filter((link) => link.entityType === CaseLinkEntityType.COMPLAINT).map((link) => link.entityId);
    const complaintLifecycle = await this.casesRepository.listComplaintLifecycle?.(complaintIds) ?? [];
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
        ...record.lifecycleHistory.map((item) => ({
          type: 'CASE_LIFECYCLE' as const,
          occurredAt: item.createdAt.toISOString(),
          fromStatus: item.fromStatus,
          toStatus: item.toStatus,
        })),
        ...complaintLifecycle.map((item) => ({
          type: 'COMPLAINT_STATUS' as const,
          occurredAt: item.createdAt.toISOString(),
          entityType: CaseLinkEntityType.COMPLAINT,
          entityId: item.complaintId,
          fromStatus: item.fromStatus,
          toStatus: item.toStatus,
          action: item.action,
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

function requiredText(value: string, field: string): string {
  const text = value.trim();
  if (!text) throw invalid(field);
  return text;
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

function assertCanWriteCapa(actor: CaseReadActor): void {
  if (!capaWriteRoles.has(actor.role)) {
    throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }
}

const capaWriteRoles = new Set<RoleCode>([RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN]);

function invalid(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid case request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}
