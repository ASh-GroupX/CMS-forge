import assert from 'node:assert/strict';
import test from 'node:test';
import { ComplaintIntakeService } from '../../src/modules/complaints/complaint-intake.service.js';
import { ComplaintIntakeRepository } from '../../src/modules/complaints/complaint-intake.repository.js';
import { parseIntakeCorrection } from '../../src/modules/complaints/dto/complaint-intake.dto.js';
const actor = { userId: 'u1', roleCode: 'CR_MANAGER', branchId: 'b1', permissions: [] } as never;
const original = { id: 'c1', referenceNumber: 'CMS-1', branchId: 'b1', categoryId: 'cat', departmentId: 'dep', ownerId: null, status: 'SUBMITTED', severity: 'MEDIUM', descriptionEn: 'Noise', incidentAt: new Date('2026-11-11'), odometer: null, updatedAt: new Date('2026-11-11'), createdAt: new Date('2026-11-11'), customerNameSnapshot: 'Maya', vehicleVinSnapshot: null, vehicleMakeSnapshot: 'Nissan', vehicleModelSnapshot: 'Patrol', customer: { nameEn: 'Shared name', phone: '+962790000000' }, vehicle: null };
const correction = () => parseIntakeCorrection({ customerName: 'Corrected', customerPhone: '+962790000001', vehicleMake: 'Nissan', vehicleModel: 'Patrol', vehicleVin: null, odometer: 123, incidentAt: '2026-11-11', description: 'Corrected description', branchId: 'b1', categoryId: 'cat', severity: 'HIGH', departmentId: 'dep', ownerId: null, reason: 'Verified with customer' });
function fixture() {
  let row = structuredClone(original); let owner: string | null = null; let member = true; let failAudit = false; let committed = false;
  const histories: any[] = [], audits: any[] = [], effects: string[] = [];
  const repository = { transaction: async (work: (tx: any) => Promise<any>) => { const before = structuredClone(row), beforeOwner = owner, h = histories.length, a = audits.length; committed = false; try { const result = await work({}); committed = true; return result; } catch (error) { row = before; owner = beforeOwner; histories.splice(h); audits.splice(a); throw error; } }, find: async () => row, bump: async (_row: any, data: any) => { row = { ...row, ...data, updatedAt: new Date(row.updatedAt.getTime() + 1) }; return row; }, history: async (data: any) => { histories.push(data); }, queue: async () => [row] };
  const assignments = { getInTransaction: async () => owner ? { assignedUserId: owner } : null, setInTransaction: async (input: any) => { if (input.entityType === 'COMPLAINT_INTAKE') owner = input.assignedUserId; effects.push(`assign:${input.entityType}`); }, releaseInTransaction: async () => { owner = null; }, claimedIds: async () => [], get: async () => owner ? { assignedUserId: owner } : null, notifyAfterCommit: async () => { assert.equal(committed, true); effects.push('notify'); } };
  const audit = { record: async (data: any) => { if (failAudit) throw Error('audit unavailable'); audits.push(data); } };
  const catalog = { list: async () => ({ branches: [{ id: 'b1' }], categories: [{ id: 'cat', branchId: 'b1' }], departments: [{ id: 'dep', branchId: 'b1' }], users: [{ id: 'employee', branchId: 'b1', departmentId: 'dep' }] }) };
  const service = new ComplaintIntakeService(repository as never, audit as never, assignments as never, { resolveIntake: async () => ({ id: 'resolved-customer' }) } as never, catalog as never, { recordDeadlineEvent: async () => { assert.equal(committed, true); effects.push('sla'); } } as never, { isMember: async () => member } as never);
  return { service, histories, audits, effects, row: () => row, owner: (value: string | null) => { owner = value; }, membership: (value: boolean) => { member = value; }, fail: () => { failAudit = true; } };
}
test('configured member can claim; missing membership, branch mismatch and stale versions are denied', async () => {
  const f = fixture(); const claimed = await f.service.claim('c1', original.updatedAt.toISOString(), actor);
  assert.equal(claimed.claim?.assignedUserId, 'u1');
  await assert.rejects(f.service.claim('c1', original.updatedAt.toISOString(), actor), { status: 409 });
  f.membership(false); await assert.rejects(f.service.queue(actor, 'all'), { status: 403 });
  f.membership(true); await assert.rejects(f.service.detail('c1', { ...actor as object, branchId: 'other' } as never), { status: 404 });
});
test('editing without own claim and claims by other members are conflicts', async () => {
  const f = fixture(); await assert.rejects(f.service.correct('c1', original.updatedAt.toISOString(), correction(), actor, false), { status: 409 });
  f.owner('other'); await assert.rejects(f.service.claim('c1', original.updatedAt.toISOString(), actor), { status: 409 });
});
test('redirect atomically writes ordered workflow history and PII-free audits before post-commit effects', async () => {
  const f = fixture(); f.owner('u1'); const result = await f.service.correct('c1', original.updatedAt.toISOString(), correction(), actor, true);
  assert.equal(result.status, 'BRANCH_REVIEW');
  assert.deepEqual(f.histories.map((event) => [event.fromStatus, event.toStatus]), [['SUBMITTED', 'MANAGER_REVIEW'], ['MANAGER_REVIEW', 'BRANCH_REVIEW']]);
  assert.ok(f.effects.includes('assign:COMPLAINT')); assert.ok(f.effects.includes('notify')); assert.ok(f.effects.includes('sla'));
  assert.doesNotMatch(JSON.stringify(f.audits), /Corrected description|962790|Verified with customer/);
  assert.equal(f.row().customer.nameEn, 'Shared name'); assert.equal(f.row().customerNameSnapshot, 'Corrected');
  assert.equal(f.row().subject, 'Corrected');
  assert.equal(f.row().vehicleMakeSnapshot, 'Nissan'); assert.equal(f.row().vehicleModelSnapshot, 'Patrol');
});
test('specific owner enters investigation; audit failure rolls back writes and schedules no notifications', async () => {
  const f = fixture(); f.owner('u1'); const changes = correction(); changes.ownerId = 'employee';
  assert.equal((await f.service.correct('c1', original.updatedAt.toISOString(), changes, actor, true)).status, 'IN_PROGRESS');
  const failed = fixture(); failed.owner('u1'); failed.fail();
  await assert.rejects(failed.service.correct('c1', original.updatedAt.toISOString(), correction(), actor, true));
  assert.equal(failed.row().status, 'SUBMITTED'); assert.deepEqual(failed.histories, []); assert.ok(!failed.effects.includes('notify'));
});
test('queue filter is applied in persistence before page limit', async () => {
  let query: any;
  await new ComplaintIntakeRepository({ complaint: { findMany: async (input: any) => { query = input; return []; } } } as never).queue('b1', ['claimed1'], true, 2);
  assert.deepEqual(query.where.id, { notIn: ['claimed1'] }); assert.equal(query.take, 51); assert.equal(query.skip, 50);
});
test('intake validates phone, VIN and odometer', () => {
  const valid = { ...correction(), incidentAt: '2026-11-11' };
  for (const invalid of [{ customerPhone: '123' }, { vehicleVin: 'PRIVATE' }, { odometer: -1 }]) assert.throws(() => parseIntakeCorrection({ ...valid, ...invalid }), { code: 'VALIDATION_FAILED' });
});
