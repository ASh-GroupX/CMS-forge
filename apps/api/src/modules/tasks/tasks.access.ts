import { HttpStatus } from '@nestjs/common';
import { RoleCode, TaskConfidentialityLevel } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { TaskRecord } from './tasks.repository.js';
import type { TaskActor } from './tasks.service.js';

type ManagerRollupScope = { roleCode: string; branchId: string | null };

const managerRoles = new Set<string>([RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN, RoleCode.MGMT_READONLY]);

export function managerBranchId(scope: ManagerRollupScope): string | null {
  if (!managerRoles.has(scope.roleCode)) {
    throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  }
  if (scope.roleCode === RoleCode.ADMIN) return null;
  if (!scope.branchId) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  return scope.branchId;
}

export function assertCanAct(task: TaskRecord, actor: TaskActor): void {
  if (actor.roleCode === RoleCode.ADMIN) return;
  if (isParticipant(task, actor.userId)) return;
  if (!managerRoles.has(actor.roleCode) || !actor.branchId) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  if (task.confidentialityLevel !== TaskConfidentialityLevel.NORMAL) throw new AppException('RBAC_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
  const taskBranches = new Set([task.owner?.branchId, task.assignee?.branchId, task.nextActionWho?.branchId].filter(Boolean));
  if (!taskBranches.has(actor.branchId)) throw new AppException('BRANCH_SCOPE_FORBIDDEN', 'Forbidden', HttpStatus.FORBIDDEN);
}

function isParticipant(task: TaskRecord, userId: string): boolean {
  return task.ownerId === userId || task.assigneeId === userId || task.nextActionWhoId === userId || task.participants.some((participant) => participant.userId === userId);
}
