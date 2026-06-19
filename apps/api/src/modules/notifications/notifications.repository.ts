import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';

const notificationSelect = {
  id: true,
  complaintId: true,
  recipientUserId: true,
  channel: true,
  status: true,
  templateCode: true,
  locale: true,
  payload: true,
} satisfies Prisma.NotificationSelect;

export type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;

export type QueueInternalNotificationData = {
  complaintId?: string | null;
  recipientUserId?: string | null;
  templateCode: string;
  locale: string;
  payload: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async queueInternal(data: QueueInternalNotificationData): Promise<NotificationRecord> {
    return this.prisma.notification.create({
      data: {
        complaintId: data.complaintId ?? null,
        recipientUserId: data.recipientUserId ?? null,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.QUEUED,
        templateCode: data.templateCode,
        locale: data.locale,
        payload: data.payload,
      },
      select: notificationSelect,
    });
  }
}
