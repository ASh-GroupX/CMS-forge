import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceBookingsRepository } from './service-bookings.repository.js';
import { ServiceBookingsService } from './service-bookings.service.js';

function createMockRepository(overrides: Partial<Record<keyof ServiceBookingsRepository, any>> = {}) {
  const repo = new ServiceBookingsRepository(null as any);
  Object.assign(repo, {
    findRuleForDay: async () => null, // falls back to defaults (Sun-Thu 8-18 open, maxDaily: 24, maxPerHour: 3, maxPerSlot: 1; Fri closed)
    countDailyActive: async () => 0,
    countInSlot: async () => 0,
    countInHourWindow: async () => 0,
    findCarModelById: async () => ({ id: 'c1', nameEn: 'Patrol', brand: 'Nissan' }),
    findMaintenanceTypeById: async () => ({ id: 'm1', nameEn: 'Periodic 10k', estimatedDurationMinutes: 30 }),
    generateReferenceNumber: async () => 'APT-20261026-0001',
    createAppointment: async (data: any) => ({
      status: 'BOOKED',
      ...data,
      id: 'apt_1',
      createdAt: new Date(),
      updatedAt: new Date(),
      branch: { nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' },
    }),
    findAppointmentsForDate: async () => [],
    ...overrides,
  });
  return repo;
}

test('service-bookings service can be constructed', () => {
  assert.ok(new ServiceBookingsService(createMockRepository()));
});

test('createAppointment rejects when branch is closed on that day', async () => {
  const repo = createMockRepository({
    findRuleForDay: async () => ({
      id: 'r_fri',
      branchId: 'b_main',
      dayOfWeek: 5,
      isOpen: false,
      startTime: '08:00',
      endTime: '12:00',
      maxDailyAppointments: 0,
      maxPerHour: 3,
      maxPerSlot: 1,
      slotDurationMinutes: 15,
    }),
  });
  const service = new ServiceBookingsService(repo);

  await assert.rejects(
    async () => {
      await service.createAppointment({
        customerName: 'Ahmad',
        customerPhone: '0501234567',
        carModelId: 'c1',
        maintenanceTypeId: 'm1',
        branchId: 'b_main',
        date: '2026-10-30', // Friday
        startTime: '09:00',
        notes: 'Oil change',
      });
    },
    /branch is closed on this day/i,
  );
});

test('createAppointment rejects when daily limit is reached', async () => {
  const repo = createMockRepository({
    findRuleForDay: async () => ({
      id: 'r_sun',
      branchId: 'b_main',
      dayOfWeek: 0,
      isOpen: true,
      startTime: '08:00',
      endTime: '18:00',
      maxDailyAppointments: 5,
      maxPerHour: 3,
      maxPerSlot: 1,
      slotDurationMinutes: 15,
    }),
    countDailyActive: async () => 5, // already reached 5
  });
  const service = new ServiceBookingsService(repo);

  await assert.rejects(
    async () => {
      await service.createAppointment({
        customerName: 'Ahmad',
        customerPhone: '0501234567',
        carModelId: 'c1',
        maintenanceTypeId: 'm1',
        branchId: 'b_main',
        date: '2026-10-25', // Sunday
        startTime: '09:00',
        notes: 'Oil change',
      });
    },
    /daily appointment limit \(5\) reached/i,
  );
});

test('createAppointment rejects when 15-minute slot limit is reached', async () => {
  const repo = createMockRepository({
    countInSlot: async () => 1, // maxPerSlot is 1 by default
  });
  const service = new ServiceBookingsService(repo);

  await assert.rejects(
    async () => {
      await service.createAppointment({
        customerName: 'Sara',
        customerPhone: '0509876543',
        carModelId: 'c1',
        maintenanceTypeId: 'm1',
        branchId: 'b_main',
        date: '2026-10-26', // Monday
        startTime: '10:15',
        notes: 'Brake check',
      });
    },
    /slot is already booked/i,
  );
});

test('createAppointment rejects when max 3 appointments per hour limit is reached', async () => {
  const repo = createMockRepository({
    countInSlot: async () => 0, // slot empty
    countInHourWindow: async () => 3, // already 3 in 09:00 hour window
  });
  const service = new ServiceBookingsService(repo);

  await assert.rejects(
    async () => {
      await service.createAppointment({
        customerName: 'Khaled',
        customerPhone: '0501112233',
        carModelId: 'c1',
        maintenanceTypeId: 'm1',
        branchId: 'b_main',
        date: '2026-10-26', // Monday
        startTime: '09:45',
        notes: 'Inspection',
      });
    },
    /Maximum appointments per hour limit \(3\) reached/i,
  );
});

test('createAppointment succeeds and generates reference when within limits', async () => {
  const repo = createMockRepository({
    countDailyActive: async () => 2,
    countInSlot: async () => 0,
    countInHourWindow: async () => 1,
  });
  const service = new ServiceBookingsService(repo);

  const result = await service.createAppointment({
    customerName: 'Fahad',
    customerPhone: '0507778899',
    carModelId: 'c1',
    maintenanceTypeId: 'm1',
    branchId: 'b_main',
    date: '2026-10-26',
    startTime: '11:15',
    notes: 'Regular checkup',
  });

  assert.equal(result.customerName, 'Fahad');
  assert.equal(result.startTime, '11:15');
  assert.equal(result.endTime, '11:45');
  assert.equal(result.referenceNumber, 'APT-20261026-0001');
  assert.equal(result.status, 'BOOKED');
});
