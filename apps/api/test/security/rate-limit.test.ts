import assert from 'node:assert/strict';
import test from 'node:test';
import type { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { AppException, AppExceptionFilter } from '../../src/core/http-kernel.ts';
import {
  InMemoryLoginRateLimitStore,
  LOGIN_RATE_LIMIT_ATTEMPTS,
  LoginRateLimitGuard,
} from '../../src/core/rate-limit.guard.ts';

type RateLimitRequest = {
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  correlationId?: string;
};

type ErrorEnvelope = {
  error: {
    code: string;
    message: string;
    correlationId: string;
  };
};

function request(input: Partial<RateLimitRequest> = {}): RateLimitRequest {
  return {
    body: { identifier: ' Admin@CMS-Auto.test ', password: 'secret-password' },
    headers: {
      'x-forwarded-for': '203.0.113.10, 10.0.0.1',
      'user-agent': 'node:test',
    },
    socket: { remoteAddress: '198.51.100.20' },
    correlationId: 'req_rate_limit',
    ...input,
  };
}

function context(req: RateLimitRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as ExecutionContext;
}

function guard(auditRecords: AuditRecordInput[]): LoginRateLimitGuard {
  return new LoginRateLimitGuard(
    new InMemoryLoginRateLimitStore(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );
}

function renderError(exception: unknown, req: RateLimitRequest): ErrorEnvelope {
  let body: ErrorEnvelope | undefined;
  const host = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({
        status: (status: number) => {
          assert.equal(status, 429);
          return {
            json: (payload: ErrorEnvelope) => {
              body = payload;
            },
          };
        },
      }),
    }),
  } as unknown as ArgumentsHost;

  new AppExceptionFilter().catch(exception, host);
  assert.ok(body);
  return body;
}

test('login rate limit allows requests under the account and IP limit', async () => {
  const auditRecords: AuditRecordInput[] = [];

  assert.equal(await guard(auditRecords).canActivate(context(request())), true);
  assert.equal(auditRecords.length, 0);
});

test('login rate limit denies over-limit requests and records safe security audit', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const loginGuard = guard(auditRecords);
  const req = request();

  for (let attempt = 0; attempt < LOGIN_RATE_LIMIT_ATTEMPTS; attempt += 1) {
    assert.equal(await loginGuard.canActivate(context(req)), true);
  }

  let thrown: unknown;
  await assert.rejects(
    loginGuard.canActivate(context(req)).catch((error: unknown) => {
      thrown = error;
      throw error;
    }),
    (error: unknown) =>
      error instanceof AppException &&
      error.code === 'RATE_LIMITED' &&
      error.getStatus() === 429,
  );

  assert.equal(auditRecords.length, 1);
  assert.deepEqual(auditRecords[0], {
    eventType: 'SECURITY',
    action: 'rate_limit_triggered',
    targetType: 'auth_login',
    correlationId: 'req_rate_limit',
    ipAddress: '203.0.113.10',
    userAgent: 'node:test',
    metadata: {
      limit: LOGIN_RATE_LIMIT_ATTEMPTS,
      windowSeconds: 60,
      keyTypes: ['ip', 'account'],
    },
  });

  const body = renderError(thrown, req);
  assert.equal(body.error.code, 'RATE_LIMITED');
  assert.equal(JSON.stringify([auditRecords[0], body]).includes('secret-password'), false);
  assert.equal(JSON.stringify([auditRecords[0], body]).includes('token'), false);
  assert.equal(JSON.stringify([auditRecords[0], body]).includes('hash'), false);
});
