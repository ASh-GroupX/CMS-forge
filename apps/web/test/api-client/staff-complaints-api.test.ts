import assert from 'node:assert/strict';
import test from 'node:test';
import { GET as proxyListAttachments, POST as proxyUploadAttachment } from '../../src/app/api/complaints/[id]/attachments/route';
import { GET as proxyDownloadAttachment } from '../../src/app/api/complaints/[id]/attachments/[attachmentId]/download/route';
import { POST as proxyCorrectComplaint } from '../../src/app/api/complaints/[id]/corrections/route';
import { DELETE as proxyUnlinkRelatedComplaint, POST as proxyLinkRelatedComplaint } from '../../src/app/api/complaints/[id]/related/route';
import { POST as proxyTransitionComplaint } from '../../src/app/api/complaints/[id]/transitions/route';
import { POST as proxyCreateComplaint } from '../../src/app/api/complaints/route';
import { GET as proxyLookupDmsCustomerVehicle } from '../../src/app/api/integrations/dms/customer-vehicle/route';
import { getStaffComplaintDuplicateCandidates, getStaffComplaintRelated, linkStaffComplaintRelation, unlinkStaffComplaintRelation } from '../../src/lib/staff-complaint-relations-api';
import { downloadStaffAttachment, listStaffComplaintAttachments, uploadStaffComplaintAttachment } from '../../src/lib/staff-attachments-api';
import { correctStaffComplaint, createStaffComplaint, getStaffComplaint, listStaffComplaints, lookupStaffDmsCustomerVehicle, submitStaffComplaintWorkflowAction } from '../../src/lib/staff-complaints-api';

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
        allowedActions: ['ACCEPT_INTAKE'],
      },
    });
  };

  const result = await getStaffComplaint('c/1', fetchImpl);

  assert.equal(result.ok, true);
  assert.equal(calls[0]?.input, '/complaints/c%2F1');
  assert.doesNotMatch(String(calls[0]?.input), /branchId|role|actor|workflow/i);
  assert.deepEqual(result.ok ? result.data.complaint.allowedActions : null, ['ACCEPT_INTAKE']);
});

test('staff complaint relation reads use safe fields and server session scope only', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({
      items: [{
        id: 'cmp_related',
        referenceNumber: 'CMP-RELATED-001',
        status: 'SUBMITTED',
        severity: 'HIGH',
        subject: 'Engine noise',
        branchId: 'branch_main',
        branchName: 'Main Branch',
        customerName: 'Faisal Al-Otaibi',
        ownerName: 'Staff Name',
        customerPhone: '+966500000001',
        vehicleVin: 'SEEDDEMO00001',
        createdAt: '2026-06-18T00:00:00.000Z',
        updatedAt: '2026-06-19T00:00:00.000Z',
      }],
      windowDays: 30,
    });
  };

  const candidates = await getStaffComplaintDuplicateCandidates({ apiUrl: 'http://api.test', complaintId: 'cmp/1', cookies: 'cms_staff_session=raw-session', fetchImpl });
  const related = await getStaffComplaintRelated({ apiUrl: 'http://api.test', complaintId: 'cmp/1', cookies: 'cms_staff_session=raw-session', fetchImpl });

  assert.equal(candidates.ok, true);
  assert.equal(related.ok, true);
  assert.deepEqual(candidates.ok ? candidates.data.items[0] : null, {
    id: 'cmp_related',
    referenceNumber: 'CMP-RELATED-001',
    status: 'SUBMITTED',
    severity: 'HIGH',
    subject: 'Engine noise',
    branchId: 'branch_main',
    branchName: 'Main Branch',
    customerName: 'Faisal Al-Otaibi',
    createdAt: '2026-06-18T00:00:00.000Z',
    updatedAt: '2026-06-19T00:00:00.000Z',
  });
  assert.equal(String(calls[0]?.input), 'http://api.test/complaints/cmp%2F1/duplicate-candidates');
  assert.equal(String(calls[1]?.input), 'http://api.test/complaints/cmp%2F1/related');
  assert.ok(calls.every((call) => !/branchId|role|actor|workflow|token|credential/i.test(String(call.input))));
  assert.deepEqual(calls[0]?.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
});

