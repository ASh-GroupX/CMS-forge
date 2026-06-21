import { HttpStatus, Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { IntegrationsService } from '../integrations/integrations.service.js';
import { NotificationsRepository } from './notifications.repository.js';
import type { NotificationDeliveryMetadata, NotificationRecord } from './notifications.repository.js';
import { dispatchSkipReason, emailMessage, failureReason, quietHourBypassReason, smsMessage, whatsAppMessage } from './notification-dispatch.rules.js';
import { preferenceData, preferenceDto } from './notification-preference.rules.js';
import type { NotificationPreferenceDto, NotificationPreferenceInput } from './notification-preference.rules.js';
import { createTemplateData, updateTemplateData } from './notification-template.rules.js';
import type { NotificationTemplateCreateData, NotificationTemplateUpdateData } from './notification-template.rules.js';
import { templateAudit } from './notification-template.audit.js';
import type { NotificationTemplateAuditContext } from './notification-template.audit.js';
import { notificationDto, notificationTemplateDto } from './dto/notification-response.dto.js';
import type { NotificationResponseDto, NotificationTemplateResponseDto } from './dto/notification-response.dto.js';

export type QueueInternalNotificationInput = {
  complaintId?: string | null;
  recipientUserId?: string | null;
  templateCode?: string;
  locale?: string;
  payload?: unknown;
  idempotencyKey?: string;
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
    private readonly auditService: AuditService,
  ) {}

  async listTemplates(): Promise<NotificationTemplateResponseDto[]> {
    return (await this.notificationsRepository.listTemplates()).map(notificationTemplateDto);
  }

  async listForRecipient(recipientUserId: string): Promise<NotificationResponseDto[]> {
    return (await this.notificationsRepository.listForRecipient(requiredText(recipientUserId, 'recipientUserId'))).map(notificationDto);
  }

  async getCustomerPreference(customerId: string): Promise<NotificationPreferenceDto> {
    return preferenceDto(customerId, await this.notificationsRepository.findCustomerPreference(requiredText(customerId, 'customerId')));
  }

  async upsertCustomerPreference(input: NotificationPreferenceInput): Promise<NotificationPreferenceDto> {
    const data = preferenceData(input);
    return preferenceDto(data.customerId, await this.notificationsRepository.upsertCustomerPreference(data));
  }

  async createTemplate(input: NotificationTemplateCreateData, audit: NotificationTemplateAuditContext = {}): Promise<NotificationTemplateResponseDto> {
    const data = createTemplateData(input);
    return this.notificationsRepository.transaction(async (client) => {
      const template = await this.notificationsRepository.createTemplate(data, client);
      await this.auditService.record(templateAudit('template_created', template, audit, data), client);
      return notificationTemplateDto(template);
    });
  }

  async updateTemplate(id: string, input: NotificationTemplateUpdateData, audit: NotificationTemplateAuditContext = {}): Promise<NotificationTemplateResponseDto> {
    const data = updateTemplateData(input);
    if (Object.keys(data).length === 0) throw invalidNotification('body');
    return this.notificationsRepository.transaction(async (client) => {
      const template = await this.notificationsRepository.updateTemplate(requiredText(id, 'id'), data, client);
      await this.auditService.record(templateAudit('template_updated', template, audit, data), client);
      return notificationTemplateDto(template);
    });
  }

  async setTemplateActive(id: string, isActive: boolean, audit: NotificationTemplateAuditContext = {}): Promise<NotificationTemplateResponseDto> {
    return this.notificationsRepository.transaction(async (client) => {
      const template = await this.notificationsRepository.setTemplateActive(requiredText(id, 'id'), isActive, client);
      await this.auditService.record(templateAudit(isActive ? 'template_activated' : 'template_deactivated', template, audit, { isActive }), client);
      return notificationTemplateDto(template);
    });
  }

  async queueInternal(input: QueueInternalNotificationInput): Promise<NotificationRecord> {
    const templateCode = requiredText(input.templateCode, 'templateCode');
    const locale = requiredText(input.locale ?? 'en', 'locale');
    const payload = safePayload(input.payload ?? {});
    const idempotencyKey = input.idempotencyKey === undefined ? null : requiredText(input.idempotencyKey, 'idempotencyKey');

    const data = {
      complaintId: optionalText(input.complaintId),
      recipientUserId: optionalText(input.recipientUserId),
      templateCode,
      locale,
      payload: idempotencyKey ? payloadWithIdempotency(payload, idempotencyKey) : payload,
    };
    return idempotencyKey
      ? this.notificationsRepository.queueInternalOnce({ ...data, idempotencyKey })
      : this.notificationsRepository.queueInternal(data);
  }

  async dispatchQueuedEmail(limit = 25, now = new Date()): Promise<DispatchEmailNotificationsResult> {
    const queued = await this.notificationsRepository.findQueuedEmail(limit);
    return this.dispatchQueued(
      queued,
      emailMessage,
      (input) => this.integrationsService.sendEmail(input),
      (id, sent, metadata) => this.notificationsRepository.markEmailSent(id, sent, metadata),
      (data) => this.notificationsRepository.markEmailFailed(data),
      'EMAIL_PROVIDER_FAILED',
      now,
    );
  }

  async dispatchQueuedSms(limit = 25, now = new Date()): Promise<DispatchEmailNotificationsResult> {
    const queued = await this.notificationsRepository.findQueuedSms(limit);
    return this.dispatchQueued(
      queued,
      smsMessage,
      (input) => this.integrationsService.sendSms(input),
      (id, sent, metadata) => this.notificationsRepository.markSmsSent(id, sent, metadata),
      (data) => this.notificationsRepository.markSmsFailed(data),
      'SMS_PROVIDER_FAILED',
      now,
    );
  }

  async dispatchQueuedWhatsApp(limit = 25, now = new Date()): Promise<DispatchEmailNotificationsResult> {
    const queued = await this.notificationsRepository.findQueuedWhatsApp(limit);
    return this.dispatchQueued(
      queued,
      whatsAppMessage,
      (input) => this.integrationsService.sendWhatsApp(input),
      (id, sent, metadata) => this.notificationsRepository.markWhatsAppSent(id, sent, metadata),
      (data) => this.notificationsRepository.markWhatsAppFailed(data),
      'WHATSAPP_PROVIDER_FAILED',
      now,
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
    markSent: (id: string, result: TResult, metadata?: NotificationDeliveryMetadata) => Promise<boolean>,
    markFailed: (data: { id: string; failureReason: string }) => Promise<boolean>,
    providerFailureCode: string,
    now: Date,
  ): Promise<DispatchEmailNotificationsResult> {
    const result: DispatchEmailNotificationsResult = { attempted: queued.length, sent: 0, failed: 0, skipped: 0 };

    for (const notification of queued) {
      try {
        const { skipReason, metadata } = await this.dispatchDecision(notification, now);
        if (skipReason) {
          if (await markFailed({ id: notification.id, failureReason: skipReason })) result.failed += 1;
          else result.skipped += 1;
          continue;
        }
        const sent = await send(buildMessage(notification));
        if (await markSent(notification.id, sent, metadata)) result.sent += 1;
        else result.skipped += 1;
      } catch (error) {
        if (await markFailed({ id: notification.id, failureReason: failureReason(error, providerFailureCode) })) result.failed += 1;
        else result.skipped += 1;
      }
    }

    return result;
  }

  private async dispatchDecision(notification: NotificationRecord, now: Date): Promise<{ skipReason: string | null; metadata?: NotificationDeliveryMetadata }> {
    const customerId = notification.complaint?.customerId;
    const preference = customerId ? await this.notificationsRepository.findCustomerPreference(customerId) : null;
    const bypassReason = quietHourBypassReason(notification, preference, now);
    const decision = { skipReason: dispatchSkipReason(notification, preference, now) };
    return bypassReason ? { ...decision, metadata: { quietHourBypassReason: bypassReason } } : decision;
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

function payloadWithIdempotency(value: Prisma.InputJsonValue, idempotencyKey: string): Prisma.InputJsonValue {
  if (!isPlainObject(value)) throw invalidNotification('payload');
  return { ...value, idempotencyKey };
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
