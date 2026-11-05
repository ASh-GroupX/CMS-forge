import assert from 'node:assert/strict';
import test from 'node:test';
import { requestTicketPhoneDuplicates } from '../../../../packages/contracts/src/ticket-phone-client';

test('phone contract client sends no client scope authority and projects only scoped ticket metadata', async () => {
  const result = await requestTicketPhoneDuplicates({ departmentId: 'dept-1', fieldId: 'phone-1', phone: '+962790000000' }, {
    baseUrl: 'http://api.example.test', cookieHeader: 'cms_staff_session=test-session', fetchImpl: async (url, init) => {
      assert.equal(String(url), 'http://api.example.test/internal-tickets/phone-duplicates');
      assert.equal(init?.method, 'POST');
      assert.equal((init?.headers as any).cookie, 'cms_staff_session=test-session');
      assert.equal((JSON.parse(String(init?.body))).roleCode, undefined);
      return Response.json({ items: [{ id: 'allowed', referenceNumber: 'TKT-1', title: 'Existing', status: 'NEW', staffEmail: 'must-not-pass' }] });
    },
  });
  assert.deepEqual(result, { items: [{ id: 'allowed', referenceNumber: 'TKT-1', title: 'Existing', status: 'NEW' }] });
});
test('phone client surfaces denial/validation codes and fails closed on malformed responses', async () => {
  for (const code of ['AUTH_INVALID_CREDENTIALS', 'VALIDATION_FAILED']) {
    const result = await requestTicketPhoneDuplicates({ departmentId: 'd', fieldId: 'f', phone: 'bad' }, { baseUrl: 'http://api.test', cookieHeader: '', fetchImpl: async () => Response.json({ error: { code } }, { status: 400 }) });
    assert.deepEqual(result, { items: [], error: code });
  }
  const result = await requestTicketPhoneDuplicates({ departmentId: 'd', fieldId: 'f', phone: 'bad' }, { baseUrl: 'http://api.test', cookieHeader: '', fetchImpl: async () => Response.json({ items: [{}] }) });
  assert.equal(result.error, 'UNAVAILABLE');
});
