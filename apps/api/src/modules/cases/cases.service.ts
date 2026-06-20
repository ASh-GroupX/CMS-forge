import { HttpStatus, Injectable } from '@nestjs/common';
import { CaseLinkEntityType, CaseType, ComplaintStatus, TaskLinkEntityType } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { CaseResponseDto, CaseTimelineResponseDto, TaskCaseLinkDto } from './dto/case-response.dto.js';
import { CasesRepository } from './cases.repository.js';
import type { CaseRecord } from './cases.repository.js';

export type CreateCaseDraftInput = {
  branchId: string;
  ownerId?: string | null;
  subject: string;
  descriptionEn: string;
  descriptionAr?: string | null;
  links: { entityType: CaseLinkEntityType; entityId: string }[];
};

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
    return {
      case: response,
      taskLink: this.taskLinkForCase(record.id),
      events: [
        { type: 'CASE_CREATED', occurredAt: response.createdAt },
        ...record.links.map((link) => ({
          type: 'CASE_LINKED' as const,
          occurredAt: link.createdAt.toISOString(),
          entityType: link.entityType,
          entityId: link.entityId,
        })),
      ],
    };
  }

  taskLinkForCase(caseId: string): TaskCaseLinkDto {
    return { entityType: TaskLinkEntityType.CASE, entityId: requiredText(caseId, 'caseId') };
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

function requiredText(value: string, field: string): string {
  const text = value.trim();
  if (!text) throw invalid(field);
  return text;
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
