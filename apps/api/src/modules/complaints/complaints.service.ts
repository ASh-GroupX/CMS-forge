import { HttpStatus, Injectable } from '@nestjs/common';
import { CommentVisibility, ComplaintSeverity, ComplaintStatus, ComplaintTransitionAction, ComplaintTransitionRequestSource, RoleCode } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ComplaintsRepository } from './complaints.repository.js';
import type { ComplaintCommentRecord, ComplaintDetailRecord, ComplaintQueueRecord, ComplaintRecord, CreateComplaintData, PortalVerificationTargetRecord } from './complaints.repository.js';
import type { ComplaintDetailDto, ComplaintQueueItemDto } from './dto/complaint-response.dto.js';

export type ValidateComplaintTransitionInput = { fromStatus: ComplaintStatus; action: ComplaintTransitionAction; actorRole: RoleCode };
export type ComplaintTransitionDecision = ValidateComplaintTransitionInput & { toStatus: ComplaintStatus };
export type ApplyComplaintTransitionInput = ValidateComplaintTransitionInput & {
  complaintId: string; actorId?: string | null; requestSource: ComplaintTransitionRequestSource;
  reason?: string | null; resolutionType?: string | null; resolutionSummary?: string | null; customerCommunicationStatus?: string | null;
  correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null;
};
export type ApplyComplaintTransitionResult = ComplaintTransitionDecision & { complaintId: string };

export type CreateInternalComplaintInput = {
  customerName: string; customerPhone?: string | null; customerNumber?: string | null; categoryId: string;
  subcategoryId: string; description: string; incidentAt: Date | string; branchId: string; subject: string;
  severity: ComplaintSeverity; vehicleRelated?: boolean; vehicleVin?: string | null; vehicleId?: string | null;
  actorId?: string | null; requestSource?: ComplaintTransitionRequestSource; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null;
};

export type ComplaintCreationResult = { id: string; referenceNumber: string; status: ComplaintStatus };

export type ComplaintQueueFilter = { branchId?: string | null };
export type CreateComplaintCommentInput = { complaintId: string; body: string; visibility: CommentVisibility; actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };
export type ComplaintCommentResult = { id: string; complaintId: string; body: string; visibility: CommentVisibility; authorId: string | null; createdAt: string };

type WorkflowTransition = { fromStatus: ComplaintStatus; action: ComplaintTransitionAction; toStatus: ComplaintStatus; allowedRoles: readonly RoleCode[] };

const MANAGER_ROLES = [RoleCode.CR_MANAGER, RoleCode.ADMIN] as const;
const BRANCH_MANAGER_ROLES = [RoleCode.BRANCH_MANAGER, RoleCode.CR_MANAGER, RoleCode.ADMIN] as const;

export const WORKFLOW_TRANSITIONS: readonly WorkflowTransition[] = [
  transition(ComplaintStatus.DRAFT, ComplaintTransitionAction.SUBMIT, ComplaintStatus.SUBMITTED, [RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.ADMIN, RoleCode.CUSTOMER_PORTAL]),
  transition(ComplaintStatus.SUBMITTED, ComplaintTransitionAction.ACCEPT_INTAKE, ComplaintStatus.MANAGER_REVIEW, MANAGER_ROLES),
  transition(ComplaintStatus.SUBMITTED, ComplaintTransitionAction.REJECT_AS_INVALID, ComplaintStatus.REJECTED, MANAGER_ROLES),
  transition(ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.APPROVE_AND_ROUTE, ComplaintStatus.BRANCH_REVIEW, MANAGER_ROLES),
  transition(ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.SEND_BACK, ComplaintStatus.DRAFT, MANAGER_ROLES),
  transition(ComplaintStatus.MANAGER_REVIEW, ComplaintTransitionAction.REJECT_AS_INVALID, ComplaintStatus.REJECTED, MANAGER_ROLES),
  transition(ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.ASSIGN_INVESTIGATION, ComplaintStatus.IN_PROGRESS, BRANCH_MANAGER_ROLES),
  transition(ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.RESOLVE_DIRECTLY, ComplaintStatus.RESOLVED, BRANCH_MANAGER_ROLES),
  transition(ComplaintStatus.BRANCH_REVIEW, ComplaintTransitionAction.REJECT_AFTER_REVIEW, ComplaintStatus.REJECTED, BRANCH_MANAGER_ROLES),
  transition(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.ADD_INVESTIGATION_UPDATE, ComplaintStatus.IN_PROGRESS, BRANCH_MANAGER_ROLES),
  transition(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.RESOLVE, ComplaintStatus.RESOLVED, BRANCH_MANAGER_ROLES),
  transition(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.REJECT_AFTER_INVESTIGATION, ComplaintStatus.REJECTED, BRANCH_MANAGER_ROLES),
  transition(ComplaintStatus.RESOLVED, ComplaintTransitionAction.CLOSE, ComplaintStatus.CLOSED, BRANCH_MANAGER_ROLES),
  transition(ComplaintStatus.RESOLVED, ComplaintTransitionAction.REJECT_RESOLUTION, ComplaintStatus.IN_PROGRESS, BRANCH_MANAGER_ROLES),
  transition(ComplaintStatus.CLOSED, ComplaintTransitionAction.REOPEN, ComplaintStatus.REOPENED, MANAGER_ROLES),
  transition(ComplaintStatus.REJECTED, ComplaintTransitionAction.REOPEN, ComplaintStatus.REOPENED, MANAGER_ROLES),
  transition(ComplaintStatus.REOPENED, ComplaintTransitionAction.ROUTE_AGAIN, ComplaintStatus.MANAGER_REVIEW, MANAGER_ROLES),
];

