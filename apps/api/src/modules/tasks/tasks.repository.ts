import { Injectable } from '@nestjs/common';
import { TaskLinkEntityType } from '@prisma/client';
import type { Prisma, TaskConfidentialityLevel, TaskParticipantRole, TaskStatus, TaskVisibility } from '@prisma/client';
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
  owner: { select: { nameEn: true, branchId: true, branch: { select: { nameEn: true, timezone: true } } } },
  assignee: { select: { nameEn: true, branchId: true, branch: { select: { nameEn: true, timezone: true } } } },
  nextActionWho: { select: { nameEn: true, branchId: true } },
  links: { select: { entityType: true, entityId: true } },
  participants: { select: { userId: true, role: true, user: { select: { email: true, nameEn: true, nameAr: true } } } },
} satisfies Prisma.TaskSelect;

const taskCommentSelect = {
  id: true,
  taskId: true,
  authorId: true,
  body: true,
  createdAt: true,
  author: { select: { nameEn: true, nameAr: true } },
  mentions: { select: { recipientUserId: true, source: true, sourceId: true, sourceLabel: true, recipientUser: { select: { nameEn: true, nameAr: true } } } },
} satisfies Prisma.TaskCommentSelect;

const timelineTaskSelect = {
  id: true,
  title: true,
  status: true,
  createdAt: true,
  ownerId: true,
  assigneeId: true,
  owner: { select: { nameEn: true } },
  assignee: { select: { nameEn: true } },
  statusHistory: {
    orderBy: { createdAt: 'asc' },
    select: { id: true, fromStatus: true, toStatus: true, actorId: true, correlationId: true, createdAt: true, actor: { select: { nameEn: true } } },
  },
  comments: {
    orderBy: { createdAt: 'asc' },
    select: { id: true, authorId: true, body: true, createdAt: true, author: { select: { nameEn: true } } },
  },
} satisfies Prisma.TaskSelect;

export type TaskRecord = Prisma.TaskGetPayload<{ select: typeof taskSelect }>;
export type TaskCommentRecord = Prisma.TaskCommentGetPayload<{ select: typeof taskCommentSelect }>;
export type TaskTimelineRecord = Prisma.TaskGetPayload<{ select: typeof timelineTaskSelect }>;
export type PromiseTaskRecord = TaskRecord & { statusHistory: { toStatus: TaskStatus; createdAt: Date }[] };
type TaskClient = Pick<Prisma.TransactionClient, 'task' | 'taskComment' | 'taskCommentMention' | 'taskParticipant' | 'taskStatusHistory'>;

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
  status?: TaskStatus;
  assigneeId?: string;
  dueAt?: Date;
  nextActionWhat?: string | null;
  nextActionWhoId?: string | null;
  nextActionWhen?: Date | null;
  isCustomerPromise?: boolean;
};

