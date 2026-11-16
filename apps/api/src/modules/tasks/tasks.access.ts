import { HttpStatus } from '@nestjs/common';
import { TaskConfidentialityLevel, TaskParticipantRole } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { TaskRecord } from './tasks.repository.js';
import type { TaskActor } from './tasks.service.js';

type ManagerRollupScope = { branchId: string | null; permissions?: string[] };

const has = (actor: ManagerRollupScope, code: string) => actor.permissions?.includes(code) ?? false;

export function managerBranchId(scope: ManagerRollupScope): string | null {
  if (!has(scope, 'TASK_VIEW_BRANCH') && !has(scope, 'TASK_MANAGE_ALL')) {
    throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }
  if (has(scope, 'TASK_MANAGE_ALL')) return null;
  if (!scope.branchId) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  return scope.branchId;
}

export function assertCanView(task: TaskRecord, actor: TaskActor): void {
  if (has(actor, 'TASK_MANAGE_ALL')) return;
  if (isParticipant(task, actor.userId)) return;
  if (isDepartmentMember(task, actor)) return;
  if (!has(actor, 'TASK_VIEW_BRANCH') || !actor.branchId) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  if (task.confidentialityLevel !== TaskConfidentialityLevel.NORMAL) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  const taskBranches = new Set([task.owner?.branchId, task.assignee?.branchId, task.nextActionWho?.branchId].filter(Boolean));
  if (!taskBranches.has(actor.branchId)) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
}

export function assertCanComment(task: TaskRecord, actor: TaskActor): void {
  assertCanView(task, actor);
}

export function assertCanManage(task: TaskRecord, actor: TaskActor): void {
  if (has(actor, 'TASK_MANAGE_ALL')) return;
  const membership = task.participants.find((participant) => participant.userId === actor.userId);
  if (task.ownerId === actor.userId || task.assigneeId === actor.userId || task.nextActionWhoId === actor.userId || membership?.role === TaskParticipantRole.PARTICIPANT) return;
  if (isDepartmentMember(task, actor)) return;
  if (!has(actor, 'TASK_MANAGE_BRANCH') || !actor.branchId) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  if (task.confidentialityLevel !== TaskConfidentialityLevel.NORMAL) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  const taskBranches = new Set([task.owner?.branchId, task.assignee?.branchId, task.nextActionWho?.branchId].filter(Boolean));
  if (!taskBranches.has(actor.branchId)) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
}

export const assertCanAct = assertCanManage;

function isParticipant(task: TaskRecord, userId: string): boolean {
  return task.ownerId === userId || task.assigneeId === userId || task.nextActionWhoId === userId || task.participants.some((participant) => participant.userId === userId);
}

// B3 department assignment: members of the assigned department may view/act on
// the task — but, like manager rollup access, only on NORMAL-confidentiality
// tasks. Confidential tasks stay limited to named participants and admins.
// The actor departmentId comes from the server session, never client input.
function isDepartmentMember(task: TaskRecord, actor: TaskActor): boolean {
  if (task.confidentialityLevel !== TaskConfidentialityLevel.NORMAL) return false;
  return Boolean(actor.departmentId && task.departmentRecipients.some((recipient) => recipient.departmentId === actor.departmentId));
}
