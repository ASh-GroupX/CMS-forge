import { HttpStatus, Injectable } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus, ComplaintTransitionAction, ComplaintTransitionRequestSource, RoleCode } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { CasesService } from '../cases/cases.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SlaService } from '../sla/sla.service.js';
import type { SurveysService } from '../surveys/surveys.service.js';
import { TasksService } from '../tasks/tasks.service.js';
import { CommunicationGroupsService } from '../communication-groups/communication-groups.service.js';
import type { CommunicationActor } from '../communication-groups/communication-groups.service.js';
import { addComplaintWatcher, complaintCommunicationTargets, createComplaintComment, listComplaintComments, listPublicComplaintComments, removeComplaintWatcher } from './complaint-collaboration.js';
import type { ComplaintCommentResult, CreateComplaintCommentInput } from './complaint-collaboration.js';
export type { ComplaintCommentResult, CreateComplaintCommentInput } from './complaint-collaboration.js';
import { complaintCreatedAudit, createComplaintData, isReferenceConflict, referenceConflictError } from './complaint-intake.js';
import { complaintCorrectionAudit, complaintCorrectionData, correctionConflictError } from './complaint-correction.js';
import type { ApplyComplaintCorrectionInput, ApplyComplaintCorrectionResult } from './complaint-correction.js';
import { detailItem, queueItem, reportItem, searchItem, shouldMask } from './complaint-read-models.js';
import { timelineItems } from './complaint-timeline.js';
import { queueComplaintCreationSideEffects, queueWorkflowSideEffects } from './complaint-workflow-side-effects.js';
import { ComplaintsRepository } from './complaints.repository.js';
import type { ComplaintReportFilter, ComplaintStatusRecord, ComplaintTransitionSubject, DataSource, PortalVerificationTargetRecord } from './complaints.repository.js';
import type { ComplaintCaseSummaryDto, ComplaintDetailDto, ComplaintQueueItemDto, ComplaintTimelineItemDto } from './dto/complaint-response.dto.js';
export type ValidateComplaintTransitionInput = { fromStatus: ComplaintStatus; action: ComplaintTransitionAction; actorRole: RoleCode };
export type ComplaintTransitionDecision = ValidateComplaintTransitionInput & { toStatus: ComplaintStatus };
export type ApplyComplaintTransitionInput = ValidateComplaintTransitionInput & {
  complaintId: string; actorId?: string | null; requestSource: ComplaintTransitionRequestSource;
  reason?: string | null; targetBranchId?: string | null; targetDepartmentId?: string | null; ownerId?: string | null;
  resolutionType?: string | null; resolutionSummary?: string | null; customerCommunicationStatus?: string | null;
  vehicleDataUnavailableReason?: string | null;
  correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null;
};
export type ApplyComplaintTransitionResult = ComplaintTransitionDecision & { complaintId: string };

export type CreateInternalComplaintInput = {
  customerName: string; customerPhone?: string | null; customerNumber?: string | null; customerSource?: DataSource | null; categoryId: string;
  subcategoryId: string; description: string; incidentAt: Date | string; branchId: string; subject: string;
  severity: ComplaintSeverity; vehicleRelated?: boolean; vehicleVin?: string | null; vehicleId?: string | null;
  vehiclePlate?: string | null; vehicleBrand?: string | null; vehicleModel?: string | null; vehicleModelYear?: number | null;
  vehicleSource?: DataSource | null; vehicleDataUnavailableReason?: string | null;
  departmentId?: string | null; saveAsDraft?: boolean;
  actorId?: string | null; requestSource?: ComplaintTransitionRequestSource; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null;
  manualTriage?: boolean;
};

export type ComplaintCreationResult = { id: string; referenceNumber: string; status: ComplaintStatus };

export type ComplaintQueueFilter = { branchId?: string | null; role?: RoleCode | null };
export type ComplaintReportRow = { id: string; referenceNumber: string; branchId: string; categoryId: string; status: ComplaintStatus; severity: ComplaintSeverity; subject: string; ownerId: string | null; displayTimeZone: string; createdAt: string; updatedAt: string };
export type ComplaintSearchInput = ComplaintReportFilter & { sla?: ComplaintQueueItemDto['slaState'] | null };
export type ComplaintSearchRow = ComplaintQueueItemDto & { categoryId: string; customerName: string; customerPhone: string; customerIdentifier: string | null };

