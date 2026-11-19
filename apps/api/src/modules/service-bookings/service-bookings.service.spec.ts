import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { ServiceBookingsRepository } from './service-bookings.repository.js';
import { ServiceBookingsService } from './service-bookings.service.js';
import { ServiceBookingsController } from './service-bookings.controller.js';
import { parseUpsertCarModelBody } from './dto/service-master-data.dto.js';
import { parseCreateServiceAppointmentBody } from './dto/create-service-appointment.dto.js';
import { periodicMaintenance, DEFAULT_MAINTENANCE_TYPES } from './service-bookings.utils.js';

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

test('booking parser requires an explicit maintenance type', () => {
  assert.throws(() => parseCreateServiceAppointmentBody({ customerName: 'Test', customerPhone: '0790000000',
    carModelId: 'c1', bookingLaneId: 'lane-1', date: '2026-11-02', startTime: '11:15' }), /maintenance type is required/i);
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

test('all three current periodic types require mileage and keep their distinct labels', () => {
  for (const type of DEFAULT_MAINTENANCE_TYPES.slice(0, 3)) {
    assert.throws(() => periodicMaintenance(null, type.id, type.nameEn, type.nameAr), /periodic maintenance mileage/i);
    assert.deepEqual(periodicMaintenance(40000, type.id, type.nameEn, type.nameAr), { mileage: 40000, name: type.nameEn });
  }
  for (const type of DEFAULT_MAINTENANCE_TYPES.slice(3)) {
    assert.deepEqual(periodicMaintenance(null, type.id, type.nameEn, type.nameAr), { mileage: null, name: type.nameEn });
    assert.throws(() => periodicMaintenance(40000, type.id, type.nameEn, type.nameAr), /only valid for periodic/i);
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

test('closed date blocks creation and reports no available slots', async () => {
  let wrote = false;
  const repository = createMockRepository({ createAppointment: async () => { wrote = true; } });
  const closures = { findActive: async (_centerId: string, date: Date) =>
    date.toISOString().slice(0, 10) === '2026-12-23' ? { id: 'closure-1' } : null };
  const service = new ServiceBookingsService(repository, undefined, undefined, closures as any);
  await assert.rejects(service.createAppointment({ customerName: 'Test', customerPhone: '0790000000',
    carModelId: 'c1', maintenanceTypeId: 'm1', branchId: 'b_main', date: '2026-12-23',
    startTime: '09:00', notes: '' }), /booking is closed/i);
  assert.equal(wrote, false);
  const availability = await service.getSlotAvailability('b_main', '2026-12-23');
  assert.equal(availability.isOpen, false);
  assert.equal(availability.slots.length, 0);
});

test('closed date blocks rescheduling without changing the appointment', async () => {
  let changed = false;
  const existing = { id: 'apt-2', status: 'BOOKED', serviceCenterId: 'b_main', branchId: null,
    bookingLaneId: 'lane-1', date: new Date('2026-12-20T00:00:00Z'), startTime: '09:00', durationMinutes: 30,
    customerName: 'Maya', customerPhone: '0791234567', createdAt: new Date() };
  const repository = createMockRepository({
    findAppointmentById: async () => existing,
    updateAppointmentWithAudits: async () => { changed = true; },
  });
  const closures = { findActive: async () => ({ id: 'closure-1' }) };
  const service = new ServiceBookingsService(repository, undefined, undefined, closures as any);
  await assert.rejects(service.updateAppointment('apt-2', { date: '2026-12-23' }), /booking is closed/i);
  assert.equal(changed, false);
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

test('maintenance edit checks booking access, recalculates duration, and audits atomically', async () => {
  const existing: any = { id: 'apt-3', status: 'BOOKED', serviceCenterId: 'center_main', bookingLaneId: 'lane-1',
    date: new Date('2026-11-20T00:00:00.000Z'), startTime: '09:00', durationMinutes: 30,
    maintenanceTypeId: 'maint_oil_filter', maintenanceTypeName: 'Oil and Filter Change', periodicMileageKm: null,
    customerName: 'Maya', customerPhone: '0791234567', createdAt: new Date() };
  let writes = 0;
  let saved: any;
  let audits: any;
  const repo = createMockRepository({ findAppointmentById: async () => existing,
    findMaintenanceTypeById: async () => ({ id: 'maint_periodic_40k', nameEn: 'Periodic Maintenance 40,000 km', estimatedDurationMinutes: 60, isActive: true }),
    updateAppointmentWithAudits: async (_id: string, data: any, auditRows: any) => {
      writes++; saved = data; audits = auditRows;
      return { ...existing, ...data, updatedAt: new Date() };
    }, findAppointmentHistory: async () => [] });
  const permissions = { checkPermission: async (_id: string, _role: string, key: string) => {
    assert.equal(key, 'canRescheduleBookings'); throw new Error('denied');
  } };
  const denied = new ServiceBookingsService(repo, permissions as any);
  await assert.rejects(denied.updateAppointment('apt-3', { maintenanceTypeId: 'maint_periodic_40k', periodicMileageKm: 40000 }, 'staff-1', 'STAFF'), /denied/);
  assert.equal(writes, 0);
  const allowed = new ServiceBookingsService(repo, { checkPermission: async () => undefined } as any);
  await allowed.updateAppointment('apt-3', { maintenanceTypeId: 'maint_periodic_40k', periodicMileageKm: 40000 }, 'staff-2', 'STAFF');
  assert.equal(saved.durationMinutes, 60);
  assert.equal(saved.endTime, '10:00');
  assert.equal(saved.periodicMileageKm, 40000);
  assert.equal(audits[0].action, 'service_booking_details_change');
  assert.deepEqual(audits[0].metadata.fields, ['maintenanceTypeId', 'periodicMileageKm']);
});

test('appointment edit routes require a session and CSRF token', () => {
  for (const handler of ['updateAppointmentPath', 'updateAppointment'] as const) {
    const guards = Reflect.getMetadata('__guards__', ServiceBookingsController.prototype[handler]) as Array<{ name: string }>;
    assert.deepEqual(guards.map((guard) => guard.name), ['SessionAuthGuard', 'CsrfGuard']);
  }
});
