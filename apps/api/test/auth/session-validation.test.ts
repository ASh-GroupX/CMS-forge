import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { AuthService, hashStaffSessionToken } from '../../src/modules/auth/auth.service.ts';
import type { StaffSessionRecord } from '../../src/modules/auth/auth.repository.ts';

const token = 'raw-session-token';
const validSession: StaffSessionRecord = {
  id: 'ses_test',
  expiresAt: new Date('2026-06-18T13:00:00.000Z'),
  revokedAt: null,
  user: {
    id: 'usr_test',
    email: 'admin@cms-auto.test',
    username: 'admin',
    nameEn: 'System Admin',
    nameAr: 'System Admin',
    branchId: 'branch_main',
    isActive: true,
    lockedAt: null,
    role: { code: 'ADMIN', permissions: [{ permission: { code: 'ROLES_MANAGE' } }] },
  },
};

function serviceFor(session: StaffSessionRecord | null): AuthService {
  return new AuthService({
    findStaffByIdentifier: async () => null,
    createStaffSession: async () => ({ id: 'session_unused' }),
    findStaffSessionByTokenHash: async (tokenHash) =>
      tokenHash === hashStaffSessionToken(token) ? session : null,
    revokeStaffSession: async () => 0,
  });
}

function isAuthError(code: string): (error: unknown) => boolean {
  return (error: unknown) =>
    error instanceof AppException &&
    error.code === code &&
    error.safeMessage === 'Invalid credentials';
}

test('valid staff session returns safe server-derived claims', async () => {
  const claims = await serviceFor(validSession).validateStaffSession(
    token,
    new Date('2026-06-18T12:00:00.000Z'),
  );

  assert.deepEqual(claims, {
    sessionId: 'ses_test',
    userId: 'usr_test',
    email: 'admin@cms-auto.test',
    nameEn: 'System Admin',
    nameAr: 'System Admin',
    roleCode: 'ADMIN',
    permissions: ['ROLES_MANAGE'],
    branchId: 'branch_main',
  });
});

test('missing, unknown, expired, and revoked sessions are denied generically', async () => {
  await assert.rejects(
    serviceFor(validSession).validateStaffSession('', new Date('2026-06-18T12:00:00.000Z')),
    isAuthError('AUTH_INVALID_CREDENTIALS'),
  );
  await assert.rejects(
    serviceFor(null).validateStaffSession(token, new Date('2026-06-18T12:00:00.000Z')),
    isAuthError('AUTH_INVALID_CREDENTIALS'),
  );
  await assert.rejects(
    serviceFor({ ...validSession, expiresAt: new Date('2026-06-18T11:59:59.000Z') }).validateStaffSession(
      token,
      new Date('2026-06-18T12:00:00.000Z'),
    ),
    isAuthError('AUTH_INVALID_CREDENTIALS'),
  );
  await assert.rejects(
    serviceFor({ ...validSession, revokedAt: new Date('2026-06-18T11:00:00.000Z') }).validateStaffSession(
      token,
      new Date('2026-06-18T12:00:00.000Z'),
    ),
    isAuthError('AUTH_INVALID_CREDENTIALS'),
  );
});

test('logout revokes by token hash and returns an expired HttpOnly cookie', async () => {
  let revokedHash = '';
  let revokedAt: Date | undefined;
  const service = new AuthService({
    findStaffByIdentifier: async () => null,
    createStaffSession: async () => ({ id: 'session_unused' }),
    findStaffSessionByTokenHash: async () => null,
    revokeStaffSession: async (tokenHash, when) => {
      revokedHash = tokenHash;
      revokedAt = when;
      return 1;
    },
  });

  const cookie = await service.logoutStaffSession(
    token,
    true,
    new Date('2026-06-18T12:00:00.000Z'),
  );

  assert.equal(revokedHash, hashStaffSessionToken(token));
  assert.notEqual(revokedHash, token);
  assert.equal(revokedAt?.toISOString(), '2026-06-18T12:00:00.000Z');
  assert.match(cookie, /^cms_staff_session=;/);
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; Max-Age=0/);
  assert.match(cookie, /; Secure/);
});

test('logout writes audit in the same transaction hook without exposing the token', async () => {
  const auditRecords: AuditRecordInput[] = [];
  let usedTransaction = false;
  const service = new AuthService(
    {
      findStaffByIdentifier: async () => null,
      createStaffSession: async () => ({ id: 'session_unused' }),
      findStaffSessionByTokenHash: async (tokenHash) =>
        tokenHash === hashStaffSessionToken(token) ? validSession : null,
      revokeStaffSession: async () => 1,
      transaction: async (work) => {
        usedTransaction = true;
        return work({} as never);
      },
    },
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  await service.logoutStaffSessionWithAudit(
    token,
    false,
    new Date('2026-06-18T12:00:00.000Z'),
    { correlationId: 'req_test', ipAddress: '127.0.0.1', userAgent: 'node:test' },
  );

  assert.equal(usedTransaction, true);
  assert.deepEqual(auditRecords, [
    {
      eventType: 'AUTH',
      action: 'logout',
      actorId: 'usr_test',
      branchId: 'branch_main',
      targetType: 'staff_session',
      targetId: 'ses_test',
      correlationId: 'req_test',
      ipAddress: '127.0.0.1',
      userAgent: 'node:test',
    },
  ]);
  assert.equal(JSON.stringify(auditRecords).includes(token), false);
});
