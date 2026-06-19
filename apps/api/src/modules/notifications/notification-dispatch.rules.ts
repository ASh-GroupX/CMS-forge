import { ComplaintSeverity, NotificationChannel } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { EmailMessageInput } from '../integrations/email-provider.port.js';
import type { SmsMessageInput } from '../integrations/sms-provider.port.js';
import type { WhatsAppMessageInput } from '../integrations/whatsapp-provider.port.js';
import type { CustomerNotificationPreferenceRecord, NotificationRecord } from './notifications.repository.js';

export function emailMessage(notification: NotificationRecord): EmailMessageInput {
  const payload = isPlainObject(notification.payload) ? notification.payload : {};
  return {
    to: payloadText(payload.to) ?? '',
    subject: payloadText(payload.subject) || notification.templateCode,
    textBody: payloadText(payload.textBody),
    htmlBody: payloadText(payload.htmlBody),
    payload,
  };
}

export function smsMessage(notification: NotificationRecord): SmsMessageInput {
  const payload = isPlainObject(notification.payload) ? notification.payload : {};
  return { to: payloadText(payload.to) ?? '', textBody: payloadText(payload.textBody) ?? '', payload };
}

export function whatsAppMessage(notification: NotificationRecord): WhatsAppMessageInput {
  const payload = isPlainObject(notification.payload) ? notification.payload : {};
  return { to: payloadText(payload.to) ?? '', textBody: payloadText(payload.textBody) ?? '', payload };
}

export function dispatchSkipReason(
  notification: NotificationRecord,
  preference: CustomerNotificationPreferenceRecord | null,
  now: Date,
): string | null {
  if (!preference) return null;
  if (preference.preferredChannel && preference.preferredChannel !== notification.channel) return 'NOTIFICATION_CHANNEL_PREFERENCE_SKIPPED';
  if (notification.channel === NotificationChannel.SMS && inQuietHours(preference, now) && notification.complaint?.severity !== ComplaintSeverity.CRITICAL) return 'NOTIFICATION_QUIET_HOURS_SKIPPED';
  return null;
}

export function quietHourBypassReason(
  notification: NotificationRecord,
  preference: CustomerNotificationPreferenceRecord | null,
  now: Date,
): string | undefined {
  return preference &&
    notification.channel === NotificationChannel.SMS &&
    notification.complaint?.severity === ComplaintSeverity.CRITICAL &&
    inQuietHours(preference, now)
    ? 'CRITICAL_COMPLAINT_QUIET_HOURS_BYPASS'
    : undefined;
}

export function failureReason(error: unknown, providerFailureCode: string): string {
  if (error instanceof AppException) return error.code;
  return providerFailureCode;
}

function inQuietHours(preference: CustomerNotificationPreferenceRecord, now: Date): boolean {
  if (!preference.smsQuietStart || !preference.smsQuietEnd || !preference.timezone) return false;
  const local = new Intl.DateTimeFormat('en-GB', {
    timeZone: preference.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  const start = minutes(preference.smsQuietStart), end = minutes(preference.smsQuietEnd), current = minutes(local);
  return start <= end ? current >= start && current < end : current >= start || current < end;
}

function minutes(value: string): number {
  const [hours, mins] = value.split(':').map(Number);
  return (hours ?? 0) * 60 + (mins ?? 0);
}

function payloadText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}