test('linkStaffComplaintRelation posts only target id with CSRF', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ relation: { sourceComplaintId: 'cmp/1', targetComplaintId: 'cmp_2', changed: true } }, 201);
  };

  await withDocumentCookie('cms_csrf_token=csrf_123', async () => {
    const result = await linkStaffComplaintRelation('cmp/1', 'cmp_2', fetchImpl);
    assert.equal(result.ok, true);
  });

  assert.equal(calls[0]?.input, '/api/complaints/cmp%2F1/related');
  assert.equal(calls[0]?.init?.method, 'POST');
  assert.equal(calls[0]?.init?.credentials, 'include');
  assert.deepEqual(calls[0]?.init?.headers, { Accept: 'application/json', 'content-type': 'application/json', 'x-csrf-token': 'csrf_123' });
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), { targetComplaintId: 'cmp_2' });
  assert.doesNotMatch(String(calls[0]?.init?.body), /branch|role|actor|workflow|token|credential/i);
});

test('unlinkStaffComplaintRelation deletes only target id with CSRF', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ relation: { sourceComplaintId: 'cmp/1', targetComplaintId: 'cmp_2', changed: true } });
  };

  await withDocumentCookie('cms_csrf_token=csrf_123', async () => {
    const result = await unlinkStaffComplaintRelation('cmp/1', 'cmp_2', fetchImpl);
    assert.equal(result.ok, true);
  });

  assert.equal(calls[0]?.input, '/api/complaints/cmp%2F1/related');
  assert.equal(calls[0]?.init?.method, 'DELETE');
  assert.equal(calls[0]?.init?.credentials, 'include');
  assert.deepEqual(calls[0]?.init?.headers, { Accept: 'application/json', 'content-type': 'application/json', 'x-csrf-token': 'csrf_123' });
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), { targetComplaintId: 'cmp_2' });
  assert.doesNotMatch(String(calls[0]?.init?.body), /branch|role|actor|workflow|token|credential/i);
});

test('staff attachment client lists uploads and opens prepared signed download targets', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const opened: string[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/download')) {
      return jsonResponse({ download: { attachmentId: 'att_1', token: 'https://storage.test/attachments/att_1?X-Amz-Signature=proof', expiresAt: '2026-06-19T10:05:00.000Z' } });
    }
    if (init?.method === 'POST') {
      return jsonResponse({ attachment: { id: 'att_1', complaintId: 'cmp/1', fileName: 'photo.png', contentType: 'image/png', sizeBytes: 10, scanStatus: 'PENDING', customerVisible: false } }, 201);
    }
    return jsonResponse({ items: [{ id: 'att_1', complaintId: 'cmp/1', fileName: 'photo.png', contentType: 'image/png', sizeBytes: 10, scanStatus: 'CLEAN', customerVisible: false }] });
  };

  await withDocumentCookie('cms_csrf_token=csrf_123', async () => {
    assert.equal((await listStaffComplaintAttachments('cmp/1', fetchImpl)).ok, true);
    assert.equal((await uploadStaffComplaintAttachment('cmp/1', new File(['file-bytes'], 'photo.png', { type: 'image/png' }), fetchImpl)).ok, true);
    assert.equal((await downloadStaffAttachment('cmp/1', 'att_1', (target) => opened.push(target), fetchImpl)).ok, true);
  });

  assert.equal(calls[0]?.input, '/api/complaints/cmp%2F1/attachments');
  assert.deepEqual(calls[0]?.init?.headers, { Accept: 'application/json' });
  assert.equal(calls[1]?.input, '/api/complaints/cmp%2F1/attachments');
  assert.deepEqual(calls[1]?.init?.headers, { Accept: 'application/json', 'content-type': 'application/json', 'x-csrf-token': 'csrf_123' });
  assert.deepEqual(JSON.parse(String(calls[1]?.init?.body)), {
    fileName: 'photo.png',
    contentType: 'image/png',
    sizeBytes: 10,
    contentBase64: 'ZmlsZS1ieXRlcw==',
  });
  assert.equal(calls[2]?.input, '/api/complaints/cmp%2F1/attachments/att_1/download');
  assert.deepEqual(opened, ['https://storage.test/attachments/att_1?X-Amz-Signature=proof']);
  assert.doesNotMatch(String(calls[1]?.init?.body), /branch|role|actor|workflow|storage|token|credential/i);
});

