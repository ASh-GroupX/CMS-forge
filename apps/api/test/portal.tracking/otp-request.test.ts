import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import { ComplaintStatus, PortalVerificationStatus } from '@prisma/client';
import { createHash } from 'node:crypto';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { InMemoryLoginRateLimitStore, LOGIN_RATE_LIMIT_ATTEMPTS, PortalTrackingOtpRateLimitGuard } from '../../src/core/rate-limit.guard.ts';
import type { NotificationsService } from '../../src/modules/notifications/notifications.service.ts';
import { PortalController } from '../../src/modules/portal/portal.controller.ts';
import { PortalRepository } from '../../src/modules/portal/portal.repository.ts';
import { PortalService } from '../../src/modules/portal/portal.service.ts';

type PortalRequest = { body?: unknown; headers: Record<string, string | string[] | undefined>; socket: { remoteAddress?: string }; correlationId?: string };

test('portal tracking OTP route delegates only reference, phone, and request context', async () => {
  const calls: unknown[] = [];
  const controller = new PortalController({
    requestTrackingOtp: async (input) => {
      calls.push(input);
      return { ok: true };
    },
  } as PortalService);

  const response = await controller.requestTrackingOtp({
    referenceNumber: ' CMP-000010 ',
    customerPhone: ' +966500000001 ',
    customerNumber: 'DMS-SECRET',
    auditLogs: true,
  }, request());

  assert.deepEqual(response, { ok: true });
  assert.deepEqual(calls[0], {
    referenceNumber: 'CMP-000010',
    customerPhone: '+966500000001',
    correlationId: 'req_portal_otp',
    ipAddress: '203.0.113.91',
    userAgent: 'node:test',
  });
  assert.equal('customerNumber' in (calls[0] as Record<string, unknown>), false);
});

test('portal tracking OTP route uses the tracking rate limit guard', () => {
  const guards = Reflect.getMetadata(GUARDS_METADATA, PortalController.prototype.requestTrackingOtp) as Array<{ name: string }>;
  assert.deepEqual(guards.map((guard) => guard.name), ['PortalTrackingOtpRateLimitGuard']);
});

test('portal tracking OTP request persists hash before queueing notification metadata', async () => {
  const events: string[] = [];
  const writes: Array<{ otpHash: string; attempts?: number; ipAddress?: string | null }> = [];
  const notifications: unknown[] = [];
  const service = new PortalService(
    { findPortalVerificationTarget: async () => { events.push('lookup'); return { complaintId: 'cmp_1', customerId: 'cus_1', phone: '+966500000001' }; } } as never,
    { createVerification: async (data) => { events.push('persist'); writes.push(data); return { ...data, id: 'ver_1', status: PortalVerificationStatus.PENDING, attempts: 0, createdAt: new Date('2026-06-19T10:00:00.000Z') }; } } as never,
    { queueInternal: async (input) => { events.push('queue'); notifications.push(input); return {} as never; } } as NotificationsService,
    { record: async () => undefined } as AuditService,
  );

  await assert.doesNotReject(service.requestTrackingOtp({ referenceNumber: 'CMP-000010', customerPhone: '+966500000001', ipAddress: '203.0.113.91' }));

  assert.deepEqual(events, ['lookup', 'persist', 'queue']);
  assert.match(writes[0].otpHash, /^sha256:[a-f0-9]{32}:[a-f0-9]{64}$/);
  assert.doesNotMatch(writes[0].otpHash, /^\d{6}$/);
  assert.equal(writes[0].ipAddress, '203.0.113.91');
  assert.deepEqual(notifications[0], {
    complaintId: 'cmp_1',
    templateCode: 'portal.verification.requested.internal',
    locale: 'en',
    payload: { verificationId: 'ver_1', referenceNumber: 'CMP-000010', expiresAt: (notifications[0] as { payload: { expiresAt: string } }).payload.expiresAt },
  });
  assert.equal(JSON.stringify(notifications[0]).includes('otpHash'), false);
});

