import { HttpStatus, Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import { IntegrationsService } from '../integrations/integrations.service.js';
import type { EmailMessageInput } from '../integrations/email-provider.port.js';
import type { SmsMessageInput } from '../integrations/sms-provider.port.js';
import type { WhatsAppMessageInput } from '../integrations/whatsapp-provider.port.js';
import { NotificationsRepository } from './notifications.repository.js';
import type { NotificationRecord } from './notifications.repository.js';

export type QueueInternalNotificationInput = {
  complaintId?: string | null;
  recipientUserId?: string | null;
  templateCode?: string;
  locale?: string;
  payload?: unknown;
};

export type DispatchEmailNotificationsResult = {
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
};

export type ResolveNotificationTemplateInput = {
  templateCode?: string;
  channel?: NotificationChannel | string;
  locale?: string;
  payload?: unknown;
};

export type ResolvedNotificationTemplate = {
  templateId: string;
  templateCode: string;
  channel: NotificationChannel;
  locale: string;
  subject: string | null;
  body: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly integrationsService: IntegrationsService,
  ) {}

  async queueInternal(input: QueueInternalNotificationInput): Promise<NotificationRecord> {
    const templateCode = requiredText(input.templateCode, 'templateCode');
    const locale = requiredText(input.locale ?? 'en', 'locale');
    const payload = safePayload(input.payload ?? {});

    return this.notificationsRepository.queueInternal({
      complaintId: optionalText(input.complaintId),
      recipientUserId: optionalText(input.recipientUserId),
      templateCode,
      locale,
      payload,
    });
  }

  async dispatchQueuedEmail(limit = 25): Promise<DispatchEmailNotificationsResult> {
    const queued = await this.notificationsRepository.findQueuedEmail(limit);
    return this.dispatchQueued(
      queued,
      emailMessage,
      (input) => this.integrationsService.sendEmail(input),
      (id, sent) => this.notificationsRepository.markEmailSent(id, sent),
      (data) => this.notificationsRepository.markEmailFailed(data),
      'EMAIL_PROVIDER_FAILED',
    );
  }

  async dispatchQueuedSms(limit = 25): Promise<DispatchEmailNotificationsResult> {
    const queued = await this.notificationsRepository.findQueuedSms(limit);
    return this.dispatchQueued(
      queued,
      smsMessage,
      (input) => this.integrationsService.sendSms(input),
      (id, sent) => this.notificationsRepository.markSmsSent(id, sent),
      (data) => this.notificationsRepository.markSmsFailed(data),
      'SMS_PROVIDER_FAILED',
    );
  }

  async dispatchQueuedWhatsApp(limit = 25): Promise<DispatchEmailNotificationsResult> {
    const queued = await this.notificationsRepository.findQueuedWhatsApp(limit);
    return this.dispatchQueued(
      queued,
      whatsAppMessage,
      (input) => this.integrationsService.sendWhatsApp(input),
      (id, sent) => this.notificationsRepository.markWhatsAppSent(id, sent),
      (data) => this.notificationsRepository.markWhatsAppFailed(data),
      'WHATSAPP_PROVIDER_FAILED',
    );
  }

  async resolveTemplate(input: ResolveNotificationTemplateInput): Promise<ResolvedNotificationTemplate> {
    const templateCode = requiredText(input.templateCode, 'templateCode');
    const channel = notificationChannel(input.channel);
    const locale = notificationLocale(input.locale ?? 'en');
    const payload = safePayload(input.payload ?? {});
    const template =
      (await this.notificationsRepository.findActiveTemplate(templateCode, channel, locale)) ??
      (locale === 'en' ? null : await this.notificationsRepository.findActiveTemplate(templateCode, channel, 'en'));

    if (!template) {
      throw new AppException('NOTIFICATION_TEMPLATE_NOT_FOUND', 'Notification template was not found', HttpStatus.NOT_FOUND);
    }

    return {
      templateId: template.id,
      templateCode: template.code,
      channel: template.channel,
      locale: template.locale,
      subject: template.subject ? renderTemplate(template.subject, payload) : null,
      body: renderTemplate(template.body, payload),
    };
  }

  private async dispatchQueued<TInput, TResult>(
    queued: NotificationRecord[],
    buildMessage: (notification: NotificationRecord) => TInput,
    send: (input: TInput) => Promise<TResult>,
    markSent: (id: string, result: TResult) => Promise<boolean>,
    markFailed: (data: { id: string; failureReason: string }) => Promise<boolean>,
    providerFailureCode: string,
  ): Promise<DispatchEmailNotificationsResult> {
    const result: DispatchEmailNotificationsResult = { attempted: queued.length, sent: 0, failed: 0, skipped: 0 };

    for (const notification of queued) {
      try {
        const sent = await send(buildMessage(notification));
        if (await markSent(notification.id, sent)) result.sent += 1;
        else result.skipped += 1;
      } catch (error) {
        if (await markFailed({ id: notification.id, failureReason: failureReason(error, providerFailureCode) })) result.failed += 1;
        else result.skipped += 1;
      }
    }

    return result;
  }
}

const blockedPayloadKey = /(password|token|otp|hash|secret|credential)/i;

function requiredText(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw invalidNotification(field);
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function safePayload(value: unknown): Prisma.InputJsonValue {
  if (!isJson(value) || hasBlockedKey(value)) throw invalidNotification('payload');
  return value;
}

function notificationChannel(value: unknown): NotificationChannel {
  if (typeof value === 'string' && Object.values(NotificationChannel).includes(value as NotificationChannel)) {
    return value as NotificationChannel;
  }
  throw invalidNotification('channel');
}

function notificationLocale(value: unknown): string {
  if (value === 'ar' || value === 'en') return value;
  throw invalidNotification('locale');
}

function renderTemplate(template: string, payload: Prisma.InputJsonValue): string {
  return template.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_match, path: string) => scalarAtPath(payload, path));
}

function scalarAtPath(value: unknown, path: string): string {
  const found = path.split('.').reduce<unknown>((current, part) => (isPlainObject(current) ? current[part] : undefined), value);
  return ['string', 'number', 'boolean'].includes(typeof found) ? String(found) : '';
}

function emailMessage(notification: NotificationRecord): EmailMessageInput {
  const payload = isPlainObject(notification.payload) ? notification.payload : {};
  return {
    to: payloadText(payload.to) ?? '',
    subject: payloadText(payload.subject) || notification.templateCode,
    textBody: payloadText(payload.textBody),
    htmlBody: payloadText(payload.htmlBody),
    payload,
  };
}

function smsMessage(notification: NotificationRecord): SmsMessageInput {
  const payload = isPlainObject(notification.payload) ? notification.payload : {};
  return {
    to: payloadText(payload.to) ?? '',
    textBody: payloadText(payload.textBody) ?? '',
    payload,
  };
}

function whatsAppMessage(notification: NotificationRecord): WhatsAppMessageInput {
  const payload = isPlainObject(notification.payload) ? notification.payload : {};
  return {
    to: payloadText(payload.to) ?? '',
    textBody: payloadText(payload.textBody) ?? '',
    payload,
  };
}

function payloadText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isJson(value: unknown): value is Prisma.InputJsonValue {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isJson);
  return isPlainObject(value) && Object.values(value).every(isJson);
}

function hasBlockedKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasBlockedKey);
  return Object.entries(value).some(([key, child]) => blockedPayloadKey.test(key) || hasBlockedKey(child));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

function invalidNotification(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid notification request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}

function failureReason(error: unknown, providerFailureCode: string): string {
  if (error instanceof AppException) return error.code;
  return providerFailureCode;
}
