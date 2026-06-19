import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import type { EmailSendResult } from '../integrations/email-provider.port.js';
import type { SmsSendResult } from '../integrations/sms-provider.port.js';
import type { WhatsAppSendResult } from '../integrations/whatsapp-provider.port.js';

const notificationSelect = {
  id: true,
  complaintId: true,
  recipientUserId: true,
  channel: true,
  status: true,
  templateCode: true,
  locale: true,
  payload: true,
  provider: true,
  providerResult: true,
  sentAt: true,
  failedAt: true,
} satisfies Prisma.NotificationSelect;

const notificationTemplateSelect = {
  id: true,
  code: true,
  channel: true,
  locale: true,
  subject: true,
  body: true,
  version: true,
} satisfies Prisma.NotificationTemplateSelect;

export type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;
export type NotificationTemplateRecord = Prisma.NotificationTemplateGetPayload<{ select: typeof notificationTemplateSelect }>;

export type QueueInternalNotificationData = {
  complaintId?: string | null;
  recipientUserId?: string | null;
  templateCode: string;
  locale: string;
  payload: Prisma.InputJsonValue;
};

export type MarkEmailFailedData = {
  id: string;
  failureReason: string;
};

type ProviderSendResult = EmailSendResult | SmsSendResult | WhatsAppSendResult;

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

  async findQueuedEmail(limit = 25): Promise<NotificationRecord[]> {
    return this.findQueued(NotificationChannel.EMAIL, limit);
  }

  async findQueuedSms(limit = 25): Promise<NotificationRecord[]> {
    return this.findQueued(NotificationChannel.SMS, limit);
  }

  async findQueuedWhatsApp(limit = 25): Promise<NotificationRecord[]> {
    return this.findQueued(NotificationChannel.WHATSAPP, limit);
  }

  async markEmailSent(id: string, result: EmailSendResult, now = new Date()): Promise<boolean> {
    return this.markSent(id, NotificationChannel.EMAIL, result, now);
  }

  async markSmsSent(id: string, result: SmsSendResult, now = new Date()): Promise<boolean> {
    return this.markSent(id, NotificationChannel.SMS, result, now);
  }

  async markWhatsAppSent(id: string, result: WhatsAppSendResult, now = new Date()): Promise<boolean> {
    return this.markSent(id, NotificationChannel.WHATSAPP, result, now);
  }

  async markEmailFailed(data: MarkEmailFailedData, now = new Date()): Promise<boolean> {
    return this.markFailed(data.id, NotificationChannel.EMAIL, data.failureReason, now);
  }

  async markSmsFailed(data: MarkEmailFailedData, now = new Date()): Promise<boolean> {
    return this.markFailed(data.id, NotificationChannel.SMS, data.failureReason, now);
  }

  async markWhatsAppFailed(data: MarkEmailFailedData, now = new Date()): Promise<boolean> {
    return this.markFailed(data.id, NotificationChannel.WHATSAPP, data.failureReason, now);
  }

  async findActiveTemplate(code: string, channel: NotificationChannel, locale: string): Promise<NotificationTemplateRecord | null> {
    return this.prisma.notificationTemplate.findFirst({
      where: { code, channel, locale, isActive: true },
      orderBy: { version: 'desc' },
      select: notificationTemplateSelect,
    });
  }

  private async findQueued(channel: NotificationChannel, limit: number): Promise<NotificationRecord[]> {
    return this.prisma.notification.findMany({
      where: { channel, status: NotificationStatus.QUEUED },
      orderBy: { queuedAt: 'asc' },
      take: limit,
      select: notificationSelect,
    });
  }

  private async markSent(id: string, channel: NotificationChannel, result: ProviderSendResult, now: Date): Promise<boolean> {
    const update = await this.prisma.notification.updateMany({
      where: { id, channel, status: NotificationStatus.QUEUED },
      data: {
        status: NotificationStatus.SENT,
        provider: result.provider,
        providerResult: JSON.stringify({
          messageId: result.messageId,
          provider: result.provider,
          accepted: result.accepted,
        }),
        sentAt: now,
      },
    });
    return update.count === 1;
  }

  private async markFailed(id: string, channel: NotificationChannel, failureReason: string, now: Date): Promise<boolean> {
    const update = await this.prisma.notification.updateMany({
      where: { id, channel, status: NotificationStatus.QUEUED },
      data: {
        status: NotificationStatus.FAILED,
        providerResult: failureReason,
        failedAt: now,
      },
    });
    return update.count === 1;
  }
}
