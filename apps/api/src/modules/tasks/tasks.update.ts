import { HttpStatus } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { AdminUsersService } from '../admin/admin-users.service.js';
import type { AssignmentsService } from '../assignments/assignments.service.js';
import type { TaskResponseDto } from './dto/task-response.dto.js';
import { assertCanAct } from './tasks.access.js';
import type { TasksBoardRepository } from './tasks.board.repository.js';
import { assertPromiseLink } from './tasks.promise.js';
import { TasksRepository } from './tasks.repository.js';
import { currentNextAction, taskToResponse } from './tasks.response.js';
import { requiredStatusNote, statusComment } from './tasks.status-note.js';
import type { TaskActor, TaskAuditContext, UpdateTaskInput } from './tasks.service.js';
import { assertNextAction, normalizeNextAction, requiredText, validDate } from './tasks.validation.js';

// PATCH /tasks/:id for a staff actor — extracted from tasks.service.ts (which
// sits at the agentic size budget) so B3 department assignment has a home.
// Keeps the canonical shape: same-transaction status history + outcome comment
// + audit entry, with actor authority from the server session only.

export async function updateTaskForActor(
  repository: TasksRepository,
  auditService: AuditService,
  usersService: Pick<AdminUsersService, 'assertAssignable'> | undefined,
  boardRepository: TasksBoardRepository | undefined,
  input: UpdateTaskInput,
  actor: TaskActor,
  audit: TaskAuditContext,
  assignmentsService?: AssignmentsService,
): Promise<TaskResponseDto> {
  if (input.assignedDepartmentId) await assertAssignedDepartment(boardRepository, input.assignedDepartmentId);
  return repository.transaction(async (client) => {
    const current = await repository.findById(requiredText(input.taskId, 'taskId'), client);
    if (!current) throw new AppException('TASK_NOT_FOUND', 'Task was not found', HttpStatus.NOT_FOUND);
    assertCanAct(current, actor);
    if (input.assigneeId) await usersService?.assertAssignable(actor, input.assigneeId);
    const assignedUserId = input.assigneeId === undefined ? current.assigneeId : input.assigneeId;
    const assignedDepartmentId = input.assignedDepartmentId === undefined ? current.assignedDepartmentId : input.assignedDepartmentId;
    if (!assignedUserId && !assignedDepartmentId) throw assignmentRequired();

    const status = input.status ?? current.status;
    const nextAction =
      status === TaskStatus.DONE ? null : normalizeNextAction(input.nextAction === undefined ? currentNextAction(current) : input.nextAction);
    assertNextAction(status, nextAction, Boolean(assignedDepartmentId));
    const statusNote = requiredStatusNote(current.status, status, input.statusNote);
    if (nextAction) await usersService?.assertAssignable(actor, nextAction.whoId);
    assertPromiseLink(input.isCustomerPromise ?? current.isCustomerPromise, current.links);

    const task = await repository.updateStatus(
      {
        id: current.id,
        status,
        ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
        ...(input.dueAt !== undefined ? { dueAt: validDate(input.dueAt, 'dueAt') } : {}),
        nextActionWhat: nextAction?.what ?? null,
        nextActionWhoId: nextAction?.whoId ?? null,
        nextActionWhen: nextAction?.when ?? null,
        ...(input.isCustomerPromise !== undefined ? { isCustomerPromise: input.isCustomerPromise } : {}),
        ...(input.assignedDepartmentId !== undefined ? { assignedDepartmentId: input.assignedDepartmentId } : {}),
      },
      client,
    );
    if (current.status !== task.status) {
      await repository.createStatusHistory(
        { taskId: task.id, fromStatus: current.status, toStatus: task.status, actorId: audit.actorId ?? null, correlationId: audit.correlationId ?? null },
        client,
      );
      if (statusNote) {
        await repository.createComment({ taskId: task.id, authorId: actor.userId, body: statusComment(current.status, task.status, statusNote) }, client);
      }
    }
    await auditService.record(
      updateAudit(task.id, audit, {
        fromStatus: current.status,
        toStatus: task.status,
        ...(input.assignedDepartmentId !== undefined
          ? { fromDepartmentId: current.assignedDepartmentId, toDepartmentId: input.assignedDepartmentId }
          : {}),
      }),
      client,
    );
    if (assignmentsService && (input.assigneeId !== undefined || input.assignedDepartmentId !== undefined)) {
      await assignmentsService.setInTransaction({
        entityType: 'TASK', entityId: task.id, assignedUserId, assignedDepartmentId,
        scopeBranchId: task.owner?.branchId ?? actor.branchId, reason: input.statusNote ?? null,
      }, actor, audit, client);
    }
    return taskToResponse(task);
  });
}

function assignmentRequired(): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid task request', HttpStatus.BAD_REQUEST, [
    { field: 'assignment', code: 'REQUIRED', message: 'A task requires an assigned user or department.' },
  ]);
}

// Department assignment must reference an active department; anything else is a
// 400 so the board control can surface a field error instead of a 500.
export async function assertAssignedDepartment(boardRepository: TasksBoardRepository | undefined, departmentId: string): Promise<void> {
  if (!boardRepository) return;
  if (await boardRepository.findActiveDepartment(departmentId)) return;
  throw new AppException('VALIDATION_FAILED', 'Invalid task request', HttpStatus.BAD_REQUEST, [
    { field: 'assignedDepartmentId', code: 'REQUIRED', message: 'assignedDepartmentId must reference an active department.' },
  ]);
}

function updateAudit(taskId: string, context: TaskAuditContext, metadata: Prisma.InputJsonObject): AuditRecordInput {
  return {
    eventType: 'TASK',
    action: 'task_updated',
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
