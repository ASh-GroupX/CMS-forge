import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import type { EmailSendResult } from '../integrations/email-provider.port.js';
import type { SmsSendResult } from '../integrations/sms-provider.port.js';
import type { WhatsAppSendResult } from '../integrations/whatsapp-provider.port.js';
import type { NotificationPreferenceData } from './notification-preference.rules.js';
import type { NotificationTemplateCreateData, NotificationTemplateUpdateData } from './notification-template.rules.js';

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
  complaint: { select: { customerId: true, severity: true } },
} satisfies Prisma.NotificationSelect;

const notificationTemplateSelect = {
  id: true,
  code: true,
  channel: true,
  locale: true,
  subject: true,
  body: true,
  version: true,
  versionNote: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationTemplateSelect;

const customerNotificationPreferenceSelect = {
  id: true,
  customerId: true,
  preferredChannel: true,
  smsQuietStart: true,
  smsQuietEnd: true,
  timezone: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerNotificationPreferenceSelect;

export type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;
export type NotificationTemplateRecord = Prisma.NotificationTemplateGetPayload<{ select: typeof notificationTemplateSelect }>;
export type CustomerNotificationPreferenceRecord = Prisma.CustomerNotificationPreferenceGetPayload<{ select: typeof customerNotificationPreferenceSelect }>;

export type QueueInternalNotificationData = {
  complaintId?: string | null;
  recipientUserId?: string | null;
  templateCode: string;
  locale: string;
  payload: Prisma.InputJsonValue;
};
export type QueueInternalNotificationOnceData = QueueInternalNotificationData & {
  idempotencyKey: string;
};

export type MarkEmailFailedData = {
  id: string;
  failureReason: string;
};
export type NotificationDeliveryMetadata = { quietHourBypassReason?: string };

type ProviderSendResult = EmailSendResult | SmsSendResult | WhatsAppSendResult;
type TemplateClient = Pick<Prisma.TransactionClient, 'notificationTemplate'>;
type NotificationWriteClient = Pick<Prisma.TransactionClient, 'notification' | 'notificationDeliveryAttempt'>;

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(work: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work);
  }

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

  async queueInternalOnce(data: QueueInternalNotificationOnceData): Promise<NotificationRecord> {
    const existing = await this.prisma.notification.findFirst({
      where: {
        channel: NotificationChannel.IN_APP,
        templateCode: data.templateCode,
        recipientUserId: data.recipientUserId ?? null,
        payload: { path: ['idempotencyKey'], equals: data.idempotencyKey },
      },
      select: notificationSelect,
    });
    return existing ?? this.queueInternal(data);
  }

  async findCustomerPreference(customerId: string): Promise<CustomerNotificationPreferenceRecord | null> {
    return this.prisma.customerNotificationPreference.findUnique({
      where: { customerId },
      select: customerNotificationPreferenceSelect,
    });
  }

  async upsertCustomerPreference(data: NotificationPreferenceData): Promise<CustomerNotificationPreferenceRecord> {
    const write = {
      preferredChannel: data.preferredChannel,
      smsQuietStart: data.smsQuietStart,
      smsQuietEnd: data.smsQuietEnd,
      timezone: data.timezone,
    };
    return this.prisma.customerNotificationPreference.upsert({
      where: { customerId: data.customerId },
      create: { customerId: data.customerId, ...write },
      update: write,
      select: customerNotificationPreferenceSelect,
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

  async markEmailSent(id: string, result: EmailSendResult, metadataOrNow?: NotificationDeliveryMetadata | Date, now = new Date()): Promise<boolean> {
    const sent = sentAttempt(metadataOrNow, now);
    return this.markSent(id, NotificationChannel.EMAIL, result, sent.metadata, sent.now);
  }

  async markSmsSent(id: string, result: SmsSendResult, metadataOrNow?: NotificationDeliveryMetadata | Date, now = new Date()): Promise<boolean> {
    const sent = sentAttempt(metadataOrNow, now);
    return this.markSent(id, NotificationChannel.SMS, result, sent.metadata, sent.now);
  }

  async markWhatsAppSent(id: string, result: WhatsAppSendResult, metadataOrNow?: NotificationDeliveryMetadata | Date, now = new Date()): Promise<boolean> {
    const sent = sentAttempt(metadataOrNow, now);
    return this.markSent(id, NotificationChannel.WHATSAPP, result, sent.metadata, sent.now);
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

  async listTemplates(): Promise<NotificationTemplateRecord[]> {
    return this.prisma.notificationTemplate.findMany({
      orderBy: [{ code: 'asc' }, { channel: 'asc' }, { locale: 'asc' }, { version: 'desc' }],
      select: notificationTemplateSelect,
    });
  }

  async createTemplate(data: NotificationTemplateCreateData, client: TemplateClient = this.prisma): Promise<NotificationTemplateRecord> {
    return client.notificationTemplate.create({ data, select: notificationTemplateSelect });
  }

  async updateTemplate(id: string, data: NotificationTemplateUpdateData, client: TemplateClient = this.prisma): Promise<NotificationTemplateRecord> {
    return client.notificationTemplate.update({ where: { id }, data, select: notificationTemplateSelect });
  }

  async setTemplateActive(id: string, isActive: boolean, client: TemplateClient = this.prisma): Promise<NotificationTemplateRecord> {
    return client.notificationTemplate.update({ where: { id }, data: { isActive }, select: notificationTemplateSelect });
  }

  private async findQueued(channel: NotificationChannel, limit: number): Promise<NotificationRecord[]> {
    return this.prisma.notification.findMany({
      where: { channel, status: NotificationStatus.QUEUED },
      orderBy: { queuedAt: 'asc' },
      take: limit,
      select: notificationSelect,
    });
  }

  private async markSent(id: string, channel: NotificationChannel, result: ProviderSendResult, metadata: NotificationDeliveryMetadata | undefined, now: Date): Promise<boolean> {
    const providerResult = safeProviderResult(result, metadata);
    return this.prisma.$transaction(async (client) => {
      await this.recordAttempt(client, { id, channel, status: NotificationStatus.SENT, provider: result.provider, providerResult, now });
      const update = await client.notification.updateMany({
        where: { id, channel, status: NotificationStatus.QUEUED },
        data: { status: NotificationStatus.SENT, provider: result.provider, providerResult, sentAt: now },
      });
      return update.count === 1;
    });
  }

  private async markFailed(id: string, channel: NotificationChannel, failureReason: string, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (client) => {
      await this.recordAttempt(client, { id, channel, status: NotificationStatus.FAILED, failureReason, now });
      const update = await client.notification.updateMany({
        where: { id, channel, status: NotificationStatus.QUEUED },
        data: { status: NotificationStatus.FAILED, providerResult: failureReason, failedAt: now },
      });
      return update.count === 1;
    });
  }

  private async recordAttempt(
    client: NotificationWriteClient,
    data: { id: string; channel: NotificationChannel; status: NotificationStatus; provider?: string; providerResult?: string; failureReason?: string; now: Date },
  ): Promise<void> {
    await client.notificationDeliveryAttempt.create({
      data: {
        notificationId: data.id,
        channel: data.channel,
        status: data.status,
        provider: data.provider ?? null,
        providerResult: data.providerResult ?? null,
        failureReason: data.failureReason ?? null,
        attemptedAt: data.now,
      },
    });
  }
}

function safeProviderResult(result: ProviderSendResult, metadata?: NotificationDeliveryMetadata): string {
  return JSON.stringify({ messageId: result.messageId, provider: result.provider, accepted: result.accepted, ...metadata });
}

function sentAttempt(metadataOrNow: NotificationDeliveryMetadata | Date | undefined, fallbackNow: Date): { metadata?: NotificationDeliveryMetadata; now: Date } {
  if (metadataOrNow instanceof Date) return { now: metadataOrNow };
  return metadataOrNow ? { metadata: metadataOrNow, now: fallbackNow } : { now: fallbackNow };
}
