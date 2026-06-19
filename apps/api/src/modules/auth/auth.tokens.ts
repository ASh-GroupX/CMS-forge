import { createHash } from 'node:crypto';

export const STAFF_SESSION_TTL_SECONDS = 60 * 60 * 8;

const STAFF_SESSION_COOKIE = 'cms_staff_session';

export function hashStaffSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

export function serializeStaffSessionCookie(token: string, expiresAt: Date, secure: boolean): string {
  const parts = [
    `${STAFF_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${STAFF_SESSION_TTL_SECONDS}`,
    `Expires=${expiresAt.toUTCString()}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function serializeExpiredStaffSessionCookie(secure: boolean): string {
  const parts = [
    `${STAFF_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}
