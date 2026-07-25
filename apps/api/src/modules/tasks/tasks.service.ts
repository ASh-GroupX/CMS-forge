import { HttpStatus, Injectable } from '@nestjs/common';
import { TaskConfidentialityLevel, TaskLinkEntityType, TaskParticipantRole, RoleCode, TaskStatus, TaskVisibility, type Prisma } from '@prisma/client';
import { AuditService, type AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CommunicationGroupsService } from '../communication-groups/communication-groups.service.js';
import type { AdminUsersService, StaffLookupActor } from '../admin/admin-users.service.js';
import type { AssignmentsService } from '../assignments/assignments.service.js';
import type { EmployeeTodayResponseDto, ManagerControlRoomResponseDto, ManagerTaskDetailResponseDto, PromiseTrackerResponseDto, SentTasksResponseDto, TaskCommentsResponseDto, TaskResponseDto } from './dto/task-response.dto.js';
import type { CreateTaskCommentInput, TaskNudgeInput } from './dto/task-collaboration.dto.js';
import type { RelatedRecordLookupQueryDto, RelatedRecordLookupResponseDto } from './dto/related-record-lookup.dto.js';
import { createCommentForActor, listCommentsForActor, nudgeForActor, sentByMe } from './tasks.collaboration.js';
import { assertCanView, managerBranchId } from './tasks.access.js';
import { addTaskWatcher, removeTaskWatcher, taskCapabilities, taskCommunicationTargets } from './tasks.collaboration-service.js';
import { selectTaskEscalations } from './tasks.escalation.js';
import { assertPromiseLink } from './tasks.promise.js';
import { buildPromiseTracker, promiseTrackerQuery } from './tasks.promise-tracker.js';
import { TasksRelatedRecordsService } from './tasks.related-records.service.js';
import type { TasksBoardRepository } from './tasks.board.repository.js';
import { TasksRepository } from './tasks.repository.js';
import type { TaskRecord, TaskTimelineRecord } from './tasks.repository.js';
import { notifyTaskRecipients, type TaskRecipientsRepository } from './tasks.recipients.js';
import { currentNextAction, managerTaskDetailResponse, taskCounts, taskToResponse } from './tasks.response.js';
import { requiredStatusNote, statusComment } from './tasks.status-note.js';
import { assertAssignedDepartment, updateTaskForActor } from './tasks.update.js';
import { assertNextAction, normalizeNextAction, requiredText, utcDay, validDate, validEnum } from './tasks.validation.js';
import type { NormalizedNextAction } from './tasks.validation.js';
export { assertNextAction, normalizeNextAction } from './tasks.validation.js';
export type { NormalizedNextAction } from './tasks.validation.js';
export type TaskAuditContext = { actorId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };

export type TaskNextActionInput = { what: string; whoId: string; when: Date | string };
export type CreateTaskInput = { title: string; ownerId: string; assigneeId?: string | null; dueAt: Date | string; status?: TaskStatus; nextAction?: TaskNextActionInput | null; isCustomerPromise?: boolean; visibility?: TaskVisibility; confidentialityLevel?: TaskConfidentialityLevel; links?: { entityType: TaskLinkEntityType; entityId: string }[]; participantUserIds?: string[]; assignedDepartmentId?: string | null; assignedDepartmentIds?: string[] };
export type UpdateTaskStatusInput = { taskId: string; status: TaskStatus; nextAction?: TaskNextActionInput | null; statusNote?: string };
export type UpdateTaskInput = { taskId: string; status?: TaskStatus; assigneeId?: string | null; dueAt?: Date | string; nextAction?: TaskNextActionInput | null; isCustomerPromise?: boolean; statusNote?: string; assignedDepartmentId?: string | null };
export type TaskActor = { userId: string; roleCode: string; branchId: string | null; departmentId?: string | null; permissions?: string[] };

