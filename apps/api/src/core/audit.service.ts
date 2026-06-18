import type { AuditEventType, Prisma } from '@prisma/client';
import { PrismaService } from './http-kernel.js';

type AuditClient = Pick<PrismaService, 'auditLog'>;

export type AuditRecordInput = {
  eventType: AuditEventType;
  action: string;
  actorId?: string | null;
  branchId?: string | null;
  targetType: string;
  targetId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditRecordInput, client: AuditClient = this.prisma): Promise<void> {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      eventType: input.eventType,
      action: input.action,
      actorId: input.actorId ?? null,
      branchId: input.branchId ?? null,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      correlationId: input.correlationId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    };

    if (input.metadata !== undefined) {
      data.metadata = input.metadata;
    }

    await client.auditLog.create({ data });
  }
}
