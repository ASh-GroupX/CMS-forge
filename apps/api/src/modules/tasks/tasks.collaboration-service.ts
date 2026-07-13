import { HttpStatus } from '@nestjs/common';
import { TaskParticipantRole, type Prisma } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { AuditService } from '../../core/audit.service.js';
import type { CommunicationGroupsService } from '../communication-groups/communication-groups.service.js';
import { assertCanComment, assertCanManage } from './tasks.access.js';
import type { TaskActor, TaskAuditContext } from './tasks.service.js';
import type { TaskRecord, TasksRepository } from './tasks.repository.js';

export function taskCapabilities(task: TaskRecord, actor: TaskActor) {
  return { canComment: can(() => assertCanComment(task, actor)), canManage: can(() => assertCanManage(task, actor)), canManageWatchers: can(() => assertCanManage(task, actor)) };
}

export async function taskCommunicationTargets(repository: TasksRepository, groups: CommunicationGroupsService | undefined, taskId: string, actor: TaskActor, query = '') {
  const task = await requiredTask(repository, taskId);
  assertCanComment(task, actor);
  const branchId = task.assignee?.branchId ?? task.owner?.branchId;
  if (!branchId || !groups) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  const targets = await groups.targets({ ...actor, permissions: actor.permissions ?? [] }, branchId, query);
  return { ...targets, currentWatchers: task.participants.filter((item) => item.role === TaskParticipantRole.WATCHER).map((item) => ({ userId: item.userId, name: item.user.nameEn, nameAr: item.user.nameAr })), capabilities: taskCapabilities(task, actor) };
}

export async function addTaskWatcher(repository: TasksRepository, audit: AuditService, groups: CommunicationGroupsService | undefined, taskId: string, userId: string, actor: TaskActor, context: TaskAuditContext): Promise<void> {
  const task = await requiredTask(repository, taskId);
  assertCanManage(task, actor);
  const branchId = task.assignee?.branchId ?? task.owner?.branchId;
  if (!branchId || !groups) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  if (userId !== actor.userId) await groups.assertRecipient({ ...actor, permissions: actor.permissions ?? [] }, branchId, userId);
  await repository.transaction(async (client) => {
    await repository.addWatcher(task.id, userId, client);
    await audit.record(watcherAudit('task_watcher_added', task, userId, context), client);
  });
}

export async function removeTaskWatcher(repository: TasksRepository, audit: AuditService, taskId: string, userId: string, actor: TaskActor, context: TaskAuditContext): Promise<void> {
  const task = await requiredTask(repository, taskId);
  assertCanManage(task, actor);
  await repository.transaction(async (client) => {
    await repository.removeWatcher(task.id, userId, client);
    await audit.record(watcherAudit('task_watcher_removed', task, userId, context), client);
  });
}

async function requiredTask(repository: TasksRepository, taskId: string): Promise<TaskRecord> {
  const task = await repository.findById(taskId.trim());
  if (!task) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
  return task;
}

function watcherAudit(action: string, task: TaskRecord, userId: string, context: TaskAuditContext) {
  return { eventType: 'TASK' as const, action, actorId: context.actorId ?? null, branchId: null, targetType: 'task', targetId: task.id, correlationId: context.correlationId ?? null, ipAddress: context.ipAddress ?? null, userAgent: context.userAgent ?? null, metadata: { userId } satisfies Prisma.InputJsonObject };
}

function can(check: () => void): boolean { try { check(); return true; } catch { return false; } }
