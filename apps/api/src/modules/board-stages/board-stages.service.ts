import { HttpStatus, Injectable } from '@nestjs/common';
import { BoardScope } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { TasksBoardService } from '../tasks/tasks.board.service.js';
import { BoardStagesRepository } from './board-stages.repository.js';
import type { BoardStageRecord, CreateBoardStageData, UpdateBoardStageData } from './board-stages.repository.js';
import type { BoardStageAdminDto } from './dto/board-stage-response.dto.js';

type StageAuditContext = {
  actorId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class BoardStagesService {
  constructor(
    private readonly stagesRepository: BoardStagesRepository,
    private readonly auditService: AuditService,
    private readonly tasksBoardService: Pick<TasksBoardService, 'reassignStage'>,
  ) {}

  async list(scope?: BoardScope): Promise<BoardStageAdminDto[]> {
    const stages = await this.stagesRepository.listActive(scope);
    return stages.map(toResponse);
  }

  async create(input: CreateBoardStageData, audit: StageAuditContext = {}): Promise<BoardStageAdminDto> {
    return this.stagesRepository.transaction(async (client) => {
      const position = await this.stagesRepository.nextPosition(input.scope, client);
      const stage = await this.stagesRepository.create({ ...input, position }, client);
      await this.auditService.record(auditInput('board_stage_created', stage, audit, input as unknown as Record<string, unknown>), client);
      return toResponse(stage);
    });
  }

  async update(id: string, input: UpdateBoardStageData, audit: StageAuditContext = {}): Promise<BoardStageAdminDto> {
    return this.stagesRepository.transaction(async (client) => {
      await this.requireActiveStage(id, client);
      const stage = await this.stagesRepository.update(id, input, client);
      await this.auditService.record(auditInput('board_stage_updated', stage, audit, input), client);
      return toResponse(stage);
    });
  }

  // Reorder is all-or-nothing: the ordered ids must be exactly the active
  // stages of the scope so a stale admin screen cannot silently drop columns.
  async reorder(scope: BoardScope, orderedIds: string[], audit: StageAuditContext = {}): Promise<BoardStageAdminDto[]> {
    return this.stagesRepository.transaction(async (client) => {
      const active = await this.stagesRepository.listActive(scope);
      const activeIds = new Set(active.map((stage) => stage.id));
      if (orderedIds.length !== active.length || orderedIds.some((id) => !activeIds.has(id))) {
        throw new AppException('BOARD_STAGE_ORDER_MISMATCH', 'orderedIds must list every active stage of the scope exactly once', HttpStatus.CONFLICT);
      }
      for (const [position, id] of orderedIds.entries()) {
        await this.stagesRepository.setPosition(id, position, client);
      }
      await this.auditService.record(
        { ...auditBase('board_stages_reordered', audit), targetType: 'board_stage', targetId: scope, metadata: { scope, orderedIds } },
        client,
      );
      const stages = await this.stagesRepository.listActive(scope);
      return stages.map(toResponse);
    });
  }

  // Archiving always names a destination so no card is stranded: TASKS cards
  // are moved on the same transaction; TICKETS columns regroup by their
  // mapped complaint status, so the destination must carry a mapping.
  async archive(id: string, destinationStageId: string, audit: StageAuditContext = {}, now: Date = new Date()): Promise<BoardStageAdminDto> {
    if (id === destinationStageId) {
      throw validation('destinationStageId', 'destinationStageId must be a different stage.');
    }
    return this.stagesRepository.transaction(async (client) => {
      const stage = await this.requireActiveStage(id, client);
      const destination = await this.requireActiveStage(destinationStageId, client, 'destinationStageId');
      if (destination.scope !== stage.scope) {
        throw validation('destinationStageId', 'destinationStageId must belong to the same board scope.');
      }
      if (stage.scope === BoardScope.TICKETS && !destination.mappedComplaintStatus) {
        throw validation('destinationStageId', 'destinationStageId must map a complaint status.');
      }
      const movedTasks = stage.scope === BoardScope.TASKS
        ? await this.tasksBoardService.reassignStage(stage.id, destination.id, client)
        : 0;
      const archived = await this.stagesRepository.archive(stage.id, now, client);
      await this.auditService.record(
        auditInput('board_stage_archived', archived, audit, { destinationStageId: destination.id, movedTasks }),
        client,
      );
      return toResponse(archived);
    });
  }

  private async requireActiveStage(
    id: string,
    client: Parameters<BoardStagesRepository['findById']>[1],
    field = 'id',
  ): Promise<BoardStageRecord> {
    const stage = await this.stagesRepository.findById(id, client);
    if (!stage || stage.archivedAt) {
      throw new AppException('BOARD_STAGE_NOT_FOUND', `Board stage was not found (${field})`, HttpStatus.NOT_FOUND);
    }
    return stage;
  }
}

function toResponse(stage: BoardStageRecord): BoardStageAdminDto {
  return {
    id: stage.id,
    code: stage.code,
    scope: stage.scope,
    nameEn: stage.nameEn,
    nameAr: stage.nameAr,
    color: stage.color,
    position: stage.position,
    isDefault: stage.isDefault,
    mappedTaskStatus: stage.mappedTaskStatus,
    mappedComplaintStatus: stage.mappedComplaintStatus,
    archivedAt: stage.archivedAt ? stage.archivedAt.toISOString() : null,
    createdAt: stage.createdAt.toISOString(),
    updatedAt: stage.updatedAt.toISOString(),
  };
}

function validation(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid board stage request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}

function auditBase(action: string, context: StageAuditContext) {
  return {
    eventType: 'CONFIG' as const,
    action,
    actorId: context.actorId ?? null,
    branchId: null,
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  };
}

function auditInput(
  action: string,
  stage: BoardStageRecord,
  context: StageAuditContext,
  metadata?: Record<string, unknown>,
): AuditRecordInput {
  const input: AuditRecordInput = {
    ...auditBase(action, context),
    targetType: 'board_stage',
    targetId: stage.id,
  };
  return metadata ? { ...input, metadata: { scope: stage.scope, changedFields: Object.keys(metadata), ...metadataSafe(metadata) } } : input;
}

// Stage metadata is configuration (names, colors, ids) — never customer data
// or secrets — so recording the values themselves is audit-safe and useful.
function metadataSafe(metadata: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined));
}
