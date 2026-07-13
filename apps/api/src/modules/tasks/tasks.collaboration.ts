import { HttpStatus } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { AuditRecordInput, AuditService } from '../../core/audit.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { CommunicationGroupsService, ResolvedMention } from '../communication-groups/communication-groups.service.js';
import type { SentTasksResponseDto, TaskCommentResponseDto, TaskCommentsResponseDto } from './dto/task-response.dto.js';
import type { CreateTaskCommentInput, TaskNudgeInput } from './dto/task-collaboration.dto.js';
import type { TaskCommentRecord, TaskRecord, TasksRepository } from './tasks.repository.js';
import { taskToResponse } from './tasks.response.js';
import { assertCanAct, assertCanComment, assertCanManage, assertCanView } from './tasks.access.js';
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
  groupsService: CommunicationGroupsService | undefined,
  taskId: string,
  input: CreateTaskCommentInput,
  actor: TaskActor,
  audit: TaskAuditContext,
): Promise<TaskCommentResponseDto> {
  const result = await auditedTransaction(auditService, taskId, actor, audit, async () => {
    const targetTask = await repository.findById(requiredText(taskId, 'taskId'));
    if (!targetTask) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
    assertCanComment(targetTask, actor);
    const branchId = taskBranchId(targetTask);
    const groupActor = { ...actor, permissions: actor.permissions ?? [] };
    const mentions = groupsService ? await groupsService.resolveMentions(groupActor, branchId, input.mentionTargets) : [];
    const cc = groupsService ? await resolveCc(groupsService, groupActor, branchId, input.ccUserIds, actor.userId) : [];
    const recipients = new Set([...mentions.map((item) => item.userId), ...cc.map((item) => item.userId)]);
    groupsService?.assertAudience(recipients.size, input.confirmedRecipientCount);
    if (cc.length) assertCanManage(targetTask, actor);
    return repository.transaction(async (client) => {
      const task = await repository.findById(requiredText(taskId, 'taskId'), client);
      if (!task) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
      assertCanComment(task, actor);
      for (const recipient of cc) await repository.addWatcher(task.id, recipient.userId, client);
      const comment = await repository.createComment({
        taskId: task.id,
        authorId: actor.userId,
        body: requiredText(input.body, 'body'),
        mentions: mentions.map((item) => ({ recipientUserId: item.userId, source: item.source, sourceId: item.sourceId, sourceLabel: item.sourceLabel })),
      }, client);
      await auditService.record(taskAudit('task_comment_created', task, audit, { commentId: comment.id, mentionCount: mentions.length, ccCount: cc.length }), client);
      return { comment, task, mentions, cc };
    });
  });
  const watchers = recipientUsers(result.task).filter((user) => result.task.participants.some((participant) => participant.userId === user.userId && participant.role === 'WATCHER'));
  await notificationsService?.queueCollaboration({
    recordType: 'TASK', recordId: result.task.id, href: `/tasks/${result.task.id}`, title: result.task.title,
    excerpt: result.comment.body, confidential: result.task.confidentialityLevel !== 'NORMAL', eventKey: `task-comment:${result.comment.id}`,
    mentions: result.mentions, watchers: [...watchers, ...result.cc],
  });
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
  assertCanView(task, actor);
  return task;
}

function commentToResponse(comment: TaskCommentRecord): TaskCommentResponseDto {
  return { id: comment.id, taskId: comment.taskId, authorId: comment.authorId, authorName: comment.author?.nameEn ?? null, authorNameAr: comment.author?.nameAr ?? null, body: comment.body, mentions: comment.mentions.map((mention) => ({ userId: mention.recipientUserId, name: mention.recipientUser.nameEn, nameAr: mention.recipientUser.nameAr, source: mention.source, sourceLabel: mention.sourceLabel })), createdAt: comment.createdAt.toISOString() };
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

async function resolveCc(groupsService: CommunicationGroupsService, actor: TaskActor & { permissions: string[] }, branchId: string, ids: string[], senderId: string): Promise<ResolvedMention[]> {
  const resolved: ResolvedMention[] = [];
  for (const userId of ids) {
    if (userId === senderId) continue;
    await groupsService.assertRecipient(actor, branchId, userId);
    const recipients = await groupsService.resolveMentions(actor, branchId, [{ type: 'USER', id: userId }]);
    resolved.push(...recipients);
  }
  return resolved;
}

function taskBranchId(task: TaskRecord): string {
  const branchId = task.assignee?.branchId ?? task.owner?.branchId;
  if (!branchId) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  return branchId;
}

function recipientUsers(task: TaskRecord): { userId: string; email: string; nameEn: string; nameAr: string }[] {
  return task.participants.map((participant) => ({ userId: participant.userId, email: participant.user.email, nameEn: participant.user.nameEn, nameAr: participant.user.nameAr }));
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
