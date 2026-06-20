import { HttpStatus, Injectable } from '@nestjs/common';
import { CaseLinkEntityType, CaseType, ComplaintStatus, TaskLinkEntityType } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { CapaActionDto, CaseRepeatIssueDto, CaseResponseDto, CaseTimelineResponseDto, TaskCaseLinkDto } from './dto/case-response.dto.js';
import { CasesRepository } from './cases.repository.js';
import type { CapaActionRecord, CaseRecord } from './cases.repository.js';

export type CreateCaseDraftInput = {
  branchId: string;
  ownerId?: string | null;
  subject: string;
  descriptionEn: string;
  descriptionAr?: string | null;
  links: { entityType: CaseLinkEntityType; entityId: string }[];
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

@Injectable()
export class CasesService {
  constructor(private readonly casesRepository: CasesRepository) {}

  async createDraft(input: CreateCaseDraftInput): Promise<CaseResponseDto> {
    const links = normalizeLinks(input.links);
    return toResponse(await this.casesRepository.create({
      type: CaseType.CUSTOMER_COMPLAINT,
      status: ComplaintStatus.DRAFT,
      branchId: requiredText(input.branchId, 'branchId'),
      ownerId: input.ownerId ? requiredText(input.ownerId, 'ownerId') : null,
      subject: requiredText(input.subject, 'subject'),
      descriptionEn: requiredText(input.descriptionEn, 'descriptionEn'),
      descriptionAr: input.descriptionAr?.trim() || null,
      links,
    }));
  }

  async timeline(caseId: string): Promise<CaseTimelineResponseDto> {
    const record = await this.casesRepository.findById(requiredText(caseId, 'caseId'));
    if (!record) throw new AppException('CASE_NOT_FOUND', 'Case was not found', HttpStatus.NOT_FOUND);
    const response = toResponse(record);
    const capaActions = record.capaActions.map(toCapaResponse);
    return {
      case: response,
      taskLink: this.taskLinkForCase(record.id),
      capaActions,
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
}

function normalizeLinks(input: { entityType: CaseLinkEntityType; entityId: string }[]) {
  if (!input.length) throw invalid('links');
  return input.map((link) => ({
    entityType: validEnum(link.entityType, CaseLinkEntityType, 'links.entityType'),
    entityId: requiredText(link.entityId, 'links.entityId'),
  }));
}

function toResponse(record: CaseRecord): CaseResponseDto {
  return {
    id: record.id,
    type: record.type,
    status: record.status,
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
