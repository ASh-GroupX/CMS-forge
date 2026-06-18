import { HttpStatus } from '@nestjs/common';
import argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { AppException } from '../../core/http-kernel.js';
import { AuthRepository } from './auth.repository.js';
import type { StaffAuthRecord } from './auth.repository.js';

const STAFF_SESSION_COOKIE = 'cms_staff_session';
const STAFF_SESSION_TTL_SECONDS = 60 * 60 * 8;

type AuthStore = Pick<
  AuthRepository,
  'findStaffByIdentifier' | 'createStaffSession' | 'findStaffSessionByTokenHash' | 'revokeStaffSession'
>;

export type VerifyCredentialsInput = {
  identifier: string;
  password: string;
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
  now?: Date;
  secureCookie?: boolean;
};

export type StaffSessionCookie = {
  cookie: string;
  expiresAt: Date;
};

export type StaffSessionClaims = StaffAuthClaims & {
  sessionId: string;
};

export class AuthService {
  constructor(private readonly authRepository: AuthStore) {}

  async verifyCredentials(input: VerifyCredentialsInput): Promise<StaffAuthClaims> {
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
  }

  async createStaffSession(input: CreateStaffSessionInput): Promise<StaffSessionCookie> {
    const now = input.now ?? new Date();
    const expiresAt = new Date(now.getTime() + STAFF_SESSION_TTL_SECONDS * 1000);
    const token = randomBytes(32).toString('base64url');

    await this.authRepository.createStaffSession({
      userId: input.userId,
      tokenHash: hashStaffSessionToken(token),
      expiresAt,
    });

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
    if (token.trim()) {
      await this.authRepository.revokeStaffSession(hashStaffSessionToken(token), now);
    }

    return serializeExpiredStaffSessionCookie(secureCookie);
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
