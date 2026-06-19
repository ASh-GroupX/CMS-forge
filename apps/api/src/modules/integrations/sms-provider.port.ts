import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

export type SmsMessageInput = {
  to: string;
  textBody: string;
  payload?: unknown;
};

export type SmsSendResult = {
  messageId: string;
  provider: 'in-memory';
  accepted: string[];
};

export interface SmsProviderPort {
  send(input: SmsMessageInput): Promise<SmsSendResult>;
}

@Injectable()
export class InMemorySmsProvider implements SmsProviderPort {
  readonly sent: Array<SmsMessageInput & { messageId: string }> = [];

  async send(input: SmsMessageInput): Promise<SmsSendResult> {
    const messageId = `sms_${this.sent.length + 1}`;
    this.sent.push({ ...input, messageId });
    return { messageId, provider: 'in-memory', accepted: [input.to] };
  }
}

export function validateSmsMessage(input: SmsMessageInput): SmsMessageInput {
  const to = text(input.to, 'to');
  if (!/^\+[1-9]\d{7,14}$/.test(to) || /[\r\n]/.test(to)) throw invalidSms('to');
  const textBody = text(input.textBody, 'textBody');
  if (!isSafePayload(input.payload ?? {})) throw invalidSms('payload');
  return { ...input, to, textBody };
}

const blockedKey = /(password|token|otp|hash|secret|credential)/i;

function text(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw invalidSms(field);
}

function isSafePayload(value: unknown): boolean {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isSafePayload);
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.entries(value).every(([key, child]) => !blockedKey.test(key) && isSafePayload(child));
}

function invalidSms(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid SMS provider request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}
