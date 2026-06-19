import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { AppException } from '../../src/core/http-kernel.ts';
import { NotificationsRepository } from '../../src/modules/notifications/notifications.repository.ts';
import { NotificationsService } from '../../src/modules/notifications/notifications.service.ts';

test('notifications service queues one internal in-app row', async () => {
  const writes: unknown[] = [];
  const service = new NotificationsService({
    queueInternal: async (data) => {
      writes.push(data);
      return {
        id: 'notif_1',
        ...data,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.QUEUED,
      };
    },
  } as NotificationsRepository);

  const result = await service.queueInternal({
    complaintId: 'cmp_1',
    recipientUserId: 'usr_1',
    templateCode: 'sla.breach.internal',
    locale: 'en',
    payload: { breachId: 'breach_1', severity: 'HIGH' },
  });

  assert.deepEqual(writes[0], {
    complaintId: 'cmp_1',
    recipientUserId: 'usr_1',
    templateCode: 'sla.breach.internal',
    locale: 'en',
    payload: { breachId: 'breach_1', severity: 'HIGH' },
  });
  assert.equal(result.channel, NotificationChannel.IN_APP);
  assert.equal(result.status, NotificationStatus.QUEUED);
});

test('notifications repository persists queued in-app rows only', async () => {
  const calls: unknown[] = [];
  const repository = new NotificationsRepository({
    notification: {
      create: async (query: unknown) => {
        calls.push(query);
        return {
          id: 'notif_1',
          complaintId: 'cmp_1',
          recipientUserId: 'usr_1',
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.QUEUED,
          templateCode: 'sla.breach.internal',
          locale: 'en',
          payload: { breachId: 'breach_1' },
        };
      },
    },
  } as never);

  await repository.queueInternal({
    complaintId: 'cmp_1',
    recipientUserId: 'usr_1',
    templateCode: 'sla.breach.internal',
    locale: 'en',
    payload: { breachId: 'breach_1' },
  });

  assert.deepEqual(calls[0], {
    data: {
      complaintId: 'cmp_1',
      recipientUserId: 'usr_1',
      channel: NotificationChannel.IN_APP,
      status: NotificationStatus.QUEUED,
      templateCode: 'sla.breach.internal',
      locale: 'en',
      payload: { breachId: 'breach_1' },
    },
    select: {
      id: true,
      complaintId: true,
      recipientUserId: true,
      channel: true,
      status: true,
      templateCode: true,
      locale: true,
      payload: true,
    },
  });
});

test('notifications service denies blank template code before write', async () => {
  let writeCalled = false;
  const service = new NotificationsService({
    queueInternal: async () => {
      writeCalled = true;
      throw new Error('should not write');
    },
  } as unknown as NotificationsRepository);

  await assert.rejects(
    service.queueInternal({ templateCode: ' ', payload: { breachId: 'breach_1' } }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(writeCalled, false);
});

test('notifications service denies unsafe payload keys before write', async () => {
  let writeCalled = false;
  const service = new NotificationsService({
    queueInternal: async () => {
      writeCalled = true;
      throw new Error('should not write');
    },
  } as unknown as NotificationsRepository);

  await assert.rejects(
    service.queueInternal({ templateCode: 'sla.breach.internal', payload: { providerSecret: 'hidden' } }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.queueInternal({ templateCode: 'sla.breach.internal', payload: { nested: { password: 'hidden' } } }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(writeCalled, false);
});
