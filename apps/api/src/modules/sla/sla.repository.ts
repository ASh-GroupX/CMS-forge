import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ComplaintSeverity, SlaStage } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const slaPolicySelect = {
  id: true,
  severity: true,
  stage: true,
  branchId: true,
  departmentId: true,
  categoryId: true,
  durationMinutes: true,
  warningPercent: true,
  branchTimezone: true,
  workingCalendarMode: true,
  isActive: true,
  updatedAt: true,
} satisfies Prisma.SlaPolicySelect;

export type SlaPolicyRecord = Prisma.SlaPolicyGetPayload<{ select: typeof slaPolicySelect }>;

@Injectable()
export class SlaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveBySeverityAndStage(severity: ComplaintSeverity, stage: SlaStage): Promise<SlaPolicyRecord[]> {
    return this.prisma.slaPolicy.findMany({
      where: { severity, stage, isActive: true },
      orderBy: [{ updatedAt: 'desc' }],
      select: slaPolicySelect,
    });
  }
}
