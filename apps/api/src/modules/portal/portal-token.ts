import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashOtp(otp: string): string {
  const salt = randomBytes(16).toString('hex');
  return `sha256:${salt}:${createHash('sha256').update(`${salt}:${otp}`).digest('hex')}`;
}

export function hashSessionToken(token: string): string {
  return `sha256:${createHash('sha256').update(token).digest('hex')}`;
}

export function verifyOtpHash(otp: string, hash: string): boolean {
  const [, salt, digest] = hash.split(':');
  if (!salt || !digest) return false;
  const expected = Buffer.from(digest, 'hex');
  const actual = Buffer.from(createHash('sha256').update(`${salt}:${otp}`).digest('hex'), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
