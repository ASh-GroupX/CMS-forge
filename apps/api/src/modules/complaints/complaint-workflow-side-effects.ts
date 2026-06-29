import { ComplaintStatus, ComplaintTransitionAction, SlaEventType, SlaStage } from '@prisma/client';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { SlaService } from '../sla/sla.service.js';
import type { ApplyComplaintTransitionInput } from './complaints.service.js';
import type { ComplaintStatusRecord } from './complaints.repository.js';

type WorkflowSideEffectInput = {
  notificationsService?: Pick<NotificationsService, 'queueInternal'> | undefined;
  slaService?: Pick<SlaService, 'recordDeadlineEvent' | 'recordLifecycleEvent'> | undefined;
  input: ApplyComplaintTransitionInput;
  toStatus: ComplaintStatus;
  complaint: ComplaintStatusRecord;
  enteredAt: Date;
};

const SLA_STAGE_BY_ACTION: Partial<Record<ComplaintTransitionAction, SlaStage>> = {
  [ComplaintTransitionAction.SUBMIT]: SlaStage.INTAKE,
  [ComplaintTransitionAction.ACCEPT_INTAKE]: SlaStage.MANAGER_REVIEW,
  [ComplaintTransitionAction.ROUTE_AGAIN]: SlaStage.MANAGER_REVIEW,
  [ComplaintTransitionAction.APPROVE_AND_ROUTE]: SlaStage.BRANCH_REVIEW,
  [ComplaintTransitionAction.ASSIGN_INVESTIGATION]: SlaStage.INVESTIGATION,
  [ComplaintTransitionAction.REJECT_RESOLUTION]: SlaStage.INVESTIGATION,
  [ComplaintTransitionAction.RESOLVE]: SlaStage.RESOLUTION,
  [ComplaintTransitionAction.RESOLVE_DIRECTLY]: SlaStage.RESOLUTION,
};

const SLA_STAGE_BY_STATUS: Partial<Record<ComplaintStatus, SlaStage>> = {
  [ComplaintStatus.SUBMITTED]: SlaStage.INTAKE,
  [ComplaintStatus.MANAGER_REVIEW]: SlaStage.MANAGER_REVIEW,
  [ComplaintStatus.BRANCH_REVIEW]: SlaStage.BRANCH_REVIEW,
  [ComplaintStatus.IN_PROGRESS]: SlaStage.INVESTIGATION,
  [ComplaintStatus.RESOLVED]: SlaStage.RESOLUTION,
};

const NOTIFICATION_BY_ACTION: Partial<Record<ComplaintTransitionAction, string>> = {
  [ComplaintTransitionAction.SUBMIT]: 'complaint.submitted.internal',
  [ComplaintTransitionAction.APPROVE_AND_ROUTE]: 'workflow.approved-routed.internal',
  [ComplaintTransitionAction.ASSIGN_INVESTIGATION]: 'workflow.investigation-assigned.internal',
  [ComplaintTransitionAction.RESOLVE]: 'workflow.resolved.internal',
  [ComplaintTransitionAction.RESOLVE_DIRECTLY]: 'workflow.resolved.internal',
  [ComplaintTransitionAction.REJECT_RESOLUTION]: 'workflow.resolution-rejected.internal',
  [ComplaintTransitionAction.SEND_BACK]: 'workflow.sent-back.internal',
  [ComplaintTransitionAction.CLOSE]: 'survey.schedule.internal',
  [ComplaintTransitionAction.REOPEN]: 'workflow.reopened.internal',
};

const REJECT_ACTIONS = new Set<ComplaintTransitionAction>([
  ComplaintTransitionAction.REJECT_AS_INVALID,
  ComplaintTransitionAction.REJECT_AFTER_REVIEW,
  ComplaintTransitionAction.REJECT_AFTER_INVESTIGATION,
]);