test('staff attachment client rejects opaque download tokens without opening a broken page', async () => {
  const opened: string[] = [];
  const result = await downloadStaffAttachment('cmp/1', 'att/2', (target) => opened.push(target), async (input, init) => {
    assert.equal(input, '/api/complaints/cmp%2F1/attachments/att%2F2/download');
    assert.equal(init?.credentials, 'include');
    return jsonResponse({ download: { attachmentId: 'att/2', token: 'attdl_safe', expiresAt: '2026-06-19T10:05:00.000Z' } });
  });

  assert.equal(result.ok, false);
  assert.equal(result.ok ? null : result.error.code, 'ATTACHMENT_DOWNLOAD_TARGET_UNAVAILABLE');
  assert.equal(result.ok ? null : result.error.message, 'Download target is unavailable in this environment.');
  assert.equal(JSON.stringify(result).includes('attdl_safe'), false);
  assert.deepEqual(opened, []);
});

test('staff attachment client rejects blocked files before posting', async () => {
  let called = false;
  const result = await uploadStaffComplaintAttachment('cmp_1', new File(['bad'], 'malware.exe', { type: 'application/x-msdownload' }), async () => {
    called = true;
    return jsonResponse({});
  });

  assert.equal(result.ok, false);
  assert.equal(result.ok ? null : result.error.code, 'ATTACHMENT_TYPE_BLOCKED');
  assert.equal(called, false);
});

test('lookupStaffDmsCustomerVehicle reads through the same-origin proxy without client authority', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({
      lookup: {
        action: 'customerVehicleLookup',
        result: 'MATCH',
        latencyMs: 4,
        correlationId: 'corr_lookup',
        manualFallbackAllowed: false,
        matches: [{ customerCode: 'DMS-100', customerName: 'Nadia Saleh', primaryPhone: '+201001112222', vin: 'WBA12345678900001', source: 'DMS' }],
      },
    });
  };

  const result = await lookupStaffDmsCustomerVehicle({ phone: ' +201001112222 ', customerNumber: 'DMS-100', vin: 'wba123', name: 'Nadia' }, fetchImpl);

  assert.equal(result.ok, true);
  assert.equal(calls[0]?.init?.method, 'GET');
  assert.equal(calls[0]?.init?.credentials, 'include');
  assert.deepEqual(calls[0]?.init?.headers, { Accept: 'application/json' });
  assert.match(String(calls[0]?.input), /^\/api\/integrations\/dms\/customer-vehicle\?/);
  assert.match(String(calls[0]?.input), /phone=%2B201001112222/);
  assert.match(String(calls[0]?.input), /customerNumber=DMS-100/);
  assert.match(String(calls[0]?.input), /vin=wba123/);
  assert.match(String(calls[0]?.input), /name=Nadia/);
  assert.doesNotMatch(String(calls[0]?.input), /branch|role|actor|workflow|token|credential|password/i);
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

  assert.equal(calls[0]?.input, '/api/complaints?branchId=branch%20main');
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

  assert.equal(calls[0]?.input, '/api/complaints?branchId=branch_main');
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

test('correctStaffComplaint posts changed fields with version and no client authority', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ correction: { complaintId: 'cmp/1', changedFields: ['vehicleRelated'] } });
  };

  await withDocumentCookie('cms_csrf_token=csrf_123', async () => {
    const result = await correctStaffComplaint('cmp/1', {
      expectedUpdatedAt: '2026-06-19T09:30:00.000Z',
      reason: 'Correct vehicle flag after review.',
      vehicleRelated: true,
    }, fetchImpl);
    assert.equal(result.ok, true);
  });

  assert.equal(calls[0]?.input, '/api/complaints/cmp%2F1/corrections');
  assert.equal(calls[0]?.init?.method, 'POST');
  assert.deepEqual(calls[0]?.init?.headers, { Accept: 'application/json', 'content-type': 'application/json', 'x-csrf-token': 'csrf_123' });
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    expectedUpdatedAt: '2026-06-19T09:30:00.000Z',
    reason: 'Correct vehicle flag after review.',
    vehicleRelated: true,
  });
  assert.doesNotMatch(String(calls[0]?.init?.body), /branch|role|actor|workflow|token|credential/i);
});

