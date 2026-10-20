import { HttpStatus } from '@nestjs/common';
import { ComplaintStatus, ComplaintTransitionAction, RoleCode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { ApplyComplaintTransitionInput } from './complaints.service.js';
import type { ComplaintStatusRecord, ComplaintTransitionSubject } from './complaints.repository.js';
import type { ComplaintDetailDto } from './dto/complaint-response.dto.js';

const branchManagerRoles = new Set<string>([RoleCode.BRANCH_MANAGER, RoleCode.CR_MANAGER, RoleCode.ADMIN, 'DEPARTMENT_MANAGER', 'DEPARTMENT_MANGER']);
const reasonRequired = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.APPROVE_AND_ROUTE, ComplaintTransitionAction.SEND_BACK, ComplaintTransitionAction.ASSIGN_INVESTIGATION, ComplaintTransitionAction.CLOSE, ComplaintTransitionAction.REOPEN, ComplaintTransitionAction.ROUTE_AGAIN, ComplaintTransitionAction.REJECT_AS_INVALID, ComplaintTransitionAction.REJECT_AFTER_REVIEW, ComplaintTransitionAction.REJECT_AFTER_INVESTIGATION, ComplaintTransitionAction.REJECT_RESOLUTION]);
const resolutionRequired = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.RESOLVE, ComplaintTransitionAction.RESOLVE_DIRECTLY]);
const ownerAllowedActions = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.ACCEPT_INTAKE, ComplaintTransitionAction.ADD_INVESTIGATION_UPDATE, ComplaintTransitionAction.RESOLVE]);
const resolutionDecisionActions = new Set<ComplaintTransitionAction>([
  ComplaintTransitionAction.CLOSE,
  ComplaintTransitionAction.COMPLETE,
  ComplaintTransitionAction.REJECT_RESOLUTION,
]);
export const ASSIGNMENT_ACTIONS = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.APPROVE_AND_ROUTE, ComplaintTransitionAction.ASSIGN_INVESTIGATION]);

export function invalidTransitionError(): AppException { return new AppException('COMPLAINT_INVALID_TRANSITION', 'The requested action is not allowed for the current complaint state.', HttpStatus.CONFLICT); }
export function roleForbiddenError(): AppException { return new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN); }

export function assertActorCanApplyTransition(input: ApplyComplaintTransitionInput, complaint: ComplaintStatusRecord): void {
  const isGlobalManager = input.actorRole === RoleCode.CR_MANAGER || input.actorRole === RoleCode.ADMIN || Boolean(input.actorPermissions?.includes('COMPLAINT_MANAGE'));
  const isManager = branchManagerRoles.has(input.actorRole) || isGlobalManager;
  if (ownerAllowedActions.has(input.action)) {
    const isOwnerOrBackup = Boolean(input.actorId && (complaint.ownerId === input.actorId || complaint.backupOfficerId === input.actorId));
    if (!isManager && !isOwnerOrBackup) throw roleForbiddenError();
  }

  if (resolutionDecisionActions.has(input.action) && !isGlobalManager) {
    const isCreator = Boolean(input.actorId && complaint.createdById === input.actorId);
    const isAssignedDept = Boolean(input.actorDepartmentId && complaint.departmentId && input.actorDepartmentId === complaint.departmentId);
    const isGeneralBranchManager = input.actorRole === RoleCode.BRANCH_MANAGER && !input.actorDepartmentId;
    if (!isCreator && !isAssignedDept && !isGeneralBranchManager) {
      throw roleForbiddenError();
    }
  }
}

export function actorCanSeeAction(
  action: ComplaintTransitionAction,
  actor: { roleCode: string; userId: string | null; permissions?: string[]; departmentId?: string | null },
  complaint: Pick<ComplaintDetailDto, 'ownerId'> & { backupOfficerId?: string | null; createdById?: string | null; departmentId?: string | null },
): boolean {
  const isGlobalManager = actor.roleCode === RoleCode.CR_MANAGER || actor.roleCode === RoleCode.ADMIN || Boolean(actor.permissions?.includes('COMPLAINT_MANAGE'));
  const isManager = branchManagerRoles.has(actor.roleCode) || isGlobalManager;
  if (ownerAllowedActions.has(action)) {
    const isOwnerOrBackup = Boolean(actor.userId && (complaint.ownerId === actor.userId || complaint.backupOfficerId === actor.userId));
    if (!isManager && !isOwnerOrBackup) return false;
  }

  if (resolutionDecisionActions.has(action) && !isGlobalManager) {
    const isCreator = Boolean(actor.userId && complaint.createdById === actor.userId);
    const isAssignedDept = Boolean(actor.departmentId && complaint.departmentId && actor.departmentId === complaint.departmentId);
    const isGeneralBranchManager = actor.roleCode === RoleCode.BRANCH_MANAGER && !actor.departmentId;
    if (!isCreator && !isAssignedDept && !isGeneralBranchManager) return false;
  }

  return true;
}