test('portal tracking OTP denial does not persist or queue notification', async () => {
  let persisted = false;
  let queued = false;
  const service = new PortalService(
    { findPortalVerificationTarget: async () => null } as never,
    { createVerification: async () => { persisted = true; throw new Error('should not persist'); } } as never,
    { queueInternal: async () => { queued = true; throw new Error('should not queue'); } } as unknown as NotificationsService,
    { record: async () => undefined } as AuditService,
  );

  await assert.rejects(
    service.requestTrackingOtp({ referenceNumber: 'CMP-404', customerPhone: '+966500000404' }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED' && error.getStatus() === 400,
  );
  assert.equal(persisted, false);
  assert.equal(queued, false);
});

test('portal repository creates pending verification rows with hash-only persistence fields', async () => {
  const calls: unknown[] = [];
  const repository = new PortalRepository({
    portalVerification: {
      create: async (query: unknown) => {
        calls.push(query);
        return { id: 'ver_1', complaintId: 'cmp_1', customerId: 'cus_1', phone: '+966500000001', otpHash: 'sha256:salt:digest', status: PortalVerificationStatus.PENDING, attempts: 0, ipAddress: '203.0.113.91', expiresAt: new Date('2026-06-19T10:05:00.000Z'), createdAt: new Date('2026-06-19T10:00:00.000Z') };
      },
    },
  } as never);

  await repository.createVerification({ complaintId: 'cmp_1', customerId: 'cus_1', phone: '+966500000001', otpHash: 'sha256:salt:digest', ipAddress: '203.0.113.91', expiresAt: new Date('2026-06-19T10:05:00.000Z') });

  assert.deepEqual(calls[0], {
    data: { complaintId: 'cmp_1', customerId: 'cus_1', phone: '+966500000001', otpHash: 'sha256:salt:digest', ipAddress: '203.0.113.91', expiresAt: new Date('2026-06-19T10:05:00.000Z'), status: PortalVerificationStatus.PENDING, attempts: 0 },
    select: { id: true, complaintId: true, customerId: true, phone: true, otpHash: true, status: true, attempts: true, ipAddress: true, expiresAt: true, createdAt: true },
  });
});

test('portal tracking OTP rate limit denies repeated reference phone and ip attempts safely', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new PortalTrackingOtpRateLimitGuard(new InMemoryLoginRateLimitStore(), { record: async (input) => auditRecords.push(input) } as AuditService);
  const req = request();

  for (let index = 0; index < LOGIN_RATE_LIMIT_ATTEMPTS; index += 1) {
    assert.equal(await guard.canActivate(context(req)), true);
  }

  await assert.rejects(
    guard.canActivate(context(req)),
    (error: unknown) => error instanceof AppException && error.code === 'RATE_LIMITED' && error.getStatus() === 429,
  );
  assert.deepEqual(auditRecords[0], {
    eventType: 'SECURITY',
    action: 'rate_limit_triggered',
    targetType: 'portal_tracking_otp',
    correlationId: 'req_portal_otp',
    ipAddress: '203.0.113.91',
    userAgent: 'node:test',
    metadata: { limit: LOGIN_RATE_LIMIT_ATTEMPTS, windowSeconds: 60, keyTypes: ['ip', 'phone', 'reference'] },
  });
});

function request(input: Partial<PortalRequest> = {}): PortalRequest {
  return {
    body: { referenceNumber: 'CMP-000010', customerPhone: '+966500000001' },
    correlationId: 'req_portal_otp',
    headers: { 'x-forwarded-for': '203.0.113.91, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.91' },
    ...input,
  };
}

function context(req: PortalRequest): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => req }), getHandler: () => PortalController.prototype.requestTrackingOtp, getClass: () => PortalController } as ExecutionContext;
}

test('portal tracking OTP verify route delegates only verification id, OTP, and request context', async () => {
  const calls: unknown[] = [];
  const controller = new PortalController({
    verifyTrackingOtp: async (input) => {
      calls.push(input);
      return { sessionToken: 'portal_token', expiresAt: '2026-06-19T10:30:00.000Z' };
    },
  } as PortalService);

  const response = await controller.verifyTrackingOtp({ verificationId: ' ver_1 ', otp: ' 123456 ', customerNumber: 'DMS-SECRET' }, request());

  assert.deepEqual(response, { session: { sessionToken: 'portal_token', expiresAt: '2026-06-19T10:30:00.000Z' } });
  assert.deepEqual(calls[0], { verificationId: 'ver_1', otp: '123456', correlationId: 'req_portal_otp', ipAddress: '203.0.113.91', userAgent: 'node:test' });
  assert.equal('customerNumber' in (calls[0] as Record<string, unknown>), false);
});

