import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { InMemoryEmailProvider } from '../../src/modules/integrations/email-provider.port.ts';
import { IntegrationsRepository } from '../../src/modules/integrations/integrations.repository.ts';
import { IntegrationsService } from '../../src/modules/integrations/integrations.service.ts';
import { NotificationsRepository } from '../../src/modules/notifications/notifications.repository.ts';
import { NotificationsService } from '../../src/modules/notifications/notifications.service.ts';

test('notifications dispatch sends queued email and marks it sent', async () => {
  const sends: unknown[] = [];
  const marks: unknown[] = [];
  const service = new NotificationsService({
    findQueuedEmail: async () => [emailNotification()],
    markEmailSent: async (id, result) => {
      marks.push({ id, result });
      return true;
    },
    markEmailFailed: async () => {
      throw new Error('should not fail');
    },
  } as unknown as NotificationsRepository, {
    sendEmail: async (input) => {
      sends.push(input);
      return { messageId: 'email_1', provider: 'in-memory', accepted: [input.to] };
    },
  } as IntegrationsService);

  const result = await service.dispatchQueuedEmail();

  assert.deepEqual(result, { attempted: 1, sent: 1, failed: 0, skipped: 0 });
  assert.deepEqual(sends, [{
    to: 'customer@example.com',
    subject: 'Complaint update',
    textBody: 'Your complaint changed status.',
    htmlBody: null,
    payload: {
      to: 'customer@example.com',
      subject: 'Complaint update',
      textBody: 'Your complaint changed status.',
    },
  }]);
  assert.deepEqual(marks, [{
    id: 'notif_email_1',
    result: { messageId: 'email_1', provider: 'in-memory', accepted: ['customer@example.com'] },
  }]);
});

test('notifications dispatch records provider failure without leaking details', async () => {
  const failures: unknown[] = [];
  const service = new NotificationsService({
    findQueuedEmail: async () => [emailNotification()],
    markEmailSent: async () => {
      throw new Error('should not mark sent');
    },
    markEmailFailed: async (data) => {
      failures.push(data);
      return true;
    },
  } as unknown as NotificationsRepository, {
    sendEmail: async () => {
      throw new Error('provider secret do-not-return');
    },
  } as IntegrationsService);

  const result = await service.dispatchQueuedEmail();

  assert.deepEqual(result, { attempted: 1, sent: 0, failed: 1, skipped: 0 });
  assert.deepEqual(failures, [{ id: 'notif_email_1', failureReason: 'EMAIL_PROVIDER_FAILED' }]);
  assert.equal(JSON.stringify(failures).includes('do-not-return'), false);
});

test('notifications dispatch skips already terminal email rows at repository boundary', async () => {
  const calls: unknown[] = [];
  const repository = new NotificationsRepository({
    notification: {
      findMany: async (query: unknown) => {
        calls.push(query);
        return [];
      },
    },
  } as never);
  const service = new NotificationsService(repository, {
    sendEmail: async () => {
      throw new Error('should not send');
    },
  } as IntegrationsService);

  const result = await service.dispatchQueuedEmail(3);

  assert.deepEqual(result, { attempted: 0, sent: 0, failed: 0, skipped: 0 });
  assert.deepEqual(calls[0], {
    where: { channel: NotificationChannel.EMAIL, status: NotificationStatus.QUEUED },
    orderBy: { queuedAt: 'asc' },
    take: 3,
    select: notificationSelect(),
  });
});

test('notifications dispatch rejects unsafe email payload before provider send', async () => {
  const failures: unknown[] = [];
  const provider = new InMemoryEmailProvider();
  const service = new NotificationsService({
    findQueuedEmail: async () => [emailNotification({ providerSecret: 'hidden' })],
    markEmailSent: async () => {
      throw new Error('should not mark sent');
    },
    markEmailFailed: async (data) => {
      failures.push(data);
      return true;
    },
  } as unknown as NotificationsRepository, new IntegrationsService(new IntegrationsRepository(), provider));

  const result = await service.dispatchQueuedEmail();

  assert.deepEqual(result, { attempted: 1, sent: 0, failed: 1, skipped: 0 });
  assert.deepEqual(failures, [{ id: 'notif_email_1', failureReason: 'VALIDATION_FAILED' }]);
  assert.equal(provider.sent.length, 0);
});

test('notifications dispatch sends queued sms and marks it sent', async () => {
  const marks: unknown[] = [];
  const service = new NotificationsService({
    findQueuedSms: async () => [messageNotification(NotificationChannel.SMS)],
    markSmsSent: async (id, result) => {
      marks.push({ id, result });
      return true;
    },
    markSmsFailed: async () => {
      throw new Error('should not fail');
    },
  } as unknown as NotificationsRepository, {
    sendSms: async (input) => ({ messageId: 'sms_1', provider: 'in-memory', accepted: [input.to] }),
  } as IntegrationsService);

  const result = await service.dispatchQueuedSms();

  assert.deepEqual(result, { attempted: 1, sent: 1, failed: 0, skipped: 0 });
  assert.deepEqual(marks, [{
    id: 'notif_email_1',
    result: { messageId: 'sms_1', provider: 'in-memory', accepted: ['+201001112222'] },
  }]);
});

test('notifications dispatch records sms provider failure without leaking details', async () => {
  const failures: unknown[] = [];
  const service = new NotificationsService({
    findQueuedSms: async () => [messageNotification(NotificationChannel.SMS)],
    markSmsSent: async () => {
      throw new Error('should not mark sent');
    },
    markSmsFailed: async (data) => {
      failures.push(data);
      return true;
    },
  } as unknown as NotificationsRepository, {
    sendSms: async () => {
      throw new Error('provider secret do-not-return');
    },
  } as IntegrationsService);

  const result = await service.dispatchQueuedSms();

  assert.deepEqual(result, { attempted: 1, sent: 0, failed: 1, skipped: 0 });
  assert.deepEqual(failures, [{ id: 'notif_email_1', failureReason: 'SMS_PROVIDER_FAILED' }]);
  assert.equal(JSON.stringify(failures).includes('do-not-return'), false);
});

