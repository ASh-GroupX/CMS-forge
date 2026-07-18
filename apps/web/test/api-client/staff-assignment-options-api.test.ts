import assert from 'node:assert/strict';
import test from 'node:test';
import { getStaffAssignmentOptions } from '../../src/lib/staff-assignment-options-api';

test('assignment options use the session-scoped endpoint and preserve user and department targets', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const result = await getStaffAssignmentOptions({
    apiUrl: 'http://api.test',
    cookieHeader: 'cms_staff_session=raw-session',
    fetchImpl: async (input, init) => {
      calls.push({ input, init });
      return jsonResponse({
        users: [{ id: 'usr_1', nameEn: 'Owner User', nameAr: 'Owner User', branchId: 'branch_1', departmentId: 'dept_1', roleCode: 'CR_MANAGER' }],
        departments: [{ id: 'dept_1', nameEn: 'Service', nameAr: 'Service', branchId: 'branch_1' }],
      });
    },
  });

  assert.deepEqual(result, {
    users: [{ id: 'usr_1', nameEn: 'Owner User', nameAr: 'Owner User', branchId: 'branch_1', departmentId: 'dept_1', roleCode: 'CR_MANAGER' }],
    departments: [{ id: 'dept_1', nameEn: 'Service', nameAr: 'Service', branchId: 'branch_1' }],
  });
  assert.equal(String(calls[0]?.input), 'http://api.test/assignments/options');
  assert.deepEqual(calls[0]?.init?.headers, { Accept: 'application/json', cookie: 'cms_staff_session=raw-session' });
  assert.doesNotMatch(String(calls[0]?.input), /branchId|role|actor|departmentId|userId/);
});

test('assignment options deny without a session and reject malformed responses', async () => {
  let calls = 0;
  assert.equal(await getStaffAssignmentOptions({ cookieHeader: '', fetchImpl: async () => { calls += 1; return jsonResponse({}); } }), null);
  assert.equal(calls, 0);
  assert.equal(await getStaffAssignmentOptions({
    cookieHeader: 'cms_staff_session=raw-session',
    fetchImpl: async () => jsonResponse({ users: [{ id: 'bad' }], departments: [] }),
  }), null);
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}
