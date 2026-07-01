import assert from 'node:assert/strict';
import test from 'node:test';
import { GET, POST } from '../../src/app/api/portal/[...path]/route';
import { portalSubmissionAttachments, submitPortalComplaint } from '../../src/lib/portal-submission-api';
import { getPortalTracking, requestPortalOtp, submitPortalFollowUp, uploadPortalAttachment, verifyPortalOtp } from '../../src/lib/portal-tracking-api';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, status });
}

test('portal client runs submission OTP session tracking follow-up and attachment upload without browser persistence', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/complaints')) return jsonResponse({ complaint: { id: 'cmp_1', referenceNumber: 'CMS-2026-MAIN-000010', status: 'SUBMITTED' } }, 201);
    if (String(input).endsWith('/otp')) return jsonResponse({ ok: true, verificationId: 'ver_1', expiresAt: '2026-06-29T08:05:00.000Z' }, 201);
    if (String(input).endsWith('/verify')) return jsonResponse({ session: { sessionToken: 'portal_token', expiresAt: '2026-06-29T08:30:00.000Z' } }, 201);
    if (String(input).endsWith('/follow-ups')) return jsonResponse({ ok: true }, 201);
    if (String(input).endsWith('/attachments')) return jsonResponse({ attachment: { id: 'att_1', complaintId: 'cmp_1', fileName: 'invoice.pdf', contentType: 'application/pdf', sizeBytes: 7, scanStatus: 'PENDING', customerVisible: true } }, 201);
    return jsonResponse({ complaint: { referenceNumber: 'CMP-1', status: 'IN_PROGRESS', createdAt: '2026-06-29T08:00:00.000Z', updatedAt: '2026-06-29T08:10:00.000Z', timeline: [] } });
  };

  assert.equal((await submitPortalComplaint(validPortalComplaint(), fetchImpl)).ok, true);
  assert.equal((await requestPortalOtp({ referenceNumber: 'CMP-1', customerPhone: '+966500000001' }, fetchImpl)).ok, true);
  assert.equal((await verifyPortalOtp({ verificationId: 'ver_1', otp: '123456' }, fetchImpl)).ok, true);
  assert.equal((await getPortalTracking('portal_token', fetchImpl)).ok, true);
  assert.equal((await submitPortalFollowUp('portal_token', 'Customer update', fetchImpl)).ok, true);
  assert.equal((await uploadPortalAttachment('portal_token', new File(['invoice'], 'invoice.pdf', { type: 'application/pdf' }), fetchImpl)).ok, true);

  assert.deepEqual(calls.map((call) => [call.init?.method, call.input]), [
    ['POST', '/api/portal/complaints'],
    ['POST', '/api/portal/tracking/otp'],
    ['POST', '/api/portal/tracking/otp/verify'],
    ['GET', '/api/portal/tracking'],
    ['POST', '/api/portal/tracking/follow-ups'],
    ['POST', '/api/portal/attachments'],
  ]);
  assert.equal(calls.every((call) => call.init?.credentials === 'omit'), true);
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), validPortalComplaint());
  assert.deepEqual(calls[3]?.init?.headers, { Accept: 'application/json', 'x-portal-session': 'portal_token' });
  assert.deepEqual(JSON.parse(String(calls[4]?.init?.body)), { body: 'Customer update' });
  assert.deepEqual(JSON.parse(String(calls[5]?.init?.body)), {
    fileName: 'invoice.pdf',
    contentType: 'application/pdf',
    sizeBytes: 7,
    contentBase64: 'aW52b2ljZQ==',
  });
});

test('portal submission client posts initial attachments with the complaint only', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({
      complaint: {
        id: 'cmp_1',
        referenceNumber: 'CMS-2026-MAIN-000010',
        status: 'SUBMITTED',
        attachments: [{ id: 'att_1', fileName: 'invoice.pdf', scanStatus: 'PENDING' }],
      },
    }, 201);
  };
  const attachmentResult = await portalSubmissionAttachments([new File(['invoice'], 'invoice.pdf', { type: 'application/pdf' })]);
  assert.equal(attachmentResult.ok, true);

  const result = await submitPortalComplaint({
    ...validPortalComplaint(),
    attachments: attachmentResult.ok ? attachmentResult.attachments : [],
  }, fetchImpl);

  assert.equal(result.ok, true);
  assert.equal(calls[0]?.input, '/api/portal/complaints');
  assert.equal(calls[0]?.init?.credentials, 'omit');
  assert.deepEqual(Object.fromEntries(new Headers(calls[0]?.init?.headers).entries()), {
    accept: 'application/json',
    'content-type': 'application/json',
  });
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    ...validPortalComplaint(),
    attachments: [{
      fileName: 'invoice.pdf',
      contentType: 'application/pdf',
      sizeBytes: 7,
      contentBase64: 'aW52b2ljZQ==',
    }],
  });
  assert.doesNotMatch(String(calls[0]?.init?.body), /x-portal-session|staff|actorId|storageKey|credential|DMS/i);
});

test('portal submission attachment builder blocks invalid files before submit', async () => {
  const result = await portalSubmissionAttachments([new File(['bad'], 'malware.exe', { type: 'application/x-msdownload' })]);

  assert.equal(result.ok, false);
  assert.equal(result.ok ? null : result.error.field, 'attachments');
  assert.equal(result.ok ? null : result.error.code, 'ATTACHMENT_TYPE_BLOCKED');
});

test('portal proxy allowlists public submission and never forwards staff authority', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ complaint: { id: 'cmp_1', referenceNumber: 'CMS-2026-MAIN-000010', status: 'SUBMITTED' } }, 201);
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const response = await POST(new Request('http://web.test/api/portal/complaints', {
      body: JSON.stringify({ ...validPortalComplaint(), actorId: 'usr_staff' }),
      headers: {
        'content-type': 'application/json',
        cookie: 'cms_staff_session=raw-session',
        'x-csrf-token': 'csrf_123',
        'x-portal-session': 'portal_token',
      },
      method: 'POST',
    }), { params: Promise.resolve({ path: ['complaints'] }) });

    assert.equal(response.status, 201);
    assert.equal(String(calls[0]?.input), 'http://api.test/portal/complaints');
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

test('portal attachment upload blocks invalid files before forwarding', async () => {
  let called = false;
  const result = await uploadPortalAttachment('portal_token', new File(['bad'], 'malware.exe', { type: 'application/x-msdownload' }), async () => {
    called = true;
    return jsonResponse({});
  });

  assert.equal(result.ok, false);
  assert.equal(result.ok ? null : result.error.code, 'ATTACHMENT_TYPE_BLOCKED');
  assert.equal(called, false);
});

function validPortalComplaint() {
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
