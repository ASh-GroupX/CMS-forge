import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceBookingSmsSettingsService } from './service-booking-sms-settings.service.js';

test('settings are validated, audited atomically, and hide actor identifiers', async () => {
  let audit: any;
  const setting = { id: 'global', enabled: true, leadHours: 36, senderNumber: '+962790000000', messageTemplate: 'Hello {{customerName}}', updatedById: 'admin-1' };
  const repository = {
    transaction: (work: any) => work({ serviceBookingSmsSetting: { upsert: async () => setting } }),
  };
  const service = new ServiceBookingSmsSettingsService(repository as any, { record: async (event: any) => { audit = event; } } as any, { checkPermission: async () => {} } as any);
  const result = await service.update(setting, 'admin-1', 'ADMIN');
  assert.equal(result.providerMode, 'test');
  assert.equal(result.providerReady, false);
  assert.equal('updatedById' in result, false);
  assert.equal(audit.action, 'service_booking_sms_settings_changed');
  assert.equal(JSON.stringify(audit.metadata).includes('Hello'), false);
});

test('settings reject invalid lead hours and non-admin access', async () => {
  const service = new ServiceBookingSmsSettingsService({} as any, {} as any, {
    checkPermission: async (_id: string, role: string) => { if (role !== 'ADMIN') throw new Error('forbidden'); },
  } as any);
  await assert.rejects(() => service.read('staff-1', 'CR_OFFICER'), /forbidden/);
  await assert.rejects(() => service.update({ enabled: false, leadHours: 0 }, 'admin-1', 'ADMIN'), (error: any) => error.code === 'VALIDATION_FAILED' && error.fieldErrors[0].field === 'leadHours');
});

test('saving reminder settings refreshes queued messages after configuration is committed', async () => {
  const calls: string[] = [];
  const repository = { transaction: async (work: any) => { calls.push('commit-start'); const result = await work({ serviceBookingSmsSetting: { upsert: async () => ({ id: 'global', updatedById: 'admin-1' }) } }); calls.push('commit-end'); return result; } };
  const schedules = { recentServiceBookingReminders: async () => [] };
  const reminders = { refreshUpcoming: async () => { calls.push('refresh'); } };
  const service = new ServiceBookingSmsSettingsService(repository as any, { record: async () => {} } as any, { checkPermission: async () => {} } as any, schedules as any, reminders as any);
  await service.update({ enabled: false, leadHours: 24, senderNumber: '', messageTemplate: '' }, 'admin-1', 'ADMIN');
  assert.deepEqual(calls, ['commit-start', 'commit-end', 'refresh']);
});
