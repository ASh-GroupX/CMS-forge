import assert from 'node:assert/strict';
import { GET as proxyListAttachments, POST as proxyUploadAttachment } from '../apps/web/src/app/api/complaints/[id]/attachments/route.ts';
import { GET as proxyDownloadAttachment } from '../apps/web/src/app/api/complaints/[id]/attachments/[attachmentId]/download/route.ts';
import {
  listStaffComplaintAttachments,
  prepareStaffAttachmentDownload,
  uploadStaffComplaintAttachment,
} from '../apps/web/src/lib/staff-attachments-api.ts';
import { uploadPortalAttachment } from '../apps/web/src/lib/portal-tracking-api.ts';

const priorFetch = globalThis.fetch;
const priorApiUrl = process.env.API_URL;
const calls = [];

globalThis.fetch = async (input, init) => {
  calls.push({ input, init });
  const path = String(input);
  if (path.endsWith('/download')) {
    assert.deepEqual(Object.fromEntries(new Headers(init?.headers).entries()), {
      accept: 'application/json',
      cookie: 'cms_staff_session=raw-session',
    });
    return json({ download: { attachmentId: 'att_1', token: 'attdl_safe', expiresAt: '2026-06-19T10:05:00.000Z' } });
  }
  if (init?.method === 'POST') {
    assert.deepEqual(Object.fromEntries(new Headers(init?.headers).entries()), {
      accept: 'application/json',
      'content-type': 'application/json',
      cookie: 'cms_staff_session=raw-session',
      'x-csrf-token': 'csrf_123',
    });
    assert.deepEqual(JSON.parse(String(init.body)), uploadBody());
    return json({ attachment: attachment('PENDING') }, 201);
  }
  assert.deepEqual(Object.fromEntries(new Headers(init?.headers).entries()), {
    accept: 'application/json',
    cookie: 'cms_staff_session=raw-session',
  });
  return json({ items: [attachment('CLEAN')] });
};
process.env.API_URL = 'http://api.test';

try {
  await withDocumentCookie('cms_csrf_token=csrf_123', async () => {
    const list = await listStaffComplaintAttachments('cmp_1', async (input, init) => {
      assert.equal(input, '/api/complaints/cmp_1/attachments');
      assert.equal(init?.credentials, 'include');
      return json({ items: [attachment('CLEAN')] });
    });
    const upload = await uploadStaffComplaintAttachment('cmp_1', new File(['file-bytes'], 'photo.png', { type: 'image/png' }), async (input, init) => {
      assert.equal(input, '/api/complaints/cmp_1/attachments');
      assert.equal(init?.credentials, 'include');
      assert.deepEqual(JSON.parse(String(init?.body)), uploadBody());
      assert.doesNotMatch(String(init?.body), /branch|role|actor|workflow|storage|credential/i);
      return json({ attachment: attachment('PENDING') }, 201);
    });
    const download = await prepareStaffAttachmentDownload('cmp_1', 'att_1', async (input, init) => {
      assert.equal(input, '/api/complaints/cmp_1/attachments/att_1/download');
      assert.equal(init?.credentials, 'include');
      return json({ download: { attachmentId: 'att_1', token: 'attdl_safe', expiresAt: '2026-06-19T10:05:00.000Z' } });
    });
    const blocked = await uploadStaffComplaintAttachment('cmp_1', new File(['bad'], 'malware.exe', { type: 'application/x-msdownload' }), async () => {
      throw new Error('blocked upload should not post');
    });
    const portalBlocked = await uploadPortalAttachment('portal_token', new File(['bad'], 'malware.exe', { type: 'application/x-msdownload' }), async () => {
      throw new Error('blocked portal upload should not post');
    });

    assert.equal(list.ok, true);
    assert.equal(upload.ok, true);
    assert.equal(download.ok, true);
    assert.equal(blocked.ok, false);
    assert.equal(portalBlocked.ok, false);
  });

  const listResponse = await proxyListAttachments(new Request('http://web.test/api/complaints/cmp_1/attachments?role=admin&branchId=spoofed', {
    headers: { cookie: 'cms_staff_session=raw-session' },
    method: 'GET',
  }), { params: Promise.resolve({ id: 'cmp_1' }) });
  const uploadResponse = await proxyUploadAttachment(new Request('http://web.test/api/complaints/cmp_1/attachments', {
    body: JSON.stringify(uploadBody()),
    headers: { 'content-type': 'application/json', cookie: 'cms_staff_session=raw-session', 'x-csrf-token': 'csrf_123' },
    method: 'POST',
  }), { params: Promise.resolve({ id: 'cmp_1' }) });
  const downloadResponse = await proxyDownloadAttachment(new Request('http://web.test/api/complaints/cmp_1/attachments/att_1/download?branchId=spoofed', {
    headers: { cookie: 'cms_staff_session=raw-session', 'x-csrf-token': 'ignored' },
    method: 'GET',
  }), { params: Promise.resolve({ id: 'cmp_1', attachmentId: 'att_1' }) });

  assert.equal(listResponse.status, 200);
  assert.equal(uploadResponse.status, 201);
  assert.equal(downloadResponse.status, 200);
  assert.deepEqual(calls.map((call) => String(call.input)), [
    'http://api.test/complaints/cmp_1/attachments',
    'http://api.test/complaints/cmp_1/attachments',
    'http://api.test/complaints/cmp_1/attachments/att_1/download',
  ]);
  console.log('attachments proof passed');
} finally {
  globalThis.fetch = priorFetch;
  if (priorApiUrl === undefined) delete process.env.API_URL;
  else process.env.API_URL = priorApiUrl;
}

function attachment(scanStatus) {
  return {
    id: 'att_1',
    complaintId: 'cmp_1',
    fileName: 'photo.png',
    contentType: 'image/png',
    sizeBytes: 10,
    scanStatus,
    customerVisible: false,
  };
}

function uploadBody() {
  return {
    fileName: 'photo.png',
    contentType: 'image/png',
    sizeBytes: 10,
    contentBase64: 'ZmlsZS1ieXRlcw==',
  };
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
