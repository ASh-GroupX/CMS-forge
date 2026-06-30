import { HttpStatus, Injectable } from '@nestjs/common';
import type { RoleCode } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { ComplaintRelationsRepository } from './complaint-relations.repository.js';
import type { ComplaintRelationFilter, ComplaintRelationItemRecord } from './complaint-relations.repository.js';
import type { ComplaintQueueItemDto } from './dto/complaint-response.dto.js';

export type ComplaintRelationAuditContext = {
  actorId?: string | null; actorRole?: RoleCode | null; sessionId?: string | null;
  correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null;
};
export type LinkComplaintInput = ComplaintRelationAuditContext & { sourceComplaintId: string; targetComplaintId: string; branchId?: string | null };
export type ComplaintRelationMutationResult = { sourceComplaintId: string; targetComplaintId: string; changed: boolean };
export type DuplicateCandidateResult = { items: ComplaintQueueItemDto[]; windowDays: number };

const DUPLICATE_WINDOW_DAYS = 30;

@Injectable()
export class ComplaintRelationsService {
  constructor(private readonly repository: ComplaintRelationsRepository, private readonly auditService: AuditService) {}

  async listRelated(complaintId: string, filter: ComplaintRelationFilter = {}): Promise<ComplaintQueueItemDto[]> {
    await this.visibleComplaint(complaintId, filter);
    return (await this.repository.listRelated(complaintId, filter)).map(queueItem);
  }

  async duplicateCandidates(complaintId: string, filter: ComplaintRelationFilter = {}): Promise<DuplicateCandidateResult> {
    const source = await this.visibleComplaint(complaintId, filter);
    return { items: (await this.repository.findDuplicateCandidates(source, DUPLICATE_WINDOW_DAYS)).map(queueItem), windowDays: DUPLICATE_WINDOW_DAYS };
  }

  async link(input: LinkComplaintInput): Promise<ComplaintRelationMutationResult> {
    if (input.sourceComplaintId === input.targetComplaintId) throw validationError('targetComplaintId');
    return this.repository.transaction(async (client) => {
      const source = await this.visibleComplaint(input.sourceComplaintId, input, client);
      await this.visibleComplaint(input.targetComplaintId, input, client);
      const changed = await this.repository.createRelation(input, client);
      if (changed) await this.auditService.record(relationAudit(input, source.branchId, 'link'), client);
      return { sourceComplaintId: input.sourceComplaintId, targetComplaintId: input.targetComplaintId, changed };
    });
  }

  async unlink(input: LinkComplaintInput): Promise<ComplaintRelationMutationResult> {
    return this.repository.transaction(async (client) => {
      const source = await this.visibleComplaint(input.sourceComplaintId, input, client);
      await this.visibleComplaint(input.targetComplaintId, input, client);
      const changed = await this.repository.deleteRelation(input, client);
      if (changed) await this.auditService.record(relationAudit(input, source.branchId, 'unlink'), client);
      return { sourceComplaintId: input.sourceComplaintId, targetComplaintId: input.targetComplaintId, changed };
    });
  }

  private async visibleComplaint(complaintId: string, filter: ComplaintRelationFilter, client?: Parameters<ComplaintRelationsRepository['findAnchor']>[2]) {
    const complaint = await this.repository.findAnchor(complaintId, filter, client);
    if (!complaint) throw new AppException('COMPLAINT_NOT_FOUND', 'Complaint not found', HttpStatus.NOT_FOUND);
    return complaint;
  }
}

function queueItem(complaint: ComplaintRelationItemRecord): ComplaintQueueItemDto {
  return { id: complaint.id, referenceNumber: complaint.referenceNumber, status: complaint.status, severity: complaint.severity, subject: complaint.subject, branchId: complaint.branchId, branchName: complaint.branch.nameEn, ownerId: complaint.ownerId, ownerName: complaint.owner?.nameEn ?? null, createdAt: complaint.createdAt.toISOString(), updatedAt: complaint.updatedAt.toISOString() };
}

function relationAudit(input: LinkComplaintInput, branchId: string, relationAction: 'link' | 'unlink'): AuditRecordInput {
  return {
    eventType: 'COMPLAINT', action: relationAction === 'link' ? 'complaint_relation_linked' : 'complaint_relation_unlinked', actorId: input.actorId ?? null,
    branchId, targetType: 'complaint_relation', targetId: input.sourceComplaintId,
    correlationId: input.correlationId ?? null, ipAddress: input.ipAddress ?? null, userAgent: safeAuditText(input.userAgent ?? null),
    metadata: { sourceComplaintId: input.sourceComplaintId, targetComplaintId: input.targetComplaintId, relationAction, actorRole: input.actorRole ?? null, sessionId: input.sessionId ?? null },
  };
}

function validationError(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid complaint relation request', HttpStatus.BAD_REQUEST, [{ field, code: 'INVALID', message: `${field} is invalid.` }]);
}

const sensitiveAuditValue = /password|otp|token|hash|secret|credential|provider|vin|plate|dms|raw-url|query/i;

function safeAuditText(value: string | null): string | null {
  return value && sensitiveAuditValue.test(value) ? '[REDACTED]' : value;
}