test('portal tracking OTP verification marks verified and persists only session token hash', async () => {
  const events: string[] = [];
  const sessions: Array<{ sessionHash: string; expiresAt: Date }> = [];
  const audits: unknown[] = [];
  const service = new PortalService(
    {} as never,
    {
      findVerificationChallenge: async () => challenge({ otpHash: testOtpHash('123456') }),
      transaction: async (work) => work({} as never),
      markVerified: async () => events.push('verified'),
      createSession: async (data) => {
        events.push('session');
        sessions.push(data);
        return { ...data, id: 'ses_1', lastSeenAt: new Date('2026-06-19T10:00:00.000Z'), createdAt: new Date('2026-06-19T10:00:00.000Z') };
      },
    } as never,
    {} as never,
    { record: async (input) => { events.push('audit'); audits.push(input); } } as AuditService,
  );

  const result = await service.verifyTrackingOtp({ verificationId: 'ver_1', otp: '123456', correlationId: 'req_verify', ipAddress: '203.0.113.92' });

  assert.deepEqual(events, ['verified', 'session', 'audit']);
  assert.match(result.sessionToken, /^[A-Za-z0-9_-]{43}$/);
  assert.match(sessions[0].sessionHash, /^sha256:[a-f0-9]{64}$/);
  assert.notEqual(sessions[0].sessionHash.includes(result.sessionToken), true);
  assert.deepEqual(Object.keys(result).sort(), ['expiresAt', 'sessionToken']);
  assert.equal(JSON.stringify(audits[0]).includes('123456'), false);
});

