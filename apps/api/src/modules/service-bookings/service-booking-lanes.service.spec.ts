import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceBookingsController } from './service-bookings.controller.js';
import { ServiceBookingLanesService } from './service-booking-lanes.service.js';

const admin = { userId: 'admin-1', roleCode: 'ADMIN', branchId: 'center-main' } as any;
const staff = { userId: 'staff-1', roleCode: 'CR_OFFICER', branchId: 'center-main' } as any;
const laneInput = {
  serviceCenterId: 'center-main', code: 'NOTES', nameEn: 'Notes', nameAr: 'نوتس',
  maxDailyAppointments: 80, maxPerHour: 9, maxPerSlot: 3, position: 0, isActive: true,
};

test('Admin creates a lane and its CONFIG audit in the same transaction', async () => {
  const transactionClient = { marker: 'same-transaction' };
  let auditClient: unknown;
  const repository = {
    transaction: async (work: (client: unknown) => Promise<unknown>) => work(transactionClient),
    findCenter: async () => ({ id: 'center-main' }),
    create: async (values: any) => ({ id: 'lane-notes', ...values }),
  };
  const audit = { record: async (_record: unknown, client: unknown) => { auditClient = client; } };
  const service = new ServiceBookingLanesService(repository as any, audit as any);

  const lane = await service.upsert(laneInput, admin);
  assert.equal(lane.id, 'lane-notes');
  assert.equal(lane.maxPerHour, 9);
  assert.equal(auditClient, transactionClient);
});

test('non-Admin lane configuration is denied before any write', async () => {
  let wrote = false;
  const service = new ServiceBookingLanesService({ transaction: async () => { wrote = true; } } as any, {} as any);
  await assert.rejects(service.upsert(laneInput, staff), (error: any) => error?.code === 'RBAC_FORBIDDEN');
  assert.equal(wrote, false);
});

test('stale lane edits return a conflict', async () => {
  const repository = {
    transaction: async (work: (client: unknown) => Promise<unknown>) => work({}),
    findCenter: async () => ({ id: 'center-main' }),
    findLane: async () => ({ id: 'lane-notes', serviceCenterId: 'center-main' }),
    update: async () => null,
  };
  const service = new ServiceBookingLanesService(repository as any, { record: async () => undefined } as any);
  await assert.rejects(service.upsert({ ...laneInput, id: 'lane-notes', expectedUpdatedAt: '2026-11-14T10:00:00.000Z' }, admin),
    (error: any) => error?.code === 'CONFLICT');
});

test('lane write route requires session, Admin RBAC, and CSRF guards', () => {
  const guards = Reflect.getMetadata('__guards__', ServiceBookingsController.prototype.upsertBookingLane) as Array<{ name: string }>;
  assert.deepEqual(guards.map((guard) => guard.name), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);
  assert.deepEqual(Reflect.getMetadata('cms:auto:roles', ServiceBookingsController.prototype.upsertBookingLane), ['ADMIN']);
});
