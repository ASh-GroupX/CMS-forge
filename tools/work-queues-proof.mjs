import assert from 'node:assert/strict';
import { getStaffQueueResult } from '../apps/web/src/lib/staff-queue-api.ts';

const calls = [];
const fetchImpl = async (input, init) => {
  calls.push({ input, init });
  return json({
    items: [{
      id: 'cmp_filter_1',
      referenceNumber: 'CMP-FILTER-001',
      status: 'IN_PROGRESS',
      severity: 'HIGH',
      subject: 'Filtered queue complaint',
      branchId: 'branch_main',
      branchName: 'Main Branch',
      ownerId: null,
      ownerName: null,
      createdAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-06-20T10:00:00.000Z',
    }],
    limit: 10,
    offset: 10,
  });
};

const query = {
  branchId: 'branch_main',
  page: 2,
  search: 'CMP-FILTER',
  severity: 'HIGH',
  status: 'IN_PROGRESS',
};

const result = await getStaffQueueResult({
  cookieHeader: 'cms_staff_session=raw-session',
  fetchImpl,
  query,
});

assert.equal(result?.page, 2);
assert.equal(result?.rows[0]?.referenceNumber, 'CMP-FILTER-001');
assert.equal(String(calls[0]?.input), 'http://localhost:3000/complaints/search?limit=10&offset=10&branchId=branch_main&status=IN_PROGRESS&severity=HIGH&referenceNumber=CMP-FILTER');
assert.deepEqual(calls[0]?.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
assert.doesNotMatch(String(calls[0]?.input), /role|actor|workflow|owner/i);
console.log('work queues proof passed');

function json(payload) {
  return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } });
}
