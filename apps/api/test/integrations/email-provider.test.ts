import assert from 'node:assert/strict';
import test from 'node:test';
import { AppException } from '../../src/core/http-kernel.ts';
import {
  InMemoryEmailProvider,
  SmtpEmailProvider,
  validateSmtpEmailConfig,
  type SmtpEmailConfig,
  type SmtpMailInput,
} from '../../src/modules/integrations/email-provider.port.ts';
import { emailProviderFromEnv } from '../../src/modules/integrations/email-provider.factory.ts';
import { IntegrationsRepository } from '../../src/modules/integrations/integrations.repository.ts';
import { IntegrationsService } from '../../src/modules/integrations/integrations.service.ts';

test('integrations email provider sends through the module-owned port', async () => {
  const provider = new InMemoryEmailProvider();
  const service = new IntegrationsService(new IntegrationsRepository(), provider, {} as never, {} as never);

  const result = await service.sendEmail({
    to: 'customer@example.com',
    subject: 'Complaint update',
    textBody: 'Your complaint has an update.',
    payload: { complaintId: 'cmp_1' },
  });

  assert.deepEqual(result, {
    messageId: 'email_1',
    provider: 'in-memory',
    accepted: ['customer@example.com'],
  });
  assert.equal(provider.sent.length, 1);
  assert.equal(provider.sent[0]?.to, 'customer@example.com');
});

test('integrations email provider rejects unsafe recipient and payload data before send', async () => {
  const provider = new InMemoryEmailProvider();
  const service = new IntegrationsService(new IntegrationsRepository(), provider, {} as never, {} as never);

  await assert.rejects(
    service.sendEmail({ to: 'bad\n@example.com', subject: 'Update', textBody: 'Body' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.sendEmail({ to: 'customer@example.com', subject: 'Update', textBody: 'Body', payload: { providerSecret: 'hidden' } }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(provider.sent.length, 0);
});

test('integrations email provider result exposes no provider credentials', async () => {
  process.env.EMAIL_PROVIDER_SECRET = 'do-not-return';
  const service = new IntegrationsService(new IntegrationsRepository(), new InMemoryEmailProvider(), {} as never, {} as never);

  const result = await service.sendEmail({ to: 'customer@example.com', subject: 'Update', textBody: 'Body' });
  const response = JSON.stringify(result);

  assert.equal(response.includes('do-not-return'), false);
  assert.equal(/secret|credential|apiKey|password|token/i.test(response), false);
});

test('smtp email provider sends through the injected transport', async () => {
  const sent: SmtpMailInput[] = [];
  const provider = new SmtpEmailProvider(smtpConfig(), {
    async sendMail(input) {
      sent.push(input);
      return { messageId: 'smtp_1', accepted: [input.to] };
    },
  });

  const result = await provider.send({
    to: 'customer@example.com',
    subject: 'Complaint update',
    textBody: 'Your complaint has an update.',
    htmlBody: '<p>Your complaint has an update.</p>',
  });

  assert.deepEqual(result, {
    messageId: 'smtp_1',
    provider: 'smtp',
    accepted: ['customer@example.com'],
  });
  assert.deepEqual(sent, [
    {
      from: 'support@example.com',
      to: 'customer@example.com',
      subject: 'Complaint update',
      text: 'Your complaint has an update.',
      html: '<p>Your complaint has an update.</p>',
    },
  ]);
});

test('smtp email provider validates required config with safe messages', () => {
  const unsafeConfig = smtpConfig({ host: '', port: 0, auth: { user: 'smtp-user', pass: 'smtp-secret-value' } });

  assert.throws(
    () => validateSmtpEmailConfig(unsafeConfig),
    (error: unknown) => {
      const response = JSON.stringify(error);
      return (
        error instanceof AppException &&
        error.code === 'VALIDATION_FAILED' &&
        !response.includes('smtp-secret-value') &&
        !/password|token|credential/i.test(response)
      );
    },
  );
});

test('smtp email provider returns safe failure when transport rejects', async () => {
  const provider = new SmtpEmailProvider(smtpConfig({ auth: { user: 'smtp-user', pass: 'smtp-secret-value' } }), {
    async sendMail() {
      throw new Error('smtp-secret-value');
    },
  });

  await assert.rejects(
    provider.send({ to: 'customer@example.com', subject: 'Update', textBody: 'Body' }),
    (error: unknown) => {
      const response = JSON.stringify(error);
      return (
        error instanceof AppException &&
        error.code === 'EMAIL_PROVIDER_FAILED' &&
        !response.includes('smtp-secret-value') &&
        !/password|token|credential/i.test(response)
      );
    },
  );
});

test('email provider env selection defaults dev and test to in-memory', async () => {
  const provider = emailProviderFromEnv({ NODE_ENV: 'test' });
  const service = new IntegrationsService(new IntegrationsRepository(), provider, {} as never, {} as never);

  const result = await service.sendEmail({
    to: 'customer@example.com',
    subject: 'Update',
    textBody: 'Body',
  });

  assert.deepEqual(result, {
    messageId: 'email_1',
    provider: 'in-memory',
    accepted: ['customer@example.com'],
  });
});

test('email provider env selection sends SMTP through test double transport', async () => {
  const sent: SmtpMailInput[] = [];
  const provider = emailProviderFromEnv(smtpEnv(), (config) => {
    assert.equal(config.host, 'smtp.example.com');
    assert.equal(config.port, 587);
    assert.equal(config.from, 'support@example.com');
    return {
      async sendMail(input) {
        sent.push(input);
        return { messageId: 'smtp_env_1', accepted: [input.to] };
      },
    };
  });

  const service = new IntegrationsService(new IntegrationsRepository(), provider, {} as never, {} as never);
  const result = await service.sendEmail({
    to: 'customer@example.com',
    subject: 'Update',
    textBody: 'Body',
  });

  assert.deepEqual(result, {
    messageId: 'smtp_env_1',
    provider: 'smtp',
    accepted: ['customer@example.com'],
  });
  assert.equal(sent[0]?.from, 'support@example.com');
});

test('email provider env selection fails closed for unsafe production SMTP config', () => {
  const env = smtpEnv({ SMTP_HOST: '', SMTP_PASSWORD: 'smtp-secret-value' });

  assert.throws(
    () => emailProviderFromEnv(env),
    (error: unknown) => {
      const response = String(error);
      return (
        error instanceof Error &&
        response.includes('SMTP_HOST is required') &&
        !response.includes('smtp-secret-value') &&
        !/password|token|credential/i.test(response)
      );
    },
  );
});

function smtpConfig(overrides: Partial<SmtpEmailConfig> = {}): SmtpEmailConfig {
  return {
    host: 'smtp.example.com',
    port: 587,
    from: 'support@example.com',
    secure: true,
    auth: {
      user: 'smtp-user',
      pass: 'smtp-pass',
    },
    ...overrides,
  };
}

function smtpEnv(overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return {
    NODE_ENV: 'production',
    EMAIL_PROVIDER_DRIVER: 'smtp',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_FROM: 'support@example.com',
    SMTP_USER: 'smtp-user',
    SMTP_PASSWORD: 'smtp-pass',
    ...overrides,
  };
}