function transition(fromStatus: ComplaintStatus, action: ComplaintTransitionAction, toStatus: ComplaintStatus, allowedRoles: readonly RoleCode[]): WorkflowTransition { return { fromStatus, action, toStatus, allowedRoles }; }

@Injectable()
export class ComplaintsService {
  constructor(private readonly complaintsRepository: ComplaintsRepository, private readonly auditService: AuditService, private readonly notificationsService?: NotificationsService) {}

  async createInternal(input: CreateInternalComplaintInput): Promise<ComplaintCreationResult> {
    const data = createComplaintData(input);

    return this.complaintsRepository.transaction(async (client) => {
      const referenceNumber = await this.complaintsRepository.nextReferenceNumber(client);
      const complaint = await this.complaintsRepository.create({ ...data, referenceNumber }, client);
      await this.complaintsRepository.createStatusHistory({
        complaintId: complaint.id,
        fromStatus: null,
        toStatus: complaint.status,
        action: ComplaintTransitionAction.SUBMIT,
        actorId: input.actorId ?? null,
        actorRole: null,
        requestSource: input.requestSource ?? ComplaintTransitionRequestSource.STAFF_API,
        reason: null,
        correlationId: input.correlationId ?? null,
      }, client);
      await this.auditService.record(complaintCreatedAudit(input, complaint), client);
      return { id: complaint.id, referenceNumber: complaint.referenceNumber, status: complaint.status };
    });
  }

  async listQueue(filter: ComplaintQueueFilter = {}): Promise<ComplaintQueueItemDto[]> { return (await this.complaintsRepository.listQueue(filter)).map(queueItem); }

  async findPortalVerificationTarget(referenceNumber: string, customerPhone: string): Promise<PortalVerificationTargetRecord | null> {
    return this.complaintsRepository.findPortalVerificationTarget(referenceNumber.trim(), customerPhone.trim());
  }

  async getDetail(id: string, filter: ComplaintQueueFilter = {}): Promise<ComplaintDetailDto> {
    const complaint = await this.complaintsRepository.findDetail(id, filter);
    if (!complaint) {
      throw new AppException('COMPLAINT_NOT_FOUND', 'Complaint not found', HttpStatus.NOT_FOUND);
    }
    return detailItem(complaint);
  }

  async createComment(input: CreateComplaintCommentInput): Promise<ComplaintCommentResult> {
    const body = nonEmpty(input.body, 'body');
    return this.complaintsRepository.transaction(async (client) => {
      const comment = await this.complaintsRepository.createComment({ complaintId: input.complaintId, authorId: input.actorId ?? null, body, visibility: input.visibility }, client);
      await this.auditService.record(commentAudit(input, comment), client);
      return commentItem(comment);
    });
  }

  async listPublicComments(complaintId: string): Promise<ComplaintCommentResult[]> { return (await this.complaintsRepository.listPublicComments(complaintId)).map(commentItem); }

  validateTransition(input: ValidateComplaintTransitionInput): ComplaintTransitionDecision {
    const transition = WORKFLOW_TRANSITIONS.find(
      (candidate) => candidate.fromStatus === input.fromStatus && candidate.action === input.action,
    );

    if (!transition) {
      throw invalidTransitionError();
    }

    if (!transition.allowedRoles.includes(input.actorRole)) {
      throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
    }

    return { fromStatus: input.fromStatus, action: input.action, actorRole: input.actorRole, toStatus: transition.toStatus };
  }

