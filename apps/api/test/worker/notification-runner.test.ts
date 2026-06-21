import assert from 'node:assert/strict';
import test from 'node:test';
import { NotificationsService } from '../../src/modules/notifications/notifications.service.ts';
import {
  notificationEmailJobName,
  notificationSmsJobName,
  notificationWhatsAppJobName,
  processWorkerJob,
  scheduleNotificationJobs,
  taskEscalationJobName,
} from '../../src/worker/index.ts';

test('worker dispatches email notifications through the public service', async () => {
  const calls: string[] = [];
  const result = await processWorkerJob('notifications', { id: 'job_1', name: notificationEmailJobName }, fakeApp({
    dispatchQueuedEmail: async () => {
      calls.push('email');
      return { attempted: 1, sent: 1, failed: 0, skipped: 0 };
    },
  }), fakeLogger([]));

  assert.deepEqual(calls, ['email']);
  assert.deepEqual(result, { attempted: 1, sent: 1, failed: 0, skipped: 0 });
});

test('worker dispatches sms and whatsapp notifications through the public service', async () => {
  const calls: string[] = [];
  const app = fakeApp({
    dispatchQueuedSms: async () => {
      calls.push('sms');
      return { attempted: 1, sent: 0, failed: 1, skipped: 0 };
    },
    dispatchQueuedWhatsApp: async () => {
      calls.push('whatsapp');
      return { attempted: 1, sent: 1, failed: 0, skipped: 0 };
    },
  });

  await processWorkerJob('notifications', { id: 'job_2', name: notificationSmsJobName }, app, fakeLogger([]));
  await processWorkerJob('notifications', { id: 'job_3', name: notificationWhatsAppJobName }, app, fakeLogger([]));

  assert.deepEqual(calls, ['sms', 'whatsapp']);
});

test('worker schedules notification dispatch jobs on an interval', async () => {
  const scheduled: unknown[] = [];

  await scheduleNotificationJobs({
    upsertJobScheduler: async (id, repeat, template) => {
      scheduled.push({ id, repeat, template });
      return {} as never;
    },
    close: async () => undefined,
  }, 5_000);

  assert.deepEqual(scheduled, [
    { id: notificationEmailJobName, repeat: { every: 5_000 }, template: { name: notificationEmailJobName, data: {} } },
    { id: notificationSmsJobName, repeat: { every: 5_000 }, template: { name: notificationSmsJobName, data: {} } },
    { id: notificationWhatsAppJobName, repeat: { every: 5_000 }, template: { name: notificationWhatsAppJobName, data: {} } },
    { id: taskEscalationJobName, repeat: { every: 5_000 }, template: { name: taskEscalationJobName, data: {} } },
  ]);
  await assert.rejects(scheduleNotificationJobs({} as never, 999), /NOTIFICATION_JOB_INTERVAL_MS/);
});

function fakeApp(service: Partial<Pick<NotificationsService, 'dispatchQueuedEmail' | 'dispatchQueuedSms' | 'dispatchQueuedWhatsApp'>>) {
  return {
    get: (token: unknown) => {
      assert.equal(token, NotificationsService);
      return service as NotificationsService;
    },
  };
}

function fakeLogger(logs: string[]) {
  return {
    log: (message: string) => {
      logs.push(message);
    },
  };
}
