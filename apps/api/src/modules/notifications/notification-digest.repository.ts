import { Injectable } from '@nestjs/common';
import { type CollaborationRecordType, type Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const digestItemSelect = {
  id: true,
  recipientUserId: true,
  recordType: true,
  recordId: true,
  eventKey: true,
  payload: true,
  createdAt: true,
  recipientUser: { select: { email: true, nameEn: true, nameAr: true } },
} satisfies Prisma.NotificationDigestItemSelect;

export type NotificationDigestItemRecord = Prisma.NotificationDigestItemGetPayload<{ select: typeof digestItemSelect }>;

@Injectable()
export class NotificationDigestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async queue(data: { recipientUserId: string; recordType: CollaborationRecordType; recordId: string; eventKey: string; payload: Prisma.InputJsonValue }): Promise<void> {
    await this.prisma.notificationDigestItem.upsert({ where: { eventKey: data.eventKey }, create: data, update: {} });
  }

  async pendingBefore(before: Date, limit = 100): Promise<NotificationDigestItemRecord[]> {
    return this.prisma.notificationDigestItem.findMany({ where: { deliveredAt: null, createdAt: { lte: before } }, orderBy: { createdAt: 'asc' }, take: limit, select: digestItemSelect });
  }

  async markDelivered(ids: string[], now = new Date()): Promise<number> {
    if (!ids.length) return 0;
    return (await this.prisma.notificationDigestItem.updateMany({ where: { id: { in: ids }, deliveredAt: null }, data: { deliveredAt: now } })).count;
  }
}