type WorkflowTransition = { fromStatus: ComplaintStatus; action: ComplaintTransitionAction; toStatus: ComplaintStatus; allowedRoles: readonly RoleCode[] };

const MANAGER_ROLES = [RoleCode.CR_MANAGER, RoleCode.ADMIN] as const;
const BRANCH_MANAGER_ROLES = [RoleCode.BRANCH_MANAGER, RoleCode.CR_MANAGER, RoleCode.ADMIN] as const;
const OWNER_OR_BRANCH_MANAGER_ROLES = [RoleCode.CR_OFFICER, ...BRANCH_MANAGER_ROLES] as const;

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
  transition(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.ADD_INVESTIGATION_UPDATE, ComplaintStatus.IN_PROGRESS, OWNER_OR_BRANCH_MANAGER_ROLES),
  transition(ComplaintStatus.IN_PROGRESS, ComplaintTransitionAction.RESOLVE, ComplaintStatus.RESOLVED, OWNER_OR_BRANCH_MANAGER_ROLES),
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
  constructor(private readonly complaintsRepository: ComplaintsRepository, private readonly auditService: AuditService, private readonly notificationsService?: NotificationsService, private readonly casesService?: CasesService, private readonly slaService?: SlaService, private readonly surveysService?: SurveysService, private readonly tasksService?: TasksService, private readonly groupsService?: CommunicationGroupsService) {}

  async createInternal(input: CreateInternalComplaintInput): Promise<ComplaintCreationResult> {
    const data = createComplaintData(input);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const committed = await this.complaintsRepository.transaction(async (client) => {
          const referenceNumber = data.status === ComplaintStatus.DRAFT
            ? `DRAFT-${randomUUID()}`
            : await this.complaintsRepository.nextReferenceNumber(data.branchId, new Date(), client);
          const complaint = await this.complaintsRepository.create({ ...data, referenceNumber }, client);
          await this.complaintsRepository.createStatusHistory({
            complaintId: complaint.id,
            fromStatus: null,
            toStatus: complaint.status,
            action: complaint.status === ComplaintStatus.SUBMITTED ? ComplaintTransitionAction.SUBMIT : null,
            actorId: input.actorId ?? null,
            actorRole: null,
            requestSource: input.requestSource ?? ComplaintTransitionRequestSource.STAFF_API,
            reason: null,
            correlationId: input.correlationId ?? null,
          }, client);
          await this.casesService?.ensureCustomerComplaintCaseForComplaint({ complaintId: complaint.id, branchId: complaint.branchId, ownerId: input.actorId ?? null, subject: complaint.subject, descriptionEn: data.descriptionEn, status: complaint.status, actorId: input.actorId ?? null, correlationId: input.correlationId ?? null }, client);
          await this.auditService.record(complaintCreatedAudit(input, complaint), client);
          return { result: { id: complaint.id, referenceNumber: complaint.referenceNumber, status: complaint.status }, complaint };
        });
        if (committed.result.status === ComplaintStatus.SUBMITTED) await queueComplaintCreationSideEffects({ notificationsService: this.notificationsService, slaService: this.slaService, input, complaint: committed.complaint, enteredAt: new Date() });
        return committed.result;
      } catch (error) {
        if (isReferenceConflict(error) && attempt === 0) continue;
        if (isReferenceConflict(error)) throw referenceConflictError();
        throw error;
      }
    }
    throw referenceConflictError();
  }

  async listQueue(filter: ComplaintQueueFilter = {}): Promise<ComplaintQueueItemDto[]> { return (await this.complaintsRepository.listQueue(filter)).map((item) => queueItem(item, this.slaService)); }

  async listForReports(filter: ComplaintReportFilter = {}): Promise<ComplaintReportRow[]> { return (await this.complaintsRepository.listForReports(filter)).map(reportItem); }

  async search(input: ComplaintSearchInput = {}): Promise<ComplaintSearchRow[]> {
    const rows = (await this.complaintsRepository.search(input.sla ? withoutSlaPage(input) : input)).map((item) => searchItem(item, shouldMask(input), this.slaService));
    if (!input.sla) return rows;
    const offset = input.offset ?? 0, filtered = rows.filter((row) => row.slaState === input.sla);
    return filtered.slice(offset, offset + (input.limit ?? filtered.length));
  }

  async findPortalVerificationTarget(referenceNumber: string, customerPhone: string): Promise<PortalVerificationTargetRecord | null> { return this.complaintsRepository.findPortalVerificationTarget(referenceNumber.trim(), customerPhone.trim()); }

  async getDetail(id: string, filter: ComplaintQueueFilter = {}): Promise<ComplaintDetailDto> { const complaint = await this.complaintsRepository.findDetail(id, filter); if (!complaint) throw new AppException('COMPLAINT_NOT_FOUND', 'Complaint not found', HttpStatus.NOT_FOUND); return { ...detailItem(complaint, shouldMask(filter), this.slaService), caseSummary: await this.complaintCaseSummary(complaint.id) }; }

  async timeline(id: string, filter: ComplaintQueueFilter = {}): Promise<ComplaintTimelineItemDto[]> {
    const complaint = await this.getDetail(id, filter);
    const [facts, tasks] = await Promise.all([
      this.complaintsRepository.timelineFacts(id),
      this.tasksService?.timelineForComplaint(id) ?? Promise.resolve([]),
    ]);
    return timelineItems(complaint, facts, tasks);
  }

  allowedActionsFor(complaint: Pick<ComplaintDetailDto, 'ownerId' | 'status'>, actor: { roleCode: RoleCode; userId: string | null }): ComplaintTransitionAction[] { return WORKFLOW_TRANSITIONS.filter((item) => item.fromStatus === complaint.status && item.allowedRoles.includes(actor.roleCode) && actorCanSeeAction(item.action, actor, complaint)).map((item) => item.action); }

  async correctProvenance(input: ApplyComplaintCorrectionInput): Promise<ApplyComplaintCorrectionResult> { const data = complaintCorrectionData(input); return this.complaintsRepository.transaction(async (client) => { const complaint = await this.complaintsRepository.updateCorrection(data, client); if (!complaint) throw correctionConflictError(); await this.auditService.record(complaintCorrectionAudit(input, complaint.branchId, data.changedFields), client); return { complaintId: complaint.id, changedFields: data.changedFields }; }); }

  async createComment(input: CreateComplaintCommentInput): Promise<ComplaintCommentResult> {
    return createComplaintComment({ repository: this.complaintsRepository, audit: this.auditService, notifications: this.notificationsService, tasks: this.tasksService, groups: this.groupsService }, input);
  }

  async listComments(complaintId: string): Promise<ComplaintCommentResult[]> { return listComplaintComments(this.complaintsRepository, complaintId); }

  async listPublicComments(complaintId: string): Promise<ComplaintCommentResult[]> { return listPublicComplaintComments(this.complaintsRepository, complaintId); }

  async communicationTargets(complaintId: string, actor: CommunicationActor, query = '') {
    return complaintCommunicationTargets({ repository: this.complaintsRepository, audit: this.auditService, notifications: this.notificationsService, tasks: this.tasksService, groups: this.groupsService }, complaintId, actor, query);
  }

  async addWatcher(complaintId: string, userId: string, actor: CommunicationActor, audit: Pick<CreateComplaintCommentInput, 'correlationId' | 'ipAddress' | 'userAgent'> = {}): Promise<void> {
    return addComplaintWatcher({ repository: this.complaintsRepository, audit: this.auditService, notifications: this.notificationsService, tasks: this.tasksService, groups: this.groupsService }, complaintId, userId, actor, audit);
  }

  async removeWatcher(complaintId: string, userId: string, actor: CommunicationActor, audit: Pick<CreateComplaintCommentInput, 'correlationId' | 'ipAddress' | 'userAgent'> = {}): Promise<void> {
    return removeComplaintWatcher({ repository: this.complaintsRepository, audit: this.auditService, notifications: this.notificationsService, tasks: this.tasksService, groups: this.groupsService }, complaintId, userId, actor, audit);
  }

  validateTransition(input: ValidateComplaintTransitionInput): ComplaintTransitionDecision {
    const transition = WORKFLOW_TRANSITIONS.find(
      (candidate) => candidate.fromStatus === input.fromStatus && candidate.action === input.action,
    );

    if (!transition) throw invalidTransitionError();
    if (!transition.allowedRoles.includes(input.actorRole)) throw roleForbiddenError();

    return { fromStatus: input.fromStatus, action: input.action, actorRole: input.actorRole, toStatus: transition.toStatus };
  }

  async applyTransition(input: ApplyComplaintTransitionInput): Promise<ApplyComplaintTransitionResult> {
    let decision: ComplaintTransitionDecision;
    try {
      decision = this.validateTransition(input);
    } catch (error) {
      if (error instanceof AppException && error.code === 'RBAC_FORBIDDEN') {
        await recordWorkflowRoleForbidden(this.auditService, input);
      }
      throw error;
    }

    validateRequiredTransitionData(input);

    let committed: { result: ApplyComplaintTransitionResult; complaint: ComplaintStatusRecord };
    try {
      committed = await this.complaintsRepository.transaction(async (client) => {
        if (input.action === ComplaintTransitionAction.CLOSE) {
          assertVehicleClosureAllowed(input, await this.complaintsRepository.findTransitionSubject(input.complaintId, client));
        }
        const complaint = await this.complaintsRepository.updateStatus(
          statusUpdateData(input, decision.toStatus),
          client,
        );

        if (!complaint) throw invalidTransitionError();
        assertActorCanApplyTransition(input, complaint);

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

        return { result: { complaintId: complaint.id, ...decision }, complaint };
      });
    } catch (error: unknown) {
      if (isReferenceConflict(error)) throw referenceConflictError();
      if (error instanceof AppException && error.code === 'RBAC_FORBIDDEN') {
        await recordWorkflowRoleForbidden(this.auditService, input);
      }
      throw error;
    }
    await queueWorkflowSideEffects({ notificationsService: this.notificationsService, slaService: this.slaService, surveysService: this.surveysService, input, toStatus: committed.result.toStatus, complaint: committed.complaint, enteredAt: new Date() });
    return committed.result;
  }

  private async complaintCaseSummary(complaintId: string): Promise<ComplaintCaseSummaryDto | null> {
    const item = await this.casesService?.customerComplaintCaseSummary(complaintId);
    return item ? { id: item.id, type: item.type, status: item.status, lifecycleStatus: item.lifecycleStatus, confidentialityLevel: item.confidentialityLevel, branchId: item.branchId, branchName: item.branchName, ownerId: item.ownerId, ownerName: item.ownerName } : null;
  }

}

