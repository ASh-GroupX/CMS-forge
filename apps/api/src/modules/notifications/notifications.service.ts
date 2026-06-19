import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import { NotificationsRepository } from './notifications.repository.js';
import type { NotificationRecord } from './notifications.repository.js';

export type QueueInternalNotificationInput = {
  complaintId?: string | null;
  recipientUserId?: string | null;
  templateCode?: string;
  locale?: string;
  payload?: unknown;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

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

function isJson(value: unknown): value is Prisma.InputJsonValue {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isJson);
  return typeof value === 'object' && Object.values(value as Record<string, unknown>).every(isJson);
}

function hasBlockedKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasBlockedKey);
  return Object.entries(value).some(([key, child]) => blockedPayloadKey.test(key) || hasBlockedKey(child));
}

function invalidNotification(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid notification request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}
