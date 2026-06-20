import { HttpStatus, Injectable } from '@nestjs/common';
import { RoleCode, TaskLinkEntityType } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { DealBoardItemDto, DealHandoffBoardResponseDto } from './dto/deal-response.dto.js';
import { DealsRepository } from './deals.repository.js';
import type { DealRow } from './deals.repository.js';
import { TasksService } from '../tasks/tasks.service.js';

export const dealStages = ['LEAD', 'QUALIFIED', 'TEST_DRIVE', 'QUOTE', 'FINANCE', 'DELIVERY', 'POST_DELIVERY'] as const;
export type DealStageCode = (typeof dealStages)[number];

export type DealRecord = {
  id: string;
  title: string;
  branchId: string;
  ownerId: string;
  currentHolderId: string;
  stage: DealStageCode;
  stageDueAt: string;
  blocker: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateDealInput = {
  title: string;
  branchId: string;
  ownerId: string;
  currentHolderId: string;
  stageDueAt: Date | string;
  stage?: DealStageCode;
  blocker?: string | null;
};

export type AdvanceDealStageInput = {
  deal: DealRecord;
  toStage: DealStageCode;
  currentHolderId: string;
  stageDueAt: Date | string;
  blocker?: string | null;
};

type DealAuditContext = {
  actorId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};
type DealBoardScope = { roleCode: string; branchId: string | null };

@Injectable()
export class DealsService {
  constructor(
    private readonly dealsRepository: DealsRepository,
    private readonly tasksService?: TasksService,
    private readonly auditService?: AuditService,
  ) {}

  create(input: CreateDealInput, now: Date = new Date()): DealRecord {
    return {
      id: `deal_${now.getTime()}`,
      title: requiredText(input.title, 'title'),
      branchId: requiredText(input.branchId, 'branchId'),
      ownerId: requiredText(input.ownerId, 'ownerId'),
      currentHolderId: requiredText(input.currentHolderId, 'currentHolderId'),
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
    return {
      ...input.deal,
      stage: toStage,
      currentHolderId: requiredText(input.currentHolderId, 'currentHolderId'),
      stageDueAt: validDate(input.stageDueAt, 'stageDueAt').toISOString(),
      blocker: optionalText(input.blocker),
      updatedAt: now.toISOString(),
    };
  }

  async createPersisted(input: CreateDealInput, audit: DealAuditContext = {}): Promise<DealRecord> {
    const data = normalizedCreate(input);
    return this.dealsRepository.transaction(async (client) => {
      const deal = await this.dealsRepository.create(data, client);
      await this.auditService?.record(dealAudit('deal_created', toResponse(deal), audit, { stage: deal.stage }), client);
      return toResponse(deal);
    });
  }

  async advanceStagePersisted(input: AdvanceDealStageInput, audit: DealAuditContext = {}): Promise<{ deal: DealRecord; taskId: string }> {
    const tasksService = this.tasksService;
    if (!tasksService) throw new AppException('VALIDATION_FAILED', 'Tasks service is required', HttpStatus.BAD_REQUEST);
    const next = this.advanceStage(input);
    return this.dealsRepository.transaction(async (client) => {
      const deal = toResponse(await this.dealsRepository.updateStage({
        id: next.id,
        stage: next.stage,
        currentHolderId: next.currentHolderId,
        stageDueAt: new Date(next.stageDueAt),
        blocker: next.blocker,
      }, client));
      await this.auditService?.record(dealAudit('deal_stage_advanced', deal, audit, { fromStage: input.deal.stage, toStage: deal.stage }), client);
      const task = await tasksService.createInTransaction({
        title: `Complete deal ${deal.stage}`,
        ownerId: deal.ownerId,
        assigneeId: deal.currentHolderId,
        dueAt: deal.stageDueAt,
        nextAction: { what: `Complete ${deal.stage} stage`, whoId: deal.currentHolderId, when: deal.stageDueAt },
        links: [{ entityType: TaskLinkEntityType.DEAL, entityId: deal.id }],
      }, audit, client);
      return { deal, taskId: task.id };
    });
  }

  async handoffBoard(scope: DealBoardScope, now: Date = new Date()): Promise<DealHandoffBoardResponseDto> {
    const rows = await this.dealsRepository.listHandoffBoard(managerBranchId(scope));
    const deals = rows.map((deal) => boardItem(deal, now));
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

function boardItem(deal: DealRow, now: Date): DealBoardItemDto {
  const response = toResponse(deal);
  return {
    ...response,
    delayAgeMinutes: Math.max(0, Math.floor((now.getTime() - deal.stageDueAt.getTime()) / 60_000)),
  };
}

function holderCounts(deals: DealBoardItemDto[]) {
  const grouped = new Map<string, number>();
  for (const deal of deals) grouped.set(deal.currentHolderId, (grouped.get(deal.currentHolderId) ?? 0) + 1);
  return [...grouped].map(([currentHolderId, count]) => ({ currentHolderId, count }));
}

function normalizedCreate(input: CreateDealInput) {
  return {
    title: requiredText(input.title, 'title'),
    branchId: requiredText(input.branchId, 'branchId'),
    ownerId: requiredText(input.ownerId, 'ownerId'),
    currentHolderId: requiredText(input.currentHolderId, 'currentHolderId'),
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
    ownerId: deal.ownerId,
    currentHolderId: deal.currentHolderId,
    stage: validStage(deal.stage),
    stageDueAt: deal.stageDueAt.toISOString(),
    blocker: deal.blocker,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
  };
}

function dealAudit(action: string, deal: DealRecord, context: DealAuditContext, metadata: Record<string, string>): AuditRecordInput {
  return {
    eventType: 'WORKFLOW',
    action,
    actorId: context.actorId ?? null,
    branchId: deal.branchId,
    targetType: 'deal',
    targetId: deal.id,
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata,
  };
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
