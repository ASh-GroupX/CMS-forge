import { HttpStatus, Injectable } from '@nestjs/common';
import {
  TaskConfidentialityLevel,
  TaskLinkEntityType,
  TaskParticipantRole,
  RoleCode,
  TaskStatus,
  TaskVisibility,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { EmployeeTodayResponseDto, ManagerControlRoomResponseDto, TaskResponseDto } from './dto/task-response.dto.js';
import { selectTaskEscalations } from './tasks.escalation.js';
import { assertPromiseLink } from './tasks.promise.js';
import { TasksRepository } from './tasks.repository.js';
import type { TaskRecord } from './tasks.repository.js';

type TaskAuditContext = {
  actorId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type TaskNextActionInput = { what: string; whoId: string; when: Date | string };
export type CreateTaskInput = {
  title: string;
  ownerId: string;
  assigneeId: string;
  dueAt: Date | string;
  status?: TaskStatus;
  nextAction?: TaskNextActionInput | null;
  isCustomerPromise?: boolean;
  visibility?: TaskVisibility;
  confidentialityLevel?: TaskConfidentialityLevel;
  links?: { entityType: TaskLinkEntityType; entityId: string }[];
  participantUserIds?: string[];
};
export type UpdateTaskStatusInput = {
  taskId: string;
  status: TaskStatus;
  nextAction?: TaskNextActionInput | null;
};

type NormalizedNextAction = { what: string; whoId: string; when: Date };
type ManagerRollupScope = { roleCode: string; branchId: string | null };

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(input: CreateTaskInput, audit: TaskAuditContext = {}): Promise<TaskResponseDto> {
    return this.tasksRepository.transaction((client) => this.createInTransaction(input, audit, client));
  }

  async createInTransaction(input: CreateTaskInput, audit: TaskAuditContext, client: Prisma.TransactionClient): Promise<TaskResponseDto> {
    const status = input.status ?? TaskStatus.OPEN;
    const nextAction = status === TaskStatus.DONE ? null : normalizeNextAction(input.nextAction);
    assertNextAction(status, nextAction);
    const taskLinks = links(input.links ?? []);
    assertPromiseLink(input.isCustomerPromise ?? false, taskLinks);
    const data = {
      title: requiredText(input.title, 'title'),
      ownerId: requiredText(input.ownerId, 'ownerId'),
      assigneeId: requiredText(input.assigneeId, 'assigneeId'),
      dueAt: validDate(input.dueAt, 'dueAt'),
      status,
      nextActionWhat: nextAction?.what ?? null,
      nextActionWhoId: nextAction?.whoId ?? null,
      nextActionWhen: nextAction?.when ?? null,
      isCustomerPromise: input.isCustomerPromise ?? false,
      visibility: input.visibility ?? TaskVisibility.PARTICIPANTS,
      confidentialityLevel: input.confidentialityLevel ?? TaskConfidentialityLevel.NORMAL,
      links: taskLinks,
      participants: participants(input, nextAction),
    };

    const task = await this.tasksRepository.create(data, client);
    await this.tasksRepository.createStatusHistory(historyInput(task.id, null, task.status, audit), client);
    await this.auditService.record(taskAudit('task_created', task, audit, { status: task.status }), client);
    return toResponse(task);
  }

  async updateStatus(input: UpdateTaskStatusInput, audit: TaskAuditContext = {}): Promise<TaskResponseDto> {
    return this.tasksRepository.transaction(async (client) => {
      const current = await this.tasksRepository.findById(requiredText(input.taskId, 'taskId'), client);
      if (!current) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);

      const nextAction =
        input.status === TaskStatus.DONE ? null : normalizeNextAction(input.nextAction === undefined ? currentNextAction(current) : input.nextAction);
      assertNextAction(input.status, nextAction);
      const task = await this.tasksRepository.updateStatus(
        {
          id: current.id,
          status: input.status,
          nextActionWhat: nextAction?.what ?? null,
          nextActionWhoId: nextAction?.whoId ?? null,
          nextActionWhen: nextAction?.when ?? null,
        },
        client,
      );
      await this.tasksRepository.createStatusHistory(historyInput(task.id, current.status, task.status, audit), client);
      await this.auditService.record(taskAudit('task_status_updated', task, audit, { fromStatus: current.status, toStatus: task.status }), client);
      return toResponse(task);
    });
  }

  async getForParticipant(taskId: string, actorId: string): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findForParticipant(requiredText(taskId, 'taskId'), requiredText(actorId, 'actorId'));
    if (!task) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
    return toResponse(task);
  }

  async employeeToday(actorId: string, now: Date = new Date()): Promise<EmployeeTodayResponseDto> {
    const userId = requiredText(actorId, 'actorId');
    const tasks = await this.tasksRepository.listEmployeeToday(userId);
    const [start, end] = utcDay(now);
    const overduePromises = tasks.filter((task) => task.isCustomerPromise && task.dueAt < now);
    return {
      dueToday: tasks.filter((task) => task.dueAt >= start && task.dueAt < end).map(toResponse),
      overdue: tasks.filter((task) => task.dueAt < start).map(toResponse),
      overduePromises: overduePromises.map(toResponse),
      assignedToMe: tasks.filter((task) => task.assigneeId === userId).map(toResponse),
      waitingOnMe: tasks.filter((task) => task.nextActionWhoId === userId).map(toResponse),
    };
  }

  async managerControlRoom(scope: ManagerRollupScope, now: Date = new Date()): Promise<ManagerControlRoomResponseDto> {
    const branchId = managerBranchId(scope);
    const tasks = await this.tasksRepository.listManagerRollup(branchId);
    const [start, end] = utcDay(now);
    const noMovementBefore = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const escalatedIds = new Set(selectTaskEscalations(tasks, undefined, now).map((task) => task.taskId));
    const promises = tasks.filter((task) => task.isCustomerPromise);
    const overduePromises = promises.filter((task) => task.dueAt < now);
    return {
      overdueByEmployee: counts(tasks.filter((task) => task.dueAt < start)),
      dueToday: tasks.filter((task) => task.dueAt >= start && task.dueAt < end).map(toResponse),
      overduePromises: overduePromises.map(toResponse),
      stuck: tasks.flatMap((task) => {
        const reasons = [
          ...(task.nextActionWhen && task.nextActionWhen < now ? ['NEXT_ACTION_OVERDUE' as const] : []),
          // ponytail: fixed 72h no-movement threshold; make policy-backed if managers need per-branch tuning.
          ...(task.updatedAt < noMovementBefore ? ['NO_MOVEMENT' as const] : []),
        ];
        return reasons.length ? [{ ...toResponse(task), stuckReasons: reasons }] : [];
      }),
      workloadByAssignee: counts(tasks),
      escalated: tasks.filter((task) => escalatedIds.has(task.id)).map(toResponse),
      promiseKpi: { openPromiseCount: promises.length, overduePromiseCount: overduePromises.length },
    };
  }
}

