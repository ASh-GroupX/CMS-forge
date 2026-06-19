import { HttpStatus } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';
import type { CustomerNotificationPreferenceRecord } from './notifications.repository.js';

export type NotificationPreferenceInput = {
  customerId?: string;
  preferredChannel?: NotificationChannel | string | null;
  smsQuietStart?: string | null;
  smsQuietEnd?: string | null;
  timezone?: string | null;
};

export type NotificationPreferenceData = {
  customerId: string;
  preferredChannel: NotificationChannel | null;
  smsQuietStart: string | null;
  smsQuietEnd: string | null;
  timezone: string | null;
};

export type NotificationPreferenceDto = NotificationPreferenceData & {
  id: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export function preferenceData(input: NotificationPreferenceInput): NotificationPreferenceData {
  return {
    customerId: requiredText(input.customerId, 'customerId'),
    preferredChannel: nullableChannel(input.preferredChannel),
    smsQuietStart: quietTime(input.smsQuietStart, 'smsQuietStart'),
    smsQuietEnd: quietTime(input.smsQuietEnd, 'smsQuietEnd'),
    timezone: nullableTimezone(input.timezone),
  };
}

export function preferenceDto(customerId: string, record: CustomerNotificationPreferenceRecord | null): NotificationPreferenceDto {
  return record ? {
    id: record.id,
    customerId: record.customerId,
    preferredChannel: record.preferredChannel,
    smsQuietStart: record.smsQuietStart,
    smsQuietEnd: record.smsQuietEnd,
    timezone: record.timezone,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  } : {
    id: null,
    customerId: requiredText(customerId, 'customerId'),
    preferredChannel: null,
    smsQuietStart: null,
    smsQuietEnd: null,
    timezone: null,
    createdAt: null,
    updatedAt: null,
  };
}

function nullableChannel(value: unknown): NotificationChannel | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && Object.values(NotificationChannel).includes(value as NotificationChannel)) {
    return value as NotificationChannel;
  }
  throw invalid('preferredChannel', 'preferredChannel is invalid.');
}

function quietTime(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  const text = requiredText(value, field);
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) return text;
  throw invalid(field, `${field} must be HH:mm.`);
}

function nullableTimezone(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = requiredText(value, 'timezone');
  if (/^[A-Za-z]+(?:[_-][A-Za-z]+)*\/[A-Za-z0-9]+(?:[_-][A-Za-z0-9]+)*$/.test(text)) return text;
  throw invalid('timezone', 'timezone is invalid.');
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw invalid(field, `${field} is required.`);
  return value.trim();
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid notification preference request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}