export async function recordWorkflowRoleForbidden(auditService: AuditService, input: ApplyComplaintTransitionInput): Promise<void> {
  await auditService.record({ eventType: 'SECURITY', action: 'workflow_role_forbidden', actorId: input.actorId ?? null, branchId: null, targetType: 'complaint', targetId: input.complaintId, correlationId: input.correlationId ?? null, ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null, metadata: { fromStatus: input.fromStatus, action: input.action, actorRole: input.actorRole, requestSource: input.requestSource } });
}

export function validateRequiredTransitionData(input: ApplyComplaintTransitionInput): void {
  const errors = [
    ...(reasonRequired.has(input.action) ? requiredTextError(input.reason, 'reason') : []),
    ...(input.action === ComplaintTransitionAction.APPROVE_AND_ROUTE && !nonEmptyText(input.targetBranchId) ? [{ field: 'targetBranchId', code: 'REQUIRED', message: 'targetBranchId is required.' }] : []),
    ...(input.action === ComplaintTransitionAction.APPROVE_AND_ROUTE && !nonEmptyText(input.targetDepartmentId) ? [{ field: 'targetDepartmentId', code: 'REQUIRED', message: 'targetDepartmentId is required.' }] : []),
    ...(input.action === ComplaintTransitionAction.ASSIGN_INVESTIGATION && !nonEmptyText(input.ownerId) && !nonEmptyText(input.targetDepartmentId) ? [{ field: 'assignment', code: 'REQUIRED', message: 'ownerId or targetDepartmentId is required.' }] : []),
    ...(resolutionRequired.has(input.action) ? requiredTextError(input.resolutionType, 'resolutionType') : []),
    ...(resolutionRequired.has(input.action) ? requiredTextError(input.resolutionSummary, 'resolutionSummary') : []),
    ...(resolutionRequired.has(input.action) && !input.actorId ? [{ field: 'actorId', code: 'REQUIRED', message: 'actorId is required.' }] : []),
    ...(input.action === ComplaintTransitionAction.CLOSE ? requiredTextError(input.customerCommunicationStatus, 'customerCommunicationStatus') : []),
  ];
  if (errors.length) throw new AppException('VALIDATION_FAILED', 'Invalid complaint transition request', HttpStatus.BAD_REQUEST, errors);
}

export function assertVehicleClosureAllowed(input: ApplyComplaintTransitionInput, complaint: ComplaintTransitionSubject | null): void {
  if (!complaint) throw invalidTransitionError();
  if (!complaint.vehicleRelated || complaint.vehicleId || nonEmptyText(input.vehicleDataUnavailableReason) || nonEmptyText(complaint.vehicleDataUnavailableReason)) return;
  throw new AppException('VALIDATION_FAILED', 'Invalid complaint transition request', HttpStatus.BAD_REQUEST, [{ field: 'vehicleDataUnavailableReason', code: 'REQUIRED', message: 'vehicleDataUnavailableReason is required.' }]);
}

export function statusUpdateData(input: ApplyComplaintTransitionInput, toStatus: ComplaintStatus) {
  const now = new Date();
  return {
    complaintId: input.complaintId,
    fromStatus: input.fromStatus,
    toStatus,
    ...(input.action === ComplaintTransitionAction.APPROVE_AND_ROUTE ? {
      ...(input.targetBranchId ? { targetBranchId: input.targetBranchId } : {}),
      ...(input.targetDepartmentId ? { targetDepartmentId: input.targetDepartmentId } : {}),
      ...(input.ownerId ? { ownerId: input.ownerId } : {}),
    } : {}),
    ...(input.action === ComplaintTransitionAction.ASSIGN_INVESTIGATION ? {
      ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
      ...(input.targetDepartmentId !== undefined ? { targetDepartmentId: input.targetDepartmentId } : {}),
    } : {}),
    ...(resolutionRequired.has(input.action) ? { resolvedAt: now } : {}),
    ...(input.action === ComplaintTransitionAction.CLOSE ? { closedAt: now } : {}),
    ...(input.action === ComplaintTransitionAction.CLOSE && nonEmptyText(input.vehicleDataUnavailableReason) ? { vehicleDataUnavailableReason: input.vehicleDataUnavailableReason } : {}),
    ...(input.isJustified !== undefined ? { isJustified: input.isJustified } : {}),
    ...(input.satisfactionStatus !== undefined ? { satisfactionStatus: input.satisfactionStatus } : {}),
    ...(input.investigationNotes !== undefined ? { investigationNotes: input.investigationNotes, investigatedAt: now } : {}),
  };
}

export function workflowAuditInput(input: ApplyComplaintTransitionInput, toStatus: ComplaintStatus, branchId: string): AuditRecordInput {
  return { eventType: 'WORKFLOW', action: `transition_${input.action.toLowerCase()}`, actorId: input.actorId ?? null, branchId, targetType: 'complaint', targetId: input.complaintId, correlationId: input.correlationId ?? null, ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null, metadata: { fromStatus: input.fromStatus, toStatus, action: input.action, actorRole: input.actorRole, requestSource: input.requestSource, resolutionType: input.resolutionType ?? null, customerCommunicationStatus: input.customerCommunicationStatus ?? null } };
}

function requiredTextError(value: unknown, field: string) { return typeof value === 'string' && value.trim() ? [] : [{ field, code: 'REQUIRED', message: `${field} is required.` }]; }
function nonEmptyText(value: string | null | undefined): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null; }
