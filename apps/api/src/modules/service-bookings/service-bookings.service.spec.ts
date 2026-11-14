import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { ServiceBookingsRepository } from './service-bookings.repository.js';
import { ServiceBookingsService } from './service-bookings.service.js';
import { parseUpsertCarModelBody } from './dto/service-master-data.dto.js';
import { parseCreateServiceAppointmentBody } from './dto/create-service-appointment.dto.js';

test('admin car catalog requires a brand and a separate model name', () => {
  for (const brand of [undefined, '', '   ', 123]) {
    assert.throws(() => parseUpsertCarModelBody({ brand, nameEn: 'BJ30' }), /brand.*required/i);
  }
  assert.throws(() => parseUpsertCarModelBody({ brand: 'BAIC' }), /model name.*required/i);
  assert.deepEqual(parseUpsertCarModelBody({ brand: ' BAIC ', nameEn: ' BJ30 ' }), {
    id: undefined, brand: 'BAIC', nameEn: 'BJ30', nameAr: 'BJ30', isActive: true,
  });
});

test('booking parser never substitutes a default vehicle', () => {
  assert.throws(() => parseCreateServiceAppointmentBody({ customerName: 'Test', customerPhone: '0790000000' }), /vehicle model.*required/i);
});

test('booking parser requires an explicit booking lane', () => {
  assert.throws(() => parseCreateServiceAppointmentBody({ customerName: 'Test', customerPhone: '0790000000',
    carModelId: 'c1', maintenanceTypeId: 'm1', date: '2026-11-02', startTime: '11:15' }), /booking lane.*required/i);
});

test('periodic mileage accepts the offered values and rejects invalid values', () => {
  const base = { customerName: 'Test', customerPhone: '0790000000', carModelId: 'c1',
    maintenanceTypeId: 'maint_periodic_10k', bookingLaneId: 'lane-1', date: '2026-11-02', startTime: '11:15' };
  for (const value of [1000, 5000, 10000, 150000]) {
    assert.equal(parseCreateServiceAppointmentBody({ ...base, periodicMileageKm: value }).periodicMileageKm, value);
  }
  for (const value of [0, 999, 6000, 160000, 'oops']) {
    assert.throws(() => parseCreateServiceAppointmentBody({ ...base, periodicMileageKm: value }), /valid periodic maintenance mileage/i);
  }
});