test('portal tracking OTP verification denies wrong OTP and increments attempts without session', async () => {
  let sessionCreated = false;
  const attempts: unknown[] = [];
  const service = new PortalService(
    {} as never,
    {
      findVerificationChallenge: async () => challenge({ otpHash: testOtpHash('123456'), attempts: 4 }),
      transaction: async (work) => work({} as never),
      recordFailedAttempt: async (_id, fail) => { attempts.push({ fail }); return { attempts: 5, status: PortalVerificationStatus.FAILED }; },
      createSession: async () => { sessionCreated = true; throw new Error('should not create session'); },
    } as never,
    {} as never,
    { record: async () => undefined } as AuditService,
  );

  await assert.rejects(
    service.verifyTrackingOtp({ verificationId: 'ver_1', otp: '000000' }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );
  assert.deepEqual(attempts, [{ fail: true }]);
  assert.equal(sessionCreated, false);
});

test('portal tracking OTP verification denies expired verification and marks it expired', async () => {
  let expired = false;
  const service = new PortalService(
    {} as never,
    {
      findVerificationChallenge: async () => challenge({ expiresAt: new Date('2000-01-01T00:00:00.000Z'), otpHash: testOtpHash('123456') }),
      transaction: async (work) => work({} as never),
      markExpired: async () => { expired = true; return { status: PortalVerificationStatus.EXPIRED }; },
    } as never,
    {} as never,
    { record: async () => undefined } as AuditService,
  );

  await assert.rejects(
    service.verifyTrackingOtp({ verificationId: 'ver_1', otp: '123456' }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );
  assert.equal(expired, true);
});

test('portal tracking OTP verification denies exhausted attempts before session issuance', async () => {
  let sessionCreated = false;
  const audits: AuditRecordInput[] = [];
  const service = new PortalService(
    {} as never,
    {
      findVerificationChallenge: async () => challenge({ attempts: 5, otpHash: testOtpHash('123456') }),
      createSession: async () => { sessionCreated = true; throw new Error('should not create session'); },
    } as never,
    {} as never,
    { record: async (input) => { audits.push(input); } } as AuditService,
  );

  await assert.rejects(
    service.verifyTrackingOtp({ verificationId: 'ver_1', otp: '123456', correlationId: 'req_verify', ipAddress: '203.0.113.92' }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );
  assert.equal(sessionCreated, false);
  assert.deepEqual(audits[0], {
    eventType: 'SECURITY',
    action: 'portal_otp_failed',
    actorId: null,
    branchId: null,
    targetType: 'portal_verification',
    targetId: 'ver_1',
    correlationId: 'req_verify',
    ipAddress: '203.0.113.92',
    userAgent: null,
    metadata: { complaintId: 'cmp_1', customerId: 'cus_1', reason: 'attempts_exhausted', attempts: 5, status: PortalVerificationStatus.PENDING },
  });
  assertSafePortalAudit(audits[0], '123456');
});

test('portal tracking OTP verification audits unknown verification denial safely', async () => {
  const audits: AuditRecordInput[] = [];
  const service = new PortalService(
    {} as never,
    { findVerificationChallenge: async () => null } as never,
    {} as never,
    { record: async (input) => { audits.push(input); } } as AuditService,
  );

  await assert.rejects(
    service.verifyTrackingOtp({ verificationId: 'missing_ver', otp: '123456', correlationId: 'req_verify', ipAddress: '203.0.113.92' }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );
  assert.deepEqual(audits[0], {
    eventType: 'SECURITY',
    action: 'portal_otp_failed',
    actorId: null,
    branchId: null,
    targetType: 'portal_verification',
    targetId: 'missing_ver',
    correlationId: 'req_verify',
    ipAddress: '203.0.113.92',
    userAgent: null,
    metadata: { reason: 'unknown_verification' },
  });
  assertSafePortalAudit(audits[0], '123456');
});

test('portal tracking OTP verification audits non-pending verification denial safely', async () => {
  const audits: AuditRecordInput[] = [];
  const service = new PortalService(
    {} as never,
    { findVerificationChallenge: async () => challenge({ status: PortalVerificationStatus.VERIFIED, otpHash: testOtpHash('123456') }) } as never,
    {} as never,
    { record: async (input) => { audits.push(input); } } as AuditService,
  );

  await assert.rejects(
    service.verifyTrackingOtp({ verificationId: 'ver_1', otp: '123456', correlationId: 'req_verify', ipAddress: '203.0.113.92' }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );
  assert.deepEqual(audits[0], {
    eventType: 'SECURITY',
    action: 'portal_otp_failed',
    actorId: null,
    branchId: null,
    targetType: 'portal_verification',
    targetId: 'ver_1',
    correlationId: 'req_verify',
    ipAddress: '203.0.113.92',
    userAgent: null,
    metadata: { complaintId: 'cmp_1', customerId: 'cus_1', reason: 'not_pending', status: PortalVerificationStatus.VERIFIED },
  });
  assertSafePortalAudit(audits[0], '123456');
});

test('portal repository creates session rows with hash-only token persistence', async () => {
  const calls: unknown[] = [];
  const repository = new PortalRepository({
    portalSession: {
      create: async (query: unknown) => {
        calls.push(query);
        return { id: 'ses_1', complaintId: 'cmp_1', customerId: 'cus_1', sessionHash: 'sha256:digest', expiresAt: new Date('2026-06-19T10:30:00.000Z'), lastSeenAt: new Date('2026-06-19T10:00:00.000Z'), createdAt: new Date('2026-06-19T10:00:00.000Z') };
      },
    },
  } as never);

  await repository.createSession({ complaintId: 'cmp_1', customerId: 'cus_1', sessionHash: 'sha256:digest', expiresAt: new Date('2026-06-19T10:30:00.000Z') });

  assert.deepEqual(calls[0], {
    data: { complaintId: 'cmp_1', customerId: 'cus_1', sessionHash: 'sha256:digest', expiresAt: new Date('2026-06-19T10:30:00.000Z') },
    select: { id: true, complaintId: true, customerId: true, sessionHash: true, expiresAt: true, lastSeenAt: true, createdAt: true },
  });
});

test('portal tracking route delegates only portal session token and request context', async () => {
  const calls: unknown[] = [];
  const controller = new PortalController({
    getTracking: async (input) => {
      calls.push(input);
      return { referenceNumber: 'CMP-000010', status: ComplaintStatus.SUBMITTED, createdAt: '2026-06-19T10:00:00.000Z', updatedAt: '2026-06-19T10:10:00.000Z', timeline: [] };
    },
  } as PortalService);

  const response = await controller.getTracking(' portal_token ', request({ body: { referenceNumber: 'CMP-000010' } }));

  assert.deepEqual(response, { complaint: { referenceNumber: 'CMP-000010', status: ComplaintStatus.SUBMITTED, createdAt: '2026-06-19T10:00:00.000Z', updatedAt: '2026-06-19T10:10:00.000Z', timeline: [] } });
  assert.deepEqual(calls[0], { sessionToken: ' portal_token ', correlationId: 'req_portal_otp', ipAddress: '203.0.113.91', userAgent: 'node:test' });
  assert.equal('referenceNumber' in (calls[0] as Record<string, unknown>), false);
});

test('portal tracking returns only portal-safe complaint fields for a valid session', async () => {
  const lookups: string[] = [];
  const service = new PortalService(
    {
      getDetail: async (id) => {
        assert.equal(id, 'cmp_1');
        return {
          id,
          referenceNumber: 'CMP-000010',
          status: ComplaintStatus.IN_PROGRESS,
          severity: 'HIGH',
          subject: 'Internal staff subject',
          branchId: 'branch_main',
          ownerId: 'usr_staff',
          createdAt: '2026-06-19T10:00:00.000Z',
          updatedAt: '2026-06-19T10:10:00.000Z',
          description: 'Customer description',
          incidentAt: '2026-06-19T09:00:00.000Z',
          statusHistory: [{
            fromStatus: null,
            toStatus: ComplaintStatus.SUBMITTED,
            action: 'SUBMIT',
            actorId: 'usr_staff',
            actorRole: 'CR_OFFICER',
            reason: 'internal note',
            correlationId: 'req_internal',
            createdAt: '2026-06-19T10:01:00.000Z',
          }],
        };
      },
    } as never,
    {
      findValidSession: async (sessionHash) => {
        lookups.push(sessionHash);
        return { id: 'ses_1', complaintId: 'cmp_1', customerId: 'cus_1', expiresAt: new Date('2026-06-19T10:30:00.000Z') };
      },
    } as never,
    {} as never,
    { record: async () => undefined } as AuditService,
  );

  const result = await service.getTracking({ sessionToken: 'portal_token' });

  assert.match(lookups[0], /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(result, {
    referenceNumber: 'CMP-000010',
    status: ComplaintStatus.IN_PROGRESS,
    createdAt: '2026-06-19T10:00:00.000Z',
    updatedAt: '2026-06-19T10:10:00.000Z',
    timeline: [{ fromStatus: null, toStatus: ComplaintStatus.SUBMITTED, action: 'SUBMIT', createdAt: '2026-06-19T10:01:00.000Z' }],
  });
  assertPortalTrackingSafe(result);
});

test('portal tracking denies missing or invalid sessions before complaint lookup', async () => {
  let complaintRead = false;
  const service = new PortalService(
    { getDetail: async () => { complaintRead = true; throw new Error('should not read complaint'); } } as never,
    { findValidSession: async () => null } as never,
    {} as never,
    { record: async () => undefined } as AuditService,
  );

  await assert.rejects(
    service.getTracking({ sessionToken: 'portal_token' }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );
  await assert.rejects(
    service.getTracking({ sessionToken: ' ' }),
    (error: unknown) => error instanceof AppException && error.code === 'PORTAL_VERIFICATION_FAILED',
  );
  assert.equal(complaintRead, false);
});

test('portal repository validates sessions by hash without selecting stored hashes', async () => {
  const calls: unknown[] = [];
  const repository = new PortalRepository({
    portalSession: {
      findFirst: async (query: unknown) => {
        calls.push(query);
        return { id: 'ses_1', complaintId: 'cmp_1', customerId: 'cus_1', expiresAt: new Date('2026-06-19T10:30:00.000Z') };
      },
    },
  } as never);

  await repository.findValidSession('sha256:digest', new Date('2026-06-19T10:00:00.000Z'));

  assert.deepEqual(calls[0], {
    where: { sessionHash: 'sha256:digest', expiresAt: { gt: new Date('2026-06-19T10:00:00.000Z') } },
    select: { id: true, complaintId: true, customerId: true, expiresAt: true },
  });
});

function testOtpHash(otp: string): string {
  const salt = '0123456789abcdef0123456789abcdef';
  return `sha256:${salt}:${createHash('sha256').update(`${salt}:${otp}`).digest('hex')}`;
}

function challenge(overrides: Partial<{ otpHash: string; status: PortalVerificationStatus; attempts: number; expiresAt: Date }> = {}) {
  return {
    id: 'ver_1',
    complaintId: 'cmp_1',
    customerId: 'cus_1',
    otpHash: testOtpHash('123456'),
    status: PortalVerificationStatus.PENDING,
    attempts: 0,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

function assertSafePortalAudit(record: AuditRecordInput, otp: string): void {
  const body = JSON.stringify(record);
  assert.equal(body.includes(otp), false);
  assert.equal(body.includes('otpHash'), false);
  assert.equal(body.includes('sessionToken'), false);
  assert.equal(body.includes('sessionHash'), false);
  assert.equal(body.includes('DMS'), false);
  assert.equal(body.includes('internalComments'), false);
  assert.equal(body.includes('auditLogs'), false);
  assert.equal(body.includes('staff'), false);
}

function assertPortalTrackingSafe(record: unknown): void {
  const body = JSON.stringify(record);
  for (const blocked of ['description', 'statusHistory', 'actorId', 'reason', 'ownerId', 'branchId', 'DMS', 'audit', 'sessionToken', 'sessionHash', 'otpHash']) {
    assert.equal(body.includes(blocked), false);
  }
}
