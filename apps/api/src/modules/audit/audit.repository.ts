import type { AuditEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const auditSelect = {
  id: true, eventType: true, action: true, actorId: true, branchId: true, targetType: true, targetId: true,
  correlationId: true, ipAddress: true, userAgent: true, metadata: true, createdAt: true,
  actor: { select: { nameEn: true, nameAr: true } },
  branch: { select: { nameEn: true, nameAr: true, timezone: true } },
} satisfies Prisma.AuditLogSelect;
export type AuditSearchRecord = Prisma.AuditLogGetPayload<{ select: typeof auditSelect }>;

export type AuditSearchFilters = {
  eventType?: AuditEventType;
  actorId?: string;
  branchId?: string;
  targetType?: string;
  targetId?: string;
  correlationId?: string;
  from?: Date;
  to?: Date;
};

export type AuditSearchPage = {
  page: number;
  pageSize: number;
};

export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(filters: AuditSearchFilters, page: AuditSearchPage) {
    const where: Prisma.AuditLogWhereInput = {};
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.targetId) where.targetId = filters.targetId;
    if (filters.correlationId) where.correlationId = filters.correlationId;
    if (filters.from || filters.to) {
      where.createdAt = {
        ...(filters.from ? { gte: filters.from } : {}),
        ...(filters.to ? { lte: filters.to } : {}),
      };
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page.page - 1) * page.pageSize,
      take: page.pageSize,
      select: auditSelect,
    });
  }
}
