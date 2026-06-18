import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthService, hashStaffSessionToken } from '../../src/modules/auth/auth.service.ts';

test('staff session creation stores only a token hash and returns a safe cookie', async () => {
  let stored: { userId: string; tokenHash: string; expiresAt: Date } | undefined;
  const service = new AuthService({
    findStaffByIdentifier: async () => null,
    createStaffSession: async (input) => {
      stored = input;
      return { id: 'session_test' };
    },
    findStaffSessionByTokenHash: async () => null,
    revokeStaffSession: async () => 0,
  });

  const result = await service.createStaffSession({
    userId: 'usr_test',
    now: new Date('2026-06-18T12:00:00.000Z'),
    secureCookie: true,
  });

  const token = result.cookie.match(/^cms_staff_session=([^;]+)/)?.[1] ?? '';
  assert.ok(token.length > 20);
  assert.match(result.cookie, /; HttpOnly/);
  assert.match(result.cookie, /; SameSite=Lax/);
  assert.match(result.cookie, /; Secure/);
  assert.equal(stored?.userId, 'usr_test');
  assert.equal(stored?.tokenHash, hashStaffSessionToken(token));
  assert.notEqual(stored?.tokenHash, token);
  assert.equal(stored?.expiresAt.toISOString(), '2026-06-18T20:00:00.000Z');
});

test('staff session cookie omits Secure outside production mode', async () => {
  const service = new AuthService({
    findStaffByIdentifier: async () => null,
    createStaffSession: async () => ({ id: 'session_test' }),
    findStaffSessionByTokenHash: async () => null,
    revokeStaffSession: async () => 0,
  });

  const result = await service.createStaffSession({
    userId: 'usr_test',
    now: new Date('2026-06-18T12:00:00.000Z'),
  });

  assert.doesNotMatch(result.cookie, /; Secure/);
});
