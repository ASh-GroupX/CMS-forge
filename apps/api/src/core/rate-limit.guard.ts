import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AuditService } from './audit.service.js';
import { AppException } from './http-kernel.js';

export const LOGIN_RATE_LIMIT_STORE = Symbol('LOGIN_RATE_LIMIT_STORE');
export const LOGIN_RATE_LIMIT_ATTEMPTS = 5;
export const LOGIN_RATE_LIMIT_WINDOW_MS = 60_000;

export type LoginRateLimitStore = {
  increment(key: string, now: number): { count: number; resetAt: number };
};

type LoginRequest = {
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  correlationId?: string;
};

@Injectable()
export class InMemoryLoginRateLimitStore implements LoginRateLimitStore {
  private readonly windows = new Map<string, { count: number; resetAt: number }>();

  increment(key: string, now: number): { count: number; resetAt: number } {
    const current = this.windows.get(key);

    if (!current || current.resetAt <= now) {
      const next = { count: 1, resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS };
      this.windows.set(key, next);
      return next;
    }

    current.count += 1;
    return current;
  }
}

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  constructor(@Inject(LOGIN_RATE_LIMIT_STORE) private readonly store: LoginRateLimitStore, private readonly auditService: AuditService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<LoginRequest>();
    const identifier = submittedText(request.body, 'identifier')?.toLowerCase() ?? null;
    return enforceLimit(request, this.store, this.auditService, 'auth_login', 'Too many login attempts', identifier ? ['ip', 'account'] : ['ip'], identifier ? [`account:${identifier}`] : []);
  }
}

@Injectable()
export class PortalSubmissionRateLimitGuard implements CanActivate {
  constructor(@Inject(LOGIN_RATE_LIMIT_STORE) private readonly store: LoginRateLimitStore, private readonly auditService: AuditService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<LoginRequest>();
    const phone = submittedText(request.body, 'customerPhone')?.toLowerCase() ?? null;
    return enforceLimit(request, this.store, this.auditService, 'portal_submission', 'Too many portal submissions', phone ? ['ip', 'phone'] : ['ip'], phone ? [`phone:${phone}`] : []);
  }
}

@Injectable()
export class PortalTrackingOtpRateLimitGuard implements CanActivate {
  constructor(@Inject(LOGIN_RATE_LIMIT_STORE) private readonly store: LoginRateLimitStore, private readonly auditService: AuditService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<LoginRequest>();
    const phone = submittedText(request.body, 'customerPhone')?.toLowerCase() ?? null;
    const reference = submittedText(request.body, 'referenceNumber')?.toLowerCase() ?? null;
    const extraKeys = [...(phone ? [`phone:${phone}`] : []), ...(reference ? [`reference:${reference}`] : [])];
    const keyTypes = ['ip', ...(phone ? ['phone'] : []), ...(reference ? ['reference'] : [])];
    return enforceLimit(request, this.store, this.auditService, 'portal_tracking_otp', 'Too many portal tracking OTP attempts', keyTypes, extraKeys);
  }
}

async function enforceLimit(
  request: LoginRequest,
  store: LoginRateLimitStore,
  auditService: AuditService,
  targetType: string,
  message: string,
  keyTypes: string[],
  extraKeys: string[],
): Promise<boolean> {
  const ipAddress = clientIp(request);
  const keys = [`ip:${ipAddress ?? 'unknown'}`, ...extraKeys];
  const now = Date.now();
  if (!keys.some((key) => store.increment(key, now).count > LOGIN_RATE_LIMIT_ATTEMPTS)) return true;

  await auditService.record({
    eventType: 'SECURITY',
    action: 'rate_limit_triggered',
    targetType,
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress,
    userAgent: headerValue(request.headers['user-agent']),
    metadata: { limit: LOGIN_RATE_LIMIT_ATTEMPTS, windowSeconds: LOGIN_RATE_LIMIT_WINDOW_MS / 1000, keyTypes },
  });
  throw new AppException('RATE_LIMITED', message, HttpStatus.TOO_MANY_REQUESTS);
}

function submittedText(body: unknown, field: string): string | null {
  if (!body || typeof body !== 'object') return null;
  const value = (body as Record<string, unknown>)[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function clientIp(request: LoginRequest): string | null {
  return headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
    ?? request.socket?.remoteAddress
    ?? null;
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