test('correctStaffComplaint preserves conflict envelopes distinctly', async () => {
  const result = await correctStaffComplaint('cmp_1', { expectedUpdatedAt: '2026-06-19T09:30:00.000Z', reason: 'retry', manualVehicle: true }, async () =>
    jsonResponse({ error: { code: 'COMPLAINT_INVALID_TRANSITION', message: 'Complaint correction could not be applied.', correlationId: 'corr-conflict' } }, 409),
  );

  assert.equal(result.ok, false);
  assert.deepEqual(result.ok ? null : result.error, {
    kind: 'api',
    code: 'COMPLAINT_INVALID_TRANSITION',
    message: 'Complaint correction could not be applied.',
    correlationId: 'corr-conflict',
    status: 409,
  });
});

test('submitStaffComplaintWorkflowAction posts required action fields without client authority', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    const body = JSON.parse(String(init?.body)) as { action: string; fromStatus: string };
    return jsonResponse({ transition: { complaintId: 'cmp/1', fromStatus: body.fromStatus, action: body.action, actorRole: 'CR_MANAGER', toStatus: 'MANAGER_REVIEW' } });
  };

  await withDocumentCookie('cms_csrf_token=csrf_123', async () => {
    for (const request of [
      { status: 'SUBMITTED', action: 'ACCEPT_INTAKE' },
      { status: 'MANAGER_REVIEW', action: 'APPROVE_AND_ROUTE', reason: 'Route to branch.', targetBranchId: 'branch_service', targetDepartmentId: 'dept_service', ownerId: 'usr_owner' },
      { status: 'BRANCH_REVIEW', action: 'ASSIGN_INVESTIGATION', reason: 'Assign investigator.', ownerId: 'usr_investigator' },
      { status: 'IN_PROGRESS', action: 'RESOLVE', resolutionType: 'repair', resolutionSummary: 'Fixed the issue.' },
      { status: 'RESOLVED', action: 'CLOSE', reason: 'Customer confirmed.', customerCommunicationStatus: 'called' },
    ] as const) {
      assert.equal((await submitStaffComplaintWorkflowAction('cmp/1', request, fetchImpl)).ok, true);
    }
  });

  assert.ok(calls.every((call) => call.input === '/api/complaints/cmp%2F1/transitions' && call.init?.method === 'POST' && call.init.credentials === 'include'));
  assert.deepEqual(calls.map((call) => JSON.parse(String(call.init?.body))), [
    { fromStatus: 'SUBMITTED', action: 'ACCEPT_INTAKE' },
    { fromStatus: 'MANAGER_REVIEW', action: 'APPROVE_AND_ROUTE', reason: 'Route to branch.', targetBranchId: 'branch_service', targetDepartmentId: 'dept_service', ownerId: 'usr_owner' },
    { fromStatus: 'BRANCH_REVIEW', action: 'ASSIGN_INVESTIGATION', reason: 'Assign investigator.', ownerId: 'usr_investigator' },
    { fromStatus: 'IN_PROGRESS', action: 'RESOLVE', resolutionType: 'repair', resolutionSummary: 'Fixed the issue.' },
    { fromStatus: 'RESOLVED', action: 'CLOSE', reason: 'Customer confirmed.', customerCommunicationStatus: 'called' },
  ]);
  assert.ok(calls.every((call) => !/role|actor|branchScope|token|credential/i.test(String(call.init?.body))));
});

test('complaint create proxy forwards body, session cookie, and CSRF to the API', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ complaint: { id: 'cmp_1', referenceNumber: 'CMP-000001', status: 'SUBMITTED' } }, 201);
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const response = await proxyCreateComplaint(new Request('http://web.test/api/complaints?branchId=branch_main', {
      body: JSON.stringify(validCreateBody()),
      headers: {
        'content-type': 'application/json',
        cookie: 'cms_staff_session=raw-session',
        'x-csrf-token': 'csrf_123',
      },
      method: 'POST',
    }));

    assert.equal(response.status, 201);
    assert.equal(String(calls[0]?.input), 'http://api.test/complaints?branchId=branch_main');
    assert.equal(calls[0]?.init?.method, 'POST');
    assert.equal(calls[0]?.init?.body, JSON.stringify(validCreateBody()));
    assert.deepEqual(Object.fromEntries(new Headers(calls[0]?.init?.headers).entries()), {
      accept: 'application/json',
      'content-type': 'application/json',
      cookie: 'cms_staff_session=raw-session',
      'x-csrf-token': 'csrf_123',
    });
  } finally {
    globalThis.fetch = priorFetch;
    if (priorApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = priorApiUrl;
  }
});

