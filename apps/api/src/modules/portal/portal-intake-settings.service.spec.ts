import assert from 'node:assert/strict';
import test from 'node:test';
import { PortalIntakeSettingsService } from './portal-intake-settings.service.js';

test('intake settings reject missing team members before touching persistence', async () => {
  const service = new PortalIntakeSettingsService({ $transaction: () => { throw new Error('unexpected database access'); } } as never, {} as never);
  await assert.rejects(() => service.save({ branchId: 'branch', categoryId: 'category', phoneCountryCode: '+962', memberIds: [], expectedVersion: null }, 'admin'), { code: 'VALIDATION_FAILED' });
});

test('intake settings reject stale versions without writing membership or audit', async () => {
  let writes = 0;
  const tx = {
    branch: { findFirst: async () => ({ id: 'branch' }) },
    category: { findFirst: async () => ({ id: 'category', branchId: null }) },
    user: { findMany: async () => [{ id: 'manager', role: { code: 'CR_MANAGER', permissions: [] } }] },
    portalIntakeSetting: { findUnique: async () => ({ id: 'default', version: 2, members: [] }), update: async () => { writes++; } },
    portalIntakeMember: { create: async () => { writes++; } },
  };
  const service = new PortalIntakeSettingsService({ $transaction: (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as never, { record: async () => { writes++; } } as never);
  await assert.rejects(() => service.save({ branchId: 'branch', categoryId: 'category', phoneCountryCode: '+962', memberIds: ['manager'], expectedVersion: 1 }, 'admin'), { status: 409 });
  assert.equal(writes, 0);
});
