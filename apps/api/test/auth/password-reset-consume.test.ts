import assert from 'node:assert/strict';
import test from 'node:test';
import argon2 from 'argon2';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { AuthService, hashPasswordResetToken } from '../../src/modules/auth/auth.service.ts';
import type { PasswordResetTokenRecord } from '../../src/modules/auth/auth.repository.ts';

const rawToken = 'reset-token-raw-value';
const oldHash = '$argon2id$old';
const validPassword = 'new-valid-password';
const now = new Date('2026-06-19T12:00:00.000Z');

const baseToken: PasswordResetTokenRecord = {
  id: 'reset_token_1',
  userId: 'usr_admin',
  expiresAt: new Date('2026-06-19T12:15:00.000Z'),
  consumedAt: null,
  user: {
    id: 'usr_admin',
    branchId: 'branch_main',
    isActive: true,
    lockedAt: null,
  },
};

test('password reset consume updates hash, consumes token, and audits without credential material', async () => {
  const auditRecords: AuditRecordInput[] = [];
  let passwordHash = oldHash;
  let consumedAt: Date | null = null;
  let usedTransaction = false;

  const service = serviceFor({
    token: baseToken,
    auditRecords,
    consume: async (_tokenId, _userId, newPasswordHash, consumedNow) => {
      passwordHash = newPasswordHash;
      consumedAt = consumedNow;
      return true;
    },
    transaction: async (work) => {
      usedTransaction = true;
      return work({} as never);
    },
  });

  const result = await service.consumePasswordReset({
    token: rawToken,
    newPassword: validPassword,
    now,
    audit: { correlationId: 'req_reset_complete', ipAddress: '127.0.0.1', userAgent: 'node:test' },
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(usedTransaction, true);
  assert.equal(consumedAt, now);
  assert.notEqual(passwordHash, oldHash);
  assert.equal(await argon2.verify(passwordHash, validPassword), true);
  assert.deepEqual(auditRecords, [
    {
      eventType: 'AUTH',
      action: 'password_reset_complete',
      actorId: baseToken.userId,
      branchId: baseToken.user.branchId,
      targetType: 'user',
      targetId: baseToken.userId,
      correlationId: 'req_reset_complete',
      ipAddress: '127.0.0.1',
      userAgent: 'node:test',
    },
  ]);

  const auditJson = JSON.stringify(auditRecords);
  assert.equal(auditJson.includes(rawToken), false);
  assert.equal(auditJson.includes(hashPasswordResetToken(rawToken)), false);
  assert.equal(auditJson.includes(validPassword), false);
  assert.equal(auditJson.includes(passwordHash), false);
});

test('password reset consume returns same denial for consumed, expired, and missing tokens', async () => {
  const cases = [
    { name: 'consumed', token: { ...baseToken, consumedAt: now } },
    { name: 'expired', token: { ...baseToken, expiresAt: now } },
    { name: 'missing', token: null },
  ];

  for (const { name, token } of cases) {
    const auditRecords: AuditRecordInput[] = [];
    let consumeCalls = 0;
    const result = await serviceFor({
      token,
      auditRecords,
      consume: async () => {
        consumeCalls += 1;
        return true;
      },
    }).consumePasswordReset({ token: rawToken, newPassword: validPassword, now });

    assert.deepEqual(result, { ok: false }, name);
    assert.equal(consumeCalls, 0, name);
    assert.equal(auditRecords.length, 0, name);
  }
});

test('weak password is rejected before token lookup or persistence', async () => {
  let lookedUp = false;
  let consumeCalls = 0;
  const service = serviceFor({
    token: baseToken,
    findToken: async () => {
      lookedUp = true;
      return baseToken;
    },
    consume: async () => {
      consumeCalls += 1;
      return true;
    },
  });

  await assert.rejects(
    service.consumePasswordReset({ token: rawToken, newPassword: 'short', now }),
    (error) =>
      error instanceof AppException &&
      error.code === 'VALIDATION_FAILED' &&
      error.fieldErrors[0]?.field === 'newPassword',
  );
  assert.equal(lookedUp, false);
  assert.equal(consumeCalls, 0);
});

function serviceFor(options: {
  token: PasswordResetTokenRecord | null;
  auditRecords?: AuditRecordInput[];
  findToken?: (tokenHash: string) => Promise<PasswordResetTokenRecord | null>;
  consume?: (tokenId: string, userId: string, newPasswordHash: string, now: Date) => Promise<boolean>;
  transaction?: (work: (client: never) => Promise<void>) => Promise<void>;
}) {
  return new AuthService(
    {
      findStaffByIdentifier: async () => null,
      createStaffSession: async () => ({ id: 'session_unused' }),
      findStaffSessionByTokenHash: async () => null,
      revokeStaffSession: async () => 0,
      createPasswordResetToken: async () => ({ id: 'token_unused' }),
      findPasswordResetTokenByHash: options.findToken ?? (async () => options.token),
      consumePasswordResetToken: options.consume ?? (async () => true),
      transaction: options.transaction ?? (async (work) => work({} as never)),
    },
    { record: async (input) => options.auditRecords?.push(input) } as AuditService,
  );
}
