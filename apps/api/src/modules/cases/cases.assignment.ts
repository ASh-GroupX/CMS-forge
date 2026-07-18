import { HttpStatus } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import type { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { AssignmentsService } from '../assignments/assignments.service.js';
import type { CaseResponseDto } from './dto/case-response.dto.js';
import { assertCanReadCase } from './cases.policy.js';
import type { CaseReadActor, CaseReadAudit } from './cases.policy.js';
import type { CasesRepository } from './cases.repository.js';
import { toCaseResponse } from './cases.response.js';

const writeRoles = new Set<RoleCode>([RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN]);

export function assertCanWriteCase(actor: CaseReadActor): void {
  if (!writeRoles.has(actor.role)) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
}

export async function assignCaseForActor(
  repository: CasesRepository,
  auditService: AuditService | undefined,
  assignmentsService: AssignmentsService | undefined,
  caseId: string,
  input: { assignedUserId: string | null; assignedDepartmentId: string | null; reason?: string | null },
  actor: CaseReadActor,
  audit: CaseReadAudit,
): Promise<CaseResponseDto> {
  const assigned = await repository.transaction(async (client) => {
    const record = await repository.findByIdInTransaction(caseId, client);
    if (!record) throw new AppException('CASE_NOT_FOUND', 'Case was not found', HttpStatus.NOT_FOUND);
    await assertCanReadCase(record, actor, audit, auditService);
    const updated = await repository.updateAssignment(record.id, input.assignedUserId, input.assignedDepartmentId, client);
    await assignmentsService?.setInTransaction({
      entityType: 'CASE', entityId: updated.id, assignedUserId: input.assignedUserId,
      assignedDepartmentId: input.assignedDepartmentId, scopeBranchId: updated.branchId,
      reason: input.reason ?? null,
    }, {
      userId: actor.userId, roleCode: actor.role, branchId: actor.branchId ?? null,
      ...(actor.departmentId !== undefined ? { departmentId: actor.departmentId } : {}),
    }, audit, client);
    return toCaseResponse(updated);
  });
  await assignmentsService?.notifyAfterCommit?.('CASE', assigned.id, { href: `/cases/${assigned.id}`, title: assigned.subject });
  return assigned;
}