function requiredTextError(value: unknown, field: string) { return typeof value === 'string' && value.trim() ? [] : [{ field, code: 'REQUIRED', message: `${field} is required.` }]; }

function invalidTransitionError(): AppException { return new AppException('COMPLAINT_INVALID_TRANSITION', 'The requested action is not allowed for the current complaint state.', HttpStatus.CONFLICT); }
function roleForbiddenError(): AppException { return new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN); }

const REASON_REQUIRED = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.APPROVE_AND_ROUTE, ComplaintTransitionAction.SEND_BACK, ComplaintTransitionAction.ASSIGN_INVESTIGATION, ComplaintTransitionAction.CLOSE, ComplaintTransitionAction.REOPEN, ComplaintTransitionAction.ROUTE_AGAIN, ComplaintTransitionAction.REJECT_AS_INVALID, ComplaintTransitionAction.REJECT_AFTER_REVIEW, ComplaintTransitionAction.REJECT_AFTER_INVESTIGATION, ComplaintTransitionAction.REJECT_RESOLUTION]);
const RESOLUTION_REQUIRED = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.RESOLVE, ComplaintTransitionAction.RESOLVE_DIRECTLY]), OWNER_ALLOWED_ACTIONS = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.ADD_INVESTIGATION_UPDATE, ComplaintTransitionAction.RESOLVE]), OWNER_REQUIRED = new Set<ComplaintTransitionAction>([ComplaintTransitionAction.APPROVE_AND_ROUTE, ComplaintTransitionAction.ASSIGN_INVESTIGATION]);

