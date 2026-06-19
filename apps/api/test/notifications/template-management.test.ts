import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import 'reflect-metadata';
import { GUARDS_METADATA, MODULE_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NotificationChannel, RoleCode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { RbacGuard, SESSION_AUTH_SERVICE, SessionAuthGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest } from '../../src/core/auth.guard.ts';
import { CsrfGuard } from '../../src/core/csrf.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { AuthModule } from '../../src/modules/auth/auth.module.ts';
import { NotificationsController } from '../../src/modules/notifications/notifications.controller.ts';
import { NotificationsModule } from '../../src/modules/notifications/notifications.module.ts';
import { NotificationsRepository } from '../../src/modules/notifications/notifications.repository.ts';
import { NotificationsService } from '../../src/modules/notifications/notifications.service.ts';

test('admin template routes create and update with same-transaction CONFIG audit', async () => {
  const txClient = {};
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const service = new NotificationsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    createTemplate: async (data, client) => {
      assert.equal(client, txClient);
      return templateRecord({ id: 'tpl_created', ...data });
    },
    updateTemplate: async (id, data, client) => {
      assert.equal(client, txClient);
      return templateRecord({ id, body: data.body ?? 'Updated body', versionNote: data.versionNote ?? null });
    },
  } as NotificationsRepository, {} as never, {
    record: async (input, client) => auditRecords.push({ input, client }),
  } as unknown as AuditService);
  const controller = new NotificationsController(service);

  const created = await controller.createTemplate(validBody(), request(RoleCode.ADMIN));
  const updated = await controller.updateTemplate('tpl_created', { body: 'Updated body', versionNote: 'copy fix' }, request(RoleCode.ADMIN));

  assert.equal(created.template.id, 'tpl_created');
  assert.equal(updated.template.body, 'Updated body');
  assert.deepEqual(auditRecords.map((record) => [record.client, record.input.eventType, record.input.action]), [
    [txClient, 'CONFIG', 'template_created'],
    [txClient, 'CONFIG', 'template_updated'],
  ]);
  assert.deepEqual(auditRecords[0]?.input.metadata, {
    code: 'complaint.created',
    channel: NotificationChannel.EMAIL,
    locale: 'en',
    version: 1,
    changedFields: ['code', 'channel', 'locale', 'subject', 'body', 'version', 'versionNote', 'isActive'],
  });
});

test('template management allows admin and denies non-admin before controller body runs', async () => {
  assert.deepEqual(guardNames('createTemplate'), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('updateTemplate'), ['SessionAuthGuard', 'RbacGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('listTemplates'), ['SessionAuthGuard', 'RbacGuard']);

  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  assert.equal(await guard.canActivate(context(request(RoleCode.ADMIN), 'createTemplate')), true);
  await assert.rejects(
    guard.canActivate(context(request(RoleCode.CR_MANAGER), 'createTemplate')),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'rbac_forbidden');
});

test('template validation rejects invalid data before write or audit', async () => {
  let transactionCalled = false;
  let auditCalled = false;
  const service = new NotificationsService({
    transaction: async () => {
      transactionCalled = true;
      throw new Error('transaction should not start');
    },
  } as NotificationsRepository, {} as never, {
    record: async () => {
      auditCalled = true;
    },
  } as unknown as AuditService);

  await assert.rejects(
    service.createTemplate({ ...validBody(), code: 'Bad Code', isActive: 'yes' as never }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.equal(transactionCalled, false);
  assert.equal(auditCalled, false);
});

test('template activation audits and response exposes no provider credentials', async () => {
  process.env.EMAIL_PROVIDER_SECRET = 'do-not-return';
  const auditRecords: AuditRecordInput[] = [];
  const service = new NotificationsService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work({} as never),
    setTemplateActive: async (id, isActive) => templateRecord({ id, isActive }),
  } as NotificationsRepository, {} as never, {
    record: async (input) => auditRecords.push(input),
  } as unknown as AuditService);
  const controller = new NotificationsController(service);

  const response = await controller.activateTemplate('tpl_1', request(RoleCode.ADMIN));
  const json = JSON.stringify(response);

  assert.equal(response.template.isActive, true);
  assert.equal(auditRecords[0]?.action, 'template_activated');
  assert.equal(json.includes('do-not-return'), false);
  assert.equal(/secret|credential|apiKey|password|token/i.test(json), false);
});

test('notifications module and OpenAPI document admin template routes', () => {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, NotificationsModule) as unknown[];
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, NotificationsModule) as unknown[];
  const openapi = JSON.parse(readFileSync('packages/contracts/openapi.json', 'utf8'));

  assert.ok(imports.includes(AuthModule));
  assert.ok(providers.includes(SessionAuthGuard));
  assert.ok(providers.includes(RbacGuard));
  assert.ok(providers.includes(CsrfGuard));
  assert.equal(providers.some((provider) => providerObject(provider)?.provide === SESSION_AUTH_SERVICE), true);
  assert.ok(openapi.paths['/notifications/templates']?.post);
  assert.ok(openapi.paths['/notifications/templates/{id}/activate']?.post);
  for (const field of ['providerSecret', 'credentials', 'token', 'password']) {
    assert.equal(Object.hasOwn(openapi.components.schemas.NotificationTemplate.properties, field), false);
  }
});

function validBody() {
  return {
    code: 'complaint.created',
    channel: NotificationChannel.EMAIL,
    locale: 'en',
    subject: 'Complaint {{referenceNumber}}',
    body: 'Complaint {{referenceNumber}} was received',
    version: 1,
    versionNote: 'initial',
    isActive: true,
  };
}

function templateRecord(overrides: Record<string, unknown> = {}) {
  return {
    ...validBody(),
    id: 'tpl_1',
    subject: 'Complaint {{referenceNumber}}',
    versionNote: null,
    createdAt: new Date('2026-06-19T10:00:00.000Z'),
    updatedAt: new Date('2026-06-19T10:00:00.000Z'),
    ...overrides,
  };
}

function request(roleCode: RoleCode): AuthenticatedRequest {
  return {
    principal: { sessionId: 'ses_1', userId: 'usr_1', email: 'admin@test', nameEn: 'Admin', nameAr: 'Admin', roleCode, branchId: null },
    url: '/notifications/templates',
    correlationId: 'req_templates',
    headers: { 'x-forwarded-for': '203.0.113.44, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.44' },
  };
}

function context(req: AuthenticatedRequest, handler: keyof NotificationsController): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => NotificationsController.prototype[handler],
    getClass: () => NotificationsController,
  } as ExecutionContext;
}

function guardNames(handler: keyof NotificationsController): string[] {
  const guards = Reflect.getMetadata(GUARDS_METADATA, NotificationsController.prototype[handler]) as Array<{ name: string }>;
  return guards.map((guard) => guard.name);
}

function providerObject(provider: unknown): { provide?: unknown } | null {
  return provider && typeof provider === 'object' ? provider as { provide?: unknown } : null;
}
