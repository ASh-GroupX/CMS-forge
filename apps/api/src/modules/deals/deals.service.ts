import { HttpStatus, Injectable } from '@nestjs/common';
import { RoleCode, TaskLinkEntityType } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { DealHandoffBoardResponseDto } from './dto/deal-response.dto.js';
import { DealsRepository } from './deals.repository.js';
import type { DealRow } from './deals.repository.js';
import { boardItem, dealAudit, groupHistory, holderCounts } from './deals.read-models.js';
import { TasksService } from '../tasks/tasks.service.js';
import type { AssignmentsService } from '../assignments/assignments.service.js';

export const dealStages = ['LEAD', 'BOOKING', 'PAYMENT', 'FINANCE', 'INSURANCE', 'REGISTRATION', 'PDI', 'DELIVERY', 'POST_DELIVERY'] as const;
export type DealStageCode = (typeof dealStages)[number];

export type DealRecord = { id: string; title: string; branchId: string; branchName: string | null; ownerId: string; ownerName: string | null; currentHolderId: string | null; currentHolderName: string | null; assignedDepartmentId: string | null; assignedDepartmentName: string | null; assignedDepartmentNameAr: string | null; stage: DealStageCode; stageDueAt: string; blocker: string | null; createdAt: string; updatedAt: string };

export type CreateDealInput = { title: string; branchId: string; ownerId: string; currentHolderId?: string | null; assignedDepartmentId?: string | null; stageDueAt: Date | string; stage?: DealStageCode; blocker?: string | null };
export type AdvanceDealStageInput = { deal: DealRecord; toStage: DealStageCode; currentHolderId?: string | null; assignedDepartmentId?: string | null; stageDueAt: Date | string; blocker?: string | null; updateNote?: string | null };

type DealAuditContext = { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };
type DealBoardScope = { roleCode: string; branchId: string | null };
export type DealWriteActor = { userId: string; roleCode: string; branchId: string | null };

@Injectable()
export class DealsService {
  constructor(
    private readonly dealsRepository: DealsRepository,
    private readonly tasksService?: TasksService,
    private readonly auditService?: AuditService,
    private readonly assignmentsService?: AssignmentsService,
  ) {}