function assertActorCanApplyTransition(input: ApplyComplaintTransitionInput, complaint: ComplaintStatusRecord): void {
  if (!OWNER_ALLOWED_ACTIONS.has(input.action) || (BRANCH_MANAGER_ROLES as readonly RoleCode[]).includes(input.actorRole)) return;
  if (input.actorId && complaint.ownerId === input.actorId) return;
  throw roleForbiddenError();
}

function actorCanSeeAction(action: ComplaintTransitionAction, actor: { roleCode: RoleCode; userId: string | null }, complaint: Pick<ComplaintDetailDto, 'ownerId'>): boolean { return !OWNER_ALLOWED_ACTIONS.has(action) || (BRANCH_MANAGER_ROLES as readonly RoleCode[]).includes(actor.roleCode) || Boolean(actor.userId && complaint.ownerId === actor.userId); }

async function recordWorkflowRoleForbidden(auditService: AuditService, input: ApplyComplaintTransitionInput): Promise<void> {
  await auditService.record({ eventType: 'SECURITY', action: 'workflow_role_forbidden', actorId: input.actorId ?? null, branchId: null, targetType: 'complaint', targetId: input.complaintId, correlationId: input.correlationId ?? null, ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null, metadata: { fromStatus: input.fromStatus, action: input.action, actorRole: input.actorRole, requestSource: input.requestSource } });
}