const PAUSE_ACTIONS = new Set<ComplaintTransitionAction>([
  ComplaintTransitionAction.CLOSE,
  ComplaintTransitionAction.REJECT_AS_INVALID,
  ComplaintTransitionAction.REJECT_AFTER_REVIEW,
  ComplaintTransitionAction.REJECT_AFTER_INVESTIGATION,
]);

export async function queueWorkflowSideEffects({
  notificationsService,
  slaService,
  input,
  toStatus,
  complaint,
  enteredAt,
}: WorkflowSideEffectInput): Promise<void> {
  const templateCode = notificationTemplate(input.action);
  if (templateCode && notificationsService) {
    await notificationsService.queueInternal({
      complaintId: input.complaintId,
      ...recipient(input, complaint),
      templateCode,
      payload: notificationPayload(input, toStatus, complaint),
    });
  }

  const stage = SLA_STAGE_BY_ACTION[input.action];
  if (stage && slaService) {
    await slaService.recordDeadlineEvent({
      complaintId: complaint.id,
      severity: complaint.severity,
      stage,
      branchId: complaint.branchId,
      departmentId: complaint.departmentId,
      categoryId: complaint.categoryId,
      enteredAt,
    });
  }

  const lifecycle = lifecycleEvent(input);
  if (lifecycle && slaService) {
    await slaService.recordLifecycleEvent({ complaintId: complaint.id, ...lifecycle, occurredAt: enteredAt });
  }
}

function notificationTemplate(action: ComplaintTransitionAction): string | null {
  return REJECT_ACTIONS.has(action) ? 'complaint.rejected.internal' : NOTIFICATION_BY_ACTION[action] ?? null;
}

function lifecycleEvent(input: ApplyComplaintTransitionInput): { type: typeof SlaEventType.PAUSED | typeof SlaEventType.RESUMED; stage: SlaStage } | null {
  if (input.action === ComplaintTransitionAction.REOPEN) return { type: SlaEventType.RESUMED, stage: SlaStage.MANAGER_REVIEW };
  if (!PAUSE_ACTIONS.has(input.action)) return null;
  const stage = SLA_STAGE_BY_STATUS[input.fromStatus];
  return stage ? { type: SlaEventType.PAUSED, stage } : null;
}

function recipient(input: ApplyComplaintTransitionInput, complaint: ComplaintStatusRecord): { recipientUserId?: string } {
  const ownerId = targetOwnerId(input, complaint);
  return ownerId ? { recipientUserId: ownerId } : {};
}

function notificationPayload(input: ApplyComplaintTransitionInput, toStatus: ComplaintStatus, complaint: ComplaintStatusRecord) {
  if (input.action === ComplaintTransitionAction.CLOSE || input.action === ComplaintTransitionAction.REOPEN) {
    return {
      complaintId: input.complaintId,
      fromStatus: input.fromStatus,
      toStatus,
      action: input.action,
      actorId: input.actorId ?? null,
      reason: input.reason ?? null,
      customerCommunicationStatus: input.customerCommunicationStatus ?? null,
    };
  }

  const ownerId = targetOwnerId(input, complaint);
  return {
    complaintId: input.complaintId,
    fromStatus: input.fromStatus,
    toStatus,
    action: input.action,
    actorId: input.actorId ?? null,
    ...(input.targetBranchId ? { targetBranchId: input.targetBranchId } : {}),
    ...(input.targetDepartmentId ? { targetDepartmentId: input.targetDepartmentId } : {}),
    ...(ownerId ? { ownerId } : {}),
    ...(input.resolutionType ? { resolutionType: input.resolutionType } : {}),
  };
}

function targetOwnerId(input: ApplyComplaintTransitionInput, complaint: ComplaintStatusRecord): string | null {
  if (
    input.action === ComplaintTransitionAction.APPROVE_AND_ROUTE ||
    input.action === ComplaintTransitionAction.ASSIGN_INVESTIGATION ||
    input.action === ComplaintTransitionAction.REJECT_RESOLUTION
  ) {
    return input.ownerId ?? complaint.ownerId;
  }
  return null;
}
