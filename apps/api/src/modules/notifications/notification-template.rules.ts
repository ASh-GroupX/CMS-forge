import { HttpStatus } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { AppException } from '../../core/http-kernel.js';

export type NotificationTemplateCreateData = {
  code: string;
  channel: NotificationChannel;
  locale: string;
  subject?: string | null;
  body: string;
  version?: number;
  versionNote?: string | null;
  isActive?: boolean;
};

export type NotificationTemplateUpdateData = Partial<NotificationTemplateCreateData>;
type TemplateInput = Partial<Record<keyof NotificationTemplateCreateData, unknown>>;

export function parseCreateTemplateBody(body: unknown): NotificationTemplateCreateData {
  return createTemplateData(objectBody(body));
}

export function parseUpdateTemplateBody(body: unknown): NotificationTemplateUpdateData {
  const data = updateTemplateData(objectBody(body));
  if (Object.keys(data).length === 0) throw invalid('body', 'At least one template field is required.');
  return data;
}

export function createTemplateData(input: TemplateInput): NotificationTemplateCreateData {
  return {
    code: templateCode(input.code),
    channel: channel(input.channel),
    locale: locale(input.locale),
    subject: nullableText(input.subject, 'subject'),
    body: requiredText(input.body, 'body'),
    version: version(input.version ?? 1),
    versionNote: nullableText(input.versionNote, 'versionNote'),
    isActive: active(input.isActive ?? true),
  };
}

export function updateTemplateData(input: TemplateInput): NotificationTemplateUpdateData {
  const data: NotificationTemplateUpdateData = {};
  if (input.code !== undefined) data.code = templateCode(input.code);
  if (input.channel !== undefined) data.channel = channel(input.channel);
  if (input.locale !== undefined) data.locale = locale(input.locale);
  if (input.subject !== undefined) data.subject = nullableText(input.subject, 'subject');
  if (input.body !== undefined) data.body = requiredText(input.body, 'body');
  if (input.version !== undefined) data.version = version(input.version);
  if (input.versionNote !== undefined) data.versionNote = nullableText(input.versionNote, 'versionNote');
  if (input.isActive !== undefined) data.isActive = active(input.isActive);
  return data;
}

function objectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('body', 'Request body must be an object.');
  return body as Record<string, unknown>;
}

function templateCode(value: unknown): string {
  const text = requiredText(value, 'code');
  if (!/^[a-z][a-z0-9.-]{1,79}$/.test(text)) throw invalid('code', 'code must be a stable lowercase template code.');
  return text;
}

function channel(value: unknown): NotificationChannel {
  if (typeof value === 'string' && Object.values(NotificationChannel).includes(value as NotificationChannel)) {
    return value as NotificationChannel;
  }
  throw invalid('channel', 'channel is required or invalid.');
}

function locale(value: unknown): string {
  if (value === 'en' || value === 'ar') return value;
  throw invalid('locale', 'locale must be en or ar.');
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw invalid(field, `${field} is required.`);
  return value.trim();
}

function nullableText(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  return requiredText(value, field);
}

function version(value: unknown): number {
  if (Number.isInteger(value) && Number(value) > 0) return Number(value);
  throw invalid('version', 'version must be a positive integer.');
}

function active(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  throw invalid('isActive', 'isActive must be boolean.');
}

function invalid(field: string, message: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid notification template request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message },
  ]);
}
