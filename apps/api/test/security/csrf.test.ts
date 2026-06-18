import assert from 'node:assert/strict';
import test from 'node:test';
import type { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { CSRF_COOKIE, CSRF_HEADER, CsrfGuard } from '../../src/core/csrf.guard.ts';
import { AppException, AppExceptionFilter } from '../../src/core/http-kernel.ts';

type CsrfRequest = {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  correlationId?: string;
  url?: string;
  principal?: { userId: string; branchId: string | null };
};

type ErrorEnvelope = {
  error: {
    code: string;
    message: string;
    correlationId: string;
  };
};

function request(input: Partial<CsrfRequest> = {}): CsrfRequest {
  return {
    headers: {
      cookie: `cms_staff_session=raw-session; ${CSRF_COOKIE}=csrf-secret`,
      [CSRF_HEADER]: 'csrf-secret',
      'x-forwarded-for': '203.0.113.22, 10.0.0.1',
      'user-agent': 'node:test',
    },
    socket: { remoteAddress: '198.51.100.22' },
    correlationId: 'req_csrf',
    url: '/auth/logout',
    principal: { userId: 'usr_test', branchId: 'branch_main' },
    ...input,
  };
}

function context(req: CsrfRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as ExecutionContext;
}

function guard(auditRecords: AuditRecordInput[]): CsrfGuard {
  return new CsrfGuard({ record: async (input) => auditRecords.push(input) } as AuditService);
}

function renderError(exception: unknown, req: CsrfRequest): ErrorEnvelope {
  let body: ErrorEnvelope | undefined;
  const host = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({
        status: (status: number) => {
          assert.equal(status, 403);
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

test('csrf guard allows a matching CSRF cookie and header', async () => {
  const auditRecords: AuditRecordInput[] = [];

  assert.equal(await guard(auditRecords).canActivate(context(request())), true);
  assert.equal(auditRecords.length, 0);
});

test('csrf guard denies mismatched CSRF tokens and records safe security audit', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const req = request({ headers: { ...request().headers, [CSRF_HEADER]: 'wrong-secret' } });
  let thrown: unknown;

  await assert.rejects(
    guard(auditRecords).canActivate(context(req)).catch((error: unknown) => {
      thrown = error;
      throw error;
    }),
    (error: unknown) =>
      error instanceof AppException &&
      error.code === 'CSRF_INVALID' &&
      error.getStatus() === 403,
  );

  assert.deepEqual(auditRecords[0], {
    eventType: 'SECURITY',
    action: 'csrf_rejected',
    actorId: 'usr_test',
    branchId: 'branch_main',
    targetType: 'api_route',
    targetId: '/auth/logout',
    correlationId: 'req_csrf',
    ipAddress: '203.0.113.22',
    userAgent: 'node:test',
    metadata: { reason: 'missing_or_mismatch' },
  });

  const body = renderError(thrown, req);
  const safeJson = JSON.stringify([auditRecords[0], body]);
  assert.equal(body.error.code, 'CSRF_INVALID');
  assert.equal(safeJson.includes('csrf-secret'), false);
  assert.equal(safeJson.includes('raw-session'), false);
  assert.equal(safeJson.includes('password'), false);
  assert.equal(safeJson.includes('hash'), false);
});
