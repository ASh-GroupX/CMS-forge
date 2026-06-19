import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationChannel } from '@prisma/client';
import { AppException } from '../../src/core/http-kernel.ts';
import { IntegrationsService } from '../../src/modules/integrations/integrations.service.ts';
import { NotificationsRepository } from '../../src/modules/notifications/notifications.repository.ts';
import { NotificationsService } from '../../src/modules/notifications/notifications.service.ts';

test('notifications resolves active Arabic template with safe placeholders', async () => {
  const service = templateService({
    findActiveTemplate: async () => template('ar', 'طلب {{referenceNumber}}'),
  });

  const result = await service.resolveTemplate({
    templateCode: 'complaint.update',
    channel: NotificationChannel.EMAIL,
    locale: 'ar',
    payload: { referenceNumber: 'CMP-000001' },
  });

  assert.deepEqual(result, {
    templateId: 'tpl_ar',
    templateCode: 'complaint.update',
    channel: NotificationChannel.EMAIL,
    locale: 'ar',
    subject: 'طلب CMP-000001',
    body: 'طلب CMP-000001',
  });
});

test('notifications falls back to English when requested locale template is missing', async () => {
  const calls: unknown[] = [];
  const service = templateService({
    findActiveTemplate: async (code, channel, locale) => {
      calls.push({ code, channel, locale });
      return locale === 'en' ? template('en', 'Complaint {{referenceNumber}}') : null;
    },
  });

  const result = await service.resolveTemplate({
    templateCode: 'complaint.update',
    channel: NotificationChannel.SMS,
    locale: 'ar',
    payload: { referenceNumber: 'CMP-000002' },
  });

  assert.deepEqual(calls, [
    { code: 'complaint.update', channel: NotificationChannel.SMS, locale: 'ar' },
    { code: 'complaint.update', channel: NotificationChannel.SMS, locale: 'en' },
  ]);
  assert.equal(result.locale, 'en');
  assert.equal(result.body, 'Complaint CMP-000002');
});

test('notifications denies missing templates with a stable code', async () => {
  const service = templateService({ findActiveTemplate: async () => null });

  await assert.rejects(
    service.resolveTemplate({ templateCode: 'missing', channel: NotificationChannel.EMAIL, locale: 'en', payload: {} }),
    (error: unknown) => error instanceof AppException && error.code === 'NOTIFICATION_TEMPLATE_NOT_FOUND',
  );
});

test('notifications denies unsafe template payload before repository read', async () => {
  let readCalled = false;
  const service = templateService({
    findActiveTemplate: async () => {
      readCalled = true;
      throw new Error('should not read');
    },
  });

  await assert.rejects(
    service.resolveTemplate({
      templateCode: 'complaint.update',
      channel: NotificationChannel.EMAIL,
      locale: 'en',
      payload: { providerSecret: 'hidden' },
    }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(readCalled, false);
});

test('notifications template resolution exposes no provider credentials', async () => {
  process.env.TEMPLATE_PROVIDER_SECRET = 'do-not-return';
  const service = templateService({
    findActiveTemplate: async () => template('en', 'Complaint {{referenceNumber}}'),
  });

  const result = await service.resolveTemplate({
    templateCode: 'complaint.update',
    channel: NotificationChannel.WHATSAPP,
    locale: 'en',
    payload: { referenceNumber: 'CMP-000003' },
  });

  const response = JSON.stringify(result);
  assert.equal(response.includes('do-not-return'), false);
  assert.equal(/secret|credential|apiKey|password|token/i.test(response), false);
});

function templateService(repository: Partial<NotificationsRepository>): NotificationsService {
  return new NotificationsService(repository as NotificationsRepository, {} as IntegrationsService);
}

function template(locale: string, body: string) {
  return {
    id: `tpl_${locale}`,
    code: 'complaint.update',
    channel: NotificationChannel.EMAIL,
    locale,
    subject: body,
    body,
    version: 1,
  };
}
