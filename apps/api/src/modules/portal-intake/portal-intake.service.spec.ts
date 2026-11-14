import assert from 'node:assert/strict';
import test from 'node:test';
import { PortalIntakeService } from './portal-intake.service.js';

test('settings reject an empty redirect team without a transaction', async () => {
  const service = new PortalIntakeService({ transaction: () => { throw Error('Unexpected write'); } } as never, {} as never, {} as never);
  await assert.rejects(service.save({ branchId: 'branch', categoryId: 'cat', redirectBranchId: 'destination', redirectDepartmentId: 'department', phoneCountryCode: '+962', memberIds: [], expectedVersion: null }, 'admin'), { code: 'VALIDATION_FAILED' });
});
test('active configured intake accepts a category without a department; staff classify the destination later', async () => {
  const service = new PortalIntakeService({ defaults: async () => ({ branchId: 'b1', categoryId: 'cat', branch: { isActive: true }, category: { isActive: true, branchId: null } }) } as never, {} as never, {} as never);
  assert.deepEqual(await service.defaults(), { branchId: 'b1', categoryId: 'cat', departmentId: null });
});
test('admin settings validate the suggested destination and audit a versioned save', async () => {
  const records: unknown[] = [];
  const choices = { branches: [{ id: 'source' }, { id: 'target' }], categories: [{ id: 'cat', branchId: 'source' }], departments: [{ id: 'service', branchId: 'target' }], members: [{ id: 'manager', branchId: 'source', roleCode: 'CR_MANAGER' }] };
  const repository = { transaction: async (work: (tx: object) => Promise<unknown>) => work({}), get: async () => null, advance: async (input: Record<string, unknown>) => ({ ...input, version: 1 }), add: async (id: string) => { records.push(id); } };
  const service = new PortalIntakeService(repository as never, { intakeOptions: async () => choices } as never, { record: async (event: unknown) => { records.push(event); } } as never);
  const input = { branchId: 'source', categoryId: 'cat', redirectBranchId: 'target', redirectDepartmentId: 'service', phoneCountryCode: '+962', memberIds: ['manager'], expectedVersion: null };
  await assert.rejects(service.save({ ...input, redirectDepartmentId: 'unknown' }, 'admin'), { code: 'VALIDATION_FAILED' });
  assert.equal(records.length, 0);
  const saved = await service.save(input, 'admin');
  assert.equal(saved.redirectBranchId, 'target'); assert.equal(saved.redirectDepartmentId, 'service');
  assert.equal(records.length, 2);
  assert.equal((records[1] as { action: string }).action, 'portal_intake_settings_updated');
});
