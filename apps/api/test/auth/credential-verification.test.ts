import assert from 'node:assert/strict';
import test from 'node:test';
import argon2 from 'argon2';
import { AppException } from '../../src/core/http-kernel.ts';
import { AuthService } from '../../src/modules/auth/auth.service.ts';
import type { StaffAuthRecord } from '../../src/modules/auth/auth.repository.ts';

const baseUser: StaffAuthRecord = {
  id: 'usr_test',
  email: 'admin@cms-auto.test',
  nameEn: 'System Admin',
  nameAr: 'System Admin',
  passwordHash: null,
  branchId: 'branch_main',
  isActive: true,
  lockedAt: null,
  role: { code: 'ADMIN' },
};

function serviceFor(user: StaffAuthRecord | null): AuthService {
  return new AuthService({
    findStaffByIdentifier: async () => user,
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
