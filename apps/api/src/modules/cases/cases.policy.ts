import { HttpStatus } from '@nestjs/common';
import { CaseConfidentialityLevel, CaseLifecycleStatus, CaseParticipantRole, RoleCode } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { CaseRecord } from './cases.repository.js';

export type CaseReadActor = { userId: string; role: RoleCode; branchId?: string | null };
export type CaseReadAudit = { correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };

export async function assertCanReadCase(
  record: CaseRecord,
  actor: CaseReadActor,
  audit: CaseReadAudit,
  auditService?: AuditService,
): Promise<void> {
  const participant = record.participants.find((item) => item.userId === actor.userId);
  if (participant?.role === CaseParticipantRole.ACCUSED) await deny(record, actor, audit, 'accused_conflict', auditService);
  if (record.confidentialityLevel !== CaseConfidentialityLevel.CONFIDENTIAL) {
    if (actor.role === RoleCode.ADMIN || actor.branchId === record.branchId) return;
    await deny(record, actor, audit, 'branch_scope', auditService);
  }
  if (actor.role === RoleCode.ADMIN || actor.userId === record.ownerId || participant) return;
  await deny(record, actor, audit, 'not_participant', auditService);
}

export function assertLifecycle(from: CaseLifecycleStatus, to: CaseLifecycleStatus): void {
  if (!lifecycleMoves[from]?.includes(to)) {
    throw new AppException('CASE_INVALID_LIFECYCLE_TRANSITION', 'Invalid case lifecycle transition', HttpStatus.CONFLICT);
  }
}

export function caseAudit(action: string, record: CaseRecord, actor: CaseReadActor, audit: CaseReadAudit, metadata: Prisma.InputJsonObject) {
  return {
    eventType: 'WORKFLOW' as const,
    action,
    actorId: actor.userId,
    branchId: record.branchId,
    targetType: 'case',
    targetId: record.id,
    correlationId: audit.correlationId ?? null,
    ipAddress: audit.ipAddress ?? null,
    userAgent: audit.userAgent ?? null,
    metadata,
  };
}

const lifecycleMoves: Partial<Record<CaseLifecycleStatus, CaseLifecycleStatus[]>> = {
  [CaseLifecycleStatus.HR_REVIEW]: [CaseLifecycleStatus.INVESTIGATION],
  [CaseLifecycleStatus.INVESTIGATION]: [CaseLifecycleStatus.DECISION],
  [CaseLifecycleStatus.DECISION]: [CaseLifecycleStatus.CLOSED],
  [CaseLifecycleStatus.CLOSED]: [CaseLifecycleStatus.APPEALED],
};

async function deny(record: CaseRecord, actor: CaseReadActor, audit: CaseReadAudit, reason: string, auditService?: AuditService): Promise<never> {
  await auditService?.record({
    eventType: 'SECURITY',
    action: 'case_confidential_access_denied',
    actorId: actor.userId,
    branchId: actor.branchId ?? null,
    targetType: 'case',
    targetId: record.id,
    correlationId: audit.correlationId ?? null,
    ipAddress: audit.ipAddress ?? null,
    userAgent: audit.userAgent ?? null,
    metadata: { reason, caseBranchId: record.branchId },
  });
  throw new AppException(reason === 'branch_scope' ? 'BRANCH_SCOPE_FORBIDDEN' : 'RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
}
