import nodemailer from 'nodemailer';
import {
  InMemoryEmailProvider,
  SmtpEmailProvider,
  validateSmtpEmailConfig,
  type EmailProviderPort,
  type SmtpEmailConfig,
  type SmtpEmailTransport,
} from './email-provider.port.js';

export type EmailProviderEnv = Record<string, string | undefined>;
export type SmtpTransportFactory = (config: SmtpEmailConfig) => SmtpEmailTransport;

export function emailProviderFromEnv(
  env: EmailProviderEnv = process.env,
  createTransport: SmtpTransportFactory = nodemailerSmtpTransport,
): EmailProviderPort {
  const driver = (env.EMAIL_PROVIDER_DRIVER?.trim() || defaultEmailProviderDriver(env)).toLowerCase();
  if (driver === 'in-memory') return new InMemoryEmailProvider();
  if (driver === 'smtp') {
    const config = smtpEmailConfigFromEnv(env);
    return new SmtpEmailProvider(config, createTransport(config));
  }
  throw new Error('EMAIL_PROVIDER_DRIVER must be in-memory or smtp');
}

export function smtpEmailConfigFromEnv(env: EmailProviderEnv): SmtpEmailConfig {
  return validateSmtpEmailConfig({
    host: requiredEmailEnv(env, 'SMTP_HOST'),
    port: emailPortEnv(env.SMTP_PORT),
    from: requiredEmailEnv(env, 'SMTP_FROM'),
    secure: booleanEmailEnv(env.SMTP_SECURE, true, 'SMTP_SECURE'),
    auth: {
      user: requiredEmailEnv(env, 'SMTP_USER'),
      pass: requiredEmailEnv(env, 'SMTP_PASSWORD', 'SMTP_AUTH'),
    },
  });
}

export function nodemailerSmtpTransport(config: SmtpEmailConfig): SmtpEmailTransport {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure ?? true,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
  });

  return {
    async sendMail(input) {
      const result = await transport.sendMail(input);
      return { messageId: result.messageId, accepted: result.accepted };
    },
  };
}

function defaultEmailProviderDriver(env: EmailProviderEnv): string {
  return env.NODE_ENV === 'production' ? 'smtp' : 'in-memory';
}

function requiredEmailEnv(env: EmailProviderEnv, key: string, safeField = key): string {
  const value = env[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw new Error(`${safeField} is required`);
}

function emailPortEnv(value: string | undefined): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT must be between 1 and 65535');
  return port;
}

function booleanEmailEnv(value: string | undefined, fallback: boolean, name: string): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  if (['true', '1'].includes(value.toLowerCase())) return true;
  if (['false', '0'].includes(value.toLowerCase())) return false;
  throw new Error(`${name} must be true or false`);
}