export type CreateTaskStatusHistoryData = {
  taskId: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  actorId?: string | null;
  correlationId?: string | null;
};
export type CreateTaskCommentData = {
  taskId: string;
  authorId: string;
  body: string;
  mentions?: { recipientUserId: string; source: 'USER' | 'SYSTEM_ROLE' | 'SYSTEM_DEPARTMENT' | 'CUSTOM_GROUP'; sourceId: string | null; sourceLabel: string }[];
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

  async listSentByOwner(ownerId: string, completedSince: Date): Promise<TaskRecord[]> {
    return this.prisma.task.findMany({
      where: {
        ownerId,
        OR: [{ assigneeId: { not: ownerId } }, { AND: [{ nextActionWhoId: { not: null } }, { nextActionWhoId: { not: ownerId } }] }],
        AND: [{ OR: [{ status: { not: 'DONE' } }, { status: 'DONE', updatedAt: { gte: completedSince } }] }],
      },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }, { dueAt: 'asc' }],
      select: taskSelect,
    });
  }

  async listEmployeeToday(userId: string, completedSince: Date): Promise<TaskRecord[]> {
    return this.prisma.task.findMany({
      where: {
        AND: [{ OR: [{ status: { not: 'DONE' } }, { status: 'DONE', updatedAt: { gte: completedSince } }] }],
        OR: [{ ownerId: userId }, { assigneeId: userId }, { nextActionWhoId: userId }, { participants: { some: { userId } } }],
      },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      select: taskSelect,
    });
  }

  async listManagerRollup(branchId: string | null, includeConfidential = false): Promise<TaskRecord[]> {
    return this.prisma.task.findMany({
      where: {
        status: { not: 'DONE' },
        ...(includeConfidential ? {} : { confidentialityLevel: 'NORMAL' }),
        ...(branchId
          ? { OR: [{ owner: { branchId } }, { assignee: { branchId } }, { nextActionWho: { branchId } }] }
          : {}),
      },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
      select: taskSelect,
    });
  }

  async listPromiseTracker(actor: { userId: string; branchId: string | null; isManager: boolean; isAdmin: boolean }): Promise<PromiseTaskRecord[]> {
    return this.prisma.task.findMany({
      where: {
        isCustomerPromise: true,
        links: { some: { entityType: { in: [TaskLinkEntityType.CUSTOMER, TaskLinkEntityType.COMPLAINT, TaskLinkEntityType.CASE, TaskLinkEntityType.DEAL] } } },
        OR: [
          ...(actor.isAdmin ? [{}] : []),
          { ownerId: actor.userId },
          { assigneeId: actor.userId },
          { nextActionWhoId: actor.userId },
          { participants: { some: { userId: actor.userId } } },
          ...(actor.isManager && actor.branchId
            ? [{ confidentialityLevel: 'NORMAL' as const, OR: [{ owner: { branchId: actor.branchId } }, { assignee: { branchId: actor.branchId } }, { nextActionWho: { branchId: actor.branchId } }] }]
            : []),
        ],
      },
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }, { createdAt: 'asc' }],
      select: { ...taskSelect, statusHistory: { select: { toStatus: true, createdAt: true }, orderBy: { createdAt: 'asc' } } },
    });
  }

  async findManagerDetail(id: string, branchId: string | null, includeConfidential = false): Promise<TaskRecord | null> {
    return this.prisma.task.findFirst({
      where: {
        id,
        ...(includeConfidential ? {} : { confidentialityLevel: 'NORMAL' }),
        ...(branchId
          ? { OR: [{ owner: { branchId } }, { assignee: { branchId } }, { nextActionWho: { branchId } }] }
          : {}),
      },
      select: taskSelect,
    });
  }

  async listTimelineForComplaint(complaintId: string): Promise<TaskTimelineRecord[]> {
    return this.prisma.task.findMany({
      where: { links: { some: { entityType: TaskLinkEntityType.COMPLAINT, entityId: complaintId } } },
      orderBy: { createdAt: 'asc' },
      select: timelineTaskSelect,
    });
  }

  async updateStatus(data: UpdateTaskStatusData, client: TaskClient = this.prisma): Promise<TaskRecord> {
    return client.task.update({
      where: { id: data.id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.assigneeId !== undefined ? { assignee: { connect: { id: data.assigneeId } } } : {}),
        ...(data.dueAt !== undefined ? { dueAt: data.dueAt } : {}),
        ...(data.nextActionWhat !== undefined ? { nextActionWhat: data.nextActionWhat } : {}),
        ...(data.nextActionWhoId !== undefined ? { nextActionWho: data.nextActionWhoId ? { connect: { id: data.nextActionWhoId } } : { disconnect: true } } : {}),
        ...(data.nextActionWhen !== undefined ? { nextActionWhen: data.nextActionWhen } : {}),
        ...(data.isCustomerPromise !== undefined ? { isCustomerPromise: data.isCustomerPromise } : {}),
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

  async listComments(taskId: string): Promise<TaskCommentRecord[]> {
    return this.prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      select: taskCommentSelect,
    });
  }

  async createComment(data: CreateTaskCommentData, client: TaskClient = this.prisma): Promise<TaskCommentRecord> {
    return client.taskComment.create({
      data: {
        taskId: data.taskId,
        authorId: data.authorId,
        body: data.body,
        ...(data.mentions?.length ? { mentions: { create: data.mentions } } : {}),
      },
      select: taskCommentSelect,
    });
  }

  async addWatcher(taskId: string, userId: string, client: TaskClient): Promise<void> {
    await client.taskParticipant.upsert({ where: { taskId_userId: { taskId, userId } }, create: { taskId, userId, role: 'WATCHER' }, update: {} });
  }

  async removeWatcher(taskId: string, userId: string, client: TaskClient): Promise<boolean> {
    const result = await client.taskParticipant.deleteMany({ where: { taskId, userId, role: 'WATCHER' } });
    return result.count === 1;
  }
}
