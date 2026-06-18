import assert from 'node:assert/strict';
import test from 'node:test';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { RbacGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { BranchesController } from '../../src/modules/branches/branches.controller.ts';
import { BranchesRepository } from '../../src/modules/branches/branches.repository.ts';
import type { BranchRecord } from '../../src/modules/branches/branches.repository.ts';
import { BranchesService } from '../../src/modules/branches/branches.service.ts';

const activeBranch: BranchRecord = {
  id: 'branch_main',
  code: 'MAIN',
  nameEn: 'Main Branch',
  nameAr: 'Main Branch',
  timezone: 'Asia/Riyadh',
  isActive: true,
  createdAt: new Date('2026-06-18T10:00:00.000Z'),
  updatedAt: new Date('2026-06-18T11:00:00.000Z'),
};

const admin: StaffPrincipal = {
  sessionId: 'ses_admin',
  userId: 'usr_admin',
  email: 'admin@cms-auto.test',
  nameEn: 'Admin',
  nameAr: 'Admin',
  roleCode: 'ADMIN',
  branchId: 'branch_main',
};

const noopAuditService = { record: async () => undefined } as unknown as AuditService;

function request(roleCode = 'ADMIN'): AuthenticatedRequest {
  return {
    principal: { ...admin, roleCode },
    url: '/branches',
    correlationId: 'req_test',
    headers: { 'x-forwarded-for': '127.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '127.0.0.2' },
  };
}

function context(
  req: AuthenticatedRequest,
  handler: 'list' | 'get' | 'create' | 'update' | 'deactivate' = 'list',
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => BranchesController.prototype[handler],
    getClass: () => BranchesController,
  } as ExecutionContext;
}

test('branch service lists active branches as explicit response objects', async () => {
  const service = new BranchesService({
    listActive: async () => [activeBranch],
    findByIdOrCode: async () => null,
  } as BranchesRepository, noopAuditService);

  const result = await service.listActive();

  assert.deepEqual(result, [{
    id: 'branch_main',
    code: 'MAIN',
    nameEn: 'Main Branch',
    nameAr: 'Main Branch',
    timezone: 'Asia/Riyadh',
    isActive: true,
    createdAt: '2026-06-18T10:00:00.000Z',
    updatedAt: '2026-06-18T11:00:00.000Z',
  }]);
  assert.equal('complaints' in result[0]!, false);
});

test('branch service finds by id or code and returns null when missing', async () => {
  const service = new BranchesService({
    listActive: async () => [],
    findByIdOrCode: async (idOrCode) => (idOrCode === 'MAIN' ? activeBranch : null),
  } as BranchesRepository, noopAuditService);

  assert.equal((await service.findByIdOrCode('MAIN'))?.id, 'branch_main');
  assert.equal(await service.findByIdOrCode('missing'), null);
});

test('branch repository queries active list and id/code lookup', async () => {
  const calls: unknown[] = [];
  const repository = new BranchesRepository({
    branch: {
      findMany: async (query: unknown) => {
        calls.push(query);
        return [];
      },
      findFirst: async (query: unknown) => {
        calls.push(query);
        return null;
      },
    },
  } as never);

  await repository.listActive();
  await repository.findByIdOrCode('MAIN');

  assert.deepEqual(calls[0], {
    where: { isActive: true },
    orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAr: true,
      timezone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  assert.deepEqual(calls[1], {
    where: { OR: [{ id: 'MAIN' }, { code: 'MAIN' }] },
    select: {
      id: true,
      code: true,
      nameEn: true,
      nameAr: true,
      timezone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
});

test('branch service creates a branch and audits in the same transaction', async () => {
  const txClient = {};
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const service = new BranchesService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    create: async (data, client) => {
      assert.equal(client, txClient);
      assert.deepEqual(data, {
        code: 'NORTH',
        nameEn: 'North Branch',
        nameAr: 'North Branch',
        timezone: 'Asia/Riyadh',
      });
      return { ...activeBranch, id: 'branch_north', code: data.code, nameEn: data.nameEn, nameAr: data.nameAr };
    },
  } as BranchesRepository, {
    record: async (input: AuditRecordInput, client?: unknown) => auditRecords.push({ input, client }),
  } as unknown as AuditService);

  const result = await service.create(
    { code: ' NORTH ', nameEn: ' North Branch ', nameAr: ' North Branch ', timezone: ' Asia/Riyadh ' },
    { actorId: 'usr_admin', correlationId: 'req_create', ipAddress: '127.0.0.1', userAgent: 'node:test' },
  );

  assert.equal(result.id, 'branch_north');
  assert.equal('complaints' in result, false);
  assert.equal(auditRecords[0]?.client, txClient);
  assert.equal(auditRecords[0]?.input.eventType, 'CONFIG');
  assert.equal(auditRecords[0]?.input.action, 'branch_created');
  assert.equal(auditRecords[0]?.input.actorId, 'usr_admin');
  assert.equal(auditRecords[0]?.input.targetId, 'branch_north');
  assert.deepEqual((auditRecords[0]?.input.metadata as { changedFields: string[] }).changedFields, [
    'code',
    'nameEn',
    'nameAr',
    'timezone',
  ]);
});

test('branch service updates and deactivates branches with audit entries', async () => {
  const txClient = {};
  const auditRecords: Array<{ input: AuditRecordInput; client: unknown }> = [];
  const service = new BranchesService({
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    update: async (id, data, client) => {
      assert.equal(id, 'branch_main');
      assert.equal(client, txClient);
      assert.deepEqual(data, { nameEn: 'Main HQ' });
      return { ...activeBranch, nameEn: data.nameEn ?? activeBranch.nameEn };
    },
    deactivate: async (id, client) => {
      assert.equal(id, 'branch_main');
      assert.equal(client, txClient);
      return { ...activeBranch, isActive: false };
    },
  } as BranchesRepository, {
    record: async (input: AuditRecordInput, client?: unknown) => auditRecords.push({ input, client }),
  } as unknown as AuditService);

  assert.equal((await service.update('branch_main', { nameEn: ' Main HQ ' })).nameEn, 'Main HQ');
  assert.equal((await service.deactivate('branch_main')).isActive, false);

  assert.deepEqual(auditRecords.map((record) => record.input.action), ['branch_updated', 'branch_deactivated']);
  assert.equal(auditRecords.every((record) => record.client === txClient), true);
  assert.deepEqual((auditRecords[0]!.input.metadata as { changedFields: string[] }).changedFields, ['nameEn']);
  assert.equal(auditRecords[1]!.input.metadata, undefined);
});

test('branch service rejects invalid branch write input', async () => {
  const service = new BranchesService({
    transaction: async () => {
      throw new Error('transaction should not run');
    },
  } as BranchesRepository, noopAuditService);

  await assert.rejects(
    service.create({ code: ' ', nameEn: 'Main', nameAr: 'Main' }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    service.update('branch_main', {}),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('branch controller delegates read routes to the service', async () => {
  const controller = new BranchesController({
    listActive: async () => [{ ...activeBranch, createdAt: activeBranch.createdAt.toISOString(), updatedAt: activeBranch.updatedAt.toISOString() }],
    findByIdOrCode: async (idOrCode) =>
      idOrCode === 'MAIN'
        ? { ...activeBranch, createdAt: activeBranch.createdAt.toISOString(), updatedAt: activeBranch.updatedAt.toISOString() }
        : null,
  } as unknown as BranchesService);

  assert.equal((await controller.list()).items[0]?.id, 'branch_main');
  assert.equal((await controller.get('MAIN')).branch?.code, 'MAIN');
  assert.deepEqual(await controller.get('missing'), { branch: null });
});

test('branch controller delegates write routes with server request audit context', async () => {
  const calls: unknown[] = [];
  const response = { ...activeBranch, createdAt: activeBranch.createdAt.toISOString(), updatedAt: activeBranch.updatedAt.toISOString() };
  const controller = new BranchesController({
    create: async (input, audit) => {
      calls.push({ method: 'create', input, audit });
      return { ...response, id: 'branch_north', code: input.code };
    },
    update: async (id, input, audit) => {
      calls.push({ method: 'update', id, input, audit });
      return { ...response, id, nameEn: input.nameEn ?? response.nameEn };
    },
    deactivate: async (id, audit) => {
      calls.push({ method: 'deactivate', id, audit });
      return { ...response, id, isActive: false };
    },
  } as unknown as BranchesService);

  const req = request('ADMIN');
  const created = await controller.create({ code: ' NORTH ', nameEn: ' North ', nameAr: ' North ', roleCode: 'ADMIN' }, req);
  const updated = await controller.update('branch_main', { nameEn: ' Main HQ ' }, req);
  const deactivated = await controller.deactivate('branch_main', req);

  assert.equal(created.branch.code, 'NORTH');
  assert.equal(updated.branch.nameEn, 'Main HQ');
  assert.equal(deactivated.branch.isActive, false);
  assert.deepEqual(calls[0], {
    method: 'create',
    input: { code: 'NORTH', nameEn: 'North', nameAr: 'North' },
    audit: { actorId: 'usr_admin', correlationId: 'req_test', ipAddress: '127.0.0.1', userAgent: 'node:test' },
  });
  assert.equal((calls[0] as { input: Record<string, unknown> }).input.roleCode, undefined);
  assert.deepEqual(calls[1], {
    method: 'update',
    id: 'branch_main',
    input: { nameEn: 'Main HQ' },
    audit: { actorId: 'usr_admin', correlationId: 'req_test', ipAddress: '127.0.0.1', userAgent: 'node:test' },
  });
});

test('branch controller rejects invalid write request bodies', async () => {
  const controller = new BranchesController({} as BranchesService);

  await assert.rejects(
    controller.create({ code: ' ', nameEn: 'North', nameAr: 'North' }, request('ADMIN')),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  await assert.rejects(
    controller.update('branch_main', {}, request('ADMIN')),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('branch read routes are admin-only and denials are audited', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(
    new Reflector(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  assert.equal(await guard.canActivate(context(request('ADMIN'))), true);

  await assert.rejects(
    guard.canActivate(context(request('BRANCH_MANAGER'))),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );

  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'rbac_forbidden');
});

test('branch write routes are admin-only and denials are audited', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(
    new Reflector(),
    { record: async (input) => auditRecords.push(input) } as AuditService,
  );

  assert.equal(await guard.canActivate(context(request('ADMIN'), 'create')), true);

  await assert.rejects(
    guard.canActivate(context(request('BRANCH_MANAGER'), 'create')),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );

  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'rbac_forbidden');
});
