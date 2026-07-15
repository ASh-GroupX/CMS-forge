import { Injectable } from '@nestjs/common';
import { BoardScope } from '@prisma/client';
import type { Prisma, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

// Board reads for the CMSS task Kanban (docs/CMSS_REVAMP_PLAN.md A2). Kept in a
// dedicated repository because tasks.repository.ts is at the agentic size budget.
// Scoping mirrors listPromiseTracker: participants always, managers within their
// branch on NORMAL tasks, admins everywhere — enforced in the Prisma WHERE so the
// frontend never filters for privacy.

const boardStageSelect = {
  id: true,
  code: true,
  nameEn: true,
  nameAr: true,
  color: true,
  position: true,
  isDefault: true,
  mappedTaskStatus: true,
} satisfies Prisma.BoardStageSelect;

const boardTaskSelect = {
  id: true,
  title: true,
  ownerId: true,
  assigneeId: true,
  dueAt: true,
  status: true,
  stageId: true,
  boardPosition: true,
  assignedDepartmentId: true,
  assignedDepartment: { select: { nameEn: true, nameAr: true } },
  isCustomerPromise: true,
  visibility: true,
  confidentialityLevel: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { nameEn: true, nameAr: true, branchId: true } },
  assignee: { select: { nameEn: true, nameAr: true, branchId: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.TaskSelect;

const boardStageTargetSelect = { id: true, code: true, mappedTaskStatus: true } satisfies Prisma.BoardStageSelect;

export type BoardStageRecord = Prisma.BoardStageGetPayload<{ select: typeof boardStageSelect }>;
export type BoardStageTarget = Prisma.BoardStageGetPayload<{ select: typeof boardStageTargetSelect }>;
export type BoardTaskRecord = Prisma.TaskGetPayload<{ select: typeof boardTaskSelect }>;

export type BoardScopeQuery = { userId: string; branchId: string | null; departmentId: string | null; isManager: boolean; isAdmin: boolean };
export type BoardDepartmentRecord = { id: string; nameEn: string; nameAr: string };
export type MoveTaskData = {
  id: string;
  stageId: string;
  boardPosition: number;
  status: TaskStatus;
  nextAction: { what: string; whoId: string; when: Date } | null;
};

@Injectable()
export class TasksBoardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listStages(scope: BoardScope): Promise<BoardStageRecord[]> {
    return this.prisma.boardStage.findMany({
      where: { scope, archivedAt: null },
      orderBy: { position: 'asc' },
      select: boardStageSelect,
    });
  }

  // Target column for a move must be an active TASKS stage; returns null (→ 404)
  // for unknown, archived, or ticket-scope stages so moves never bypass the board.
  async findStage(id: string): Promise<BoardStageTarget | null> {
    return this.prisma.boardStage.findFirst({
      where: { id, scope: BoardScope.TASKS, archivedAt: null },
      select: boardStageTargetSelect,
    });
  }

  async moveTask(data: MoveTaskData, client: Prisma.TransactionClient): Promise<BoardTaskRecord> {
    return client.task.update({
      where: { id: data.id },
      data: {
        stage: { connect: { id: data.stageId } },
        boardPosition: data.boardPosition,
        status: data.status,
        nextActionWhat: data.nextAction?.what ?? null,
        nextActionWhen: data.nextAction?.when ?? null,
        nextActionWho: data.nextAction?.whoId ? { connect: { id: data.nextAction.whoId } } : { disconnect: true },
      },
      select: boardTaskSelect,
    });
  }

  // Departments are shared reference data (see MODULE.md): read-only lookups for
  // B3 assignment validation and the board's assignment control options.
  async findActiveDepartment(id: string): Promise<{ id: string } | null> {
    return this.prisma.department.findFirst({ where: { id, isActive: true }, select: { id: true } });
  }

  async listActiveDepartments(): Promise<BoardDepartmentRecord[]> {
    return this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { nameEn: 'asc' },
      select: { id: true, nameEn: true, nameAr: true },
    });
  }

  // Bulk stage reassignment used when an admin archives a stage with a
  // destination (board-stages module) — runs on the caller's transaction.
  async reassignStage(fromStageId: string, toStageId: string, client: Prisma.TransactionClient): Promise<number> {
    const result = await client.task.updateMany({ where: { stageId: fromStageId }, data: { stageId: toStageId } });
    return result.count;
  }

  async listBoardTasks(scope: BoardScopeQuery, completedSince: Date): Promise<BoardTaskRecord[]> {
    return this.prisma.task.findMany({
      where: {
        AND: [{ OR: [{ status: { not: 'DONE' } }, { status: 'DONE', updatedAt: { gte: completedSince } }] }],
        OR: [
          ...(scope.isAdmin ? [{}] : []),
          { ownerId: scope.userId },
          { assigneeId: scope.userId },
          { nextActionWhoId: scope.userId },
          { participants: { some: { userId: scope.userId } } },
          // B3: department members see NORMAL tasks assigned to their department
          // (mirrors tasks.access.ts isDepartmentMember — keep the two in sync).
          ...(scope.departmentId ? [{ confidentialityLevel: 'NORMAL' as const, assignedDepartmentId: scope.departmentId }] : []),
          ...(scope.isManager && scope.branchId
            ? [{ confidentialityLevel: 'NORMAL' as const, OR: [{ owner: { branchId: scope.branchId } }, { assignee: { branchId: scope.branchId } }, { nextActionWho: { branchId: scope.branchId } }] }]
            : []),
        ],
      },
      orderBy: [{ boardPosition: 'asc' }, { dueAt: 'asc' }, { createdAt: 'asc' }],
      select: boardTaskSelect,
    });
  }
}
