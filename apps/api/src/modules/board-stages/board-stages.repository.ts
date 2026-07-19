import { Injectable } from '@nestjs/common';
import type { BoardScope, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const boardStageSelect = {
  id: true,
  code: true,
  scope: true,
  nameEn: true,
  nameAr: true,
  color: true,
  position: true,
  isDefault: true,
  mappedTaskStatus: true,
  mappedComplaintStatus: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BoardStageSelect;

export type BoardStageRecord = Prisma.BoardStageGetPayload<{ select: typeof boardStageSelect }>;
type BoardStageClient = Pick<Prisma.TransactionClient, 'boardStage'>;

export type CreateBoardStageData = {
  code: string;
  scope: BoardScope;
  nameEn: string;
  nameAr: string;
  color: string;
  mappedTaskStatus?: BoardStageRecord['mappedTaskStatus'];
  mappedComplaintStatus?: BoardStageRecord['mappedComplaintStatus'];
};

export type UpdateBoardStageData = Partial<Pick<CreateBoardStageData, 'nameEn' | 'nameAr' | 'color'>>;

@Injectable()
export class BoardStagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

  async listActive(scope?: BoardScope): Promise<BoardStageRecord[]> {
    return this.prisma.boardStage.findMany({
      where: { archivedAt: null, ...(scope ? { scope } : {}) },
      orderBy: [{ scope: 'asc' }, { position: 'asc' }],
      select: boardStageSelect,
    });
  }

  async findById(id: string, client: BoardStageClient = this.prisma): Promise<BoardStageRecord | null> {
    return client.boardStage.findUnique({ where: { id }, select: boardStageSelect });
  }

  async nextPosition(scope: BoardScope, client: BoardStageClient = this.prisma): Promise<number> {
    const last = await client.boardStage.findFirst({
      where: { scope, archivedAt: null },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? -1) + 1;
  }

  async create(data: CreateBoardStageData & { position: number }, client: BoardStageClient = this.prisma): Promise<BoardStageRecord> {
    return client.boardStage.create({ data, select: boardStageSelect });
  }

  async update(id: string, data: UpdateBoardStageData, client: BoardStageClient = this.prisma): Promise<BoardStageRecord> {
    return client.boardStage.update({ where: { id }, data, select: boardStageSelect });
  }

  async setPosition(id: string, position: number, client: BoardStageClient): Promise<void> {
    await client.boardStage.update({ where: { id }, data: { position }, select: { id: true } });
  }

  async archive(id: string, archivedAt: Date, client: BoardStageClient = this.prisma): Promise<BoardStageRecord> {
    return client.boardStage.update({ where: { id }, data: { archivedAt }, select: boardStageSelect });
  }
}
