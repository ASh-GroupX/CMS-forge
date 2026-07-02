import assert from 'node:assert/strict';
import test from 'node:test';
import { getAdminCategorySlaConfig } from '../../src/lib/staff-admin-category-sla-api';

test('admin category SLA client forwards staff cookie and parses backend config', async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    const url = String(input);
    if (url.endsWith('/admin/categories')) {
      return jsonResponse({ items: [{ id: 'cat_1', code: 'SERVICE', nameEn: 'Service', nameAr: 'الخدمة', parentId: null, isActive: true }] });
    }
    if (url.endsWith('/sla/policies')) {
      return jsonResponse({
        items: [{
          id: 'policy_1',
          severity: 'HIGH',
          stage: 'INTAKE',
          branchId: null,
          departmentId: null,
          categoryId: 'cat_1',
          durationMinutes: 480,
          warningPercent: 80,
          branchTimezone: 'Africa/Cairo',
          workingCalendarMode: 'ALWAYS_ON',
          pausePolicy: 'NONE',
          escalationLevel1: 'branch-manager',
          escalationLevel2: null,
          escalationLevel3: null,
          escalationLevel2AfterBreachMinutes: null,
          escalationLevel3AfterBreachMinutes: null,
          totalTargetMinutes: null,
          isActive: true,
        }],
      });
    }
    return jsonResponse({}, { status: 404 });
  };

  const result = await getAdminCategorySlaConfig({ cookieHeader: 'cms_staff_session=raw-session', fetchImpl });

  assert.equal(result?.categories[0]?.code, 'SERVICE');
  assert.equal(result?.policies[0]?.durationMinutes, 480);
  assert.deepEqual(calls.map((call) => String(call.input)), ['http://localhost:3000/admin/categories', 'http://localhost:3000/sla/policies']);
  assert.equal(calls.every((call) => (call.init?.headers as Record<string, string>).cookie === 'cms_staff_session=raw-session'), true);
});

test('admin category SLA client fails closed without session or valid bodies', async () => {
  assert.equal(await getAdminCategorySlaConfig({ cookieHeader: '', fetchImpl: async () => { throw new Error('should not fetch'); } }), null);
  assert.equal(await getAdminCategorySlaConfig({
    cookieHeader: 'cms_staff_session=raw-session',
    fetchImpl: async () => jsonResponse({ items: [] }, { status: 403 }),
  }), null);
  assert.equal(await getAdminCategorySlaConfig({
    cookieHeader: 'cms_staff_session=raw-session',
    fetchImpl: async () => jsonResponse({ nope: [] }),
  }), null);
});

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    status: init.status ?? 200,
  });
}
