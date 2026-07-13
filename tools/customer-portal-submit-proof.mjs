import assert from 'node:assert/strict';
import { POST } from '../apps/web/src/app/api/portal/[...path]/route.ts';
import { submitPortalComplaint } from '../apps/web/src/lib/portal-submission-api.ts';

const priorFetch = globalThis.fetch;
const priorApiUrl = process.env.API_URL;
const calls = [];

globalThis.fetch = async (input, init) => {
  calls.push({ input, init });
  assert.equal(String(input), 'http://api.test/portal/complaints');
  assert.deepEqual(Object.fromEntries(new Headers(init?.headers).entries()), {
    accept: 'application/json',
    'content-type': 'application/json',
  });
  assert.deepEqual(JSON.parse(String(init?.body)), validComplaint());
  return json({ complaint: { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: 'SUBMITTED' } }, 201);
};
process.env.API_URL = 'http://api.test';

try {
  const clientResult = await submitPortalComplaint(validComplaint(), async (input, init) => {
    assert.equal(input, '/api/portal/complaints');
    assert.equal(init?.credentials, 'omit');
    return json({ complaint: { id: 'cmp_portal', referenceNumber: 'CMS-2026-MAIN-000010', status: 'SUBMITTED' } }, 201);
  });
  assert.equal(clientResult.ok, true);
  assert.equal(clientResult.data.complaint.referenceNumber, 'CMS-2026-MAIN-000010');

  const response = await POST(new Request('http://web.test/api/portal/complaints', {
    body: JSON.stringify(validComplaint()),
    headers: {
      'content-type': 'application/json',
      cookie: 'cms_staff_session=raw-session',
      'x-csrf-token': 'csrf_123',
      'x-portal-session': 'portal_token',
    },
    method: 'POST',
  }), { params: Promise.resolve({ path: ['complaints'] }) });

  assert.equal(response.status, 201);
  assert.equal((await response.json()).complaint.referenceNumber, 'CMS-2026-MAIN-000010');
  assert.equal(calls.length, 1);
  console.log('customer portal submit proof passed');
} finally {
  globalThis.fetch = priorFetch;
  if (priorApiUrl === undefined) delete process.env.API_URL;
  else process.env.API_URL = priorApiUrl;
}

function validComplaint() {
  return {
    customerName: 'Faisal Al-Otaibi',
    customerPhone: '+966500000001',
    categoryId: 'cat_parent',
    subcategoryId: 'cat_engine',
    description: 'Engine makes a knocking noise.',
    incidentAt: '2026-06-19T00:00:00.000Z',
    branchId: 'branch_main',
    subject: 'Engine noise',
    severity: 'HIGH',
    vehicleRelated: true,
    vehicleVin: 'SEEDDEMO00001',
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, status });
}
