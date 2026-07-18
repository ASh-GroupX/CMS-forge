import { HttpStatus } from '@nestjs/common';
import { ComplaintStatus, ComplaintTransitionAction, RoleCode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { ApplyComplaintTransitionInput } from './complaints.service.js';
import type { ComplaintStatusRecord, ComplaintTransitionSubject } from './complaints.repository.js';
import type { ComplaintDetailDto } from './dto/complaint-response.dto.js';

const branchManagerRoles = new Set<RoleCode>([RoleCode.BRANCH_MANAGER, RoleCode.CR_MANAGER, RoleCode.ADMIN]);
const reasonRequired = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.APPROVE_AND_ROUTE, ComplaintTransitionAction.SEND_BACK, ComplaintTransitionAction.ASSIGN_INVESTIGATION, ComplaintTransitionAction.CLOSE, ComplaintTransitionAction.REOPEN, ComplaintTransitionAction.ROUTE_AGAIN, ComplaintTransitionAction.REJECT_AS_INVALID, ComplaintTransitionAction.REJECT_AFTER_REVIEW, ComplaintTransitionAction.REJECT_AFTER_INVESTIGATION, ComplaintTransitionAction.REJECT_RESOLUTION]);
const resolutionRequired = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.RESOLVE, ComplaintTransitionAction.RESOLVE_DIRECTLY]);
const ownerAllowedActions = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.ADD_INVESTIGATION_UPDATE, ComplaintTransitionAction.RESOLVE]);
export const ASSIGNMENT_ACTIONS = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.APPROVE_AND_ROUTE, ComplaintTransitionAction.ASSIGN_INVESTIGATION]);

export function invalidTransitionError(): AppException { return new AppException('COMPLAINT_INVALID_TRANSITION', 'The requested action is not allowed for the current complaint state.', HttpStatus.CONFLICT); }
export function roleForbiddenError(): AppException { return new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN); }

export function assertActorCanApplyTransition(input: ApplyComplaintTransitionInput, complaint: ComplaintStatusRecord): void {
  if (!ownerAllowedActions.has(input.action) || branchManagerRoles.has(input.actorRole)) return;
  if (input.actorId && complaint.ownerId === input.actorId) return;
  throw roleForbiddenError();
}

export function actorCanSeeAction(action: ComplaintTransitionAction, actor: { roleCode: RoleCode; userId: string | null }, complaint: Pick<ComplaintDetailDto, 'ownerId'>): boolean {
  return !ownerAllowedActions.has(action) || branchManagerRoles.has(actor.roleCode) || Boolean(actor.userId && complaint.ownerId === actor.userId);
}

export async function recordWorkflowRoleForbidden(auditService: AuditService, input: ApplyComplaintTransitionInput): Promise<void> {
  await auditService.record({ eventType: 'SECURITY', action: 'workflow_role_forbidden', actorId: input.actorId ?? null, branchId: null, targetType: 'complaint', targetId: input.complaintId, correlationId: input.correlationId ?? null, ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null, metadata: { fromStatus: input.fromStatus, action: input.action, actorRole: input.actorRole, requestSource: input.requestSource } });
}

export function validateRequiredTransitionData(input: ApplyComplaintTransitionInput): void {
  const errors = [
    ...(reasonRequired.has(input.action) ? requiredTextError(input.reason, 'reason') : []),
    ...(input.action === ComplaintTransitionAction.APPROVE_AND_ROUTE ? requiredTextError(input.targetBranchId, 'targetBranchId') : []),
    ...(input.action === ComplaintTransitionAction.APPROVE_AND_ROUTE ? requiredTextError(input.targetDepartmentId, 'targetDepartmentId') : []),
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
  return { complaintId: input.complaintId, fromStatus: input.fromStatus, toStatus, ...(input.action === ComplaintTransitionAction.APPROVE_AND_ROUTE ? { targetBranchId: input.targetBranchId, targetDepartmentId: input.targetDepartmentId, ownerId: input.ownerId } : {}), ...(input.action === ComplaintTransitionAction.ASSIGN_INVESTIGATION ? { ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}), ...(input.targetDepartmentId !== undefined ? { targetDepartmentId: input.targetDepartmentId } : {}) } : {}), ...(resolutionRequired.has(input.action) ? { resolvedAt: now } : {}), ...(input.action === ComplaintTransitionAction.CLOSE ? { closedAt: now } : {}), ...(input.action === ComplaintTransitionAction.CLOSE && nonEmptyText(input.vehicleDataUnavailableReason) ? { vehicleDataUnavailableReason: input.vehicleDataUnavailableReason } : {}) };
}

export function workflowAuditInput(input: ApplyComplaintTransitionInput, toStatus: ComplaintStatus, branchId: string): AuditRecordInput {
  return { eventType: 'WORKFLOW', action: `transition_${input.action.toLowerCase()}`, actorId: input.actorId ?? null, branchId, targetType: 'complaint', targetId: input.complaintId, correlationId: input.correlationId ?? null, ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null, metadata: { fromStatus: input.fromStatus, toStatus, action: input.action, actorRole: input.actorRole, requestSource: input.requestSource, resolutionType: input.resolutionType ?? null, customerCommunicationStatus: input.customerCommunicationStatus ?? null } };
}

function requiredTextError(value: unknown, field: string) { return typeof value === 'string' && value.trim() ? [] : [{ field, code: 'REQUIRED', message: `${field} is required.` }]; }
function nonEmptyText(value: string | null | undefined): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null; }
