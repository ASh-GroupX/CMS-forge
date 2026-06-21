import { HttpStatus } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { AuditRecordInput, AuditService } from '../../core/audit.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { SentTasksResponseDto, TaskCommentResponseDto, TaskCommentsResponseDto } from './dto/task-response.dto.js';
import type { TaskNudgeInput } from './dto/task-collaboration.dto.js';
import type { TaskCommentRecord, TaskRecord, TasksRepository } from './tasks.repository.js';
import { taskToResponse } from './tasks.response.js';
import { assertCanAct } from './tasks.access.js';
import type { TaskActor, TaskAuditContext } from './tasks.service.js';

export async function sentByMe(repository: TasksRepository, actor: TaskActor, now: Date): Promise<SentTasksResponseDto> {
  // ponytail: fixed "recently completed" window; make it policy-backed if product needs per-role retention.
  const completedSince = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  return { tasks: (await repository.listSentByOwner(requiredText(actor.userId, 'actorId'), completedSince)).map(taskToResponse) };
}

export async function listCommentsForActor(repository: TasksRepository, auditService: AuditService, taskId: string, actor: TaskActor, audit: TaskAuditContext): Promise<TaskCommentsResponseDto> {
  try {
    const task = await authorizedTask(repository, taskId, actor);
    return { comments: (await repository.listComments(task.id)).map(commentToResponse) };
  } catch (error) {
    await recordSecurityDeny(auditService, taskId, actor, audit, error);
    throw error;
  }
}

export async function createCommentForActor(
  repository: TasksRepository,
  auditService: AuditService,
  notificationsService: NotificationsService | undefined,
  taskId: string,
  body: string,
  actor: TaskActor,
  audit: TaskAuditContext,
): Promise<TaskCommentResponseDto> {
  const result = await auditedTransaction(auditService, taskId, actor, audit, () =>
    repository.transaction(async (client) => {
      const task = await repository.findById(requiredText(taskId, 'taskId'), client);
      if (!task) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
      assertCanAct(task, actor);
      const comment = await repository.createComment({ taskId: task.id, authorId: actor.userId, body: requiredText(body, 'body') }, client);
      await auditService.record(taskAudit('task_comment_created', task, audit, { commentId: comment.id }), client);
      return { comment, task };
    }),
  );
  await queueTaskNotification(notificationsService, result.task, commentRecipient(result.task, actor.userId), 'task.comment.internal', { commentId: result.comment.id });
  return commentToResponse(result.comment);
}

export async function nudgeForActor(
  repository: TasksRepository,
  auditService: AuditService,
  notificationsService: NotificationsService | undefined,
  taskId: string,
  input: TaskNudgeInput,
  actor: TaskActor,
  audit: TaskAuditContext,
): Promise<void> {
  const task = await auditedTransaction(auditService, taskId, actor, audit, () =>
    repository.transaction(async (client) => {
      const current = await repository.findById(requiredText(taskId, 'taskId'), client);
      if (!current) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
      assertCanAct(current, actor);
      const recipientUserId = nudgeRecipient(current, input.recipientUserId);
      await auditService.record(taskAudit('task_nudged', current, audit, { recipientUserId }), client);
      return { current, recipientUserId };
    }),
    input.recipientUserId ? { recipientUserId: input.recipientUserId } : {},
  );
  await queueTaskNotification(notificationsService, task.current, task.recipientUserId, 'task.nudge.internal', input.message ? { message: input.message } : {});
}

async function authorizedTask(repository: TasksRepository, taskId: string, actor: TaskActor): Promise<TaskRecord> {
  const task = await repository.findById(requiredText(taskId, 'taskId'));
  if (!task) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
  assertCanAct(task, actor);
  return task;
}

function commentToResponse(comment: TaskCommentRecord): TaskCommentResponseDto {
  return { id: comment.id, taskId: comment.taskId, authorId: comment.authorId, authorName: comment.author?.nameEn ?? null, body: comment.body, createdAt: comment.createdAt.toISOString() };
}

function commentRecipient(task: TaskRecord, actorId: string): string {
  const preferred = task.ownerId === actorId ? task.nextActionWhoId ?? task.assigneeId : task.ownerId;
  return preferred === actorId ? task.assigneeId : preferred;
}

function nudgeRecipient(task: TaskRecord, requestedRecipientId?: string): string {
  const recipientId = requestedRecipientId ?? task.nextActionWhoId ?? task.assigneeId;
  if (!participantIds(task).has(recipientId)) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  return recipientId;
}

function participantIds(task: TaskRecord): Set<string> {
  return new Set([task.ownerId, task.assigneeId, task.nextActionWhoId, ...task.participants.map((participant) => participant.userId)].filter(Boolean) as string[]);
}

async function queueTaskNotification(notificationsService: NotificationsService | undefined, task: TaskRecord, recipientUserId: string, templateCode: string, extra: Record<string, string> = {}): Promise<void> {
  if (!notificationsService) return;
  await notificationsService.queueInternal({ recipientUserId, templateCode, locale: 'en', payload: { taskId: task.id, title: task.title, status: task.status, ...extra } });
}

function taskAudit(action: string, task: TaskRecord, context: TaskAuditContext, metadata: Prisma.InputJsonObject) {
  return { eventType: 'TASK' as const, action, actorId: context.actorId ?? null, branchId: null, targetType: 'task', targetId: task.id, correlationId: context.correlationId ?? null, ipAddress: context.ipAddress ?? null, userAgent: context.userAgent ?? null, metadata };
}

async function auditedTransaction<T>(
  auditService: AuditService,
  taskId: string,
  actor: TaskActor,
  audit: TaskAuditContext,
  work: () => Promise<T>,
  metadata: Prisma.InputJsonObject = {},
): Promise<T> {
  try {
    return await work();
  } catch (error) {
    await recordSecurityDeny(auditService, taskId, actor, audit, error, metadata);
    throw error;
  }
}

async function recordSecurityDeny(
  auditService: AuditService,
  taskId: string,
  actor: TaskActor,
  context: TaskAuditContext,
  error: unknown,
  metadata: Prisma.InputJsonObject = {},
): Promise<void> {
  if (!(error instanceof AppException) || (error.code !== 'RBAC_FORBIDDEN' && error.code !== 'BRANCH_SCOPE_FORBIDDEN')) return;
  await auditService.record(taskSecurityAudit('task_access_forbidden', taskId, actor, context, { ...metadata, reason: error.code }));
}

function taskSecurityAudit(action: string, taskId: string, actor: TaskActor, context: TaskAuditContext, metadata: Prisma.InputJsonObject): AuditRecordInput {
  return { eventType: 'SECURITY', action, actorId: context.actorId ?? actor.userId, branchId: actor.branchId ?? null, targetType: 'task', targetId: taskId, correlationId: context.correlationId ?? null, ipAddress: context.ipAddress ?? null, userAgent: context.userAgent ?? null, metadata };
}

function requiredText(value: string, field: string): string {
  const text = value.trim();
  if (!text) throw new AppException('VALIDATION_FAILED', 'Invalid task request', HttpStatus.BAD_REQUEST, [{ field, code: 'REQUIRED', message: `${field} is required or invalid.` }]);
  return text;
}
