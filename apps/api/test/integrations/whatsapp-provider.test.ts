import assert from 'node:assert/strict';
import test from 'node:test';
import { AppException } from '../../src/core/http-kernel.ts';
import { IntegrationsRepository } from '../../src/modules/integrations/integrations.repository.ts';
import { IntegrationsService } from '../../src/modules/integrations/integrations.service.ts';
import { InMemoryWhatsAppProvider } from '../../src/modules/integrations/whatsapp-provider.port.ts';

test('integrations whatsapp provider sends through the module-owned port', async () => {
  const provider = new InMemoryWhatsAppProvider();
  const service = new IntegrationsService(new IntegrationsRepository(), {} as never, {} as never, provider);

  const result = await service.sendWhatsApp({
    to: '+201001112222',
    textBody: 'Your complaint has an update.',
    payload: { complaintId: 'cmp_1' },
  });

  assert.deepEqual(result, {
    messageId: 'whatsapp_1',
    provider: 'in-memory',
    accepted: ['+201001112222'],
  });
  assert.equal(provider.sent.length, 1);
  assert.equal(provider.sent[0]?.to, '+201001112222');
});

test('integrations whatsapp provider rejects unsafe recipient and payload data before send', async () => {
  const provider = new InMemoryWhatsAppProvider();
  const service = new IntegrationsService(new IntegrationsRepository(), {} as never, {} as never, provider);

  await assert.rejects(
    service.sendWhatsApp({ to: '01001112222', textBody: 'Body' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.sendWhatsApp({ to: '+201001112222', textBody: 'Body', payload: { providerSecret: 'hidden' } }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(provider.sent.length, 0);
});

test('integrations whatsapp provider result exposes no provider credentials', async () => {
  process.env.WHATSAPP_PROVIDER_SECRET = 'do-not-return';
  const service = new IntegrationsService(new IntegrationsRepository(), {} as never, {} as never, new InMemoryWhatsAppProvider());

  const result = await service.sendWhatsApp({ to: '+201001112222', textBody: 'Body' });
  const response = JSON.stringify(result);

  assert.equal(response.includes('do-not-return'), false);
  assert.equal(/secret|credential|apiKey|password|token/i.test(response), false);
});
