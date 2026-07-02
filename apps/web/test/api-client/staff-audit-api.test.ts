import assert from 'node:assert/strict';
import test from 'node:test';
import { GET as auditExportRoute } from '../../src/app/(staff)/audit/export/route';
import { auditExportHref, getStaffAuditLogs } from '../../src/lib/staff-audit-api';

test('staff audit client forwards filters and parses redacted rows', async () => {
  const calls: string[] = [];
  const result = await getStaffAuditLogs({
    apiUrl: 'http://api.test',
    cookieHeader: 'cms_staff_session=session',
    filters: { actorId: 'usr_admin', eventType: 'SECURITY', pageSize: '50' },
    fetchImpl: async (url) => {
      calls.push(String(url));
      return jsonResponse({
        items: [{
          id: 'aud_1',
          eventType: 'SECURITY',
          action: 'permission_forbidden',
          actorId: 'usr_admin',
          branchId: 'branch_main',
          targetType: 'api_route',
          targetId: '/audit/logs',
          correlationId: 'req_1',
          metadata: { password: '[REDACTED]' },
          createdAt: '2026-06-18T10:00:00.000Z',
        }],
        page: 1,
        pageSize: 50,
      });
    },
  });

  assert.equal(calls[0], 'http://api.test/audit/logs?actorId=usr_admin&eventType=SECURITY&pageSize=50');
  assert.deepEqual(result, {
    status: 'ready',
    data: {
      items: [{
        id: 'aud_1',
        eventType: 'SECURITY',
        action: 'permission_forbidden',
        actorId: 'usr_admin',
        branchId: 'branch_main',
        targetType: 'api_route',
        targetId: '/audit/logs',
        correlationId: 'req_1',
        metadata: { password: '[REDACTED]' },
        createdAt: '2026-06-18T10:00:00.000Z',
      }],
      page: 1,
      pageSize: 50,
    },
  });
});

test('staff audit client reports denied and invalid responses safely', async () => {
  assert.deepEqual(await getStaffAuditLogs({ cookieHeader: '' }), { status: 'denied' });
  assert.deepEqual(await getStaffAuditLogs({ cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({}, 403) }), { status: 'denied' });
  assert.deepEqual(await getStaffAuditLogs({ cookieHeader: 'cms_staff_session=x', fetchImpl: async () => jsonResponse({ items: [{}], page: 1, pageSize: 25 }) }), { status: 'error' });
});

test('staff audit export href preserves the same filters', () => {
  assert.equal(auditExportHref({ correlationId: 'req_1', eventType: 'AUTH', page: '2' }), '/audit/export?correlationId=req_1&eventType=AUTH&page=2');
});

test('staff audit export proxy forwards filters and staff cookie', async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; cookie: string }> = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), cookie: new Headers(init?.headers).get('cookie') ?? '' });
    return new Response('{"items":[]}', { status: 200, headers: { 'content-disposition': 'attachment; filename="audit-logs.json"', 'content-type': 'application/json' } });
  };
  try {
    const response = await auditExportRoute(new Request('http://web.test/audit/export?eventType=SECURITY&correlationId=req_1', { headers: { cookie: 'cms_staff_session=session' } }));

    assert.equal(response.status, 200);
    assert.equal(await response.text(), '{"items":[]}');
    assert.deepEqual(calls, [{ url: 'http://localhost:3000/audit/logs/export?correlationId=req_1&eventType=SECURITY', cookie: 'cms_staff_session=session' }]);
    assert.equal(response.headers.get('content-disposition'), 'attachment; filename="audit-logs.json"');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
