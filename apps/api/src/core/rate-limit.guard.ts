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
  constructor(
    @Inject(LOGIN_RATE_LIMIT_STORE)
    private readonly store: LoginRateLimitStore,
    private readonly auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<LoginRequest>();
    const ipAddress = clientIp(request);
    const keys = [`ip:${ipAddress ?? 'unknown'}`];
    const identifier = submittedIdentifier(request.body);

    if (identifier) {
      keys.push(`account:${identifier}`);
    }

    const now = Date.now();
    const exceeded = keys.some((key) => this.store.increment(key, now).count > LOGIN_RATE_LIMIT_ATTEMPTS);

    if (!exceeded) {
      return true;
    }

    await this.auditService.record({
      eventType: 'SECURITY',
      action: 'rate_limit_triggered',
      targetType: 'auth_login',
      correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
      ipAddress,
      userAgent: headerValue(request.headers['user-agent']),
      metadata: {
        limit: LOGIN_RATE_LIMIT_ATTEMPTS,
        windowSeconds: LOGIN_RATE_LIMIT_WINDOW_MS / 1000,
        keyTypes: identifier ? ['ip', 'account'] : ['ip'],
      },
    });

    throw new AppException('RATE_LIMITED', 'Too many login attempts', HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
export class PortalSubmissionRateLimitGuard implements CanActivate {
  constructor(
    @Inject(LOGIN_RATE_LIMIT_STORE)
    private readonly store: LoginRateLimitStore,
    private readonly auditService: AuditService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<LoginRequest>();
    const ipAddress = clientIp(request);
    const keys = [`ip:${ipAddress ?? 'unknown'}`];
    const phone = submittedPhone(request.body);

    if (phone) {
      keys.push(`phone:${phone}`);
    }

    const now = Date.now();
    const exceeded = keys.some((key) => this.store.increment(key, now).count > LOGIN_RATE_LIMIT_ATTEMPTS);

    if (!exceeded) {
      return true;
    }

    await this.auditService.record({
      eventType: 'SECURITY',
      action: 'rate_limit_triggered',
      targetType: 'portal_submission',
      correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
      ipAddress,
      userAgent: headerValue(request.headers['user-agent']),
      metadata: {
        limit: LOGIN_RATE_LIMIT_ATTEMPTS,
        windowSeconds: LOGIN_RATE_LIMIT_WINDOW_MS / 1000,
        keyTypes: phone ? ['ip', 'phone'] : ['ip'],
      },
    });

    throw new AppException('RATE_LIMITED', 'Too many portal submissions', HttpStatus.TOO_MANY_REQUESTS);
  }
}

function submittedIdentifier(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const value = (body as { identifier?: unknown }).identifier;
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;
}

function submittedPhone(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const value = (body as { customerPhone?: unknown }).customerPhone;
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : null;
}

function clientIp(request: LoginRequest): string | null {
  return headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim()
    ?? request.socket?.remoteAddress
    ?? null;
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
