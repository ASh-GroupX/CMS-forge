import assert from 'node:assert/strict';
import test from 'node:test';
import { getStaffComplaintDetailLoadResult } from '../../src/lib/staff-detail-api';

const body = { complaint: {
  id: 'cmp_portal', referenceNumber: 'CMS-2026-KHALDA-000004', status: 'IN_PROGRESS', severity: 'MEDIUM',
  subject: 'Customer Name', branchId: 'branch_khalda', customer: { id: 'customer', name: 'Customer Name', phone: null, identifier: null, source: 'MANUAL' },
  vehicle: null, submittedVehicle: { make: 'BYD', model: 'BYD Yuan Plus EV CCC', vin: 'LGX00000000000001' },
  portalAnswers: [{ key: 'preferredTime', labelEn: 'Preferred time', labelAr: 'الوقت المفضل', value: 'Evening' }],
  statusHistory: [], allowedActions: [], caseSummary: null,
} };
const response = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });

test('staff detail loader preserves submitted vehicle and added answers for the receiving page', async () => {
  const fetchImpl: typeof fetch = async (input) => response(String(input).endsWith('/complaints/cmp_portal') ? body : { items: [] });
  const result = await getStaffComplaintDetailLoadResult({ apiUrl: 'http://api.test', complaintId: 'cmp_portal', cookieHeader: 'cms_staff_session=proof', fetchImpl });
  assert.equal(result.status, 'ready');
  if (result.status !== 'ready') return;
  assert.equal(result.data.subject, 'Customer Name');
  assert.deepEqual(result.data.submittedVehicle, body.complaint.submittedVehicle);
  assert.deepEqual(result.data.portalAnswers, body.complaint.portalAnswers);
});

test('staff detail loader rejects unauthenticated access and malformed submitted fields', async () => {
  let called = false;
  const fetchImpl: typeof fetch = async (input) => { called = true; return response(String(input).endsWith('/complaints/cmp_portal') ? { complaint: { ...body.complaint, submittedVehicle: { make: 1 }, portalAnswers: [{ key: 'x', value: 'Hidden' }] } } : { items: [] }); };
  assert.equal((await getStaffComplaintDetailLoadResult({ apiUrl: 'http://api.test', complaintId: 'cmp_portal', cookieHeader: '', fetchImpl })).status, 'denied');
  assert.equal(called, false);
  const result = await getStaffComplaintDetailLoadResult({ apiUrl: 'http://api.test', complaintId: 'cmp_portal', cookieHeader: 'cms_staff_session=proof', fetchImpl });
  assert.equal(result.status, 'ready');
  if (result.status !== 'ready') return;
  assert.equal(result.data.submittedVehicle, null);
  assert.deepEqual(result.data.portalAnswers, []);
});
