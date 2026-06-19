import { HttpStatus, Injectable } from '@nestjs/common';
import { AppException } from '../../core/http-kernel.js';

export const WHATSAPP_PROVIDER = Symbol('WHATSAPP_PROVIDER');

export type WhatsAppMessageInput = {
  to: string;
  textBody: string;
  payload?: unknown;
};

export type WhatsAppSendResult = {
  messageId: string;
  provider: 'in-memory';
  accepted: string[];
};

export interface WhatsAppProviderPort {
  send(input: WhatsAppMessageInput): Promise<WhatsAppSendResult>;
}

@Injectable()
export class InMemoryWhatsAppProvider implements WhatsAppProviderPort {
  readonly sent: Array<WhatsAppMessageInput & { messageId: string }> = [];

  async send(input: WhatsAppMessageInput): Promise<WhatsAppSendResult> {
    const messageId = `whatsapp_${this.sent.length + 1}`;
    this.sent.push({ ...input, messageId });
    return { messageId, provider: 'in-memory', accepted: [input.to] };
  }
}

export function validateWhatsAppMessage(input: WhatsAppMessageInput): WhatsAppMessageInput {
  const to = text(input.to, 'to');
  if (!/^\+[1-9]\d{7,14}$/.test(to) || /[\r\n]/.test(to)) throw invalidWhatsApp('to');
  const textBody = text(input.textBody, 'textBody');
  if (!isSafePayload(input.payload ?? {})) throw invalidWhatsApp('payload');
  return { ...input, to, textBody };
}

const blockedKey = /(password|token|otp|hash|secret|credential)/i;

function text(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw invalidWhatsApp(field);
}

function isSafePayload(value: unknown): boolean {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isSafePayload);
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.entries(value).every(([key, child]) => !blockedKey.test(key) && isSafePayload(child));
}

function invalidWhatsApp(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid WhatsApp provider request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}
