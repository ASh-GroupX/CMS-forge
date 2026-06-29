import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PortalController } from '../apps/api/src/modules/portal/portal.controller.ts';
import { PortalService } from '../apps/api/src/modules/portal/portal.service.ts';

const ComplaintStatus = {
  SUBMITTED: 'SUBMITTED',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
};
const CommentVisibility = { PUBLIC: 'PUBLIC' };
const PortalVerificationStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  EXPIRED: 'EXPIRED',
};
const REFERENCE = 'CMP-PORTAL-L3-0001';
const PHONE = '+966500000001';
const OTP = '123456';
const state = {
  audits: [],
  comments: [],
  complaintReads: 0,
  notifications: [],
  sessions: new Map(),
  status: ComplaintStatus.IN_PROGRESS,
  targetLookups: [],
  verification: null,
};

const controller = new PortalController(new PortalService(complaints(), repository(), notifications(), audit()));

await rejectsPortal(controller.getTracking(undefined, request({ body: { referenceNumber: REFERENCE } })));
await rejectsPortal(controller.submitFollowUp(undefined, { referenceNumber: REFERENCE, body: 'Customer update' }, request()));
assert.equal(state.complaintReads, 0);
assert.equal(state.comments.length, 0);

const otpRequest = await controller.requestTrackingOtp({
  referenceNumber: ` ${REFERENCE} `,
  customerPhone: ` ${PHONE} `,
  customerNumber: 'DMS-CUSTOMER-SECRET',
  auditLogs: true,
  otp: OTP,
}, request());
assert.deepEqual(otpRequest, { ok: true, verificationId: 'ver_1', expiresAt: otpRequest.expiresAt });
assert.equal(otpRequest.expiresAt, state.verification.expiresAt.toISOString());
assertSafeJson(otpRequest, ['DMS-CUSTOMER-SECRET', OTP, 'otpHash', 'sessionToken', 'sessionHash']);
assert.deepEqual(state.targetLookups, [{ referenceNumber: REFERENCE, customerPhone: PHONE }]);
assertSafeJson(state.notifications[0], ['DMS-CUSTOMER-SECRET', OTP, 'otpHash', 'sessionToken', 'sessionHash']);

await rejectsPortal(controller.getTracking('unverified-token', request()));
await rejectsPortal(controller.verifyTrackingOtp({ verificationId: 'ver_1', otp: '000000' }, request()));
assert.equal(state.sessions.size, 0);

const { session } = await controller.verifyTrackingOtp({ verificationId: 'ver_1', otp: OTP }, request());
assert.match(session.sessionToken, /^[A-Za-z0-9_-]{43}$/);
assertSafeJson(session, ['sessionHash', OTP, 'otpHash']);

addExpiredSession('expired-token');
const readsBeforeExpired = state.complaintReads;
await rejectsPortal(controller.getTracking('expired-token', request()));
await rejectsPortal(controller.submitFollowUp('expired-token', { body: 'Expired write' }, request()));
assert.equal(state.complaintReads, readsBeforeExpired);

const tracking = await controller.getTracking(session.sessionToken, request({ body: { referenceNumber: REFERENCE } }));
assert.deepEqual(tracking, {
  complaint: {
    referenceNumber: REFERENCE,
    status: ComplaintStatus.IN_PROGRESS,
    createdAt: '2026-06-29T08:00:00.000Z',
    updatedAt: '2026-06-29T09:00:00.000Z',
    timeline: [{ fromStatus: null, toStatus: ComplaintStatus.SUBMITTED, action: 'SUBMIT', createdAt: '2026-06-29T08:01:00.000Z' }],
  },
});
assertSafeJson(tracking, blockedPortalFields());

assert.deepEqual(await controller.submitFollowUp(session.sessionToken, {
  body: ' Customer public update ',
  referenceNumber: REFERENCE,
  visibility: 'INTERNAL',
  actorId: 'usr_staff',
}, request({ correlationId: 'req_follow' })), { ok: true });
assert.deepEqual(state.comments[0], {
  complaintId: 'cmp_1',
  body: 'Customer public update',
  visibility: CommentVisibility.PUBLIC,
  actorId: null,
  correlationId: 'req_follow',
  ipAddress: '203.0.113.91',
  userAgent: 'node:test',
});

for (const status of [ComplaintStatus.CLOSED, ComplaintStatus.REJECTED]) {
  state.status = status;
  const count = state.comments.length;
  await rejectsPortal(controller.submitFollowUp(session.sessionToken, { body: 'Too late' }, request()));
  assert.equal(state.comments.length, count);
}

assertSafeJson(state.audits, [OTP, 'otpHash', 'sessionToken', 'sessionHash', 'DMS-CUSTOMER-SECRET', 'staff@example.test']);
console.log('customer portal track proof passed');

