import { HttpStatus, Injectable } from '@nestjs/common';
import { ComplaintTransitionRequestSource } from '@prisma/client';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { ComplaintsService } from '../complaints/complaints.service.js';
import type { ComplaintCreationResult, CreateInternalComplaintInput } from '../complaints/complaints.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PortalRepository } from './portal.repository.js';
import type { PortalVerificationChallengeRecord } from './portal.repository.js';

export type SubmitPortalComplaintInput = Omit<CreateInternalComplaintInput, 'actorId' | 'requestSource' | 'customerNumber'>;
export type RequestPortalOtpInput = { referenceNumber: string; customerPhone: string; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };
export type VerifyPortalOtpInput = { verificationId: string; otp: string; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };
export type PortalTrackingInput = { sessionToken: string; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };
export type PortalOtpRequestResult = { ok: true };
export type PortalSessionResult = { sessionToken: string; expiresAt: string };
export type PortalTrackingResult = { referenceNumber: string; status: string; createdAt: string; updatedAt: string; timeline: Array<{ fromStatus: string | null; toStatus: string; action: string | null; createdAt: string }> };

const OTP_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

@Injectable()
export class PortalService {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly portalRepository: PortalRepository,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async submitComplaint(input: SubmitPortalComplaintInput): Promise<ComplaintCreationResult> {
    return this.complaintsService.createInternal({
      ...input,
      actorId: null,
      customerNumber: null,
      requestSource: ComplaintTransitionRequestSource.CUSTOMER_PORTAL,
    });
  }

  async requestTrackingOtp(input: RequestPortalOtpInput): Promise<PortalOtpRequestResult> {
    const referenceNumber = requiredText(input.referenceNumber);
    const customerPhone = requiredText(input.customerPhone);
    const target = await this.complaintsService.findPortalVerificationTarget(referenceNumber, customerPhone);
    if (!target) throw verificationFailed();

    const verification = await this.portalRepository.createVerification({
      complaintId: target.complaintId,
      customerId: target.customerId,
      phone: target.phone,
      otpHash: hashOtp(generateOtp()),
      ipAddress: input.ipAddress ?? null,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    await this.notificationsService.queueInternal({
      complaintId: target.complaintId,
      templateCode: 'portal.verification.requested.internal',
      locale: 'en',
      payload: { verificationId: verification.id, referenceNumber, expiresAt: verification.expiresAt.toISOString() },
    });
    return { ok: true };
  }

  async verifyTrackingOtp(input: VerifyPortalOtpInput): Promise<PortalSessionResult> {
    const verificationId = requiredText(input.verificationId);
    const otp = requiredText(input.otp);
    const verification = await this.portalRepository.findVerificationChallenge(verificationId);
    if (!verification) {
      await this.auditService.record(portalUnknownAudit(verificationId, input, 'unknown_verification'));
      throw verificationFailed();
    }
    if (verification.status !== 'PENDING') {
      await this.auditService.record(portalAudit('portal_otp_failed', verification, input, { reason: 'not_pending', status: verification.status }));
      throw verificationFailed();
    }
    if (verification.attempts >= MAX_OTP_ATTEMPTS) {
      await this.auditService.record(portalAudit('portal_otp_failed', verification, input, { reason: 'attempts_exhausted', attempts: verification.attempts, status: verification.status }));
      throw verificationFailed();
    }
    if (verification.expiresAt.getTime() <= Date.now()) {
      await this.expireVerification(verification, input);
      throw verificationFailed();
    }
    if (!verifyOtpHash(otp, verification.otpHash)) {
      await this.recordFailedOtp(verification, input);
      throw verificationFailed();
    }

    const sessionToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = await this.portalRepository.transaction(async (client) => {
      await this.portalRepository.markVerified(verification.id, client);
      const created = await this.portalRepository.createSession({ complaintId: verification.complaintId, customerId: verification.customerId, sessionHash: hashSessionToken(sessionToken), expiresAt }, client);
      await this.auditService.record(portalAudit('portal_otp_verified', verification, input, { sessionId: created.id, expiresAt: created.expiresAt.toISOString() }), client);
      return created;
    });
    return { sessionToken, expiresAt: session.expiresAt.toISOString() };
  }

  async getTracking(input: PortalTrackingInput): Promise<PortalTrackingResult> {
    const session = await this.portalRepository.findValidSession(hashSessionToken(requiredText(input.sessionToken)));
    if (!session) throw verificationFailed();
    try {
      const complaint = await this.complaintsService.getDetail(session.complaintId);
      return {
        referenceNumber: complaint.referenceNumber,
        status: complaint.status,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
        timeline: complaint.statusHistory.map(({ fromStatus, toStatus, action, createdAt }) => ({ fromStatus, toStatus, action, createdAt })),
      };
    } catch (error) {
      if (error instanceof AppException && error.code === 'COMPLAINT_NOT_FOUND') throw verificationFailed();
      throw error;
    }
  }

  private async expireVerification(verification: PortalVerificationChallengeRecord, input: VerifyPortalOtpInput): Promise<void> {
    await this.portalRepository.transaction(async (client) => {
      const result = await this.portalRepository.markExpired(verification.id, client);
      await this.auditService.record(portalAudit('portal_otp_expired', verification, input, { status: result.status }), client);
    });
  }

  private async recordFailedOtp(verification: PortalVerificationChallengeRecord, input: VerifyPortalOtpInput): Promise<void> {
    await this.portalRepository.transaction(async (client) => {
      const result = await this.portalRepository.recordFailedAttempt(verification.id, verification.attempts + 1 >= MAX_OTP_ATTEMPTS, client);
      await this.auditService.record(portalAudit('portal_otp_failed', verification, input, { status: result.status, attempts: result.attempts }), client);
    });
  }
}

function generateOtp(): string { return String(randomInt(0, 1_000_000)).padStart(6, '0'); }

function hashOtp(otp: string): string {
  const salt = randomBytes(16).toString('hex');
  return `sha256:${salt}:${createHash('sha256').update(`${salt}:${otp}`).digest('hex')}`;
}

function verifyOtpHash(otp: string, hash: string): boolean {
  const [, salt, digest] = hash.split(':');
  if (!salt || !digest) return false;
  const expected = Buffer.from(digest, 'hex');
  const actual = Buffer.from(createHash('sha256').update(`${salt}:${otp}`).digest('hex'), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashSessionToken(token: string): string {
  return `sha256:${createHash('sha256').update(token).digest('hex')}`;
}

function requiredText(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  throw verificationFailed();
}

function verificationFailed(): AppException {
  return new AppException('PORTAL_VERIFICATION_FAILED', 'Portal verification failed', HttpStatus.BAD_REQUEST);
}

function portalAudit(action: string, verification: PortalVerificationChallengeRecord, input: VerifyPortalOtpInput, metadata: Record<string, unknown>) {
  return {
    eventType: 'SECURITY' as const,
    action,
    actorId: null,
    branchId: null,
    targetType: 'portal_verification',
    targetId: verification.id,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: { complaintId: verification.complaintId, customerId: verification.customerId, ...metadata },
  };
}

function portalUnknownAudit(verificationId: string, input: VerifyPortalOtpInput, reason: string) {
  return {
    eventType: 'SECURITY' as const,
    action: 'portal_otp_failed',
    actorId: null,
    branchId: null,
    targetType: 'portal_verification',
    targetId: verificationId,
    correlationId: input.correlationId ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    metadata: { reason },
  };
}
