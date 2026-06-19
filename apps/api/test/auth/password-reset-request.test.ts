import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { AuthService, hashPasswordResetToken } from '../../src/modules/auth/auth.service.ts';
import type { StaffAuthRecord } from '../../src/modules/auth/auth.repository.ts';

const baseUser: StaffAuthRecord = {
  id: 'usr_active',
  email: 'admin@cms-auto.test',
  nameEn: 'System Admin',
  nameAr: 'System Admin',
  passwordHash: 'somehash',
  branchId: 'branch_main',
  isActive: true,
  lockedAt: null,
  role: { code: 'ADMIN' },
};

test('password reset request for active user generates token hash, short expiry, and returns raw token', async () => {
  let stored: { userId: string; tokenHash: string; expiresAt: Date } | undefined;
  const service = new AuthService({
    findStaffByIdentifier: async (id) => {
      if (id.toLowerCase() === baseUser.email) {
        return baseUser;
      }
      return null;
    },
    createStaffSession: async () => ({ id: 'session_unused' }),
    findStaffSessionByTokenHash: async () => null,
    revokeStaffSession: async () => 0,
    createPasswordResetToken: async (input) => {
      stored = input;
      return { id: 'token_id' };
    },
  });

  const result = await service.requestPasswordReset('ADMIN@CMS-AUTO.TEST');

  assert.equal(result.ok, true);
  assert.ok(result.rawToken);
  assert.ok(result.rawToken.length > 20);
  assert.equal(stored?.userId, baseUser.id);
  assert.equal(stored?.tokenHash, hashPasswordResetToken(result.rawToken));
  assert.notEqual(stored?.tokenHash, result.rawToken);
  
  // Verify short expiry (~15 minutes)
  const now = Date.now();
  const diffMinutes = (stored!.expiresAt.getTime() - now) / (60 * 1000);
  assert.ok(diffMinutes > 14 && diffMinutes <= 15);
});

test('password reset request for missing, inactive, or locked users returns generic ok:true without token or audit', async () => {
  const cases: { name: string; user: StaffAuthRecord | null }[] = [
    { name: 'missing user', user: null },
    { name: 'inactive user', user: { ...baseUser, isActive: false } },
    { name: 'locked user', user: { ...baseUser, lockedAt: new Date() } },
  ];

  for (const { name, user } of cases) {
    let createdToken = false;
    const auditRecords: AuditRecordInput[] = [];
    const service = new AuthService(
      {
        findStaffByIdentifier: async () => user,
        createStaffSession: async () => ({ id: 'session_unused' }),
        findStaffSessionByTokenHash: async () => null,
        revokeStaffSession: async () => 0,
        createPasswordResetToken: async () => {
          createdToken = true;
          return { id: 'token_id' };
        },
      },
      { record: async (input) => auditRecords.push(input) } as AuditService,
    );

    const result = await service.requestPasswordReset('admin@cms-auto.test');
    assert.deepEqual(result, { ok: true }, `Failed case: ${name}`);
    assert.equal(createdToken, false, `Token created for ${name}`);
    assert.equal(auditRecords.length, 0, `Audit recorded for ${name}`);
  }
});

test('password reset request for active user writes audit in the same transaction hook', async () => {
  const auditRecords: AuditRecordInput[] = [];
  let stored: { userId: string; tokenHash: string; expiresAt: Date } | undefined;
  let usedTransaction = false;

  const service = new AuthService(
    {
      findStaffByIdentifier: async () => baseUser,
      createStaffSession: async () => ({ id: 'session_unused' }),
      findStaffSessionByTokenHash: async () => null,
      revokeStaffSession: async () => 0,
      createPasswordResetToken: async (input) => {
        stored = input;
        return { id: 'token_id' };
      },
      transaction: async (work) => {
        usedTransaction = true;
        return work({} as never);
      },
    },
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  const result = await service.requestPasswordReset('admin@cms-auto.test', {
    correlationId: 'req_reset_test',
    ipAddress: '127.0.0.1',
    userAgent: 'node:test',
  });

  assert.equal(result.ok, true);
  assert.ok(result.rawToken);
  assert.equal(usedTransaction, true);
  assert.equal(stored?.tokenHash, hashPasswordResetToken(result.rawToken));
  assert.deepEqual(auditRecords, [
    {
      eventType: 'AUTH',
      action: 'password_reset_request',
      actorId: baseUser.id,
      branchId: baseUser.branchId,
      targetType: 'user',
      targetId: baseUser.id,
      correlationId: 'req_reset_test',
      ipAddress: '127.0.0.1',
      userAgent: 'node:test',
    },
  ]);

  // Ensure raw token, token hash, passwords, or credential material are NOT logged
  const auditStr = JSON.stringify(auditRecords);
  assert.equal(auditStr.includes(result.rawToken), false);
  assert.equal(auditStr.includes(stored.tokenHash), false);
  assert.equal(auditStr.includes('somehash'), false);
});
