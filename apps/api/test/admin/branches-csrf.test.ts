import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA, MODULE_METADATA } from '@nestjs/common/constants';
import type { ArgumentsHost, ExecutionContext } from '@nestjs/common';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../src/core/auth.guard.ts';
import { CSRF_COOKIE, CSRF_HEADER, CsrfGuard } from '../../src/core/csrf.guard.ts';
import { AppException, AppExceptionFilter } from '../../src/core/http-kernel.ts';
import { AuthModule } from '../../src/modules/auth/auth.module.ts';
import { BranchesController } from '../../src/modules/branches/branches.controller.ts';
import { BranchesModule } from '../../src/modules/branches/branches.module.ts';

type BranchRequest = {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  correlationId?: string;
  url?: string;
  principal?: { userId: string; branchId: string | null };
};

function request(headers: Record<string, string | string[] | undefined> = {}): BranchRequest {
  return {
    headers: {
      cookie: `cms_staff_session=raw-session; ${CSRF_COOKIE}=csrf-secret`,
      [CSRF_HEADER]: 'csrf-secret',
      'x-forwarded-for': '203.0.113.33, 10.0.0.1',
      'user-agent': 'node:test',
      ...headers,
    },
    socket: { remoteAddress: '198.51.100.33' },
    correlationId: 'req_branch_csrf',
    url: '/branches',
    principal: { userId: 'usr_admin', branchId: 'branch_main' },
  };
}

function context(req: BranchRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as ExecutionContext;
}

function renderError(exception: unknown, req: BranchRequest): { error: { code: string } } {
  let body: { error: { code: string } } | undefined;
  const host = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({
        status: (status: number) => {
          assert.equal(status, 403);
          return {
            json: (payload: { error: { code: string } }) => {
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

test('branch mutation routes use CSRF guard while read routes do not', () => {
  assert.deepEqual(guardNames('create'), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('update'), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('deactivate'), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('list'), ['SessionAuthGuard', 'RbacGuard']);
  assert.deepEqual(guardNames('get'), ['SessionAuthGuard', 'RbacGuard']);
});

test('branches module registers auth and CSRF guard providers', () => {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, BranchesModule) as unknown[];
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, BranchesModule) as unknown[];

  assert.ok(imports.includes(AuthModule));
  assert.ok(providers.includes(SessionAuthGuard));
  assert.ok(providers.includes(RbacGuard));
  assert.ok(providers.includes(CsrfGuard));
  assert.equal(providers.some((provider) => providerObject(provider)?.provide === SESSION_AUTH_SERVICE), true);
});

test('branch CSRF guard allows matching cookie and header', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new CsrfGuard({ record: async (input) => auditRecords.push(input) } as AuditService);

  assert.equal(await guard.canActivate(context(request())), true);
  assert.equal(auditRecords.length, 0);
});

test('branch CSRF guard denies mismatched token and audits safely', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new CsrfGuard({ record: async (input) => auditRecords.push(input) } as AuditService);
  const req = request({ [CSRF_HEADER]: 'wrong-secret' });
  let thrown: unknown;

  await assert.rejects(
    guard.canActivate(context(req)).catch((error: unknown) => {
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
    actorId: 'usr_admin',
    branchId: 'branch_main',
    targetType: 'api_route',
    targetId: '/branches',
    correlationId: 'req_branch_csrf',
    ipAddress: '203.0.113.33',
    userAgent: 'node:test',
    metadata: { reason: 'missing_or_mismatch' },
  });

  const safeJson = JSON.stringify([auditRecords[0], renderError(thrown, req)]);
  assert.equal(safeJson.includes('csrf-secret'), false);
  assert.equal(safeJson.includes('raw-session'), false);
  assert.equal(safeJson.includes('password'), false);
  assert.equal(safeJson.includes('hash'), false);
});

function guardNames(handler: keyof BranchesController): string[] {
  const guards = Reflect.getMetadata(GUARDS_METADATA, BranchesController.prototype[handler]) as Array<{ name: string }>;
  return guards.map((guard) => guard.name);
}

function providerObject(provider: unknown): { provide?: unknown } | null {
  return provider && typeof provider === 'object' ? provider as { provide?: unknown } : null;
}
