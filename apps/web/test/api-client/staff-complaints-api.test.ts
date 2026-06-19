import assert from 'node:assert/strict';
import test from 'node:test';
import { createStaffComplaint, getStaffComplaint, listStaffComplaints } from '../../src/lib/staff-complaints-api';

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

test('createStaffComplaint posts the documented body with cookies and CSRF token', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ complaint: { id: 'cmp_1', referenceNumber: 'CMP-000001', status: 'SUBMITTED' } }, 201);
  };

  await withDocumentCookie('cms_csrf_token=csrf_123; other=value', async () => {
    const result = await createStaffComplaint('branch main', validCreateBody(), fetchImpl);

    assert.equal(result.ok, true);
    assert.deepEqual(result.ok ? result.data : null, {
      complaint: { id: 'cmp_1', referenceNumber: 'CMP-000001', status: 'SUBMITTED' },
    });
  });

  assert.equal(calls[0]?.input, '/complaints?branchId=branch%20main');
  assert.equal(calls[0]?.init?.method, 'POST');
  assert.equal(calls[0]?.init?.credentials, 'include');
  assert.deepEqual(calls[0]?.init?.headers, {
    Accept: 'application/json',
    'content-type': 'application/json',
    'x-csrf-token': 'csrf_123',
  });
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), validCreateBody());
});

test('createStaffComplaint omits CSRF header when the readable cookie is missing', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ complaint: { id: 'cmp_1', referenceNumber: 'CMP-000001', status: 'SUBMITTED' } }, 201);
  };

  await withDocumentCookie('other=value', async () => {
    await createStaffComplaint('branch_main', validCreateBody(), fetchImpl);
  });

  assert.equal(calls[0]?.input, '/complaints?branchId=branch_main');
  assert.deepEqual(calls[0]?.init?.headers, {
    Accept: 'application/json',
    'content-type': 'application/json',
  });
});

test('createStaffComplaint preserves validation field errors from the API envelope', async () => {
  const fetchImpl: typeof fetch = async () =>
    jsonResponse(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid complaint request',
          correlationId: 'corr-2',
          fieldErrors: [{ field: 'customerPhone', code: 'REQUIRED', message: 'customerPhone or customerNumber is required.' }],
        },
      },
      400,
    );

  const result = await createStaffComplaint('branch_main', validCreateBody(), fetchImpl);

  assert.equal(result.ok, false);
  assert.deepEqual(result.ok ? null : result.error, {
    kind: 'api',
    code: 'VALIDATION_FAILED',
    message: 'Invalid complaint request',
    correlationId: 'corr-2',
    fieldErrors: [{ field: 'customerPhone', code: 'REQUIRED', message: 'customerPhone or customerNumber is required.' }],
    status: 400,
  });
});

test('createStaffComplaint maps network failures safely', async () => {
  const fetchImpl: typeof fetch = async () => {
    throw new Error('session cookie leaked detail');
  };

  const result = await createStaffComplaint('branch_main', validCreateBody(), fetchImpl);

  assert.equal(result.ok, false);
  assert.deepEqual(result.ok ? null : result.error, {
    kind: 'network',
    code: 'NETWORK_ERROR',
    message: 'Unable to reach server. Try again.',
    correlationId: null,
  });
});

test('createStaffComplaint accepts no client role actor workflow or credential authority', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ complaint: { id: 'cmp_1', referenceNumber: 'CMP-000001', status: 'SUBMITTED' } }, 201);
  };

  await createStaffComplaint('branch_main', validCreateBody(), fetchImpl);

  const body = JSON.parse(String(calls[0]?.init?.body)) as Record<string, unknown>;
  assert.equal('role' in body, false);
  assert.equal('actorId' in body, false);
  assert.equal('workflow' in body, false);
  assert.equal('status' in body, false);
  assert.equal('branchId' in body, false);
  assert.equal('token' in body, false);
  assert.equal('credentials' in body, false);
  assert.doesNotMatch(String(calls[0]?.input), /role|actor|workflow|token|credentials/i);
});

function validCreateBody() {
  return {
    customerName: 'Faisal Al-Otaibi',
    customerPhone: '+966500000001',
    customerNumber: null,
    categoryId: 'cat_parent',
    subcategoryId: 'cat_engine',
    description: 'Engine makes a knocking noise.',
    incidentAt: '2026-06-18T09:00:00.000Z',
    subject: 'Engine noise',
    severity: 'HIGH',
    vehicleRelated: true,
    vehicleVin: 'SEEDDEMO00001',
    vehicleId: null,
  };
}

async function withDocumentCookie(cookie: string, run: () => Promise<void>) {
  const priorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { cookie } });
  try {
    await run();
  } finally {
    if (priorDescriptor) {
      Object.defineProperty(globalThis, 'document', priorDescriptor);
    } else {
      delete (globalThis as { document?: unknown }).document;
    }
  }
}