function validateRequiredTransitionData(input: ApplyComplaintTransitionInput): void {
  const errors = [
    ...(REASON_REQUIRED.has(input.action) ? requiredTextError(input.reason, 'reason') : []),
    ...(input.action === ComplaintTransitionAction.APPROVE_AND_ROUTE ? requiredTextError(input.targetBranchId, 'targetBranchId') : []),
    ...(input.action === ComplaintTransitionAction.APPROVE_AND_ROUTE ? requiredTextError(input.targetDepartmentId, 'targetDepartmentId') : []),
    ...(OWNER_REQUIRED.has(input.action) ? requiredTextError(input.ownerId, 'ownerId') : []),
    ...(RESOLUTION_REQUIRED.has(input.action) ? requiredTextError(input.resolutionType, 'resolutionType') : []),
    ...(RESOLUTION_REQUIRED.has(input.action) ? requiredTextError(input.resolutionSummary, 'resolutionSummary') : []),
    ...(RESOLUTION_REQUIRED.has(input.action) && !input.actorId ? [{ field: 'actorId', code: 'REQUIRED', message: 'actorId is required.' }] : []),
    ...(input.action === ComplaintTransitionAction.CLOSE ? requiredTextError(input.customerCommunicationStatus, 'customerCommunicationStatus') : []),
  ];
  if (errors.length) throw new AppException('VALIDATION_FAILED', 'Invalid complaint transition request', HttpStatus.BAD_REQUEST, errors);
}

function assertVehicleClosureAllowed(input: ApplyComplaintTransitionInput, complaint: ComplaintTransitionSubject | null): void {
  if (!complaint) throw invalidTransitionError();
  if (!complaint.vehicleRelated || complaint.vehicleId || nonEmptyText(input.vehicleDataUnavailableReason) || nonEmptyText(complaint.vehicleDataUnavailableReason)) return;
  throw new AppException('VALIDATION_FAILED', 'Invalid complaint transition request', HttpStatus.BAD_REQUEST, [{ field: 'vehicleDataUnavailableReason', code: 'REQUIRED', message: 'vehicleDataUnavailableReason is required.' }]);
}

function statusUpdateData(input: ApplyComplaintTransitionInput, toStatus: ComplaintStatus) {
  const now = new Date();
  return { complaintId: input.complaintId, fromStatus: input.fromStatus, toStatus, ...(input.action === ComplaintTransitionAction.APPROVE_AND_ROUTE ? { targetBranchId: input.targetBranchId, targetDepartmentId: input.targetDepartmentId, ownerId: input.ownerId } : {}), ...(input.action === ComplaintTransitionAction.ASSIGN_INVESTIGATION ? { ownerId: input.ownerId } : {}), ...(RESOLUTION_REQUIRED.has(input.action) ? { resolvedAt: now } : {}), ...(input.action === ComplaintTransitionAction.CLOSE ? { closedAt: now } : {}), ...(input.action === ComplaintTransitionAction.CLOSE && nonEmptyText(input.vehicleDataUnavailableReason) ? { vehicleDataUnavailableReason: input.vehicleDataUnavailableReason } : {}) };
}

function workflowAuditInput(input: ApplyComplaintTransitionInput, toStatus: ComplaintStatus, branchId: string): AuditRecordInput {
  return {
    eventType: 'WORKFLOW', action: `transition_${input.action.toLowerCase()}`, actorId: input.actorId ?? null,
    branchId, targetType: 'complaint', targetId: input.complaintId,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: { fromStatus: input.fromStatus, toStatus, action: input.action, actorRole: input.actorRole, requestSource: input.requestSource, resolutionType: input.resolutionType ?? null, customerCommunicationStatus: input.customerCommunicationStatus ?? null },
  };
}

function nonEmptyText(value: string | null | undefined): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function withoutSlaPage(input: ComplaintSearchInput): ComplaintReportFilter { const filter = { ...input }; delete filter.sla; delete filter.limit; delete filter.offset; return filter; }