  async applyTransition(input: ApplyComplaintTransitionInput): Promise<ApplyComplaintTransitionResult> {
    let decision: ComplaintTransitionDecision;
    try {
      decision = this.validateTransition(input);
    } catch (error) {
      if (error instanceof AppException && error.code === 'RBAC_FORBIDDEN') {
        await this.auditService.record({ eventType: 'SECURITY', action: 'workflow_role_forbidden', actorId: input.actorId ?? null, branchId: null, targetType: 'complaint', targetId: input.complaintId, correlationId: input.correlationId ?? null, ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null, metadata: { fromStatus: input.fromStatus, action: input.action, actorRole: input.actorRole, requestSource: input.requestSource } });
      }
      throw error;
    }

    validateRequiredTransitionData(input);

    const result = await this.complaintsRepository.transaction(async (client) => {
      const complaint = await this.complaintsRepository.updateStatus(
        { complaintId: input.complaintId, fromStatus: input.fromStatus, toStatus: decision.toStatus },
        client,
      );

      if (!complaint) {
        throw invalidTransitionError();
      }

      await this.complaintsRepository.createStatusHistory({
        complaintId: input.complaintId,
        fromStatus: input.fromStatus,
        toStatus: decision.toStatus,
        action: input.action,
        actorId: input.actorId ?? null,
        actorRole: input.actorRole,
        requestSource: input.requestSource,
        reason: input.reason ?? null,
        correlationId: input.correlationId ?? null,
      }, client);
      await this.auditService.record(workflowAuditInput(input, decision.toStatus, complaint.branchId), client);

      return { complaintId: complaint.id, ...decision };
    });
    await queueWorkflowSideEffect(this.notificationsService, input, result.toStatus);
    return result;
  }
}

function createComplaintData(input: CreateInternalComplaintInput): Omit<CreateComplaintData, 'referenceNumber'> {
  const errors = [
    ...requiredTextError(input.customerName, 'customerName'),
    ...contactErrors(input),
    ...requiredTextError(input.categoryId, 'categoryId'),
    ...requiredTextError(input.subcategoryId, 'subcategoryId'),
    ...requiredTextError(input.description, 'description'),
    ...requiredTextError(input.branchId, 'branchId'),
    ...requiredTextError(input.subject, 'subject'),
    ...requiredEnumError(input.severity, ComplaintSeverity, 'severity'),
    ...incidentAtErrors(input.incidentAt),
    ...(input.vehicleRelated ? requiredTextError(input.vehicleVin, 'vehicleVin') : []),
  ];

  if (errors.length) {
    throw new AppException('VALIDATION_FAILED', 'Invalid complaint request', HttpStatus.BAD_REQUEST, errors);
  }

  return {
    status: ComplaintStatus.SUBMITTED, subject: input.subject.trim(), severity: input.severity,
    branchId: input.branchId.trim(), categoryId: input.subcategoryId.trim(), customerName: input.customerName.trim(),
    customerPhone: optionalText(input.customerPhone), customerNumber: optionalText(input.customerNumber),
    vehicleId: optionalText(input.vehicleId), createdById: input.actorId ?? null,
    descriptionEn: input.description.trim(), incidentAt: new Date(input.incidentAt),
  };
}

function complaintCreatedAudit(input: CreateInternalComplaintInput, complaint: ComplaintRecord): AuditRecordInput {
  return {
    eventType: 'COMPLAINT', action: 'complaint_created', actorId: input.actorId ?? null,
    branchId: complaint.branchId, targetType: 'complaint', targetId: complaint.id,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: { referenceNumber: complaint.referenceNumber, status: complaint.status, severity: complaint.severity },
  };
}

function queueItem(complaint: ComplaintQueueRecord): ComplaintQueueItemDto {
  return {
    id: complaint.id, referenceNumber: complaint.referenceNumber, status: complaint.status,
    severity: complaint.severity, subject: complaint.subject, branchId: complaint.branchId, ownerId: complaint.ownerId,
    createdAt: complaint.createdAt.toISOString(),
    updatedAt: complaint.updatedAt.toISOString(),
  };
}

function detailItem(complaint: ComplaintDetailRecord): ComplaintDetailDto {
  return { ...queueItem(complaint), description: complaint.descriptionEn, incidentAt: complaint.incidentAt?.toISOString() ?? null, statusHistory: complaint.statusHistory.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })) };
}

function commentItem(comment: ComplaintCommentRecord): ComplaintCommentResult {
  return { ...comment, createdAt: comment.createdAt.toISOString() };
}

function commentAudit(input: CreateComplaintCommentInput, comment: ComplaintCommentRecord): AuditRecordInput {
  return {
    eventType: 'COMMENT', action: input.visibility === CommentVisibility.PUBLIC ? 'public_comment_created' : 'internal_comment_created',
    actorId: input.actorId ?? null, branchId: null, targetType: 'complaint_comment', targetId: comment.id,
    correlationId: input.correlationId ?? null, ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null,
    metadata: { complaintId: input.complaintId, visibility: input.visibility },
  };
}

