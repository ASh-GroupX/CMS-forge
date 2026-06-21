import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { AuditService } from './audit.service.js';
import { AppException } from './http-kernel.js';

export const CSRF_COOKIE = 'cms_csrf_token';
export const CSRF_HEADER = 'x-csrf-token';
const CSRF_TOKEN_BYTES = 32;
const CSRF_TTL_SECONDS = 60 * 60 * 8;

type CsrfRequest = {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  correlationId?: string;
  url?: string;
  principal?: { userId: string; branchId: string | null };
};

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CsrfRequest>();
    const headerToken = headerValue(request.headers[CSRF_HEADER]);
    const cookieToken = readCookie(headerValue(request.headers.cookie) ?? '', CSRF_COOKIE);

    if (matchesToken(headerToken, cookieToken)) {
      return true;
    }

    await this.auditService.record({
      eventType: 'SECURITY',
      action: 'csrf_rejected',
      actorId: request.principal?.userId ?? null,
      branchId: request.principal?.branchId ?? null,
      targetType: 'api_route',
      targetId: request.url ?? null,
      correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
      ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
        ?? request.socket?.remoteAddress
        ?? null,
      userAgent: headerValue(request.headers['user-agent']),
      metadata: { reason: 'missing_or_mismatch' },
    });

    throw new AppException('CSRF_INVALID', 'Invalid CSRF token', HttpStatus.FORBIDDEN);
  }
}

export function createCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_BYTES).toString('base64url');
}

export function serializeCsrfCookie(token: string, secure: boolean): string {
  return csrfCookieParts(`${CSRF_COOKIE}=${token}`, secure, [`Max-Age=${CSRF_TTL_SECONDS}`]).join('; ');
}

export function serializeExpiredCsrfCookie(secure: boolean): string {
  return csrfCookieParts(`${CSRF_COOKIE}=`, secure, [
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ]).join('; ');
}

function csrfCookieParts(first: string, secure: boolean, extra: string[]): string[] {
  const parts = [first, 'Path=/', 'SameSite=Lax', ...extra];

  if (secure) {
    parts.push('Secure');
  }

  return parts;
}

function matchesToken(headerToken: string | null, cookieToken: string): boolean {
  if (!headerToken || !cookieToken) {
    return false;
  }

  const header = Buffer.from(headerToken);
  const cookie = Buffer.from(cookieToken);
  return header.length === cookie.length && timingSafeEqual(header, cookie);
}

function readCookie(header: string, name: string): string {
  return header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) ?? '';
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
