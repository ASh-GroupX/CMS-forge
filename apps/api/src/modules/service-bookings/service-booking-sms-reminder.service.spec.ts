import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceBookingSmsReminderService } from './service-booking-sms-reminder.service.js';

test('reminder snapshots current message and schedules before local appointment time', async () => {
  const queued: any[] = [];
  const cancelled: string[] = [];
  const service = new ServiceBookingSmsReminderService({
    queueInternal: async (input: any) => { queued.push(input); return {}; },
  } as any, { cancelServiceBookingReminder: async (id: string) => { cancelled.push(id); return 0; } } as any, { read: async () => ({
    enabled: true, leadHours: 24, senderNumber: '+962790000000',
    messageTemplate: 'Hi {{customerName}}: {{referenceNumber}} at {{time}}',
    updatedAt: new Date('2026-11-01T00:00:00.000Z'),
  }) } as any, {} as any);
  const appointment = {
    id: 'apt-1', customerName: 'Lina', customerPhone: '0791234567',
    date: new Date('2026-11-20T00:00:00.000Z'), startTime: '09:00', status: 'BOOKED',
    serviceCenterId: 'center_main', serviceCenter: { nameEn: 'Amman' }, branch: null,
    maintenanceTypeName: 'Oil service', referenceNumber: 'APT-1',
  };
  await service.sync(appointment as any, 'revision-1');
  assert.deepEqual(cancelled, ['apt-1']);
  assert.equal(queued[0].serviceAppointmentId, 'apt-1');
  assert.equal(queued[0].channel, 'SMS');
  assert.equal(queued[0].idempotencyKey, 'service-booking-reminder:apt-1:revision-1:2026-11-01T00:00:00.000Z');
  assert.equal(queued[0].scheduledAt.toISOString(), '2026-11-19T06:00:00.000Z');
  assert.deepEqual(queued[0].payload, { to: '+962791234567', from: '+962790000000', textBody: 'Hi Lina: APT-1 at 09:00' });
});

test('disabled reminders cancel stale queued messages and do not enqueue a new one', async () => {
  let queued = 0;
  let cancelled = 0;
  const service = new ServiceBookingSmsReminderService({
    queueInternal: async () => { queued += 1; return {}; },
  } as any, { cancelServiceBookingReminder: async () => { cancelled += 1; return 1; } } as any, { read: async () => ({ enabled: false }) } as any, {} as any);
  await service.sync({ id: 'apt-2', status: 'BOOKED' } as any, 'revision-2');
  assert.equal(cancelled, 1);
  assert.equal(queued, 0);
});

test('saving settings refreshes pending future bookings with the new template', async () => {
  let queued = 0;
  let settingReads = 0;
  const appointment: any = {
    id: 'apt-3', customerName: 'Rami', customerPhone: '+962791234567',
    date: new Date('2026-11-20T00:00:00.000Z'), startTime: '10:00', status: 'BOOKED',
    serviceCenterId: 'center_main', serviceCenter: { nameEn: 'Amman' }, branch: null,
    maintenanceTypeName: 'Oil service', referenceNumber: 'APT-3', updatedAt: new Date('2026-11-01T00:00:00.000Z'),
  };
  const service = new ServiceBookingSmsReminderService({
    queueInternal: async () => { queued += 1; return {}; },
  } as any, { cancelServiceBookingReminder: async () => 0 } as any, {
    read: async () => { settingReads += 1; return { enabled: true, leadHours: 24, senderNumber: '+962790000000', messageTemplate: 'Updated {{customerName}}', updatedAt: new Date('2026-11-02T00:00:00.000Z') }; },
  } as any, { findUpcomingAppointments: async () => [appointment] } as any);
  await service.refreshUpcoming(new Date('2026-11-09T09:00:00.000Z'));
  assert.equal(queued, 1);
  assert.equal(settingReads, 1);
});
