import assert from 'node:assert/strict';
import { POST } from '../apps/web/src/app/api/complaints/[id]/transitions/route.ts';
import { submitStaffComplaintWorkflowAction } from '../apps/web/src/lib/staff-complaints-api.ts';

const priorFetch = globalThis.fetch;
const priorApiUrl = process.env.API_URL;
const calls = [];
const body = { fromStatus: 'SUBMITTED', action: 'ACCEPT_INTAKE', reason: 'Manager accepted intake.' };

globalThis.fetch = async (input, init) => {
  calls.push({ input, init });
  assert.equal(String(input), 'http://api.test/complaints/cmp_1/transitions');
  assert.deepEqual(Object.fromEntries(new Headers(init?.headers).entries()), {
    accept: 'application/json',
    'content-type': 'application/json',
    cookie: 'cms_staff_session=raw-session',
    'x-csrf-token': 'csrf_123',
  });
  assert.deepEqual(JSON.parse(String(init?.body)), body);
  return json({ transition: { complaintId: 'cmp_1', fromStatus: 'SUBMITTED', action: 'ACCEPT_INTAKE', actorRole: 'CR_MANAGER', toStatus: 'MANAGER_REVIEW' } });
};
process.env.API_URL = 'http://api.test';

try {
  await withDocumentCookie('cms_csrf_token=csrf_123', async () => {
    const result = await submitStaffComplaintWorkflowAction('cmp_1', { status: 'SUBMITTED', action: 'ACCEPT_INTAKE', reason: 'Manager accepted intake.' }, async (input, init) => {
      assert.equal(input, '/api/complaints/cmp_1/transitions');
      assert.equal(init?.credentials, 'include');
      assert.deepEqual(JSON.parse(String(init?.body)), body);
      return json({ transition: { complaintId: 'cmp_1', fromStatus: 'SUBMITTED', action: 'ACCEPT_INTAKE', actorRole: 'CR_MANAGER', toStatus: 'MANAGER_REVIEW' } });
    });
    assert.equal(result.ok, true);
  });

  const response = await POST(new Request('http://web.test/api/complaints/cmp_1/transitions', {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      cookie: 'cms_staff_session=raw-session',
      'x-csrf-token': 'csrf_123',
    },
    method: 'POST',
  }), { params: Promise.resolve({ id: 'cmp_1' }) });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).transition.toStatus, 'MANAGER_REVIEW');
  assert.equal(calls.length, 1);
  console.log('complaint workflow proof passed');
} finally {
  globalThis.fetch = priorFetch;
  if (priorApiUrl === undefined) delete process.env.API_URL;
  else process.env.API_URL = priorApiUrl;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' }, status });
}

async function withDocumentCookie(cookie, callback) {
  const priorDocument = globalThis.document;
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { cookie } });
  try {
    return await callback();
  } finally {
    if (priorDocument === undefined) delete globalThis.document;
    else Object.defineProperty(globalThis, 'document', { configurable: true, value: priorDocument });
  }
}
