import assert from 'node:assert/strict';
import test from 'node:test';
import { ComplaintsRepository } from '../../src/modules/complaints/complaints.repository.js';
import { parsePortalComplaintBody } from '../../src/modules/portal/dto/create-portal.dto.js';
import { detailItem } from '../../src/modules/complaints/complaint-read-models.js';
test('responsible department can read submitted vehicle and corrected name after routing without a shared vehicle', () => {
  const detail = detailItem({ id: 'c', status: 'BRANCH_REVIEW', severity: 'MEDIUM', referenceNumber: 'CMS-1', branch: { timezone: 'Asia/Amman' }, createdAt: new Date(), updatedAt: new Date(), customer: { id: 'shared', nameEn: 'Shared name', phone: '+962790000000', dataSource: 'MANUAL' }, customerNameSnapshot: 'Submitted name', vehicle: null, vehicleMakeSnapshot: 'Nissan', vehicleModelSnapshot: 'Patrol', vehicleVinSnapshot: null, incidentAt: null, statusHistory: [] } as never);
  assert.equal(detail.customer.name, 'Submitted name');
  assert.deepEqual(detail.submittedVehicle, { make: 'Nissan', model: 'Patrol', vin: null });
});
test('responsible department reads current custom answers without baseline snapshots; masked detail hides them', () => {
  const source = { id: 'c', status: 'BRANCH_REVIEW', severity: 'MEDIUM', referenceNumber: 'CMS-1', branch: { timezone: 'Asia/Amman' }, createdAt: new Date(), updatedAt: new Date(), customer: { id: 'c', nameEn: 'Name', phone: '+962790000000', dataSource: 'MANUAL' }, vehicle: null, incidentAt: null, statusHistory: [], portalData: { fields: [{ key: 'custom_visit', labelEn: 'Visit', labelAr: 'الزيارة', enabled: true }, { key: 'customerPhone', labelEn: 'Phone', labelAr: 'الهاتف', enabled: true }], values: { custom_visit: 'evening', customerPhone: '+962790000000' }, originalValues: { custom_visit: 'morning', customerPhone: '+962799999999' } } };
  const detail = detailItem(source as never);
  assert.deepEqual(detail.portalAnswers, [{ key: 'custom_visit', labelEn: 'Visit', labelAr: 'الزيارة', value: 'evening' }]);
  assert.doesNotMatch(JSON.stringify(detail.portalAnswers), /morning|96279/);
  assert.deepEqual(detailItem(source as never, true).portalAnswers, []);
});
test('public intake discards internal vehicle identity', () => {
  const input = parsePortalComplaintBody({ customerName: 'Maya', customerPhone: '+962790000000', description: 'Noise', incidentAt: '2026-11-11', vehicleBrand: 'Nissan', vehicleModel: 'Patrol', vehicleId: 'unrelated-private-vehicle' });
  assert.equal(input.vehicleId, null);
});
test('public creation preserves submitted identity without mutating shared vehicles or customers', async () => {
  let created: any;
  const client = {
    customer: { upsert: async (query: any) => { assert.deepEqual(query.update, {}); return { id: 'existing-customer' }; } },
    vehicle: { upsert: async () => { throw new Error('Public intake must not mutate shared vehicle'); } },
    complaint: { create: async (query: any) => { created = query.data; return { id: 'complaint' }; } },
  };
  await new ComplaintsRepository(client as never).create({ publicIntake: true, customerName: 'Submitted name', customerPhone: '+962790000000', vehicleVin: 'JN1TEST12345678901', vehicleBrand: 'Nissan', vehicleModel: 'Patrol' } as never, client as never);
  assert.equal(created.vehicleId, null);
  assert.equal(created.vehicleVinSnapshot, 'JN1TEST12345678901');
  assert.equal(created.customerNameSnapshot, 'Submitted name');
});
