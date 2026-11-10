import assert from 'node:assert/strict';
import test from 'node:test';
import { createDataApiKey, loadDataApiKeys, revokeDataApiKey, testDataApiKey } from '../../src/lib/staff-integration-keys-api';

const secret = `cms_live_${'a'.repeat(43)}`;
const key = { id: 'key-1', name: 'Reports', keyPrefix: 'cms_live_aaa', scopes: ['customers:read'], branchIds: ['b1'], allBranches: false,
  createdAt: '2026-11-10T00:00:00.000Z', lastUsedAt: null, revokedAt: null };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('staff key client forwards session and CSRF and never invents a stored secret', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return response(String(input).endsWith('/branches') ? { items: [{ id: 'b1', nameEn: 'Main', nameAr: 'الرئيسي' }] } : { items: [key] });
  };
  const result = await loadDataApiKeys({ cookie: 'cms_staff_session=opaque', csrf: 'csrf-value', fetchImpl });
  assert.equal(result.status, 'ok');
  if (result.status !== 'ok') return;
  assert.equal(result.keys.length, 1);
  assert.equal(JSON.stringify(result).includes(secret), false);
  assert.deepEqual(calls.map((call) => new URL(call.url).pathname), ['/integrations/data-api-keys', '/branches']);
  assert.ok(calls.every((call) => (call.init?.headers as Record<string, string>).cookie === 'cms_staff_session=opaque'));
});

test('create and revoke send only the requested scope and use staff CSRF', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return response(String(input).includes('/revoke') ? { revoked: true } : { key, secret }, String(input).includes('/revoke') ? 200 : 201);
  };
  const options = { cookie: 'cms_staff_session=opaque', csrf: 'csrf-value', fetchImpl };
  const created = await createDataApiKey(options, { name: 'Reports', scopes: ['customers:read'], allBranches: false, branchIds: ['b1'] });
  assert.equal(created.status, 'ok');
  assert.equal((await revokeDataApiKey(options, 'key-1')).status, 'ok');
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), { name: 'Reports', scopes: ['customers:read'], allBranches: false, branchIds: ['b1'] });
  assert.ok(calls.every((call) => (call.init?.headers as Record<string, string>)['x-csrf-token'] === 'csrf-value'));
});

test('test request returns a count without customer contents and maps denial', async () => {
  let auth = '';
  const fetchImpl: typeof fetch = async (_input, init) => {
    auth = (init?.headers as Record<string, string>).Authorization;
    return response({ items: [{ id: 'customer-1', phone: 'private' }], nextCursor: 'customer-1' });
  };
  const result = await testDataApiKey({ fetchImpl }, secret, 'customers');
  assert.deepEqual(result, { status: 'ok', rowCount: 1, hasMore: true });
  assert.equal(auth, `Bearer ${secret}`);
  const denied = await testDataApiKey({ fetchImpl: async () => response({}, 403) }, secret, 'customers');
  assert.deepEqual(denied, { status: 'forbidden' });
});