  create(input: CreateDealInput, now: Date = new Date()): DealRecord {
    const currentHolderId = assignmentUser(input.currentHolderId);
    const assignedDepartmentId = assignmentDepartment(input.assignedDepartmentId);
    requireAssignment(currentHolderId, assignedDepartmentId);
    return {
      id: `deal_${now.getTime()}`,
      title: requiredText(input.title, 'title'),
      branchId: requiredText(input.branchId, 'branchId'),
      branchName: null,
      ownerId: requiredText(input.ownerId, 'ownerId'),
      ownerName: null,
      currentHolderId,
      currentHolderName: null,
      assignedDepartmentId,
      assignedDepartmentName: null,
      assignedDepartmentNameAr: null,
      stage: validStage(input.stage ?? 'LEAD'),
      stageDueAt: validDate(input.stageDueAt, 'stageDueAt').toISOString(),
      blocker: optionalText(input.blocker),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  advanceStage(input: AdvanceDealStageInput, now: Date = new Date()): DealRecord {
    const fromIndex = dealStages.indexOf(validStage(input.deal.stage));
    const toStage = validStage(input.toStage);
    if (dealStages.indexOf(toStage) !== fromIndex + 1) {
      throw new AppException('DEAL_INVALID_STAGE_TRANSITION', 'Invalid deal stage transition', HttpStatus.CONFLICT);
    }
    if (input.deal.blocker) {
      throw new AppException('DEAL_BLOCKED', 'Deal blocker must be cleared before advancing', HttpStatus.CONFLICT);
    }
    const currentHolderId = assignmentUser(input.currentHolderId);
    const assignedDepartmentId = input.assignedDepartmentId === undefined
      ? input.deal.assignedDepartmentId
      : assignmentDepartment(input.assignedDepartmentId);
    requireAssignment(currentHolderId, assignedDepartmentId);
    return {
      ...input.deal,
      stage: toStage,
      currentHolderId,
      assignedDepartmentId,
      stageDueAt: validDate(input.stageDueAt, 'stageDueAt').toISOString(),
      blocker: optionalText(input.blocker),
      updatedAt: now.toISOString(),
    };
  }

  async createForActor(input: Omit<CreateDealInput, 'branchId' | 'ownerId'> & { branchId?: string }, actor: DealWriteActor, audit: DealAuditContext = {}): Promise<DealRecord> {
    const branchId = actor.roleCode === RoleCode.ADMIN ? requiredText(input.branchId ?? '', 'branchId') : scopedBranchId(actor);
    const deal = await this.createPersisted({ ...input, branchId, ownerId: actor.userId }, audit, actor);
    await this.assignmentsService?.notifyAfterCommit?.('DEAL', deal.id, { href: `/deals/${deal.id}`, title: deal.title });
    return deal;
  }

  async advanceForActor(id: string, input: { currentHolderId: string | null; assignedDepartmentId?: string | null; stageDueAt: Date | string; updateNote: string }, actor: DealWriteActor, audit: DealAuditContext = {}): Promise<{ deal: DealRecord; taskId: string }> {
    const deal = await this.dealsRepository.findById(requiredText(id, 'id'));
    if (!deal) throw new AppException('DEAL_NOT_FOUND', 'Deal was not found', HttpStatus.NOT_FOUND);
    const current = toResponse(deal);
    assertDealWriteAllowed(current, actor);
    const result = await this.advanceStagePersisted({
      deal: current,
      toStage: nextStage(current.stage),
      currentHolderId: input.currentHolderId,
      ...(input.assignedDepartmentId !== undefined ? { assignedDepartmentId: input.assignedDepartmentId } : {}),
      stageDueAt: input.stageDueAt,
      updateNote: input.updateNote,
    }, audit, actor);
    await this.assignmentsService?.notifyAfterCommit?.('DEAL', result.deal.id, { href: `/deals/${result.deal.id}`, title: result.deal.title });
    await this.assignmentsService?.notifyAfterCommit?.('TASK', result.taskId, { href: `/tasks/${result.taskId}`, title: `Complete deal ${result.deal.stage}` });
    return result;
  }

  async updateBlockerForActor(id: string, input: { blocker: string | null; updateNote: string }, actor: DealWriteActor, audit: DealAuditContext = {}): Promise<DealRecord> {
    const updateNote = requiredText(input.updateNote, 'updateNote');
    return this.dealsRepository.transaction(async (client) => {
      const current = await this.dealsRepository.findById(requiredText(id, 'id'), client);
      if (!current) throw new AppException('DEAL_NOT_FOUND', 'Deal was not found', HttpStatus.NOT_FOUND);
      const existing = toResponse(current);
      assertDealWriteAllowed(existing, actor);
      const deal = toResponse(await this.dealsRepository.updateBlocker({ id: existing.id, blocker: optionalText(input.blocker) }, client));
      await this.auditService?.record(dealAudit(deal.blocker ? 'deal_blocker_set' : 'deal_blocker_cleared', deal, audit, { stage: deal.stage, updateNote }), client);
      return deal;
    });
  }

  async updateDetailsForActor(id: string, input: { currentHolderId: string | null; assignedDepartmentId?: string | null; stageDueAt: Date | string; updateNote: string }, actor: DealWriteActor, audit: DealAuditContext = {}): Promise<DealRecord> {
    const updateNote = requiredText(input.updateNote, 'updateNote');
    const deal = await this.dealsRepository.transaction(async (client) => {
      const current = await this.dealsRepository.findById(requiredText(id, 'id'), client);
      if (!current) throw new AppException('DEAL_NOT_FOUND', 'Deal was not found', HttpStatus.NOT_FOUND);
      const existing = toResponse(current);
      assertDealWriteAllowed(existing, actor);
      const currentHolderId = assignmentUser(input.currentHolderId);
      const assignedDepartmentId = input.assignedDepartmentId === undefined
        ? existing.assignedDepartmentId
        : assignmentDepartment(input.assignedDepartmentId);
      requireAssignment(currentHolderId, assignedDepartmentId);
      const deal = toResponse(await this.dealsRepository.updateDetails({
        id: existing.id,
        currentHolderId,
        assignedDepartmentId,
        stageDueAt: validDate(input.stageDueAt, 'stageDueAt'),
      }, client));
      await this.auditService?.record(dealAudit('deal_details_updated', deal, audit, { stage: deal.stage, updateNote }), client);
      await this.assignmentsService?.setInTransaction({ entityType: 'DEAL', entityId: deal.id, assignedUserId: deal.currentHolderId, assignedDepartmentId: deal.assignedDepartmentId, scopeBranchId: deal.branchId, reason: updateNote }, actor, audit, client);
      return deal;
    });
    await this.assignmentsService?.notifyAfterCommit?.('DEAL', deal.id, { href: `/deals/${deal.id}`, title: deal.title });
    return deal;
  }

  async createPersisted(input: CreateDealInput, audit: DealAuditContext = {}, actor?: DealWriteActor): Promise<DealRecord> {
    const data = normalizedCreate(input);
    return this.dealsRepository.transaction(async (client) => {
      const deal = await this.dealsRepository.create(data, client);
      await this.auditService?.record(dealAudit('deal_created', toResponse(deal), audit, { stage: deal.stage }), client);
      if (actor) await this.assignmentsService?.setInTransaction({ entityType: 'DEAL', entityId: deal.id, assignedUserId: deal.currentHolderId, assignedDepartmentId: deal.assignedDepartmentId, scopeBranchId: deal.branchId }, actor, audit, client);
      return toResponse(deal);
    });
  }

  async advanceStagePersisted(input: AdvanceDealStageInput, audit: DealAuditContext = {}, actor?: DealWriteActor): Promise<{ deal: DealRecord; taskId: string }> {
    const tasksService = this.tasksService;
    if (!tasksService) throw new AppException('VALIDATION_FAILED', 'Tasks service is required', HttpStatus.BAD_REQUEST);
    const updateNote = requiredText(input.updateNote ?? '', 'updateNote');
    const next = this.advanceStage(input);
    return this.dealsRepository.transaction(async (client) => {
      const deal = toResponse(await this.dealsRepository.updateStage({
        id: next.id,
        stage: next.stage,
        currentHolderId: next.currentHolderId,
        assignedDepartmentId: next.assignedDepartmentId,
        stageDueAt: new Date(next.stageDueAt),
        blocker: next.blocker,
      }, client));
      await this.auditService?.record(dealAudit('deal_stage_advanced', deal, audit, { fromStage: input.deal.stage, toStage: deal.stage, updateNote }), client);
      if (actor) await this.assignmentsService?.setInTransaction({ entityType: 'DEAL', entityId: deal.id, assignedUserId: deal.currentHolderId, assignedDepartmentId: deal.assignedDepartmentId, scopeBranchId: deal.branchId, reason: updateNote }, actor, audit, client);
      const task = await tasksService.createInTransaction({
        title: `Complete deal ${deal.stage}`,
        ownerId: deal.ownerId,
        assigneeId: deal.currentHolderId,
        assignedDepartmentId: deal.assignedDepartmentId,
        dueAt: deal.stageDueAt,
        nextAction: deal.currentHolderId ? { what: `Complete ${deal.stage} stage`, whoId: deal.currentHolderId, when: deal.stageDueAt } : null,
        links: [{ entityType: TaskLinkEntityType.DEAL, entityId: deal.id }],
      }, audit, client, actor);
      return { deal, taskId: task.id };
    });
  }

  async handoffBoard(scope: DealBoardScope, now: Date = new Date()): Promise<DealHandoffBoardResponseDto> {
    const rows = await this.dealsRepository.listHandoffBoard(managerBranchId(scope));
    const history = groupHistory(await this.dealsRepository.listHandoffHistory(rows.map((deal) => deal.id)));
    const deals = rows.map((deal) => boardItem(deal, now, history.get(deal.id) ?? [], toResponse));
    return {
      byStage: dealStages.map((stage) => {
        const stageDeals = deals.filter((deal) => deal.stage === stage);
        return { stage, count: stageDeals.length, deals: stageDeals };
      }),
      stuck: deals.filter((deal) => deal.blocker || deal.delayAgeMinutes > 0),
      currentHolder: holderCounts(deals),
    };
  }
}

function managerBranchId(scope: DealBoardScope): string | null {
  if (!managerRoles.has(scope.roleCode)) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  if (scope.roleCode === RoleCode.ADMIN) return null;
  if (!scope.branchId) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  return scope.branchId;
}

const managerRoles = new Set<string>([RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN, RoleCode.MGMT_READONLY]);
const writeRoles = new Set<string>([RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN]);

function scopedBranchId(actor: DealWriteActor): string {
  if (!actor.branchId) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  return actor.branchId;
}

function assertDealWriteAllowed(deal: DealRecord, actor: DealWriteActor): void {
  if (!writeRoles.has(actor.roleCode)) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  if (actor.roleCode !== RoleCode.ADMIN && scopedBranchId(actor) !== deal.branchId) {
    throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }
}

function nextStage(stage: DealStageCode): DealStageCode {
  const next = dealStages[dealStages.indexOf(stage) + 1];
  if (!next) throw new AppException('DEAL_INVALID_STAGE_TRANSITION', 'Invalid deal stage transition', HttpStatus.CONFLICT);
  return next;
}


function normalizedCreate(input: CreateDealInput) {
  const currentHolderId = assignmentUser(input.currentHolderId);
  const assignedDepartmentId = assignmentDepartment(input.assignedDepartmentId);
  requireAssignment(currentHolderId, assignedDepartmentId);
  return {
    title: requiredText(input.title, 'title'),
    branchId: requiredText(input.branchId, 'branchId'),
    ownerId: requiredText(input.ownerId, 'ownerId'),
    currentHolderId,
    assignedDepartmentId,
    stage: validStage(input.stage ?? 'LEAD'),
    stageDueAt: validDate(input.stageDueAt, 'stageDueAt'),
    blocker: optionalText(input.blocker),
  };
}

function toResponse(deal: DealRow): DealRecord {
  return {
    id: deal.id,
    title: deal.title,
    branchId: deal.branchId,
    branchName: deal.branch?.nameEn ?? null,
    ownerId: deal.ownerId,
    ownerName: deal.owner?.nameEn ?? null,
    currentHolderId: deal.currentHolderId,
    currentHolderName: deal.currentHolder?.nameEn ?? null,
    assignedDepartmentId: deal.assignedDepartmentId,
    assignedDepartmentName: deal.assignedDepartment?.nameEn ?? null,
    assignedDepartmentNameAr: deal.assignedDepartment?.nameAr ?? null,
    stage: validStage(deal.stage),
    stageDueAt: deal.stageDueAt.toISOString(),
    blocker: deal.blocker,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  };
}

function assignmentUser(value: string | null | undefined): string | null { return optionalText(value); }
function assignmentDepartment(value: string | null | undefined): string | null { return optionalText(value); }
function requireAssignment(userId: string | null, departmentId: string | null): void {
  if (userId || departmentId) return;
  throw invalid('assignment');
}

function validStage(value: string): DealStageCode {
  if (!dealStages.includes(value as DealStageCode)) throw invalid('stage');
  return value as DealStageCode;
}

function requiredText(value: string, field: string): string {
  const text = value.trim();
  if (!text) throw invalid(field);
  return text;
}

function optionalText(value: string | null | undefined): string | null {
  const text = value?.trim() ?? '';
  return text || null;
}

function validDate(value: Date | string, field: string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw invalid(field);
  return date;
}

function invalid(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid deal request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}
