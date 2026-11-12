import assert from 'node:assert/strict';
import test from 'node:test';
import { PortalIntakeService } from './portal-intake.service.js';

test('settings reject an empty redirect team without a transaction', async () => {
  const service = new PortalIntakeService({ transaction: () => { throw Error('Unexpected write'); } } as never, {} as never, {} as never);
  await assert.rejects(service.save({ branchId: 'branch', categoryId: 'cat', phoneCountryCode: '+962', memberIds: [], expectedVersion: null }, 'admin'), { code: 'VALIDATION_FAILED' });
});
test('active configured intake accepts a category without a department; staff classify the destination later', async () => {
  const service = new PortalIntakeService({ defaults: async () => ({ branchId: 'b1', categoryId: 'cat', branch: { isActive: true }, category: { isActive: true, branchId: null } }) } as never, {} as never, {} as never);
  assert.deepEqual(await service.defaults(), { branchId: 'b1', categoryId: 'cat', departmentId: null });
});
