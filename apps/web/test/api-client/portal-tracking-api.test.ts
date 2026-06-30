import assert from 'node:assert/strict';
import test from 'node:test';
import { GET, POST } from '../../src/app/api/portal/[...path]/route';
import { getPortalTracking, requestPortalOtp, submitPortalFollowUp, uploadPortalAttachment, verifyPortalOtp } from '../../src/lib/portal-tracking-api';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, status });
}

test('portal tracking client runs OTP session tracking follow-up and attachment upload without browser persistence', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/otp')) return jsonResponse({ ok: true, verificationId: 'ver_1', expiresAt: '2026-06-29T08:05:00.000Z' }, 201);
    if (String(input).endsWith('/verify')) return jsonResponse({ session: { sessionToken: 'portal_token', expiresAt: '2026-06-29T08:30:00.000Z' } }, 201);
    if (String(input).endsWith('/follow-ups')) return jsonResponse({ ok: true }, 201);
    if (String(input).endsWith('/attachments')) return jsonResponse({ attachment: { id: 'att_1', complaintId: 'cmp_1', fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 7, scanStatus: 'PENDING', customerVisible: true } }, 201);
    return jsonResponse({ complaint: { referenceNumber: 'CMP-1', status: 'IN_PROGRESS', createdAt: '2026-06-29T08:00:00.000Z', updatedAt: '2026-06-29T08:10:00.000Z', timeline: [] } });
  };

  assert.equal((await requestPortalOtp({ referenceNumber: 'CMP-1', customerPhone: '+966500000001' }, fetchImpl)).ok, true);
  assert.equal((await verifyPortalOtp({ verificationId: 'ver_1', otp: '123456' }, fetchImpl)).ok, true);
  assert.equal((await getPortalTracking('portal_token', fetchImpl)).ok, true);
  assert.equal((await submitPortalFollowUp('portal_token', 'Customer update', fetchImpl)).ok, true);
  assert.equal((await uploadPortalAttachment('portal_token', new File(['invoice'], 'invoice.pdf', { type: 'application/pdf' }), fetchImpl)).ok, true);

  assert.deepEqual(calls.map((call) => [call.init?.method, call.input]), [
    ['POST', '/api/portal/tracking/otp'],
    ['POST', '/api/portal/tracking/otp/verify'],
    ['GET', '/api/portal/tracking'],
    ['POST', '/api/portal/tracking/follow-ups'],
    ['POST', '/api/portal/attachments'],
  ]);
  assert.equal(calls.every((call) => call.init?.credentials === 'omit'), true);
  assert.deepEqual(calls[2]?.init?.headers, { Accept: 'application/json', 'x-portal-session': 'portal_token' });
  assert.deepEqual(JSON.parse(String(calls[3]?.init?.body)), { body: 'Customer update' });
  assert.deepEqual(JSON.parse(String(calls[4]?.init?.body)), {
    fileName: 'invoice.pdf',
    contentType: 'application/pdf',
    sizeBytes: 7,
    contentBase64: 'aW52b2ljZQ==',
  });
});

test('portal proxy allowlists public tracking paths and never forwards staff authority', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ ok: true, verificationId: 'ver_1', expiresAt: '2026-06-29T08:05:00.000Z' }, 201);
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const response = await POST(new Request('http://web.test/api/portal/tracking/otp', {
      body: JSON.stringify({ referenceNumber: 'CMP-1', customerPhone: '+966500000001', actorId: 'usr_staff' }),
      headers: {
        'content-type': 'application/json',
        cookie: 'cms_staff_session=raw-session',
        'x-csrf-token': 'csrf_123',
        'x-portal-session': 'portal_token',
      },
      method: 'POST',
    }), { params: Promise.resolve({ path: ['tracking', 'otp'] }) });

    assert.equal(response.status, 201);
    assert.equal(String(calls[0]?.input), 'http://api.test/portal/tracking/otp');
    assert.deepEqual(Object.fromEntries(new Headers(calls[0]?.init?.headers).entries()), {
      accept: 'application/json',
      'content-type': 'application/json',
    });
  } finally {
    globalThis.fetch = priorFetch;
    if (priorApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = priorApiUrl;
  }
});

test('portal proxy allowlists verified attachment upload and drops staff headers', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ attachment: { id: 'att_1', complaintId: 'cmp_1', fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 7, scanStatus: 'PENDING', customerVisible: true } }, 201);
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const payload = { fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 7, contentBase64: 'aW52b2ljZQ==' };
    const response = await POST(new Request('http://web.test/api/portal/attachments', {
      body: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json',
        cookie: 'cms_staff_session=raw-session',
        'x-csrf-token': 'csrf_123',
        'x-portal-session': 'portal_token',
      },
      method: 'POST',
    }), { params: Promise.resolve({ path: ['attachments'] }) });

    assert.equal(response.status, 201);
    assert.equal(String(calls[0]?.input), 'http://api.test/portal/attachments');
    assert.deepEqual(Object.fromEntries(new Headers(calls[0]?.init?.headers).entries()), {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-portal-session': 'portal_token',
    });
    assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), payload);
  } finally {
    globalThis.fetch = priorFetch;
    if (priorApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = priorApiUrl;
  }
});

test('portal proxy rejects non-portal paths before forwarding', async () => {
  let called = false;
  const priorFetch = globalThis.fetch;
  globalThis.fetch = (async () => { called = true; return jsonResponse({}); }) as typeof fetch;
  try {
    const response = await GET(new Request('http://web.test/api/portal/admin/users'), {
      params: Promise.resolve({ path: ['admin', 'users'] }),
    });
    const attachmentDownload = await GET(new Request('http://web.test/api/portal/attachments/att_1/download'), {
      params: Promise.resolve({ path: ['attachments', 'att_1', 'download'] }),
    });
    assert.equal(response.status, 404);
    assert.equal(attachmentDownload.status, 404);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = priorFetch;
  }
});
