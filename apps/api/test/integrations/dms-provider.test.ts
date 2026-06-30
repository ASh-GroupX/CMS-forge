import assert from 'node:assert/strict';
import test from 'node:test';
import { AppException } from '../../src/core/http-kernel.ts';
import { InMemoryDmsProvider, type DmsProviderPort } from '../../src/modules/integrations/dms-provider.port.ts';
import { IntegrationsRepository } from '../../src/modules/integrations/integrations.repository.ts';
import { IntegrationsService } from '../../src/modules/integrations/integrations.service.ts';

test('integrations dms lookup returns a safe single match with diagnostics', async () => {
  const service = serviceWith(
    new InMemoryDmsProvider({
      status: 'MATCH',
      matches: [
        {
          customerCode: 'DMS-100',
          customerName: 'Nadia Saleh',
          primaryPhone: '+201001112222',
          vin: 'abc123456789',
          plateNumber: 'EG-123',
          brand: 'Toyota',
          model: 'Corolla',
          modelYear: 2023,
          warrantyStatus: 'active',
          source: 'DMS',
        },
      ],
    }),
  );

  const result = await service.lookupDmsCustomerVehicle({ vin: 'abc123456789', correlationId: 'req_1' });

  assert.equal(result.result, 'MATCH');
  assert.equal(result.correlationId, 'req_1');
  assert.equal(result.action, 'customerVehicleLookup');
  assert.equal(result.manualFallbackAllowed, false);
  assert.equal(result.matches[0]?.source, 'DMS');
  assert.equal(result.matches[0]?.vin, 'ABC123456789');
});

test('integrations dms lookup preserves multiple selectable matches', async () => {
  const service = serviceWith(
    new InMemoryDmsProvider({
      status: 'MATCH',
      matches: [
        match('DMS-1', 'Mona Adel', '+201001112222', 'WBA12345678900001'),
        match('DMS-2', 'Mona Adel', '+201009998888', 'WBA12345678900002'),
      ],
    }),
  );

  const result = await service.lookupDmsCustomerVehicle({ name: 'Mona Adel', correlationId: 'req_2' });

  assert.equal(result.result, 'MULTIPLE_MATCHES');
  assert.equal(result.matches.length, 2);
  assert.deepEqual(
    result.matches.map((item) => [item.customerCode, item.primaryPhone, item.vin]),
    [
      ['DMS-1', '+201001112222', 'WBA12345678900001'],
      ['DMS-2', '+201009998888', 'WBA12345678900002'],
    ],
  );
});

test('integrations dms lookup allows manual fallback for not-found and disabled outcomes', async () => {
  const notFound = await serviceWith(new InMemoryDmsProvider({ status: 'NOT_FOUND' })).lookupDmsCustomerVehicle({
    phone: '+201001112222',
    correlationId: 'req_3',
  });
  const disabled = await serviceWith(new InMemoryDmsProvider()).lookupDmsCustomerVehicle({
    customerNumber: 'DMS-404',
    correlationId: 'req_4',
  });

  assert.equal(notFound.result, 'NOT_FOUND');
  assert.equal(notFound.manualFallbackAllowed, true);
  assert.equal(disabled.result, 'DISABLED');
  assert.equal(disabled.manualFallbackAllowed, true);
});

test('integrations dms lookup converts provider failure to safe provider-down result', async () => {
  const provider: DmsProviderPort = {
    async lookupCustomerVehicle() {
      throw new Error('dms-secret-value');
    },
  };

  const result = await serviceWith(provider).lookupDmsCustomerVehicle({ vin: 'WBA12345678900001', correlationId: 'req_5' });
  const response = JSON.stringify(result);

  assert.equal(result.result, 'PROVIDER_DOWN');
  assert.equal(result.manualFallbackAllowed, true);
  assert.equal(response.includes('dms-secret-value'), false);
  assert.equal(/secret|credential|apiKey|password|token/i.test(response), false);
});

test('integrations dms lookup validates input before provider access', async () => {
  const provider = new InMemoryDmsProvider({ status: 'MATCH', matches: [match('DMS-1', 'Nadia Saleh', '+201001112222')] });
  const service = serviceWith(provider);

  await assert.rejects(
    service.lookupDmsCustomerVehicle({ phone: 'bad\nphone' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.lookupDmsCustomerVehicle({}),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(provider.lookups.length, 0);
});

test('integrations dms lookup result exposes no provider credentials', async () => {
  process.env.DMS_PROVIDER_SECRET = 'do-not-return';
  const result = await serviceWith(new InMemoryDmsProvider({ status: 'MATCH', matches: [match('DMS-1', 'Nadia', '+201001112222')] }))
    .lookupDmsCustomerVehicle({ customerNumber: 'DMS-1', correlationId: 'req_6' });
  const response = JSON.stringify(result);

  assert.equal(response.includes('do-not-return'), false);
  assert.equal(/secret|credential|apiKey|password|token/i.test(response), false);
});

function serviceWith(provider: DmsProviderPort): IntegrationsService {
  return new IntegrationsService(new IntegrationsRepository(), {} as never, {} as never, {} as never, provider);
}

function match(customerCode: string, customerName: string, primaryPhone: string, vin?: string) {
  return {
    customerCode,
    customerName,
    primaryPhone,
    vin,
    brand: 'Toyota',
    model: 'Corolla',
    source: 'DMS' as const,
  };
}