function complaints() {
  return {
    findPortalVerificationTarget: async (referenceNumber, customerPhone) => {
      state.targetLookups.push({ referenceNumber, customerPhone });
      return referenceNumber === REFERENCE && customerPhone === PHONE
        ? { complaintId: 'cmp_1', customerId: 'cus_1', phone: PHONE }
        : null;
    },
    getDetail: async (id) => {
      state.complaintReads += 1;
      assert.equal(id, 'cmp_1');
      return complaintDetail();
    },
    createComment: async (input) => {
      state.comments.push(input);
      return { id: 'cmt_1', ...input, createdAt: '2026-06-29T09:30:00.000Z' };
    },
  };
}

function repository() {
  return {
    createVerification: async (data) => {
      assert.match(data.otpHash, /^sha256:[a-f0-9]{32}:[a-f0-9]{64}$/);
      state.verification = { id: 'ver_1', complaintId: data.complaintId, customerId: data.customerId, otpHash: testOtpHash(OTP), status: PortalVerificationStatus.PENDING, attempts: 0, expiresAt: new Date(Date.now() + 60_000) };
      return { ...data, ...state.verification, createdAt: new Date('2026-06-29T08:05:00.000Z') };
    },
    findVerificationChallenge: async (id) => id === state.verification?.id ? state.verification : null,
    transaction: async (work) => work({}),
    recordFailedAttempt: async () => ({ attempts: ++state.verification.attempts, status: state.verification.status }),
    markExpired: async () => ({ status: PortalVerificationStatus.EXPIRED }),
    markVerified: async () => { state.verification.status = PortalVerificationStatus.VERIFIED; },
    createSession: async (data) => {
      const session = { id: 'ses_1', complaintId: data.complaintId, customerId: data.customerId, expiresAt: data.expiresAt };
      state.sessions.set(data.sessionHash, session);
      return { ...data, ...session, lastSeenAt: new Date('2026-06-29T08:06:00.000Z'), createdAt: new Date('2026-06-29T08:06:00.000Z') };
    },
    findValidSession: async (sessionHash) => {
      const session = state.sessions.get(sessionHash);
      return session && session.expiresAt.getTime() > Date.now() ? session : null;
    },
  };
}

function notifications() {
  return { queueInternal: async (input) => { state.notifications.push(input); return { id: 'notif_1', ...input }; } };
}

function audit() {
  return { record: async (input) => { state.audits.push(input); } };
}

function complaintDetail() {
  return {
    referenceNumber: REFERENCE,
    status: state.status,
    createdAt: '2026-06-29T08:00:00.000Z',
    updatedAt: '2026-06-29T09:00:00.000Z',
    branchId: 'branch_main',
    ownerId: 'usr_staff',
    subject: 'Internal staff subject',
    description: 'Customer description',
    statusHistory: [{ fromStatus: null, toStatus: ComplaintStatus.SUBMITTED, action: 'SUBMIT', actorId: 'usr_staff', reason: 'internal note', correlationId: 'req_internal', createdAt: '2026-06-29T08:01:00.000Z' }],
    internalComments: [{ body: 'staff only note', author: { email: 'staff@example.test' } }],
    auditLogs: [{ action: 'internal', actorId: 'usr_staff' }],
    dmsCustomerCode: 'DMS-CUSTOMER-SECRET',
    unrelatedComplaints: [{ referenceNumber: 'CMP-UNRELATED-0002' }],
    otpHash: 'sha256:secret',
    sessionHash: 'sha256:session',
    sessionToken: 'portal_token',
  };
}

function request(overrides = {}) {
  return {
    body: {},
    correlationId: 'req_portal_l3',
    headers: { 'x-forwarded-for': '203.0.113.91, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.91' },
    ...overrides,
  };
}

function addExpiredSession(token) {
  state.sessions.set(sessionHash(token), { id: 'ses_expired', complaintId: 'cmp_1', customerId: 'cus_1', expiresAt: new Date('2000-01-01T00:00:00.000Z') });
}

async function rejectsPortal(promise) {
  await assert.rejects(promise, (error) => error?.code === 'PORTAL_VERIFICATION_FAILED');
}

function testOtpHash(otp) {
  const salt = '0123456789abcdef0123456789abcdef';
  return `sha256:${salt}:${createHash('sha256').update(`${salt}:${otp}`).digest('hex')}`;
}

function sessionHash(token) {
  return `sha256:${createHash('sha256').update(token).digest('hex')}`;
}

function blockedPortalFields() {
  return ['Internal staff subject', 'internal note', 'description', 'statusHistory', 'actorId', 'reason', 'ownerId', 'branch_main', 'DMS-CUSTOMER-SECRET', 'auditLogs', 'internalComments', 'staff@example.test', 'CMP-UNRELATED-0002', 'sessionToken', 'sessionHash', 'otpHash', OTP];
}

function assertSafeJson(value, blocked) {
  const body = JSON.stringify(value);
  for (const text of blocked) assert.equal(body.includes(text), false, `leaked ${text}`);
}