test('staff DMS lookup proxy forwards only safe query fields and the session cookie', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({
      lookup: {
        action: 'customerVehicleLookup',
        result: 'NOT_FOUND',
        latencyMs: 3,
        correlationId: 'corr_lookup',
        manualFallbackAllowed: true,
        matches: [],
      },
    });
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const response = await proxyLookupDmsCustomerVehicle(new Request('http://web.test/api/integrations/dms/customer-vehicle?phone=%2B201001112222&customerNumber=DMS-100&vin=WBA123&name=Nadia&role=admin&branchId=branch_1&password=leaked', {
      headers: { cookie: 'cms_staff_session=raw-session' },
      method: 'GET',
    }));

    assert.equal(response.status, 200);
    assert.equal(String(calls[0]?.input), 'http://api.test/integrations/dms/customer-vehicle?phone=%2B201001112222&customerNumber=DMS-100&vin=WBA123&name=Nadia');
    assert.equal(calls[0]?.init?.method, 'GET');
    assert.deepEqual(Object.fromEntries(new Headers(calls[0]?.init?.headers).entries()), {
      accept: 'application/json',
      cookie: 'cms_staff_session=raw-session',
    });
    assert.doesNotMatch(String(calls[0]?.input), /role|branchId|actor|workflow|token|credential|password|leaked/i);
  } finally {
    globalThis.fetch = priorFetch;
    if (priorApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = priorApiUrl;
  }
});

test('complaint correction proxy forwards body, session cookie, and CSRF to the API', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ correction: { complaintId: 'cmp_1', changedFields: ['manualVehicle'] } });
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const body = { expectedUpdatedAt: '2026-06-19T09:30:00.000Z', reason: 'Correct source.', manualVehicle: true };
    const response = await proxyCorrectComplaint(new Request('http://web.test/api/complaints/cmp_1/corrections', {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json', cookie: 'cms_staff_session=raw-session', 'x-csrf-token': 'csrf_123' },
      method: 'POST',
    }), { params: Promise.resolve({ id: 'cmp_1' }) });

    assert.equal(response.status, 200);
    assert.equal(String(calls[0]?.input), 'http://api.test/complaints/cmp_1/corrections');
    assert.equal(calls[0]?.init?.method, 'POST');
    assert.equal(calls[0]?.init?.body, JSON.stringify(body));
    assert.deepEqual(Object.fromEntries(new Headers(calls[0]?.init?.headers).entries()), {
      accept: 'application/json',
      'content-type': 'application/json',
      cookie: 'cms_staff_session=raw-session',
      'x-csrf-token': 'csrf_123',
    });
  } finally {
    globalThis.fetch = priorFetch;
    if (priorApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = priorApiUrl;
  }
});

test('complaint transition proxy forwards body, session cookie, and CSRF to the API', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ transition: { complaintId: 'cmp_1', fromStatus: 'SUBMITTED', action: 'ACCEPT_INTAKE', actorRole: 'CR_MANAGER', toStatus: 'MANAGER_REVIEW' } });
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const body = { fromStatus: 'SUBMITTED', action: 'ACCEPT_INTAKE', reason: 'Manager accepted intake.' };
    const response = await proxyTransitionComplaint(new Request('http://web.test/api/complaints/cmp_1/transitions', {
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        cookie: 'cms_staff_session=raw-session',
        'x-csrf-token': 'csrf_123',
      },
      method: 'POST',
    }), { params: Promise.resolve({ id: 'cmp_1' }) });

    assert.equal(response.status, 200);
    assert.equal(String(calls[0]?.input), 'http://api.test/complaints/cmp_1/transitions');
    assert.equal(calls[0]?.init?.body, JSON.stringify(body));
    assert.deepEqual(Object.fromEntries(new Headers(calls[0]?.init?.headers).entries()), {
      accept: 'application/json',
      'content-type': 'application/json',
      cookie: 'cms_staff_session=raw-session',
      'x-csrf-token': 'csrf_123',
    });
  } finally {
    globalThis.fetch = priorFetch;
    if (priorApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = priorApiUrl;
  }
});

