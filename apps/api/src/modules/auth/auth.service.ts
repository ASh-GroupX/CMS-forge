import { HttpStatus } from '@nestjs/common';
import argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { AuditService } from '../../core/audit.service.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import { AuthRepository } from './auth.repository.js';
import type { StaffAuthRecord } from './auth.repository.js';

const STAFF_SESSION_COOKIE = 'cms_staff_session';
const STAFF_SESSION_TTL_SECONDS = 60 * 60 * 8;

type AuthStore = Pick<
  AuthRepository,
  'findStaffByIdentifier' | 'createStaffSession' | 'findStaffSessionByTokenHash' | 'revokeStaffSession'
> &
  Partial<Pick<AuthRepository, 'transaction'>>;

export type AuthAuditContext = Pick<
  AuditRecordInput,
  'correlationId' | 'ipAddress' | 'userAgent'
>;

export type VerifyCredentialsInput = {
  identifier: string;
  password: string;
  audit?: AuthAuditContext;
};

export type StaffAuthClaims = {
  userId: string;
  email: string;
  nameEn: string;
  nameAr: string;
  roleCode: StaffAuthRecord['role']['code'];
  branchId: string | null;
};

export type CreateStaffSessionInput = {
  userId: string;
  branchId?: string | null;
  now?: Date;
  secureCookie?: boolean;
  audit?: AuthAuditContext;
};

export type StaffSessionCookie = {
  cookie: string;
  expiresAt: Date;
};

export type StaffSessionClaims = StaffAuthClaims & {
  sessionId: string;
};

export class AuthService {
  constructor(
    private readonly authRepository: AuthStore & Pick<AuthRepository, 'transaction'>,
    private readonly auditService?: AuditService,
  ) {}

  async verifyCredentials(input: VerifyCredentialsInput): Promise<StaffAuthClaims> {
    try {
      const identifier = input.identifier.trim().toLowerCase();
      const user = identifier ? await this.authRepository.findStaffByIdentifier(identifier) : null;

      if (!user?.passwordHash || !input.password) {
        throw authDenied('AUTH_INVALID_CREDENTIALS');
      }

      if (!user.isActive || user.lockedAt) {
        throw authDenied('AUTH_LOCKED_OR_INACTIVE');
      }

      if (!(await argon2.verify(user.passwordHash, input.password))) {
        throw authDenied('AUTH_INVALID_CREDENTIALS');
      }

      return {
        userId: user.id,
        email: user.email,
        nameEn: user.nameEn,
        nameAr: user.nameAr,
        roleCode: user.role.code,
        branchId: user.branchId,
      };
    } catch (error) {
      await this.recordAuthAudit({
        action: 'login_failure',
        targetType: 'user',
        metadata: { reason: error instanceof AppException ? error.code : 'UNKNOWN' },
        ...input.audit,
      });
      throw error;
    }
  }

  async createStaffSession(input: CreateStaffSessionInput): Promise<StaffSessionCookie> {
    const now = input.now ?? new Date();
    const expiresAt = new Date(now.getTime() + STAFF_SESSION_TTL_SECONDS * 1000);
    const token = randomBytes(32).toString('base64url');

    const sessionInput = {
      userId: input.userId,
      tokenHash: hashStaffSessionToken(token),
      expiresAt,
    };

    if (input.audit && this.auditService && this.authRepository.transaction) {
      await this.authRepository.transaction(async (client) => {
        await this.authRepository.createStaffSession(sessionInput, client);
        await this.recordAuthAudit(
          {
            action: 'login_success',
            actorId: input.userId,
            branchId: input.branchId ?? null,
            targetType: 'user',
            targetId: input.userId,
            ...input.audit,
          },
          client,
        );
      });
    } else {
      await this.authRepository.createStaffSession(sessionInput);
    }

    return {
      cookie: serializeStaffSessionCookie(token, expiresAt, Boolean(input.secureCookie)),
      expiresAt,
    };
  }

  async validateStaffSession(token: string, now = new Date()): Promise<StaffSessionClaims> {
    if (!token.trim()) {
      throw authDenied('AUTH_INVALID_CREDENTIALS');
    }

    const session = await this.authRepository.findStaffSessionByTokenHash(hashStaffSessionToken(token));
    if (!session || session.revokedAt || session.expiresAt <= now) {
      throw authDenied('AUTH_INVALID_CREDENTIALS');
    }

    if (!session.user.isActive || session.user.lockedAt) {
      throw authDenied('AUTH_LOCKED_OR_INACTIVE');
    }

    return {
      sessionId: session.id,
      userId: session.user.id,
      email: session.user.email,
      nameEn: session.user.nameEn,
      nameAr: session.user.nameAr,
      roleCode: session.user.role.code,
      branchId: session.user.branchId,
    };
  }

  async logoutStaffSession(token: string, secureCookie = false, now = new Date()): Promise<string> {
    return this.logoutStaffSessionWithAudit(token, secureCookie, now);
  }

  async logoutStaffSessionWithAudit(
    token: string,
    secureCookie = false,
    now = new Date(),
    audit?: AuthAuditContext,
  ): Promise<string> {
    const tokenHash = token.trim() ? hashStaffSessionToken(token) : '';
    const session = tokenHash ? await this.authRepository.findStaffSessionByTokenHash(tokenHash) : null;

    if (token.trim() && audit && this.auditService && this.authRepository.transaction) {
      await this.authRepository.transaction(async (client) => {
        await this.authRepository.revokeStaffSession(tokenHash, now, client);
        await this.recordAuthAudit(
          {
            action: 'logout',
            actorId: session?.user.id ?? null,
            branchId: session?.user.branchId ?? null,
            targetType: 'staff_session',
            targetId: session?.id ?? null,
            ...audit,
          },
          client,
        );
      });
    } else if (token.trim()) {
      await this.authRepository.revokeStaffSession(tokenHash, now);
    } else if (audit) {
      await this.recordAuthAudit({
        action: 'logout',
        targetType: 'staff_session',
        ...audit,
      });
    }

    return serializeExpiredStaffSessionCookie(secureCookie);
  }

  private async recordAuthAudit(
    input: Omit<AuditRecordInput, 'eventType'>,
    client?: Parameters<AuditService['record']>[1],
  ): Promise<void> {
    await this.auditService?.record({ eventType: 'AUTH', ...input }, client);
  }
}

function authDenied(code: 'AUTH_INVALID_CREDENTIALS' | 'AUTH_LOCKED_OR_INACTIVE'): AppException {
  return new AppException(code, 'Invalid credentials', HttpStatus.UNAUTHORIZED);
}

export function hashStaffSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

function serializeStaffSessionCookie(token: string, expiresAt: Date, secure: boolean): string {
  const parts = [
    `${STAFF_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${STAFF_SESSION_TTL_SECONDS}`,
    `Expires=${expiresAt.toUTCString()}`,
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function serializeExpiredStaffSessionCookie(secure: boolean): string {
  const parts = [
    `${STAFF_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];

  if (secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
}
