import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { AppException } from '../../src/core/http-kernel.ts';
import { AuthController } from '../../src/modules/auth/auth.controller.ts';
import type { AuthService, StaffAuthClaims } from '../../src/modules/auth/auth.service.ts';
import type { IncomingMessage } from 'node:http';

const user: StaffAuthClaims = {
  userId: 'usr_test',
  email: 'admin@cms-auto.test',
  nameEn: 'System Admin',
  nameAr: 'System Admin',
  roleCode: 'ADMIN',
  branchId: 'branch_main',
};

function response(): { headers: Record<string, string>; setHeader(name: string, value: string): void } {
  return {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
}

function controller(service: Partial<AuthService>): AuthController {
  return new AuthController(service as AuthService);
}

function request(): IncomingMessage & { correlationId?: string } {
  return Object.assign(new EventEmitter(), {
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'node:test',
    },
    socket: { remoteAddress: '127.0.0.2' },
    correlationId: 'req_test',
  }) as IncomingMessage & { correlationId?: string };
}

test('login returns safe staff claims and sets an HttpOnly staff cookie', async () => {
  const res = response();
  const result = await controller({
    verifyCredentials: async (input) => {
      assert.equal(input.identifier, 'admin@cms-auto.test');
      assert.equal(input.password, 'correct-password');
      assert.deepEqual(input.audit, {
        correlationId: 'req_test',
        ipAddress: '127.0.0.1',
        userAgent: 'node:test',
      });
      return user;
    },
    createStaffSession: async (input) => {
      assert.equal(input.userId, 'usr_test');
      return {
        cookie: 'cms_staff_session=raw-token; Path=/; HttpOnly; SameSite=Lax',
        expiresAt: new Date('2026-06-18T20:00:00.000Z'),
      };
    },
  }).login({ identifier: ' admin@cms-auto.test ', password: 'correct-password' }, request(), res);

  assert.equal(res.headers['Set-Cookie'], 'cms_staff_session=raw-token; Path=/; HttpOnly; SameSite=Lax');
  assert.deepEqual(result, { user, expiresAt: '2026-06-18T20:00:00.000Z' });
  assert.equal(JSON.stringify(result).includes('passwordHash'), false);
  assert.equal(JSON.stringify(result).includes('raw-token'), false);
});

test('failed login stays generic', async () => {
  await assert.rejects(
    controller({
      verifyCredentials: async () => {
        throw new AppException('AUTH_INVALID_CREDENTIALS', 'Invalid credentials', 401);
      },
    }).login({ identifier: 'missing@cms-auto.test', password: 'wrong' }, request(), response()),
    (error: unknown) =>
      error instanceof AppException &&
      error.code === 'AUTH_INVALID_CREDENTIALS' &&
      error.safeMessage === 'Invalid credentials',
  );
});

test('logout revokes the cookie token and returns an expired staff cookie', async () => {
  const res = response();
  const result = await controller({
    logoutStaffSessionWithAudit: async (token, _secureCookie, _now, audit) => {
      assert.equal(token, 'raw-token');
      assert.deepEqual(audit, {
        correlationId: 'req_test',
        ipAddress: '127.0.0.1',
        userAgent: 'node:test',
      });
      return 'cms_staff_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
    },
  }).logout('cms_staff_session=raw-token; other=value', request(), res);

  assert.deepEqual(result, { ok: true });
  assert.equal(res.headers['Set-Cookie'], 'cms_staff_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
});

test('malformed login input returns the standard error envelope code', async () => {
  await assert.rejects(
    controller({}).login({ identifier: '', password: 'secret' }, request(), response()),
    (error: unknown) =>
      error instanceof AppException &&
      error.code === 'VALIDATION_FAILED' &&
      error.safeMessage === 'Invalid login request',
  );
});
