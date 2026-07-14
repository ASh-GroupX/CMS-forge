import { HttpStatus, Injectable } from '@nestjs/common';
import { BoardScope, TaskStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { AdminUsersService } from '../admin/admin-users.service.js';
import type { BoardCardDto, BoardCardDueState, BoardStageDto, MoveTaskResponseDto, TaskBoardResponseDto } from './dto/board.dto.js';
import { assertCanAct } from './tasks.access.js';
import { TasksBoardRepository } from './tasks.board.repository.js';
import type { BoardStageRecord, BoardTaskRecord } from './tasks.board.repository.js';
import { promiseTrackerQuery } from './tasks.promise-tracker.js';
import { TasksRepository } from './tasks.repository.js';
import { currentNextAction } from './tasks.response.js';
import { requiredStatusNote, statusComment } from './tasks.status-note.js';
import { assertNextAction, normalizeNextAction } from './tasks.service.js';
import type { TaskActor, TaskAuditContext, TaskNextActionInput } from './tasks.service.js';
import { utcDay } from './tasks.validation.js';

const COMPLETED_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export type MoveTaskInput = {
  taskId: string;
  stageId: string;
  boardPosition: number;
  statusNote?: string;
  nextAction?: TaskNextActionInput | null;
};

@Injectable()
export class TasksBoardService {
  constructor(
    private readonly boardRepository: TasksBoardRepository,
    private readonly tasksRepository?: TasksRepository,
    private readonly auditService?: AuditService,
    private readonly usersService?: Pick<AdminUsersService, 'assertAssignable'>,
  ) {}

  async board(actor: TaskActor, now: Date = new Date()): Promise<TaskBoardResponseDto> {
    const [stages, tasks] = await Promise.all([
      this.boardRepository.listStages(BoardScope.TASKS),
      this.boardRepository.listBoardTasks(promiseTrackerQuery(actor), new Date(now.getTime() - COMPLETED_WINDOW_MS)),
    ]);
    return buildTaskBoard(stages, tasks, now);
  }

  // Public hook for the board-stages module: when an admin archives a stage with
  // a destination, its cards follow on the archive transaction's client.
  async reassignStage(fromStageId: string, toStageId: string, client: Prisma.TransactionClient): Promise<number> {
    return this.boardRepository.reassignStage(fromStageId, toStageId, client);
  }

  // Drag a card to a column: derive TaskStatus from the target stage, enforce the
  // same next-action / status-note invariants as PATCH /tasks/:id, then write the
  // move + status history + outcome comment + audit in ONE transaction.
  async move(input: MoveTaskInput, actor: TaskActor, audit: TaskAuditContext = {}, now: Date = new Date()): Promise<MoveTaskResponseDto> {
    const stage = await this.boardRepository.findStage(input.stageId);
    if (!stage) throw new AppException('BOARD_STAGE_NOT_FOUND', 'Board stage was not found', HttpStatus.NOT_FOUND);

    return this.tasksRepository!.transaction(async (client) => {
      const current = await this.tasksRepository!.findById(input.taskId, client);
      if (!current) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
      assertCanAct(current, actor);

      const status = stage.mappedTaskStatus ?? current.status;
      const nextAction = status === TaskStatus.DONE ? null : normalizeNextAction(input.nextAction === undefined ? currentNextAction(current) : input.nextAction);
      assertNextAction(status, nextAction);
      // Same guard as PATCH /tasks/:id: the actor may only route a next action to a
      // staff member inside their branch scope (admins excepted). Prevents a move
      // from leaking a task into another branch's queue via nextActionWhoId.
      if (nextAction) await this.usersService?.assertAssignable(actor, nextAction.whoId);
      const outcomeNote = requiredStatusNote(current.status, status, input.statusNote);

      const moved = await this.boardRepository.moveTask({ id: current.id, stageId: stage.id, boardPosition: input.boardPosition, status, nextAction }, client);
      if (current.status !== status) {
        await this.tasksRepository!.createStatusHistory({ taskId: moved.id, fromStatus: current.status, toStatus: status, actorId: audit.actorId ?? null, correlationId: audit.correlationId ?? null }, client);
        if (outcomeNote) {
          await this.tasksRepository!.createComment({ taskId: moved.id, authorId: actor.userId, body: statusComment(current.status, status, outcomeNote) }, client);
        }
      }
      await this.auditService!.record(moveAudit(moved.id, audit, { fromStage: current.stageId, toStage: stage.id, fromStatus: current.status, toStatus: status }), client);
      return { card: toCardDto(moved, moved.stageId ?? stage.id, now) };
    });
  }
}

function moveAudit(taskId: string, context: TaskAuditContext, metadata: Prisma.InputJsonObject): AuditRecordInput {
  return {
    eventType: 'TASK',
    action: 'task_moved',
    actorId: context.actorId ?? null,
    branchId: null,
    targetType: 'task',
    targetId: taskId,
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata,
  };
}

// Pure board projection: one column per active stage (empty columns preserved),
// each card bucketed by its explicit stage, else the default stage mapped to its
// TaskStatus, else the first stage. Card metrics (daysActive/dueState) derive from
// the server clock so the UI renders no business logic.
export function buildTaskBoard(stages: BoardStageRecord[], tasks: BoardTaskRecord[], now: Date): TaskBoardResponseDto {
  const activeStageIds = new Set(stages.map((stage) => stage.id));
  const defaultStageByStatus = new Map<TaskStatus, string>();
  for (const stage of stages) {
    if (!stage.mappedTaskStatus) continue;
    if (stage.isDefault || !defaultStageByStatus.has(stage.mappedTaskStatus)) {
      defaultStageByStatus.set(stage.mappedTaskStatus, stage.id);
    }
  }
  const fallbackStageId = stages[0]?.id ?? null;

  const grouped = new Map<string, BoardTaskRecord[]>();
  for (const stage of stages) grouped.set(stage.id, []);
  for (const task of tasks) {
    const stageId =
      task.stageId && activeStageIds.has(task.stageId) ? task.stageId : defaultStageByStatus.get(task.status) ?? fallbackStageId;
    if (stageId) grouped.get(stageId)!.push(task);
  }

  return {
    stages: stages.map(toStageDto),
    columns: stages.map((stage) => ({
      stageId: stage.id,
      cards: (grouped.get(stage.id) ?? [])
        .slice()
        .sort((a, b) => a.boardPosition - b.boardPosition || a.dueAt.getTime() - b.dueAt.getTime())
        .map((task) => toCardDto(task, stage.id, now)),
    })),
  };
}

function toStageDto(stage: BoardStageRecord): BoardStageDto {
  return {
    id: stage.id,
    code: stage.code,
    nameEn: stage.nameEn,
    nameAr: stage.nameAr,
    color: stage.color,
    position: stage.position,
    mappedTaskStatus: stage.mappedTaskStatus,
  };
}

function toCardDto(task: BoardTaskRecord, stageId: string, now: Date): BoardCardDto {
  return {
    id: task.id,
    title: task.title,
    ownerId: task.ownerId,
    ownerName: task.owner?.nameEn ?? null,
    ownerNameAr: task.owner?.nameAr ?? null,
    assigneeId: task.assigneeId,
    assigneeName: task.assignee?.nameEn ?? null,
    assigneeNameAr: task.assignee?.nameAr ?? null,
    branchId: task.assignee?.branchId ?? task.owner?.branchId ?? null,
    dueAt: task.dueAt.toISOString(),
    status: task.status,
    stageId,
    boardPosition: task.boardPosition,
    isCustomerPromise: task.isCustomerPromise,
    visibility: task.visibility,
    confidentialityLevel: task.confidentialityLevel,
    daysActive: Math.max(0, Math.floor((now.getTime() - task.createdAt.getTime()) / 86400000)),
    dueState: dueState(task, now),
    commentCount: task._count.comments,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

function dueState(task: BoardTaskRecord, now: Date): BoardCardDueState | null {
  if (task.status === TaskStatus.DONE) return null;
  const [start, end] = utcDay(now);
  if (task.dueAt < start) return 'OVERDUE';
  if (task.dueAt < end) return 'DUE_TODAY';
  return 'UPCOMING';
}
