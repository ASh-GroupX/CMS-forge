import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ComplaintStatus,
  ComplaintTransitionAction,
  ComplaintTransitionRequestSource,
  RoleCode,
} from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { ComplaintsRepository } from './complaints.repository.js';

export type ValidateComplaintTransitionInput = {
  fromStatus: ComplaintStatus;
  action: ComplaintTransitionAction;
  actorRole: RoleCode;
};

export type ComplaintTransitionDecision = ValidateComplaintTransitionInput & {
  toStatus: ComplaintStatus;
};

export type ApplyComplaintTransitionInput = ValidateComplaintTransitionInput & {
  complaintId: string;
  actorId?: string | null;
  requestSource: ComplaintTransitionRequestSource;
  reason?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type ApplyComplaintTransitionResult = ComplaintTransitionDecision & {
  complaintId: string;
};

type WorkflowTransition = {
  fromStatus: ComplaintStatus;
  action: ComplaintTransitionAction;
  toStatus: ComplaintStatus;
  allowedRoles: readonly RoleCode[];
};

const MANAGER_ROLES = [RoleCode.CR_MANAGER, RoleCode.ADMIN] as const;
const BRANCH_MANAGER_ROLES = [RoleCode.BRANCH_MANAGER, RoleCode.CR_MANAGER, RoleCode.ADMIN] as const;

export const WORKFLOW_TRANSITIONS: readonly WorkflowTransition[] = [
  {
    fromStatus: ComplaintStatus.DRAFT,
    action: ComplaintTransitionAction.SUBMIT,
    toStatus: ComplaintStatus.SUBMITTED,
    allowedRoles: [RoleCode.CR_OFFICER, RoleCode.CR_MANAGER, RoleCode.ADMIN, RoleCode.CUSTOMER_PORTAL],
  },
  {
    fromStatus: ComplaintStatus.SUBMITTED,
    action: ComplaintTransitionAction.ACCEPT_INTAKE,
    toStatus: ComplaintStatus.MANAGER_REVIEW,
    allowedRoles: MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.SUBMITTED,
    action: ComplaintTransitionAction.REJECT_AS_INVALID,
    toStatus: ComplaintStatus.REJECTED,
    allowedRoles: MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.MANAGER_REVIEW,
    action: ComplaintTransitionAction.APPROVE_AND_ROUTE,
    toStatus: ComplaintStatus.BRANCH_REVIEW,
    allowedRoles: MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.MANAGER_REVIEW,
    action: ComplaintTransitionAction.SEND_BACK,
    toStatus: ComplaintStatus.DRAFT,
    allowedRoles: MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.MANAGER_REVIEW,
    action: ComplaintTransitionAction.REJECT_AS_INVALID,
    toStatus: ComplaintStatus.REJECTED,
    allowedRoles: MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.BRANCH_REVIEW,
    action: ComplaintTransitionAction.ASSIGN_INVESTIGATION,
    toStatus: ComplaintStatus.IN_PROGRESS,
    allowedRoles: BRANCH_MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.BRANCH_REVIEW,
    action: ComplaintTransitionAction.RESOLVE_DIRECTLY,
    toStatus: ComplaintStatus.RESOLVED,
    allowedRoles: BRANCH_MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.BRANCH_REVIEW,
    action: ComplaintTransitionAction.REJECT_AFTER_REVIEW,
    toStatus: ComplaintStatus.REJECTED,
    allowedRoles: BRANCH_MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.IN_PROGRESS,
    action: ComplaintTransitionAction.ADD_INVESTIGATION_UPDATE,
    toStatus: ComplaintStatus.IN_PROGRESS,
    allowedRoles: BRANCH_MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.IN_PROGRESS,
    action: ComplaintTransitionAction.RESOLVE,
    toStatus: ComplaintStatus.RESOLVED,
    allowedRoles: BRANCH_MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.IN_PROGRESS,
    action: ComplaintTransitionAction.REJECT_AFTER_INVESTIGATION,
    toStatus: ComplaintStatus.REJECTED,
    allowedRoles: BRANCH_MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.RESOLVED,
    action: ComplaintTransitionAction.CLOSE,
    toStatus: ComplaintStatus.CLOSED,
    allowedRoles: BRANCH_MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.RESOLVED,
    action: ComplaintTransitionAction.REJECT_RESOLUTION,
    toStatus: ComplaintStatus.IN_PROGRESS,
    allowedRoles: BRANCH_MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.CLOSED,
    action: ComplaintTransitionAction.REOPEN,
    toStatus: ComplaintStatus.REOPENED,
    allowedRoles: MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.REJECTED,
    action: ComplaintTransitionAction.REOPEN,
    toStatus: ComplaintStatus.REOPENED,
    allowedRoles: MANAGER_ROLES,
  },
  {
    fromStatus: ComplaintStatus.REOPENED,
    action: ComplaintTransitionAction.ROUTE_AGAIN,
    toStatus: ComplaintStatus.MANAGER_REVIEW,
    allowedRoles: MANAGER_ROLES,
  },
];

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly complaintsRepository: ComplaintsRepository,
    private readonly auditService: AuditService,
  ) {}

  validateTransition(input: ValidateComplaintTransitionInput): ComplaintTransitionDecision {
    const transition = WORKFLOW_TRANSITIONS.find(
      (candidate) => candidate.fromStatus === input.fromStatus && candidate.action === input.action,
    );

    if (!transition) {
      throw new AppException(
        'COMPLAINT_INVALID_TRANSITION',
        'The requested action is not allowed for the current complaint state.',
        HttpStatus.CONFLICT,
      );
    }

    if (!transition.allowedRoles.includes(input.actorRole)) {
      throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
    }

    return {
      fromStatus: input.fromStatus,
      action: input.action,
      actorRole: input.actorRole,
      toStatus: transition.toStatus,
    };
  }

  async applyTransition(input: ApplyComplaintTransitionInput): Promise<ApplyComplaintTransitionResult> {
    const decision = this.validateTransition(input);

    return this.complaintsRepository.transaction(async (client) => {
      const complaint = await this.complaintsRepository.updateStatus(
        { complaintId: input.complaintId, toStatus: decision.toStatus },
        client,
      );
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

      return {
        complaintId: complaint.id,
        ...decision,
      };
    });
  }
}

function workflowAuditInput(
  input: ApplyComplaintTransitionInput,
  toStatus: ComplaintStatus,
  branchId: string,
): AuditRecordInput {
  return {
    eventType: 'WORKFLOW',
    action: `transition_${input.action.toLowerCase()}`,
    actorId: input.actorId ?? null,
    branchId,
    targetType: 'complaint',
    targetId: input.complaintId,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: {
      fromStatus: input.fromStatus,
      toStatus,
      action: input.action,
      actorRole: input.actorRole,
      requestSource: input.requestSource,
    },
  };
}
