import assert from 'node:assert/strict';
import test from 'node:test';
import { AppException } from '../../src/core/http-kernel.ts';
import { InMemoryEmailProvider } from '../../src/modules/integrations/email-provider.port.ts';
import { IntegrationsRepository } from '../../src/modules/integrations/integrations.repository.ts';
import { IntegrationsService } from '../../src/modules/integrations/integrations.service.ts';

test('integrations email provider sends through the module-owned port', async () => {
  const provider = new InMemoryEmailProvider();
  const service = new IntegrationsService(new IntegrationsRepository(), provider);

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
  const service = new IntegrationsService(new IntegrationsRepository(), provider);

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
  const service = new IntegrationsService(new IntegrationsRepository(), new InMemoryEmailProvider());

  const result = await service.sendEmail({ to: 'customer@example.com', subject: 'Update', textBody: 'Body' });
  const response = JSON.stringify(result);

  assert.equal(response.includes('do-not-return'), false);
  assert.equal(/secret|credential|apiKey|password|token/i.test(response), false);
});
