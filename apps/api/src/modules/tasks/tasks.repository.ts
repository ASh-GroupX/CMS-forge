import { Injectable } from '@nestjs/common';
import type { Prisma, TaskConfidentialityLevel, TaskLinkEntityType, TaskParticipantRole, TaskStatus, TaskVisibility } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const taskSelect = {
  id: true,
  title: true,
  ownerId: true,
  assigneeId: true,
  dueAt: true,
  status: true,
  nextActionWhat: true,
  nextActionWhoId: true,
  nextActionWhen: true,
  isCustomerPromise: true,
  visibility: true,
  confidentialityLevel: true,
  createdAt: true,
  updatedAt: true,
  links: { select: { entityType: true, entityId: true } },
  participants: { select: { userId: true, role: true } },
} satisfies Prisma.TaskSelect;

export type TaskRecord = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;
type TaskClient = Pick<Prisma.TransactionClient, 'task' | 'taskStatusHistory'>;

export type CreateTaskData = {
  title: string;
  ownerId: string;
  assigneeId: string;
  dueAt: Date;
  status: TaskStatus;
  nextActionWhat?: string | null;
  nextActionWhoId?: string | null;
  nextActionWhen?: Date | null;
  isCustomerPromise?: boolean;
  visibility: TaskVisibility;
  confidentialityLevel: TaskConfidentialityLevel;
  links: { entityType: TaskLinkEntityType; entityId: string }[];
  participants: { userId: string; role: TaskParticipantRole }[];
};

export type UpdateTaskStatusData = {
  id: string;
  status: TaskStatus;
  nextActionWhat?: string | null;
  nextActionWhoId?: string | null;
  nextActionWhen?: Date | null;
};

export type CreateTaskStatusHistoryData = {
  taskId: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  actorId?: string | null;
  correlationId?: string | null;
};

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async create(data: CreateTaskData, client: TaskClient = this.prisma): Promise<TaskRecord> {
    const createData: Prisma.TaskCreateInput = {
      title: data.title,
      dueAt: data.dueAt,
      status: data.status,
      nextActionWhat: data.nextActionWhat ?? null,
      nextActionWhen: data.nextActionWhen ?? null,
      isCustomerPromise: data.isCustomerPromise ?? false,
      visibility: data.visibility,
      confidentialityLevel: data.confidentialityLevel,
      owner: { connect: { id: data.ownerId } },
      assignee: { connect: { id: data.assigneeId } },
    };
    if (data.nextActionWhoId) createData.nextActionWho = { connect: { id: data.nextActionWhoId } };
    if (data.links.length) createData.links = { create: data.links };
    if (data.participants.length) createData.participants = { create: data.participants };
    return client.task.create({ data: createData, select: taskSelect });
  }

  async findById(id: string, client: TaskClient = this.prisma): Promise<TaskRecord | null> {
    return client.task.findUnique({ where: { id }, select: taskSelect });
  }

  async findForParticipant(id: string, userId: string): Promise<TaskRecord | null> {
    return this.prisma.task.findFirst({
      where: {
        id,
        OR: [{ ownerId: userId }, { assigneeId: userId }, { nextActionWhoId: userId }, { participants: { some: { userId } } }],
      },
      select: taskSelect,
    });
  }

  async listEmployeeToday(userId: string): Promise<TaskRecord[]> {
    return this.prisma.task.findMany({
      where: {
        status: { not: 'DONE' },
        OR: [{ ownerId: userId }, { assigneeId: userId }, { nextActionWhoId: userId }, { participants: { some: { userId } } }],
      },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      select: taskSelect,
    });
  }

  async listManagerRollup(branchId: string | null): Promise<TaskRecord[]> {
    return this.prisma.task.findMany({
      where: {
        status: { not: 'DONE' },
        ...(branchId
          ? { OR: [{ owner: { branchId } }, { assignee: { branchId } }, { nextActionWho: { branchId } }] }
          : {}),
      },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      select: taskSelect,
    });
  }

  async updateStatus(data: UpdateTaskStatusData, client: TaskClient = this.prisma): Promise<TaskRecord> {
    return client.task.update({
      where: { id: data.id },
      data: {
        status: data.status,
        nextActionWhat: data.nextActionWhat ?? null,
        nextActionWhoId: data.nextActionWhoId ?? null,
        nextActionWhen: data.nextActionWhen ?? null,
      },
      select: taskSelect,
    });
  }

  async createStatusHistory(data: CreateTaskStatusHistoryData, client: TaskClient = this.prisma): Promise<void> {
    await client.taskStatusHistory.create({
      data: {
        taskId: data.taskId,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        actorId: data.actorId ?? null,
        correlationId: data.correlationId ?? null,
      },
    });
  }
}
