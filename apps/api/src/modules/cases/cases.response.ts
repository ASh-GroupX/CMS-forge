import type { CapaActionDto, CaseResponseDto, CaseRestrictedNoteDto } from './dto/case-response.dto.js';
import type { CapaActionRecord, CaseRecord } from './cases.repository.js';

export function toCaseResponse(record: CaseRecord): CaseResponseDto {
  return {
    id: record.id,
    type: record.type,
    status: record.status,
    lifecycleStatus: record.lifecycleStatus,
    confidentialityLevel: record.confidentialityLevel,
    branchId: record.branchId,
    branchName: record.branch.nameEn,
    ownerId: record.ownerId,
    ownerName: record.owner?.nameEn ?? null,
    subject: record.subject,
    descriptionEn: record.descriptionEn,
    descriptionAr: record.descriptionAr,
    links: record.links.map((link) => ({ entityType: link.entityType, entityId: link.entityId })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toRestrictedNoteResponse(record: CaseRecord['restrictedNotes'][number]): CaseRestrictedNoteDto {
  return { id: record.id, authorId: record.authorId, body: record.body, createdAt: record.createdAt.toISOString() };
}

export function toCapaResponse(record: CapaActionRecord): CapaActionDto {
  return {
    id: record.id,
    caseId: record.caseId,
    rootCause: record.rootCause,
    correctiveAction: record.correctiveAction,
    preventiveAction: record.preventiveAction,
    ownerId: record.ownerId,
    ownerName: record.owner.nameEn,
    dueAt: record.dueAt.toISOString(),
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
