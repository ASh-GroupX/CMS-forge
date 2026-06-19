import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationChannel } from '@prisma/client';
import { AppException } from '../../src/core/http-kernel.ts';
import { NotificationsRepository } from '../../src/modules/notifications/notifications.repository.ts';
import { NotificationsService } from '../../src/modules/notifications/notifications.service.ts';

test('notification preferences return safe defaults when no row exists', async () => {
  const service = new NotificationsService({
    findCustomerPreference: async () => null,
  } as NotificationsRepository, {} as never, {} as never);

  assert.deepEqual(await service.getCustomerPreference('cust_1'), {
    id: null,
    customerId: 'cust_1',
    preferredChannel: null,
    smsQuietStart: null,
    smsQuietEnd: null,
    timezone: null,
    createdAt: null,
    updatedAt: null,
  });
});

test('notification preferences validate and upsert customer preference data', async () => {
  const writes: unknown[] = [];
  const service = new NotificationsService({
    upsertCustomerPreference: async (data) => {
      writes.push(data);
      return preferenceRecord(data);
    },
  } as NotificationsRepository, {} as never, {} as never);

  const result = await service.upsertCustomerPreference({
    customerId: ' cust_1 ',
    preferredChannel: NotificationChannel.SMS,
    smsQuietStart: '23:00',
    smsQuietEnd: '07:00',
    timezone: 'Africa/Cairo',
  });

  assert.deepEqual(writes[0], {
    customerId: 'cust_1',
    preferredChannel: NotificationChannel.SMS,
    smsQuietStart: '23:00',
    smsQuietEnd: '07:00',
    timezone: 'Africa/Cairo',
  });
  assert.equal(result.preferredChannel, NotificationChannel.SMS);
});

test('notification preference validation fails before write', async () => {
  let writeCalled = false;
  const service = new NotificationsService({
    upsertCustomerPreference: async () => {
      writeCalled = true;
      throw new Error('write should not run');
    },
  } as NotificationsRepository, {} as never, {} as never);

  await assert.rejects(
    service.upsertCustomerPreference({ customerId: 'cust_1', preferredChannel: 'EMAIL', smsQuietStart: '24:00' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.upsertCustomerPreference({ customerId: 'cust_1', preferredChannel: 'PAGER' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(writeCalled, false);
});

test('notification preference repository upserts by customer id only', async () => {
  const calls: unknown[] = [];
  const repository = new NotificationsRepository({
    customerNotificationPreference: {
      upsert: async (query: unknown) => {
        calls.push(query);
        return preferenceRecord({ customerId: 'cust_1', preferredChannel: NotificationChannel.EMAIL });
      },
    },
  } as never);

  await repository.upsertCustomerPreference({
    customerId: 'cust_1',
    preferredChannel: NotificationChannel.EMAIL,
    smsQuietStart: null,
    smsQuietEnd: null,
    timezone: null,
  });

  assert.deepEqual(calls[0], {
    where: { customerId: 'cust_1' },
    create: { customerId: 'cust_1', preferredChannel: NotificationChannel.EMAIL, smsQuietStart: null, smsQuietEnd: null, timezone: null },
    update: { preferredChannel: NotificationChannel.EMAIL, smsQuietStart: null, smsQuietEnd: null, timezone: null },
    select: {
      id: true,
      customerId: true,
      preferredChannel: true,
      smsQuietStart: true,
      smsQuietEnd: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
    },
  });
});

test('notification preference response exposes no provider credentials', async () => {
  process.env.SMS_PROVIDER_SECRET = 'do-not-return';
  const service = new NotificationsService({
    upsertCustomerPreference: async (data) => preferenceRecord(data),
  } as NotificationsRepository, {} as never, {} as never);

  const response = await service.upsertCustomerPreference({ customerId: 'cust_1', preferredChannel: NotificationChannel.WHATSAPP });
  const json = JSON.stringify(response);

  assert.equal(json.includes('do-not-return'), false);
  assert.equal(/secret|credential|password|token|hash/i.test(json), false);
});

function preferenceRecord(overrides: Record<string, unknown>) {
  return {
    id: 'pref_1',
    customerId: 'cust_1',
    preferredChannel: null,
    smsQuietStart: null,
    smsQuietEnd: null,
    timezone: null,
    createdAt: new Date('2026-06-19T10:00:00.000Z'),
    updatedAt: new Date('2026-06-19T10:00:00.000Z'),
    ...overrides,
  };
}
