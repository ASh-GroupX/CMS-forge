import { HttpStatus, Injectable } from '@nestjs/common';
import { TaskConfidentialityLevel, TaskLinkEntityType, TaskParticipantRole, RoleCode, TaskStatus, TaskVisibility, type Prisma } from '@prisma/client';
import { AuditService, type AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { AdminUsersService, StaffLookupActor } from '../admin/admin-users.service.js';
import type { EmployeeTodayResponseDto, ManagerControlRoomResponseDto, PromiseTrackerResponseDto, SentTasksResponseDto, TaskCommentsResponseDto, TaskResponseDto } from './dto/task-response.dto.js';
import type { TaskNudgeInput } from './dto/task-collaboration.dto.js';
import type { RelatedRecordLookupQueryDto, RelatedRecordLookupResponseDto } from './dto/related-record-lookup.dto.js';
import { createCommentForActor, listCommentsForActor, nudgeForActor, sentByMe } from './tasks.collaboration.js';
import { assertCanAct, managerBranchId } from './tasks.access.js';
import { selectTaskEscalations } from './tasks.escalation.js';
import { assertPromiseLink } from './tasks.promise.js';
import { buildPromiseTracker, promiseTrackerQuery } from './tasks.promise-tracker.js';
import { TasksRelatedRecordsService } from './tasks.related-records.service.js';
import { TasksRepository } from './tasks.repository.js';
import type { TaskRecord } from './tasks.repository.js';
import { currentNextAction, taskCounts, taskToResponse } from './tasks.response.js';

export type TaskAuditContext = { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };

export type TaskNextActionInput = { what: string; whoId: string; when: Date | string };
export type CreateTaskInput = { title: string; ownerId: string; assigneeId: string; dueAt: Date | string; status?: TaskStatus; nextAction?: TaskNextActionInput | null; isCustomerPromise?: boolean; visibility?: TaskVisibility; confidentialityLevel?: TaskConfidentialityLevel; links?: { entityType: TaskLinkEntityType; entityId: string }[]; participantUserIds?: string[] };
export type UpdateTaskStatusInput = { taskId: string; status: TaskStatus; nextAction?: TaskNextActionInput | null };
export type UpdateTaskInput = { taskId: string; status?: TaskStatus; assigneeId?: string; dueAt?: Date | string; nextAction?: TaskNextActionInput | null; isCustomerPromise?: boolean };
export type TaskActor = { userId: string; roleCode: string; branchId: string | null };

type NormalizedNextAction = { what: string; whoId: string; when: Date };
type ManagerRollupScope = { roleCode: string; branchId: string | null };

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository, private readonly auditService: AuditService, private readonly notificationsService?: NotificationsService, private readonly usersService?: Pick<AdminUsersService, 'assertAssignable'>, private readonly relatedRecordsService?: TasksRelatedRecordsService) {}

  async create(input: CreateTaskInput, audit: TaskAuditContext = {}): Promise<TaskResponseDto> {
    return this.tasksRepository.transaction((client) => this.createInTransaction(input, audit, client));
  }

  async createForActor(input: CreateTaskInput, actor: StaffLookupActor, audit: TaskAuditContext = {}): Promise<TaskResponseDto> {
    await this.assertAssignable(input, actor);
    await this.assertRelatedRecords(input, actor);
    return this.create(input, audit);
  }

  async relatedRecords(query: RelatedRecordLookupQueryDto, actor: TaskActor): Promise<RelatedRecordLookupResponseDto> {
    return { records: await this.relatedRecordsService!.list(query.type, actor, query.q) };
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
    return taskToResponse(task);
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
      return taskToResponse(task);
    });
  }

  async updateForActor(input: UpdateTaskInput, actor: TaskActor, audit: TaskAuditContext = {}): Promise<TaskResponseDto> {
    return this.tasksRepository.transaction(async (client) => {
      const current = await this.tasksRepository.findById(requiredText(input.taskId, 'taskId'), client);
      if (!current) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
      assertCanAct(current, actor);
      if (input.assigneeId) await this.usersService?.assertAssignable(actor, input.assigneeId);

      const status = input.status ?? current.status;
      const nextAction =
        status === TaskStatus.DONE ? null : normalizeNextAction(input.nextAction === undefined ? currentNextAction(current) : input.nextAction);
      assertNextAction(status, nextAction);
      if (nextAction) await this.usersService?.assertAssignable(actor, nextAction.whoId);
      assertPromiseLink(input.isCustomerPromise ?? current.isCustomerPromise, current.links);

      const task = await this.tasksRepository.updateStatus(
        {
          id: current.id,
          status,
          ...(input.assigneeId !== undefined ? { assigneeId: requiredText(input.assigneeId, 'assigneeId') } : {}),
          ...(input.dueAt !== undefined ? { dueAt: validDate(input.dueAt, 'dueAt') } : {}),
          nextActionWhat: nextAction?.what ?? null,
          nextActionWhoId: nextAction?.whoId ?? null,
          nextActionWhen: nextAction?.when ?? null,
          ...(input.isCustomerPromise !== undefined ? { isCustomerPromise: input.isCustomerPromise } : {}),
        },
        client,
      );
      if (current.status !== task.status) {
        await this.tasksRepository.createStatusHistory(historyInput(task.id, current.status, task.status, audit), client);
      }
      await this.auditService.record(taskAudit('task_updated', task, audit, { fromStatus: current.status, toStatus: task.status }), client);
      return taskToResponse(task);
    });
  }

  async getForParticipant(taskId: string, actorId: string): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findForParticipant(requiredText(taskId, 'taskId'), requiredText(actorId, 'actorId'));
    if (!task) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
    return taskToResponse(task);
  }

  async getForActor(taskId: string, actor: TaskActor): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findById(requiredText(taskId, 'taskId'));
    if (!task) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
    assertCanAct(task, actor);
    return taskToResponse(task);
  }

  async sentByMe(actor: TaskActor, now: Date = new Date()): Promise<SentTasksResponseDto> {
    return sentByMe(this.tasksRepository, actor, now);
  }

  async listCommentsForActor(taskId: string, actor: TaskActor, audit: TaskAuditContext = {}): Promise<TaskCommentsResponseDto> {
    return listCommentsForActor(this.tasksRepository, this.auditService, taskId, actor, audit);
  }

  async createCommentForActor(taskId: string, body: string, actor: TaskActor, audit: TaskAuditContext = {}) {
    return createCommentForActor(this.tasksRepository, this.auditService, this.notificationsService, taskId, body, actor, audit);
  }

  async nudgeForActor(taskId: string, input: TaskNudgeInput, actor: TaskActor, audit: TaskAuditContext = {}): Promise<void> {
    await nudgeForActor(this.tasksRepository, this.auditService, this.notificationsService, taskId, input, actor, audit);
  }

  async employeeToday(actorId: string, now: Date = new Date()): Promise<EmployeeTodayResponseDto> {
    const userId = requiredText(actorId, 'actorId');
    const completedSince = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const tasks = await this.tasksRepository.listEmployeeToday(userId, completedSince);
    const [start, end] = utcDay(now);
    const openTasks = tasks.filter((task) => task.status !== TaskStatus.DONE);
    const overduePromises = openTasks.filter((task) => task.isCustomerPromise && task.dueAt < now);
    return {
      completed: tasks.filter((task) => task.status === TaskStatus.DONE).map(taskToResponse),
      dueToday: openTasks.filter((task) => task.dueAt >= start && task.dueAt < end).map(taskToResponse),
      overdue: openTasks.filter((task) => task.dueAt < start).map(taskToResponse),
      overduePromises: overduePromises.map(taskToResponse),
      assignedToMe: openTasks.filter((task) => task.assigneeId === userId).map(taskToResponse),
      waitingOnMe: openTasks.filter((task) => task.nextActionWhoId === userId).map(taskToResponse),
    };
  }

  async promiseTracker(scope: TaskActor, now: Date = new Date()): Promise<PromiseTrackerResponseDto> {
    const tasks = await this.tasksRepository.listPromiseTracker(promiseTrackerQuery(scope));
    return buildPromiseTracker(tasks, now);
  }

  async managerControlRoom(scope: ManagerRollupScope, now: Date = new Date()): Promise<ManagerControlRoomResponseDto> {
    const branchId = managerBranchId(scope);
    const tasks = await this.tasksRepository.listManagerRollup(branchId, scope.roleCode === RoleCode.ADMIN);
    const [start, end] = utcDay(now);
    const noMovementBefore = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const escalatedIds = new Set(selectTaskEscalations(tasks, undefined, now).map((task) => task.taskId));
    const promises = tasks.filter((task) => task.isCustomerPromise);
    const overduePromises = promises.filter((task) => task.dueAt < now);
    return {
      overdueByEmployee: taskCounts(tasks.filter((task) => task.dueAt < start)),
      dueToday: tasks.filter((task) => task.dueAt >= start && task.dueAt < end).map(taskToResponse),
      overduePromises: overduePromises.map(taskToResponse),
      stuck: tasks.flatMap((task) => {
        const reasons = [
          ...(task.nextActionWhen && task.nextActionWhen < now ? ['NEXT_ACTION_OVERDUE' as const] : []),
          // ponytail: fixed 72h no-movement threshold; make policy-backed if managers need per-branch tuning.
          ...(task.updatedAt < noMovementBefore ? ['NO_MOVEMENT' as const] : []),
        ];
        return reasons.length ? [{ ...taskToResponse(task), stuckReasons: reasons }] : [];
      }),
      workloadByAssignee: taskCounts(tasks),
      escalated: tasks.filter((task) => escalatedIds.has(task.id)).map(taskToResponse),
      promiseKpi: { openPromiseCount: promises.length, overduePromiseCount: overduePromises.length },
    };
  }

  private async assertAssignable(input: CreateTaskInput, actor: StaffLookupActor): Promise<void> {
    await this.usersService?.assertAssignable(actor, input.assigneeId);
    const nextWho = input.nextAction?.whoId;
    if (nextWho && nextWho !== input.assigneeId) await this.usersService?.assertAssignable(actor, nextWho);
  }

  private async assertRelatedRecords(input: CreateTaskInput, actor: StaffLookupActor): Promise<void> {
    if (!this.relatedRecordsService) return;
    for (const link of input.links ?? []) {
      if (!(await this.relatedRecordsService.exists(link.entityType, link.entityId, actor))) {
        throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
      }
    }
  }
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
  return input.map((link) => ({ entityType: validEnum(link.entityType, TaskLinkEntityType, 'links.entityType'), entityId: requiredText(link.entityId, 'links.entityId') }));
}

function taskAudit(action: string, task: TaskRecord, context: TaskAuditContext, metadata: Prisma.InputJsonObject): AuditRecordInput {
  return { eventType: 'TASK', action, actorId: context.actorId ?? null, branchId: null, targetType: 'task', targetId: task.id, correlationId: context.correlationId ?? null, ipAddress: context.ipAddress ?? null, userAgent: context.userAgent ?? null, metadata };
}

function historyInput(taskId: string, fromStatus: TaskStatus | null, toStatus: TaskStatus, context: TaskAuditContext) {
  return { taskId, fromStatus, toStatus, actorId: context.actorId ?? null, correlationId: context.correlationId ?? null };
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
  return new AppException('VALIDATION_FAILED', 'Invalid task request', HttpStatus.BAD_REQUEST, [{ field, code: 'REQUIRED', message: `${field} is required or invalid.` }]);
}