test.beforeEach(() => { mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-01T00:00:00Z') }); });

test.afterEach(() => { mock.timers.reset(); });

function createMockRepository(overrides: Partial<Record<keyof ServiceBookingsRepository, any>> = {}) {
  const repo = new ServiceBookingsRepository(null as any);
  Object.assign(repo, {
    findRuleForDay: async () => null, // falls back to defaults (Sun-Thu 8-18 open, maxDaily: 24, maxPerHour: 3, maxPerSlot: 1; Fri closed)
    countDailyActive: async () => 0,
    countInSlot: async () => 0,
    countInHourWindow: async () => 0,
    findCarModelById: async () => ({ id: 'c1', nameEn: 'Patrol', brand: 'Nissan' }),
    findMaintenanceTypeById: async () => ({ id: 'm1', nameEn: 'Periodic 10k', estimatedDurationMinutes: 30 }),
    findFirstActiveLane: async (serviceCenterId: string) => ({ id: 'lane-1', serviceCenterId, nameEn: 'General', nameAr: 'عام', isActive: true,
      maxDailyAppointments: 24, maxPerHour: 3, maxPerSlot: 1 }),
    findBookingLane: async (id: string) => ({ id, serviceCenterId: 'b_main', nameEn: 'General', nameAr: 'عام', isActive: true,
      maxDailyAppointments: 24, maxPerHour: 3, maxPerSlot: 1 }),
    generateReferenceNumber: async () => 'APT-20261026-0001',
    createAppointment: async (data: any) => ({
      status: 'BOOKED',
      ...data,
      id: 'apt_1',
      createdAt: new Date(),
      updatedAt: new Date(),
      branch: { nameEn: 'Main Branch', nameAr: 'الفرع الرئيسي' },
      bookingLane: { nameEn: 'General', nameAr: 'عام' },
    }),
    findAppointmentsForDate: async () => [],
    ...overrides,
  });
  return repo;
}

test('service-bookings service can be constructed', () => {
  assert.ok(new ServiceBookingsService(createMockRepository()));
});

test('booking rejects missing or deactivated catalog models without creating an appointment', async () => {
  for (const model of [null, { id: 'c1', nameEn: 'Patrol', brand: 'Nissan', isActive: false }]) {
    let created = false;
    const service = new ServiceBookingsService(createMockRepository({
      findCarModelById: async () => model,
      createAppointment: async () => { created = true; throw new Error('unexpected write'); },
    }));
    await assert.rejects(() => service.createAppointment({ customerName: 'Test', customerPhone: '0790000000',
      carModelId: 'c1', maintenanceTypeId: 'm1', branchId: 'b_main', date: '2026-10-26', startTime: '09:00', notes: '' }), /active vehicle model/i);
    assert.equal(created, false);
  }
});

test('booking rejects an inactive maintenance type', async () => {
  const service = new ServiceBookingsService(createMockRepository({
    findMaintenanceTypeById: async () => ({ id: 'maint_periodic_20k', nameEn: 'Periodic Maintenance 20,000 km', isActive: false }),
  }));
  await assert.rejects(service.createAppointment({ customerName: 'Test', customerPhone: '0790000000',
    carModelId: 'c1', maintenanceTypeId: 'maint_periodic_20k', periodicMileageKm: 20000,
    branchId: 'b_main', date: '2026-11-02', startTime: '09:00', notes: '' }), /active maintenance type/i);
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

test('booking rejects times outside configured slots and invalid 15-minute boundaries', async () => {
  const service = new ServiceBookingsService(createMockRepository());
  for (const startTime of ['19:15', '12:10']) {
    await assert.rejects(service.createAppointment({ customerName: 'Test', customerPhone: '0790000000',
      carModelId: 'c1', maintenanceTypeId: 'm1', branchId: 'b_main', date: '2026-11-02',
      startTime, notes: '' }), /within the branch booking slots/i);
  }
});

test('booking accepts an evening slot when the branch rule opens in the evening', async () => {
  const service = new ServiceBookingsService(createMockRepository({ findRuleForDay: async () => ({
    isOpen: true, startTime: '19:00', endTime: '21:00', maxDailyAppointments: 24,
    maxPerHour: 3, maxPerSlot: 3, slotDurationMinutes: 15,
  }) }));
  const result = await service.createAppointment({ customerName: 'Test', customerPhone: '0790000000',
    carModelId: 'c1', maintenanceTypeId: 'm1', branchId: 'b_main', date: '2026-11-02',
    startTime: '19:15', notes: '' });
  assert.equal(result.startTime, '19:15');
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
    findFirstActiveLane: async (serviceCenterId: string) => ({ id: 'lane-1', serviceCenterId, nameEn: 'Notes', nameAr: 'نوتس', isActive: true,
      maxDailyAppointments: 5, maxPerHour: 3, maxPerSlot: 1 }),
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
        date: '2026-11-01', // Sunday
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
        date: '2026-11-02', // Monday
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
        date: '2026-11-02', // Monday
        startTime: '09:45',
        notes: 'Inspection',
      });
    },
    /Maximum appointments per hour limit \(3\) reached/i,
  );
});

test('createAppointment rejects when time slot is in the past', async () => {
  const repo = createMockRepository();
  const service = new ServiceBookingsService(repo);

  await assert.rejects(
    async () => {
      await service.createAppointment({
        customerName: 'Test',
        customerPhone: '0501112233',
        carModelId: 'c1',
        maintenanceTypeId: 'm1',
        branchId: 'b_main',
        date: '2020-01-01',
        startTime: '09:00',
        notes: 'Old date',
      });
    },
    /past time slot/i,
  );
});