test('notifications dispatch sends queued whatsapp and marks it sent', async () => {
  const marks: unknown[] = [];
  const service = new NotificationsService({
    findQueuedWhatsApp: async () => [messageNotification(NotificationChannel.WHATSAPP)],
    markWhatsAppSent: async (id, result) => {
      marks.push({ id, result });
      return true;
    },
    markWhatsAppFailed: async () => {
      throw new Error('should not fail');
    },
  } as unknown as NotificationsRepository, {
    sendWhatsApp: async (input) => ({ messageId: 'whatsapp_1', provider: 'in-memory', accepted: [input.to] }),
  } as IntegrationsService);

  const result = await service.dispatchQueuedWhatsApp();

  assert.deepEqual(result, { attempted: 1, sent: 1, failed: 0, skipped: 0 });
  assert.deepEqual(marks, [{
    id: 'notif_email_1',
    result: { messageId: 'whatsapp_1', provider: 'in-memory', accepted: ['+201001112222'] },
  }]);
});

test('notifications dispatch records whatsapp provider failure without leaking details', async () => {
  const failures: unknown[] = [];
  const service = new NotificationsService({
    findQueuedWhatsApp: async () => [messageNotification(NotificationChannel.WHATSAPP)],
    markWhatsAppSent: async () => {
      throw new Error('should not mark sent');
    },
    markWhatsAppFailed: async (data) => {
      failures.push(data);
      return true;
    },
  } as unknown as NotificationsRepository, {
    sendWhatsApp: async () => {
      throw new Error('provider secret do-not-return');
    },
  } as IntegrationsService);

  const result = await service.dispatchQueuedWhatsApp();

  assert.deepEqual(result, { attempted: 1, sent: 0, failed: 1, skipped: 0 });
  assert.deepEqual(failures, [{ id: 'notif_email_1', failureReason: 'WHATSAPP_PROVIDER_FAILED' }]);
  assert.equal(JSON.stringify(failures).includes('do-not-return'), false);
});

test('notifications dispatch skips terminal sms and whatsapp rows at repository boundary', async () => {
  const calls: unknown[] = [];
  const repository = new NotificationsRepository({
    notification: {
      findMany: async (query: unknown) => {
        calls.push(query);
        return [];
      },
    },
  } as never);

  assert.deepEqual(await repository.findQueuedSms(2), []);
  assert.deepEqual(await repository.findQueuedWhatsApp(4), []);
  assert.deepEqual(calls, [
    { where: { channel: NotificationChannel.SMS, status: NotificationStatus.QUEUED }, orderBy: { queuedAt: 'asc' }, take: 2, select: notificationSelect() },
    { where: { channel: NotificationChannel.WHATSAPP, status: NotificationStatus.QUEUED }, orderBy: { queuedAt: 'asc' }, take: 4, select: notificationSelect() },
  ]);
});

test('notifications dispatch rejects unsafe sms and whatsapp payloads before provider send', async () => {
  const failures: unknown[] = [];
  const service = new NotificationsService({
    findQueuedSms: async () => [messageNotification(NotificationChannel.SMS, { providerSecret: 'hidden' })],
    findQueuedWhatsApp: async () => [messageNotification(NotificationChannel.WHATSAPP, { providerSecret: 'hidden' })],
    markSmsSent: async () => {
      throw new Error('should not mark sms sent');
    },
    markWhatsAppSent: async () => {
      throw new Error('should not mark whatsapp sent');
    },
    markSmsFailed: async (data) => {
      failures.push({ channel: 'sms', ...data });
      return true;
    },
    markWhatsAppFailed: async (data) => {
      failures.push({ channel: 'whatsapp', ...data });
      return true;
    },
  } as unknown as NotificationsRepository, new IntegrationsService(new IntegrationsRepository()));

  assert.deepEqual(await service.dispatchQueuedSms(), { attempted: 1, sent: 0, failed: 1, skipped: 0 });
  assert.deepEqual(await service.dispatchQueuedWhatsApp(), { attempted: 1, sent: 0, failed: 1, skipped: 0 });
  assert.deepEqual(failures, [
    { channel: 'sms', id: 'notif_email_1', failureReason: 'VALIDATION_FAILED' },
    { channel: 'whatsapp', id: 'notif_email_1', failureReason: 'VALIDATION_FAILED' },
  ]);
});

function emailNotification(payload: Record<string, unknown> = {}) {
  return messageNotification(NotificationChannel.EMAIL, payload);
}

function messageNotification(channel: NotificationChannel, payload: Record<string, unknown> = {}) {
  const to = channel === NotificationChannel.EMAIL ? 'customer@example.com' : '+201001112222';
  return {
    id: 'notif_email_1',
    complaintId: 'cmp_1',
    recipientUserId: null,
    channel,
    status: NotificationStatus.QUEUED,
    templateCode: 'complaint.update.email',
    locale: 'en',
    payload: {
      to,
      subject: 'Complaint update',
      textBody: 'Your complaint changed status.',
      ...payload,
    },
    provider: null,
    providerResult: null,
    sentAt: null,
    failedAt: null,
  };
}

function notificationSelect() {
  return {
    id: true,
    complaintId: true,
    recipientUserId: true,
    channel: true,
    status: true,
    templateCode: true,
    locale: true,
    payload: true,
    provider: true,
    providerResult: true,
    sentAt: true,
    failedAt: true,
  };
}
