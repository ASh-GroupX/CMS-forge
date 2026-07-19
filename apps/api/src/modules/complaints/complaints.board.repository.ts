import { Injectable } from '@nestjs/common';
import { BoardScope } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

// Ticket board columns for the CMSS complaint Kanban (docs/CMSS_REVAMP_PLAN.md B4).
// `board_stages` is shared reference data (write ownership lives in the
// board-stages module); this repository only reads the active TICKETS stages —
// the same read-only pattern tasks.board.repository uses for the task board.

const boardStageSelect = {
  id: true,
  code: true,
  nameEn: true,
  nameAr: true,
  color: true,
  position: true,
  isDefault: true,
  mappedComplaintStatus: true,
} satisfies Prisma.BoardStageSelect;

export type ComplaintBoardStageRecord = Prisma.BoardStageGetPayload<{ select: typeof boardStageSelect }>;

@Injectable()
export class ComplaintsBoardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listStages(): Promise<ComplaintBoardStageRecord[]> {
    return this.prisma.boardStage.findMany({
      where: { scope: BoardScope.TICKETS, archivedAt: null },
      orderBy: { position: 'asc' },
      select: boardStageSelect,
    });
  }
}