test('createAppointment succeeds and generates reference when within limits', async () => {
  let scheduled: { appointmentId: string; revision: string } | undefined;
  const repo = createMockRepository({
    countDailyActive: async () => 2,
    countInSlot: async () => 0,
    countInHourWindow: async () => 1,
  });
  const service = new ServiceBookingsService(repo, undefined, {
    sync: async (appointment: any, revision: string) => { scheduled = { appointmentId: appointment.id, revision }; },
  } as any);

  const result = await service.createAppointment({
    customerName: 'Fahad',
    customerPhone: '0507778899',
    carModelId: 'c1',
    maintenanceTypeId: 'm1',
    branchId: 'b_main',
    date: '2026-11-02',
    startTime: '11:15',
    notes: 'Regular checkup',
  });

  assert.equal(result.customerName, 'Fahad');
  assert.equal(result.startTime, '11:15');
  assert.equal(result.endTime, '11:45');
  assert.equal(result.referenceNumber, 'APT-20261026-0001');
  assert.equal(result.status, 'BOOKED');
  assert.equal(scheduled?.appointmentId, 'apt_1');
  assert.ok(scheduled?.revision);
});

test('periodic mileage is stored and returned with the booking', async () => {
  let saved: any;
  const repo = createMockRepository({
    findMaintenanceTypeById: async (id: string) => id === 'maint_periodic_10k'
      ? { id, nameEn: 'Periodic Maintenance 10,000 km', estimatedDurationMinutes: 30 }
      : { id, nameEn: 'Oil and Filter Change', estimatedDurationMinutes: 30 },
    createAppointment: async (data: any) => {
      saved = data;
      return { ...data, id: 'apt-periodic', createdAt: new Date(), updatedAt: new Date(), branch: null };
    },
  });
  const service = new ServiceBookingsService(repo);
  const result = await service.createAppointment({ customerName: 'Test', customerPhone: '0790000000',
    carModelId: 'c1', maintenanceTypeId: 'maint_periodic_10k', periodicMileageKm: 150000,
    branchId: 'b_main', date: '2026-11-02', startTime: '11:15', notes: '' });
  assert.equal(saved.periodicMileageKm, 150000);
  assert.equal(result.periodicMileageKm, 150000);
  assert.equal(result.maintenanceTypeName, 'Periodic Maintenance 150,000 km');
  await assert.rejects(service.createAppointment({ customerName: 'Test', customerPhone: '0790000000',
    carModelId: 'c1', maintenanceTypeId: 'maint_oil_filter', periodicMileageKm: 1000,
    branchId: 'b_main', date: '2026-11-02', startTime: '11:15', notes: '' }), /only valid for periodic maintenance/i);
});

test('rescheduling replaces the reminder using the updated appointment revision', async () => {
  let scheduledRevision = '';
  const existing: any = {
    id: 'apt-2', status: 'BOOKED', serviceCenterId: 'center_main', branchId: null,
    date: new Date('2026-10-02T00:00:00.000Z'), startTime: '09:00', durationMinutes: 30,
    customerName: 'Maya', customerPhone: '0791234567', createdAt: new Date(),
  };
  const repo = createMockRepository({
    findAppointmentById: async () => existing,
    updateAppointmentWithAudits: async (_id: string, data: any) => ({ ...existing, ...data, updatedAt: new Date('2026-10-01T12:00:00.000Z') }),
    findAppointmentHistory: async () => [],
    recordAppointmentAudit: async () => undefined,
    countInSlot: async () => 0,
    countInHourWindow: async () => 0,
  });
  const service = new ServiceBookingsService(repo, undefined, {
    sync: async (_appointment: any, revision: string) => { scheduledRevision = revision; },
  } as any);
  const result = await service.updateAppointment('apt-2', { date: '2026-10-05', startTime: '09:30' }, 'admin-1', 'ADMIN');
  assert.equal(result.startTime, '09:30');
  assert.equal(scheduledRevision, '2026-10-01T12:00:00.000Z');
});