function managerBranchId(scope: ManagerRollupScope): string | null {
  if (!managerRoles.has(scope.roleCode)) {
    throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }
  if (scope.roleCode === RoleCode.ADMIN) return null;
  if (!scope.branchId) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  return scope.branchId;
}

const managerRoles = new Set<string>([RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN, RoleCode.MGMT_READONLY]);

function counts(tasks: TaskRecord[]) {
  const grouped = new Map<string, number>();
  for (const task of tasks) grouped.set(task.assigneeId, (grouped.get(task.assigneeId) ?? 0) + 1);
  return [...grouped].map(([assigneeId, count]) => ({ assigneeId, count }));
}

function toResponse(task: TaskRecord): TaskResponseDto {
  return {
    id: task.id,
    title: task.title,
    ownerId: task.ownerId,
    assigneeId: task.assigneeId,
    dueAt: task.dueAt.toISOString(),
    status: task.status,
    nextAction: currentNextAction(task)?.toDto ?? null,
    isCustomerPromise: task.isCustomerPromise,
    visibility: task.visibility,
    confidentialityLevel: task.confidentialityLevel,
    links: task.links.map((link) => ({ entityType: link.entityType, entityId: link.entityId })),
    participantUserIds: task.participants.map((participant) => participant.userId),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

function currentNextAction(task: TaskRecord): (NormalizedNextAction & { toDto: TaskResponseDto['nextAction'] }) | null {
  if (!task.nextActionWhat || !task.nextActionWhoId || !task.nextActionWhen) return null;
  return {
    what: task.nextActionWhat,
    whoId: task.nextActionWhoId,
    when: task.nextActionWhen,
    toDto: { what: task.nextActionWhat, whoId: task.nextActionWhoId, when: task.nextActionWhen.toISOString() },
  };
}

function assertNextAction(status: TaskStatus, nextAction: NormalizedNextAction | null): void {
  if (status !== TaskStatus.DONE && !nextAction) {
    throw new AppException('TASK_NEXT_ACTION_REQUIRED', 'Open tasks require a next action', HttpStatus.CONFLICT, [
      { field: 'nextAction', code: 'REQUIRED', message: 'nextAction is required for open tasks.' },
    ]);
  }
}

function normalizeNextAction(input: TaskNextActionInput | null | undefined): NormalizedNextAction | null {
  if (!input) return null;
  return {
    what: requiredText(input.what, 'nextAction.what'),
    whoId: requiredText(input.whoId, 'nextAction.whoId'),
    when: validDate(input.when, 'nextAction.when'),
  };
}

function participants(input: CreateTaskInput, nextAction: NormalizedNextAction | null) {
  const rows = new Map<string, TaskParticipantRole>();
  rows.set(requiredText(input.ownerId, 'ownerId'), TaskParticipantRole.OWNER);
  if (!rows.has(requiredText(input.assigneeId, 'assigneeId'))) rows.set(input.assigneeId.trim(), TaskParticipantRole.ASSIGNEE);
  if (nextAction && !rows.has(nextAction.whoId)) rows.set(nextAction.whoId, TaskParticipantRole.PARTICIPANT);
  for (const userId of input.participantUserIds ?? []) {
    const clean = requiredText(userId, 'participantUserIds');
    if (!rows.has(clean)) rows.set(clean, TaskParticipantRole.PARTICIPANT);
  }
  return [...rows].map(([userId, role]) => ({ userId, role }));
}

function links(input: { entityType: TaskLinkEntityType; entityId: string }[]) {
  return input.map((link) => ({
    entityType: validEnum(link.entityType, TaskLinkEntityType, 'links.entityType'),
    entityId: requiredText(link.entityId, 'links.entityId'),
  }));
}

function taskAudit(action: string, task: TaskRecord, context: TaskAuditContext, metadata: Prisma.InputJsonObject): AuditRecordInput {
  return {
    eventType: 'TASK',
    action,
    actorId: context.actorId ?? null,
    branchId: null,
    targetType: 'task',
    targetId: task.id,
    correlationId: context.correlationId ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata,
  };
}

function historyInput(taskId: string, fromStatus: TaskStatus | null, toStatus: TaskStatus, context: TaskAuditContext) {
  return {
    taskId,
    fromStatus,
    toStatus,
    actorId: context.actorId ?? null,
    correlationId: context.correlationId ?? null,
  };
}

function requiredText(value: string, field: string): string {
  const text = value.trim();
  if (!text) throw invalid(field);
  return text;
}

function validDate(value: Date | string, field: string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw invalid(field);
  return date;
}

function validEnum<T extends Record<string, string>>(value: string, options: T, field: string): T[keyof T] {
  if (!Object.values(options).includes(value)) throw invalid(field);
  return value as T[keyof T];
}

function utcDay(value: Date): [Date, Date] {
  const start = new Date(value);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return [start, end];
}

function invalid(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid task request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}