type ManagerRollupScope = { roleCode: string; branchId: string | null };

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository, private readonly auditService: AuditService, private readonly notificationsService?: NotificationsService, private readonly usersService?: Pick<AdminUsersService, 'assertAssignable'>, private readonly relatedRecordsService?: TasksRelatedRecordsService, private readonly groupsService?: CommunicationGroupsService, private readonly boardRepository?: TasksBoardRepository, private readonly assignmentsService?: AssignmentsService, private readonly taskRecipientsRepository?: TaskRecipientsRepository) {}

  async create(input: CreateTaskInput, audit: TaskAuditContext = {}): Promise<TaskResponseDto> {
    return this.tasksRepository.transaction((client) => this.createInTransaction(input, audit, client));
  }

  async createForActor(input: CreateTaskInput, actor: StaffLookupActor, audit: TaskAuditContext = {}): Promise<TaskResponseDto> {
    await this.assertAssignable(input, actor);
    await this.assertRelatedRecords(input, actor);
    for (const departmentId of departmentIds(input)) await assertAssignedDepartment(this.boardRepository, departmentId);
    const task = await this.tasksRepository.transaction((client) => this.createInTransaction(input, audit, client, actor));
    await notifyTaskRecipients(this.taskRecipientsRepository, this.notificationsService, task.id, task.title);
    return task;
  }

  async relatedRecords(query: RelatedRecordLookupQueryDto, actor: TaskActor): Promise<RelatedRecordLookupResponseDto> {
    return { records: await this.relatedRecordsService!.list(query.type, actor, query.q) };
  }

  async createInTransaction(input: CreateTaskInput, audit: TaskAuditContext, client: Prisma.TransactionClient, actor?: TaskActor): Promise<TaskResponseDto> {
    const status = input.status ?? TaskStatus.OPEN;
    const nextAction = status === TaskStatus.DONE ? null : normalizeNextAction(input.nextAction);
    const selectedDepartmentIds = departmentIds(input);
    assertNextAction(status, nextAction, selectedDepartmentIds.length > 0);
    const taskLinks = links(input.links ?? []);
    assertPromiseLink(input.isCustomerPromise ?? false, taskLinks);
    assertAssignment(input.assigneeId, input.participantUserIds, selectedDepartmentIds);
    const data = {
      title: requiredText(input.title, 'title'),
      ownerId: requiredText(input.ownerId, 'ownerId'),
      assigneeId: optionalId(input.assigneeId),
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
      assignedDepartmentId: selectedDepartmentIds[0] ?? null,
      assignedDepartmentIds: selectedDepartmentIds,
    };

    const task = await this.tasksRepository.create(data, client);
    await this.tasksRepository.createStatusHistory(historyInput(task.id, null, task.status, audit), client);
    await this.auditService.record(taskAudit('task_created', task, audit, {
      status: task.status,
      recipientUserIds: explicitUserIds(input),
      recipientDepartmentIds: selectedDepartmentIds,
    }), client);
    if (this.assignmentsService && actor) {
      await this.assignmentsService.setInTransaction({
        entityType: 'TASK', entityId: task.id, assignedUserId: task.assigneeId,
        assignedDepartmentId: task.assignedDepartmentId,
        scopeBranchId: task.owner?.branchId ?? actor.branchId,
      }, actor, audit, client);
    }
    return taskToResponse(task);
  }

  async updateStatus(input: UpdateTaskStatusInput, audit: TaskAuditContext = {}): Promise<TaskResponseDto> {
    return this.tasksRepository.transaction(async (client) => {
      const current = await this.tasksRepository.findById(requiredText(input.taskId, 'taskId'), client);
      if (!current) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);

      const nextAction =
        input.status === TaskStatus.DONE ? null : normalizeNextAction(input.nextAction === undefined ? currentNextAction(current) : input.nextAction);
      assertNextAction(input.status, nextAction, Boolean(current.assignedDepartmentId));
      const statusNote = requiredStatusNote(current.status, input.status, input.statusNote);
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
      if (statusNote && audit.actorId) {
        await this.tasksRepository.createComment({ taskId: task.id, authorId: audit.actorId, body: statusComment(current.status, task.status, statusNote) }, client);
      }
      await this.auditService.record(taskAudit('task_status_updated', task, audit, { fromStatus: current.status, toStatus: task.status }), client);
      return taskToResponse(task);
    });
  }

  async updateForActor(input: UpdateTaskInput, actor: TaskActor, audit: TaskAuditContext = {}): Promise<TaskResponseDto> {
    const task = await updateTaskForActor(this.tasksRepository, this.auditService, this.usersService, this.boardRepository, input, actor, audit, this.assignmentsService);
    if (input.assigneeId !== undefined || input.assignedDepartmentId !== undefined) {
      await this.assignmentsService?.notifyAfterCommit?.('TASK', task.id, { href: `/tasks/${task.id}`, title: task.title });
    }
    return task;
  }

  async getForParticipant(taskId: string, actorId: string): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findForParticipant(requiredText(taskId, 'taskId'), requiredText(actorId, 'actorId'));
    if (!task) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
    return taskToResponse(task);
  }

  async getForActor(taskId: string, actor: TaskActor): Promise<TaskResponseDto> {
    const task = await this.tasksRepository.findById(requiredText(taskId, 'taskId'));
    if (!task) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
    assertCanView(task, actor);
    return { ...taskToResponse(task), capabilities: taskCapabilities(task, actor) };
  }

  async sentByMe(actor: TaskActor, now: Date = new Date()): Promise<SentTasksResponseDto> {
    return sentByMe(this.tasksRepository, actor, now);
  }

  async listCommentsForActor(taskId: string, actor: TaskActor, audit: TaskAuditContext = {}): Promise<TaskCommentsResponseDto> {
    return listCommentsForActor(this.tasksRepository, this.auditService, taskId, actor, audit);
  }

  async createCommentForActor(taskId: string, input: CreateTaskCommentInput, actor: TaskActor, audit: TaskAuditContext = {}) {
    return createCommentForActor(this.tasksRepository, this.auditService, this.notificationsService, this.groupsService, taskId, input, actor, audit);
  }

  async communicationTargets(taskId: string, actor: TaskActor, query = '') { return taskCommunicationTargets(this.tasksRepository, this.groupsService, taskId, actor, query); }

  async addWatcher(taskId: string, userId: string, actor: TaskActor, audit: TaskAuditContext = {}): Promise<void> { return addTaskWatcher(this.tasksRepository, this.auditService, this.groupsService, taskId, userId, actor, audit); }

  async removeWatcher(taskId: string, userId: string, actor: TaskActor, audit: TaskAuditContext = {}): Promise<void> { return removeTaskWatcher(this.tasksRepository, this.auditService, taskId, userId, actor, audit); }

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

  async managerTaskDetail(taskId: string, actor: TaskActor, now: Date = new Date()): Promise<ManagerTaskDetailResponseDto> {
    const branchId = managerBranchId(actor);
    const task = await this.tasksRepository.findManagerDetail(
      requiredText(taskId, 'taskId'),
      branchId,
      actor.roleCode === RoleCode.ADMIN,
    );
    if (!task) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
    return managerTaskDetailResponse(task, now, (actor.permissions ?? []).includes('COMPLAINT_COMMENT_INTERNAL'));
  }

  async timelineForComplaint(complaintId: string): Promise<TaskTimelineRecord[]> {
    return this.tasksRepository.listTimelineForComplaint(requiredText(complaintId, 'complaintId'));
  }

  private async assertAssignable(input: CreateTaskInput, actor: StaffLookupActor): Promise<void> {
    for (const userId of explicitUserIds(input)) await this.usersService?.assertAssignable(actor, userId);
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

function participants(input: CreateTaskInput, nextAction: NormalizedNextAction | null) {
  const rows = new Map<string, TaskParticipantRole>();
  rows.set(requiredText(input.ownerId, 'ownerId'), TaskParticipantRole.OWNER);
  const assigneeId = optionalId(input.assigneeId);
  if (assigneeId && !rows.has(assigneeId)) rows.set(assigneeId, TaskParticipantRole.ASSIGNEE);
  if (nextAction && !rows.has(nextAction.whoId)) rows.set(nextAction.whoId, TaskParticipantRole.PARTICIPANT);
  for (const userId of input.participantUserIds ?? []) {
    const clean = requiredText(userId, 'participantUserIds');
    if (!rows.has(clean)) rows.set(clean, TaskParticipantRole.PARTICIPANT);
  }
  return [...rows].map(([userId, role]) => ({ userId, role }));
}

function assertAssignment(userId: string | null | undefined, participantUserIds: string[] | undefined, assignedDepartmentIds: string[]): void {
  if (optionalId(userId) || (participantUserIds?.length ?? 0) > 0 || assignedDepartmentIds.length > 0) return;
  throw new AppException('VALIDATION_FAILED', 'Invalid task request', HttpStatus.BAD_REQUEST, [
    { field: 'assignment', code: 'REQUIRED', message: 'A task requires an assigned user or department.' },
  ]);
}

function explicitUserIds(input: Pick<CreateTaskInput, 'assigneeId' | 'participantUserIds'>): string[] {
  return [...new Set([input.assigneeId, ...(input.participantUserIds ?? [])].map(optionalId).filter((id): id is string => Boolean(id)))];
}

function departmentIds(input: Pick<CreateTaskInput, 'assignedDepartmentId' | 'assignedDepartmentIds'>): string[] {
  return [...new Set([input.assignedDepartmentId, ...(input.assignedDepartmentIds ?? [])].map(optionalId).filter((id): id is string => Boolean(id)))];
}

function optionalId(value: string | null | undefined): string | null {
  const text = value?.trim() ?? '';
  return text || null;
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