function nonEmpty(value: string, field: string): string {
  const text = value.trim();
  if (!text) throw new AppException('VALIDATION_FAILED', 'Invalid complaint comment', HttpStatus.BAD_REQUEST, [{ field, code: 'REQUIRED', message: `${field} is required.` }]);
  return text;
}

function requiredTextError(value: unknown, field: string) {
  return typeof value === 'string' && value.trim()
    ? []
    : [{ field, code: 'REQUIRED', message: `${field} is required.` }];
}

function contactErrors(input: CreateInternalComplaintInput) {
  return optionalText(input.customerPhone) || optionalText(input.customerNumber)
    ? []
    : [{ field: 'customerPhone', code: 'REQUIRED', message: 'customerPhone or customerNumber is required.' }];
}

function requiredEnumError<T extends Record<string, string>>(value: unknown, options: T, field: string) {
  return typeof value === 'string' && Object.values(options).includes(value)
    ? []
    : [{ field, code: 'REQUIRED', message: `${field} is required.` }];
}

function incidentAtErrors(value: unknown) {
  const date = value instanceof Date || typeof value === 'string' ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf())
    ? []
    : [{ field: 'incidentAt', code: 'REQUIRED', message: 'incidentAt is required.' }];
}

function optionalText(value: string | null | undefined): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null; }

function invalidTransitionError(): AppException { return new AppException('COMPLAINT_INVALID_TRANSITION', 'The requested action is not allowed for the current complaint state.', HttpStatus.CONFLICT); }

const REASON_REQUIRED = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.SEND_BACK, ComplaintTransitionAction.REOPEN, ComplaintTransitionAction.REJECT_AS_INVALID, ComplaintTransitionAction.REJECT_AFTER_REVIEW, ComplaintTransitionAction.REJECT_AFTER_INVESTIGATION, ComplaintTransitionAction.REJECT_RESOLUTION]);
const RESOLUTION_REQUIRED = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.RESOLVE, ComplaintTransitionAction.RESOLVE_DIRECTLY]);

function validateRequiredTransitionData(input: ApplyComplaintTransitionInput): void {
  const errors = [
    ...(REASON_REQUIRED.has(input.action) || input.action === ComplaintTransitionAction.CLOSE ? requiredTextError(input.reason, 'reason') : []),
    ...(RESOLUTION_REQUIRED.has(input.action) ? requiredTextError(input.resolutionType, 'resolutionType') : []),
    ...(RESOLUTION_REQUIRED.has(input.action) ? requiredTextError(input.resolutionSummary, 'resolutionSummary') : []),
    ...(RESOLUTION_REQUIRED.has(input.action) && !input.actorId ? [{ field: 'actorId', code: 'REQUIRED', message: 'actorId is required.' }] : []),
    ...(input.action === ComplaintTransitionAction.CLOSE ? requiredTextError(input.customerCommunicationStatus, 'customerCommunicationStatus') : []),
  ];
  if (errors.length) throw new AppException('VALIDATION_FAILED', 'Invalid complaint transition request', HttpStatus.BAD_REQUEST, errors);
}

function workflowAuditInput(input: ApplyComplaintTransitionInput, toStatus: ComplaintStatus, branchId: string): AuditRecordInput {
  return {
    eventType: 'WORKFLOW', action: `transition_${input.action.toLowerCase()}`, actorId: input.actorId ?? null,
    branchId, targetType: 'complaint', targetId: input.complaintId,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: { fromStatus: input.fromStatus, toStatus, action: input.action, actorRole: input.actorRole, requestSource: input.requestSource, resolutionType: input.resolutionType ?? null, resolutionSummary: input.resolutionSummary ?? null, customerCommunicationStatus: input.customerCommunicationStatus ?? null },
  };
}

async function queueWorkflowSideEffect(notificationsService: NotificationsService | undefined, input: ApplyComplaintTransitionInput, toStatus: ComplaintStatus): Promise<void> {
  const templateCode = input.action === ComplaintTransitionAction.CLOSE ? 'survey.schedule.internal' : input.action === ComplaintTransitionAction.REOPEN ? 'workflow.reopened.internal' : null;
  if (!templateCode || !notificationsService) return;
  await notificationsService.queueInternal({ complaintId: input.complaintId, templateCode, payload: { complaintId: input.complaintId, fromStatus: input.fromStatus, toStatus, action: input.action, actorId: input.actorId ?? null, reason: input.reason ?? null, customerCommunicationStatus: input.customerCommunicationStatus ?? null } });
}
