import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceBookingNextAvailableService } from './service-booking-next-available.service.js';
import { ServiceBookingsController } from './service-bookings.controller.js';

test('next three slots skip past, full, closed and daily-capacity dates in time order', async () => {
  const calls: string[] = [];
  const bookings = {
    getServiceCenters: async () => [
      { id: 'main', nameEn: 'Main', nameAr: 'الرئيسي' },
      { id: 'north', nameEn: 'North', nameAr: 'الشمالي' },
    ],
    getActiveBookingLanes: async (branchId: string) => [{ id: `${branchId}-general`, nameEn: 'General', nameAr: 'عام' }],
    getSlotAvailability: async (branchId: string, date: string) => {
      calls.push(`${branchId}:${date}`);
      const firstDay = date === '2026-11-10';
      return { isOpen: !(branchId === 'north' && firstDay), bookedDailyCount: firstDay ? 4 : 0,
        maxDailyAppointments: 5, slots: firstDay ? [
          { slot: '12:00', bookedCount: 0, maxPerSlot: 3, remainingInSlot: 3, remainingInHour: 0 },
          { slot: '12:15', bookedCount: 3, maxPerSlot: 3, remainingInSlot: 0, remainingInHour: 1 },
          { slot: '12:30', bookedCount: 1, maxPerSlot: 3, remainingInSlot: 2, remainingInHour: 1 },
        ] : [
          { slot: '08:00', bookedCount: 0, maxPerSlot: 3, remainingInSlot: 3, remainingInHour: 3 },
        ] };
    },
  };
  const rules = { checkPermission: async () => undefined };
  const service = new ServiceBookingNextAvailableService(bookings as never, rules as never);
  const slots = await service.nextThree('ALL', 'staff-1', 'ADMIN', new Date('2026-11-10T09:07:00Z'));
  assert.deepEqual(slots.map(({ branchId, date, time }) => `${branchId}:${date}:${time}`), [
    'main:2026-11-10:12:30', 'main:2026-11-11:08:00', 'north:2026-11-11:08:00',
  ]);
  assert.equal(slots[0]?.remainingInSlot, 1);
  assert.deepEqual(calls, ['main:2026-11-10', 'north:2026-11-10', 'main:2026-11-11', 'north:2026-11-11']);
});

test('next available checks booking permission and rejects inactive center', async () => {
  const bookings = { getServiceCenters: async () => [{ id: 'main', nameEn: 'Main', nameAr: 'الرئيسي' }],
    getActiveBookingLanes: async () => [] };
  const denied = new ServiceBookingNextAvailableService(bookings as never,
    { checkPermission: async () => { throw new Error('denied'); } } as never);
  await assert.rejects(denied.nextThree('main', 'staff-1'), /denied/);
  const allowed = new ServiceBookingNextAvailableService(bookings as never, { checkPermission: async () => undefined } as never);
  await assert.rejects(allowed.nextThree('removed-center', 'staff-1'), /Unknown active service center/);
});

test('next available route requires a staff session', () => {
  const guards = Reflect.getMetadata('__guards__', ServiceBookingsController.prototype.nextAvailable) as Array<{ name: string }>;
  assert.ok(guards.some((guard) => guard.name === 'SessionAuthGuard'));
  const createGuards = Reflect.getMetadata('__guards__', ServiceBookingsController.prototype.createAppointment) as Array<{ name: string }>;
  assert.ok(createGuards.some((guard) => guard.name === 'SessionAuthGuard'));
  assert.ok(createGuards.some((guard) => guard.name === 'CsrfGuard'));
});