test('staff attachment proxies forward only session cookie csrf and body to the API', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    if (String(input).endsWith('/download')) {
      return jsonResponse({ download: { attachmentId: 'att_1', token: 'attdl_safe', expiresAt: '2026-06-19T10:05:00.000Z' } });
    }
    if (init?.method === 'POST') {
      return jsonResponse({ attachment: { id: 'att_1', complaintId: 'cmp_1', fileName: 'photo.png', contentType: 'image/png', sizeBytes: 10, scanStatus: 'PENDING', customerVisible: false } }, 201);
    }
    return jsonResponse({ items: [{ id: 'att_1', complaintId: 'cmp_1', fileName: 'photo.png', contentType: 'image/png', sizeBytes: 10, scanStatus: 'CLEAN', customerVisible: false }] });
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const payload = { fileName: 'photo.png', contentType: 'image/png', sizeBytes: 10, contentBase64: 'ZmlsZS1ieXRlcw==', actorId: 'spoofed' };
    const list = await proxyListAttachments(new Request('http://web.test/api/complaints/cmp_1/attachments?role=admin&branchId=spoofed', {
      headers: { cookie: 'cms_staff_session=raw-session' },
      method: 'GET',
    }), { params: Promise.resolve({ id: 'cmp_1' }) });
    const upload = await proxyUploadAttachment(new Request('http://web.test/api/complaints/cmp_1/attachments', {
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json', cookie: 'cms_staff_session=raw-session', 'x-csrf-token': 'csrf_123' },
      method: 'POST',
    }), { params: Promise.resolve({ id: 'cmp_1' }) });
    const download = await proxyDownloadAttachment(new Request('http://web.test/api/complaints/cmp_1/attachments/att_1/download?branchId=spoofed', {
      headers: { cookie: 'cms_staff_session=raw-session', 'x-csrf-token': 'ignored' },
      method: 'GET',
    }), { params: Promise.resolve({ id: 'cmp_1', attachmentId: 'att_1' }) });

    assert.equal(list.status, 200);
    assert.equal(upload.status, 201);
    assert.equal(download.status, 200);
    assert.equal(String(calls[0]?.input), 'http://api.test/complaints/cmp_1/attachments');
    assert.equal(String(calls[1]?.input), 'http://api.test/complaints/cmp_1/attachments');
    assert.equal(String(calls[2]?.input), 'http://api.test/complaints/cmp_1/attachments/att_1/download');
    assert.deepEqual(Object.fromEntries(new Headers(calls[0]?.init?.headers).entries()), { accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
    assert.deepEqual(Object.fromEntries(new Headers(calls[1]?.init?.headers).entries()), {
      accept: 'application/json',
      'content-type': 'application/json',
      cookie: 'cms_staff_session=raw-session',
      'x-csrf-token': 'csrf_123',
    });
    assert.deepEqual(Object.fromEntries(new Headers(calls[2]?.init?.headers).entries()), { accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
    assert.equal(calls[1]?.init?.body, JSON.stringify(payload));
  } finally {
    globalThis.fetch = priorFetch;
    if (priorApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = priorApiUrl;
  }
});

test('staff attachment download proxy redirects signed targets and hides opaque tokens', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    const token = calls.length === 1 ? 'https://storage.test/attachments/att_1?X-Amz-Signature=proof' : 'attdl_safe';
    return jsonResponse({ download: { attachmentId: 'att_1', token, expiresAt: '2026-06-19T10:05:00.000Z' } });
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const redirect = await proxyDownloadAttachment(new Request('http://web.test/api/complaints/cmp_1/attachments/att_1/download?redirect=1&branchId=spoofed', {
      headers: { cookie: 'cms_staff_session=raw-session' },
      method: 'GET',
    }), { params: Promise.resolve({ id: 'cmp_1', attachmentId: 'att_1' }) });
    const opaque = await proxyDownloadAttachment(new Request('http://web.test/api/complaints/cmp_1/attachments/att_1/download?redirect=1', {
      headers: { cookie: 'cms_staff_session=raw-session' },
      method: 'GET',
    }), { params: Promise.resolve({ id: 'cmp_1', attachmentId: 'att_1' }) });
    const opaqueBody = await opaque.json() as { error?: { code?: string; message?: string } };

    assert.equal(redirect.status, 307);
    assert.equal(redirect.headers.get('location'), 'https://storage.test/attachments/att_1?X-Amz-Signature=proof');
    assert.equal(opaque.status, 409);
    assert.equal(opaqueBody.error?.code, 'ATTACHMENT_DOWNLOAD_TARGET_UNAVAILABLE');
    assert.equal(opaqueBody.error?.message, 'Download target is unavailable in this environment.');
    assert.equal(JSON.stringify(opaqueBody).includes('attdl_safe'), false);
    assert.deepEqual(calls.map((call) => String(call.input)), [
      'http://api.test/complaints/cmp_1/attachments/att_1/download',
      'http://api.test/complaints/cmp_1/attachments/att_1/download',
    ]);
    assert.ok(calls.every((call) => !/branchId|redirect|attdl|token|credential/i.test(String(call.input))));
    assert.ok(calls.every((call) => Object.fromEntries(new Headers(call.init?.headers).entries()).cookie === 'cms_staff_session=raw-session'));
  } finally {
    globalThis.fetch = priorFetch;
    if (priorApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = priorApiUrl;
  }
});

test('related complaint proxy forwards body, session cookie, and CSRF to the API', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ relation: { sourceComplaintId: 'cmp_1', targetComplaintId: 'cmp_2', changed: true } }, 201);
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const response = await proxyLinkRelatedComplaint(new Request('http://web.test/api/complaints/cmp_1/related', {
      body: JSON.stringify({ targetComplaintId: 'cmp_2' }),
      headers: { 'content-type': 'application/json', cookie: 'cms_staff_session=raw-session', 'x-csrf-token': 'csrf_123' },
      method: 'POST',
    }), { params: Promise.resolve({ id: 'cmp_1' }) });

    assert.equal(response.status, 201);
    assert.equal(String(calls[0]?.input), 'http://api.test/complaints/cmp_1/related');
    assert.equal(calls[0]?.init?.method, 'POST');
    assert.equal(calls[0]?.init?.body, JSON.stringify({ targetComplaintId: 'cmp_2' }));
    assert.deepEqual(Object.fromEntries(new Headers(calls[0]?.init?.headers).entries()), {
      accept: 'application/json',
      'content-type': 'application/json',
      cookie: 'cms_staff_session=raw-session',
      'x-csrf-token': 'csrf_123',
    });
  } finally {
    globalThis.fetch = priorFetch;
    if (priorApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = priorApiUrl;
  }
});

