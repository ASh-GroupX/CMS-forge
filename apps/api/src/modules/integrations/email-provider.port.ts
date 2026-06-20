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
  provider: 'in-memory' | 'smtp';
  accepted: string[];
};

export interface EmailProviderPort {
  send(input: EmailMessageInput): Promise<EmailSendResult>;
}

export type SmtpEmailConfig = {
  host: string;
  port: number;
  from: string;
  secure?: boolean;
  auth: {
    user: string;
    pass: string;
  };
};

export type SmtpMailInput = {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export type SmtpTransportResult = {
  messageId?: string;
  accepted?: unknown;
};

export interface SmtpEmailTransport {
  sendMail(input: SmtpMailInput): Promise<SmtpTransportResult>;
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

export class SmtpEmailProvider implements EmailProviderPort {
  private readonly config: SmtpEmailConfig;

  constructor(
    config: SmtpEmailConfig,
    private readonly transport: SmtpEmailTransport,
  ) {
    this.config = validateSmtpEmailConfig(config);
  }

  async send(input: EmailMessageInput): Promise<EmailSendResult> {
    const message = validateEmailMessage(input);
    const mail: SmtpMailInput = {
      from: this.config.from,
      to: message.to,
      subject: message.subject,
    };
    if (message.textBody) mail.text = message.textBody;
    if (message.htmlBody) mail.html = message.htmlBody;

    try {
      const result = await this.transport.sendMail(mail);

      return {
        messageId: typeof result.messageId === 'string' && result.messageId.trim() ? result.messageId.trim() : 'smtp_accepted',
        provider: 'smtp',
        accepted: acceptedRecipients(result.accepted, message.to),
      };
    } catch {
      throw new AppException('EMAIL_PROVIDER_FAILED', 'Email provider failed', HttpStatus.BAD_GATEWAY);
    }
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

export function validateSmtpEmailConfig(config: SmtpEmailConfig): SmtpEmailConfig {
  const host = smtpText(config.host, 'host');
  const port = Number(config.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw invalidSmtpConfig('port');
  const from = smtpText(config.from, 'from');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from) || /[\r\n]/.test(from)) throw invalidSmtpConfig('from');

  return {
    host,
    port,
    from,
    secure: config.secure ?? true,
    auth: {
      user: smtpText(config.auth?.user, 'auth'),
      pass: smtpText(config.auth?.pass, 'auth'),
    },
  };
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

function smtpText(value: unknown, field: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw invalidSmtpConfig(field);
}

function acceptedRecipients(value: unknown, fallback: string): string[] {
  if (!Array.isArray(value)) return [fallback];
  const recipients = value.filter((recipient): recipient is string => typeof recipient === 'string' && Boolean(recipient.trim()));
  return recipients.length ? recipients.map((recipient) => recipient.trim()) : [fallback];
}

function invalidEmail(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid email provider request', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}

function invalidSmtpConfig(field: string): AppException {
  return new AppException('VALIDATION_FAILED', 'Invalid SMTP email provider configuration', HttpStatus.BAD_REQUEST, [
    { field, code: 'REQUIRED', message: `${field} is required or invalid.` },
  ]);
}
