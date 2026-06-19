import assert from 'node:assert/strict';
import test from 'node:test';
import { getStaffComplaint, listStaffComplaints } from '../../src/lib/staff-complaints-api';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, status });
}

test('listStaffComplaints maps successful queue responses and uses cookie credentials', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ items: [{ id: 'c1', referenceNumber: 'CMP-1', status: 'SUBMITTED' }] });
  };

  const result = await listStaffComplaints(fetchImpl);

  assert.equal(result.ok, true);
  assert.deepEqual(result.ok ? result.data.items[0] : null, {
    id: 'c1',
    referenceNumber: 'CMP-1',
    status: 'SUBMITTED',
  });
  assert.equal(calls[0]?.input, '/complaints');
  assert.equal(calls[0]?.init?.method, 'GET');
  assert.equal(calls[0]?.init?.credentials, 'include');
  assert.deepEqual(calls[0]?.init?.headers, { Accept: 'application/json' });
});

test('getStaffComplaint encodes path ids without branch or role query spoofing', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({
      complaint: {
        id: 'c/1',
        referenceNumber: 'CMP-1',
        status: 'SUBMITTED',
        severity: 'HIGH',
        subject: 'Noise',
        branchId: 'server-branch',
        ownerId: null,
        createdAt: '2026-06-19T00:00:00.000Z',
        updatedAt: '2026-06-19T00:00:00.000Z',
        description: 'Complaint detail',
        incidentAt: null,
        statusHistory: [],
      },
    });
  };

  const result = await getStaffComplaint('c/1', fetchImpl);

  assert.equal(result.ok, true);
  assert.equal(calls[0]?.input, '/complaints/c%2F1');
  assert.doesNotMatch(String(calls[0]?.input), /branchId|role|actor|workflow/i);
});

test('staff complaint client maps API error envelopes with correlation ids', async () => {
  const fetchImpl: typeof fetch = async () =>
    jsonResponse(
      { error: { code: 'BRANCH_SCOPE_FORBIDDEN', message: 'Role or branch scope denied', correlationId: 'corr-1' } },
      403,
    );

  const result = await listStaffComplaints(fetchImpl);

  assert.equal(result.ok, false);
  assert.deepEqual(result.ok ? null : result.error, {
    kind: 'api',
    code: 'BRANCH_SCOPE_FORBIDDEN',
    message: 'Role or branch scope denied',
    correlationId: 'corr-1',
    status: 403,
  });
});

test('staff complaint client maps network failures safely', async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new Error('socket leaked detail');
  };

  const result = await getStaffComplaint('c1', fetchImpl);

  assert.equal(result.ok, false);
  assert.deepEqual(result.ok ? null : result.error, {
    kind: 'network',
    code: 'NETWORK_ERROR',
    message: 'Unable to reach server. Try again.',
    correlationId: null,
  });
});
