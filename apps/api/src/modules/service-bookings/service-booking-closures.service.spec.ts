import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceBookingsController } from './service-bookings.controller.js';
import { ServiceBookingClosuresService } from './service-booking-closures.service.js';
import { parseCreateServiceBookingClosureBody } from './dto/service-booking-closure.dto.js';

const admin = { userId: 'admin-1', roleCode: 'ADMIN', branchId: 'center-main' } as any;
const staff = { userId: 'staff-1', roleCode: 'CR_OFFICER', branchId: 'center-main' } as any;
const input = { serviceCenterId: 'center-main', startDate: '2026-12-21', endDate: '2026-12-27', reason: 'Christmas week' };

test('Admin creates an inclusive date range and CONFIG audit in one transaction', async () => {
  const client = { marker: 'transaction' };
  let auditClient: unknown;
  const repository = {
    transaction: async (work: (client: unknown) => Promise<unknown>) => work(client),
    findCenter: async () => ({ id: 'center-main' }),
    findOverlap: async () => null,
    create: async (values: any) => ({ id: 'closure-1', ...values }),
  };
  const audit = { record: async (_event: unknown, tx: unknown) => { auditClient = tx; } };
  const service = new ServiceBookingClosuresService(repository as any, audit as any);
  const closure = await service.create(input, admin);
  assert.equal(closure.id, 'closure-1');
  assert.equal(closure.endDate.toISOString().slice(0, 10), '2026-12-27');
  assert.equal(auditClient, client);
});

test('non-Admin cannot create or delete a closure', async () => {
  let wrote = false;
  const service = new ServiceBookingClosuresService({ transaction: async () => { wrote = true; } } as any, {} as any);
  await assert.rejects(service.create(input, staff), (error: any) => error?.code === 'RBAC_FORBIDDEN');
  await assert.rejects(service.delete('center-main', 'closure-1', staff), (error: any) => error?.code === 'RBAC_FORBIDDEN');
  assert.equal(wrote, false);
});

test('date range parser rejects invalid or reversed dates', () => {
  for (const dates of [{ startDate: '2026-02-30', endDate: '2026-03-01' },
    { startDate: '2026-12-27', endDate: '2026-12-21' }]) {
    assert.throws(() => parseCreateServiceBookingClosureBody({ ...input, ...dates }, input.serviceCenterId),
      (error: any) => error?.code === 'VALIDATION_FAILED');
  }
});

test('closure write routes require session, Admin RBAC, and CSRF', () => {
  for (const method of ['createClosure', 'deleteClosure'] as const) {
    const route = ServiceBookingsController.prototype[method];
    const guards = Reflect.getMetadata('__guards__', route) as Array<{ name: string }>;
    assert.deepEqual(guards.map((guard) => guard.name), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);
    assert.deepEqual(Reflect.getMetadata('cms:auto:roles', route), ['ADMIN']);
  }
});
