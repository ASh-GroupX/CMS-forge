import assert from 'node:assert/strict';
import test from 'node:test';
import { AppException } from '../../src/core/http-kernel.ts';
import { IntegrationsRepository } from '../../src/modules/integrations/integrations.repository.ts';
import { IntegrationsService } from '../../src/modules/integrations/integrations.service.ts';
import { InMemorySmsProvider } from '../../src/modules/integrations/sms-provider.port.ts';

test('integrations sms provider sends through the module-owned port', async () => {
  const provider = new InMemorySmsProvider();
  const service = new IntegrationsService(new IntegrationsRepository(), undefined, provider);

  const result = await service.sendSms({
    to: '+201001112222',
    textBody: 'Your complaint has an update.',
    payload: { complaintId: 'cmp_1' },
  });

  assert.deepEqual(result, {
    messageId: 'sms_1',
    provider: 'in-memory',
    accepted: ['+201001112222'],
  });
  assert.equal(provider.sent.length, 1);
  assert.equal(provider.sent[0]?.to, '+201001112222');
});

test('integrations sms provider rejects unsafe recipient and payload data before send', async () => {
  const provider = new InMemorySmsProvider();
  const service = new IntegrationsService(new IntegrationsRepository(), undefined, provider);

  await assert.rejects(
    service.sendSms({ to: '01001112222', textBody: 'Body' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.sendSms({ to: '+201001112222', textBody: 'Body', payload: { providerToken: 'hidden' } }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(provider.sent.length, 0);
});

test('integrations sms provider result exposes no provider credentials', async () => {
  process.env.SMS_PROVIDER_SECRET = 'do-not-return';
  const service = new IntegrationsService(new IntegrationsRepository(), undefined, new InMemorySmsProvider());

  const result = await service.sendSms({ to: '+201001112222', textBody: 'Body' });
  const response = JSON.stringify(result);

  assert.equal(response.includes('do-not-return'), false);
  assert.equal(/secret|credential|apiKey|password|token/i.test(response), false);
});
