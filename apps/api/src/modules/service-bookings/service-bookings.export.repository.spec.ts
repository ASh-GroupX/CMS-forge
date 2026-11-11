import assert from 'node:assert/strict';
import test from 'node:test';
import { ServiceBookingsExportRepository } from './service-bookings.export.repository.js';

test('appointment export scopes both legacy branch and service center and includes periodic mileage', async () => {
  let query: any;
  const repository = new ServiceBookingsExportRepository({ serviceAppointment: {
    findMany: async (input: unknown) => { query = input; return []; },
  } } as never);
  await repository.page(['center_main'], 10);
  assert.deepEqual(query.where.OR, [
    { branchId: { in: ['center_main'] } }, { serviceCenterId: { in: ['center_main'] } },
  ]);
  assert.equal(query.select.periodicMileageKm, true);
  assert.equal(query.select.customerPhone, undefined);
});
