import assert from 'node:assert/strict';
import test from 'node:test';
import argon2 from 'argon2';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { AuthService } from '../../src/modules/auth/auth.service.ts';
import { AuthRepository } from '../../src/modules/auth/auth.repository.ts';
import type { StaffAuthRecord } from '../../src/modules/auth/auth.repository.ts';

const baseUser: StaffAuthRecord = {
  id: 'usr_test',
  email: 'admin@cms-auto.test',
  username: 'admin',
  nameEn: 'System Admin',
  nameAr: 'System Admin',
  passwordHash: null,
  branchId: 'branch_main',
  isActive: true,
  lockedAt: null,
  role: { code: 'ADMIN' },
};

function serviceFor(user: StaffAuthRecord | null): AuthService {
  let capturedIdentifier = '';
  return new AuthService({
    findStaffByIdentifier: async (identifier) => {
      capturedIdentifier = identifier;
      return capturedIdentifier ? user : null;
    },
    createStaffSession: async () => ({ id: 'session_unused' }),
    findStaffSessionByTokenHash: async () => null,
    revokeStaffSession: async () => 0,
  });
}

function isAuthError(code: string): (error: unknown) => boolean {
  return (error: unknown) =>
    error instanceof AppException &&
    error.code === code &&
    error.safeMessage === 'Invalid credentials';
}

test('valid active staff credentials return safe auth claims', async () => {
  const passwordHash = await argon2.hash('correct-password', { type: argon2.argon2id });
  const claims = await serviceFor({ ...baseUser, passwordHash }).verifyCredentials({
    identifier: 'ADMIN@CMS-AUTO.TEST',
    password: 'correct-password',
  });

  assert.deepEqual(claims, {
    userId: 'usr_test',
    email: 'admin@cms-auto.test',
    nameEn: 'System Admin',
    nameAr: 'System Admin',
    roleCode: 'ADMIN',
    branchId: 'branch_main',
  });
  assert.equal('passwordHash' in claims, false);
});

test('valid active staff username credentials return safe auth claims', async () => {
  const passwordHash = await argon2.hash('correct-password', { type: argon2.argon2id });
  const claims = await serviceFor({ ...baseUser, passwordHash }).verifyCredentials({
    identifier: ' ADMIN ',
    password: 'correct-password',
  });

  assert.equal(claims.userId, 'usr_test');
  assert.equal(claims.email, 'admin@cms-auto.test');
  assert.equal('passwordHash' in claims, false);
});

test('auth repository looks up staff by username or email', async () => {
  let capturedWhere: unknown;
  const repository = new AuthRepository({
    user: {
      findFirst: async (query: { where: unknown }) => {
        capturedWhere = query.where;
        return null;
      },
    },
  } as never);

  await repository.findStaffByIdentifier('Admin');

  assert.deepEqual(capturedWhere, { OR: [{ email: 'admin' }, { username: 'admin' }] });
});

test('invalid, inactive, locked, and missing-hash users are denied generically', async () => {
  const passwordHash = await argon2.hash('correct-password', { type: argon2.argon2id });

  await assert.rejects(
    serviceFor({ ...baseUser, passwordHash }).verifyCredentials({
      identifier: 'admin@cms-auto.test',
      password: 'wrong-password',
    }),
    isAuthError('AUTH_INVALID_CREDENTIALS'),
  );
  await assert.rejects(
    serviceFor({ ...baseUser, passwordHash, isActive: false }).verifyCredentials({
      identifier: 'admin@cms-auto.test',
      password: 'correct-password',
    }),
    isAuthError('AUTH_LOCKED_OR_INACTIVE'),
  );
  await assert.rejects(
    serviceFor({ ...baseUser, passwordHash, lockedAt: new Date() }).verifyCredentials({
      identifier: 'admin@cms-auto.test',
      password: 'correct-password',
    }),
    isAuthError('AUTH_LOCKED_OR_INACTIVE'),
  );
  await assert.rejects(
    serviceFor(baseUser).verifyCredentials({
      identifier: 'admin@cms-auto.test',
      password: 'correct-password',
    }),
    isAuthError('AUTH_INVALID_CREDENTIALS'),
  );
});

test('failed credential verification records safe auth audit metadata', async () => {
  const passwordHash = await argon2.hash('correct-password', { type: argon2.argon2id });
  const auditRecords: AuditRecordInput[] = [];
  const service = new AuthService(
    {
      findStaffByIdentifier: async () => ({ ...baseUser, passwordHash }),
      createStaffSession: async () => ({ id: 'session_unused' }),
      findStaffSessionByTokenHash: async () => null,
      revokeStaffSession: async () => 0,
    },
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  await assert.rejects(
    service.verifyCredentials({
      identifier: 'admin@cms-auto.test',
      password: 'wrong-password',
      audit: { correlationId: 'req_test', ipAddress: '127.0.0.1', userAgent: 'node:test' },
    }),
    isAuthError('AUTH_INVALID_CREDENTIALS'),
  );

  assert.deepEqual(auditRecords, [
    {
      eventType: 'AUTH',
      action: 'login_failure',
      targetType: 'user',
      metadata: { reason: 'AUTH_INVALID_CREDENTIALS' },
      correlationId: 'req_test',
      ipAddress: '127.0.0.1',
      userAgent: 'node:test',
    },
  ]);
  assert.equal(JSON.stringify(auditRecords).includes('wrong-password'), false);
  assert.equal(JSON.stringify(auditRecords).includes(passwordHash), false);
});
