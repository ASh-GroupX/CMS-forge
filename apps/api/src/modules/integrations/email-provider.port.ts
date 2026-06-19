import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');

export type EmailMessageInput = {
  to: string;
  subject: string;
  textBody?: string | null;
  htmlBody?: string | null;
  payload?: unknown;
};

export type EmailSendResult = {
  messageId: string;
  provider: 'in-memory';
  accepted: string[];
};

export interface EmailProviderPort {
  send(input: EmailMessageInput): Promise<EmailSendResult>;
}

@Injectable()
export class InMemoryEmailProvider implements EmailProviderPort {
  readonly sent: Array<EmailMessageInput & { messageId: string }> = [];

  async send(input: EmailMessageInput): Promise<EmailSendResult> {
    const messageId = `email_${this.sent.length + 1}`;
    this.sent.push({ ...input, messageId });
    return { messageId, provider: 'in-memory', accepted: [input.to] };
  }
}

export function validateEmailMessage(input: EmailMessageInput): EmailMessageInput {
  const to = text(input.to, 'to');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to) || /[\r\n]/.test(to)) throw invalidEmail('to');
  const subject = text(input.subject, 'subject');
  if (/[\r\n]/.test(subject)) throw invalidEmail('subject');
  if (!text(input.textBody ?? input.htmlBody, 'body')) throw invalidEmail('body');
  if (!isSafePayload(input.payload ?? {})) throw invalidEmail('payload');
  return { ...input, to, subject };
}

const blockedKey = /(password|token|otp|hash|secret|credential)/i;

function text(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw invalidEmail(field);
}

function isSafePayload(value: unknown): boolean {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isSafePayload);
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.entries(value).every(([key, child]) => !blockedKey.test(key) && isSafePayload(child));
}

function invalidEmail(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid email provider request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}