test('related complaint proxy forwards unlink to the API relation target route', async () => {
  const priorFetch = globalThis.fetch;
  const priorApiUrl = process.env.API_URL;
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    calls.push({ input, init });
    return jsonResponse({ relation: { sourceComplaintId: 'cmp_1', targetComplaintId: 'cmp_2', changed: true } });
  }) as typeof fetch;
  process.env.API_URL = 'http://api.test';

  try {
    const response = await proxyUnlinkRelatedComplaint(new Request('http://web.test/api/complaints/cmp_1/related', {
      body: JSON.stringify({ targetComplaintId: 'cmp_2' }),
      headers: { 'content-type': 'application/json', cookie: 'cms_staff_session=raw-session', 'x-csrf-token': 'csrf_123' },
      method: 'DELETE',
    }), { params: Promise.resolve({ id: 'cmp_1' }) });

    assert.equal(response.status, 200);
    assert.equal(String(calls[0]?.input), 'http://api.test/complaints/cmp_1/related/cmp_2');
    assert.equal(calls[0]?.init?.method, 'DELETE');
    assert.equal(calls[0]?.init?.body, undefined);
    assert.deepEqual(Object.fromEntries(new Headers(calls[0]?.init?.headers).entries()), {
      accept: 'application/json',
      'content-type': 'application/json',
      cookie: 'cms_staff_session=raw-session',
      'x-csrf-token': 'csrf_123',
    });
  } finally {
    globalThis.fetch = priorFetch;
    if (priorApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = priorApiUrl;
  }
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
