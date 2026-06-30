import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus, RoleCode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { PermissionGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { ComplaintFormOptionsService } from '../../src/modules/complaints/complaint-form-options.service.ts';
import { ComplaintRelationsRepository } from '../../src/modules/complaints/complaint-relations.repository.ts';
import type { ComplaintRelationAnchor, ComplaintRelationItemRecord, ComplaintRelationKey } from '../../src/modules/complaints/complaint-relations.repository.ts';
import { ComplaintRelationsService } from '../../src/modules/complaints/complaint-relations.service.ts';
import { ComplaintsController } from '../../src/modules/complaints/complaints.controller.ts';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.ts';

test('allowed users can link, list, repeat-link, and unlink related complaints without history merge', async () => {
  const { service, auditRecords, history } = harness();

  assert.deepEqual(await service.link(input('cmp_1', 'cmp_2')), { sourceComplaintId: 'cmp_1', targetComplaintId: 'cmp_2', changed: true });
  assert.deepEqual(await service.link(input('cmp_2', 'cmp_1')), { sourceComplaintId: 'cmp_2', targetComplaintId: 'cmp_1', changed: false });
  assert.deepEqual((await service.listRelated('cmp_1', { branchId: 'branch_main' })).map((item) => item.id), ['cmp_2']);
  assert.deepEqual(await service.unlink(input('cmp_1', 'cmp_2')), { sourceComplaintId: 'cmp_1', targetComplaintId: 'cmp_2', changed: true });
  assert.deepEqual(await service.listRelated('cmp_1', { branchId: 'branch_main' }), []);

  assert.deepEqual(history, { cmp_1: ['submitted'], cmp_2: ['submitted'] });
  assert.deepEqual(auditRecords.map((record) => record.action), ['complaint_relation_linked', 'complaint_relation_unlinked']);
  assert.deepEqual(auditRecords[0]?.metadata, { sourceComplaintId: 'cmp_1', targetComplaintId: 'cmp_2', relationAction: 'link', actorRole: RoleCode.CR_MANAGER, sessionId: 'ses_1' });
});

test('branch scope hides source and target complaints from relation writes', async () => {
  const { service, auditRecords } = harness();

  await assert.rejects(
    service.link(input('cmp_other', 'cmp_1')),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_NOT_FOUND',
  );
  await assert.rejects(
    service.link(input('cmp_1', 'cmp_other')),
    (error: unknown) => error instanceof AppException && error.code === 'COMPLAINT_NOT_FOUND',
  );
  assert.equal(auditRecords.length, 0);
});

test('relation audits contain only safe ids and actor/session context', async () => {
  const { service, auditRecords } = harness();

  await service.link({ ...input('cmp_1', 'cmp_2'), userAgent: 'node:test password token VIN plate DMS raw-url query' });
  const auditJson = JSON.stringify(auditRecords[0]).toLowerCase();

  for (const forbidden of ['phone', 'email', 'vin', 'plate', 'dms', 'password', 'otp', 'token', 'credential', 'raw-url', 'query']) {
    assert.equal(auditJson.includes(forbidden), false);
  }
});

test('duplicate candidates use same customer, category, branch, recent window, and exclude self', async () => {
  const calls: unknown[] = [];
  const repository = new ComplaintRelationsRepository({
    complaint: {
      findMany: async (query: unknown) => {
        calls.push(query);
        return [];
      },
    },
  } as never);

  await repository.findDuplicateCandidates(anchor('cmp_1', 'branch_main'), 30);

  const query = calls[0] as { select: unknown };
  assert.ok(query.select);
  assert.deepEqual({ ...query, select: undefined }, {
    where: {
      id: { not: 'cmp_1' },
      customerId: 'cust_1',
      categoryId: 'cat_engine',
      branchId: 'branch_main',
      createdAt: {
        gte: new Date('2026-05-19T09:00:00.000Z'),
        lte: new Date('2026-07-18T09:00:00.000Z'),
      },
    },
    orderBy: [{ createdAt: 'desc' }, { referenceNumber: 'asc' }],
    take: 10,
    select: undefined,
  });
});

test('related complaint routes enforce view/edit permissions, branch scope, and CSRF on writes', async () => {
  assert.deepEqual(guardNames('listRelated'), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard']);
  assert.deepEqual(guardNames('duplicateCandidates'), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard']);
  assert.deepEqual(guardNames('linkRelated'), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard', 'CsrfGuard']);
  assert.deepEqual(guardNames('unlinkRelated'), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard', 'CsrfGuard']);

  const guard = new PermissionGuard(new Reflector(), { record: async () => undefined } as unknown as AuditService);
  assert.equal(await guard.canActivate(context(request(['COMPLAINT_VIEW_BRANCH']), ComplaintsController.prototype.listRelated)), true);
  assert.equal(await guard.canActivate(context(request(['COMPLAINT_EDIT']), ComplaintsController.prototype.linkRelated)), true);
  await assert.rejects(
    guard.canActivate(context(request(['COMPLAINT_VIEW_BRANCH']), ComplaintsController.prototype.linkRelated)),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
});

test('related complaint controller uses server branch and actor context', async () => {
  const calls: unknown[] = [];
  const controller = new ComplaintsController({} as ComplaintsService, {} as ComplaintFormOptionsService, {
    link: async (input) => {
      calls.push(input);
      return { sourceComplaintId: input.sourceComplaintId, targetComplaintId: input.targetComplaintId, changed: true };
    },
    duplicateCandidates: async (id, filter) => {
      calls.push({ id, filter });
      return { items: [], windowDays: 30 };
    },
  } as ComplaintRelationsService);

  assert.deepEqual(await controller.linkRelated('cmp_1', undefined, { targetComplaintId: 'cmp_2', actorId: 'spoofed' }, request(['COMPLAINT_EDIT'])), {
    relation: { sourceComplaintId: 'cmp_1', targetComplaintId: 'cmp_2', changed: true },
  });
  assert.deepEqual(await controller.duplicateCandidates('cmp_1', undefined, request(['COMPLAINT_VIEW_BRANCH'])), { items: [], windowDays: 30 });
  assert.equal((calls[0] as { actorId: string }).actorId, 'usr_manager');
  assert.equal((calls[0] as { branchId: string }).branchId, 'branch_main');
  assert.deepEqual(calls[1], { id: 'cmp_1', filter: { branchId: 'branch_main' } });
});

test('OpenAPI documents related complaint routes with safe response shapes', () => {
  const openapi = JSON.parse(readFileSync('tools/openapi-canonical.json', 'utf8'));

  assert.ok(openapi.paths['/complaints/{id}/related'].get);
  assert.ok(openapi.paths['/complaints/{id}/related'].post);
  assert.ok(openapi.paths['/complaints/{id}/related/{targetId}'].delete);
  assert.ok(openapi.paths['/complaints/{id}/duplicate-candidates'].get);
  assert.deepEqual(Object.keys(openapi.components.schemas.ComplaintRelatedResponse.properties), ['items']);
  assert.deepEqual(Object.keys(openapi.components.schemas.ComplaintRelationMutation.properties.relation.properties), ['sourceComplaintId', 'targetComplaintId', 'changed']);
  assert.equal(JSON.stringify(openapi.components.schemas.ComplaintRelatedResponse).includes('customerPhone'), false);
});

function harness() {
  const auditRecords: AuditRecordInput[] = [];
  const relations = new Set<string>();
  const history = { cmp_1: ['submitted'], cmp_2: ['submitted'] };
  const repo = {
    transaction: async <T>(work: (client: never) => Promise<T>) => work({} as never),
    findAnchor: async (id: string, filter: { branchId?: string | null }) => {
      const item = anchors.get(id) ?? null;
      return item && (!filter.branchId || item.branchId === filter.branchId) ? item : null;
    },
    listRelated: async (id: string, filter: { branchId?: string | null }) => [...relations]
      .flatMap((key) => key.split('|').includes(id) ? key.split('|').filter((part) => part !== id) : [])
      .map((relatedId) => anchors.get(relatedId)!)
      .filter((item) => !filter.branchId || item.branchId === filter.branchId),
    createRelation: async (key: ComplaintRelationKey) => {
      const relationKey = normalized(key);
      const changed = !relations.has(relationKey);
      relations.add(relationKey);
      return changed;
    },
    deleteRelation: async (key: ComplaintRelationKey) => relations.delete(normalized(key)),
    findDuplicateCandidates: async (source: ComplaintRelationAnchor) => [...anchors.values()].filter((item) => item.id !== source.id && item.customerId === source.customerId && item.categoryId === source.categoryId && item.branchId === source.branchId),
  } as ComplaintRelationsRepository;
  return { service: new ComplaintRelationsService(repo, { record: async (input) => auditRecords.push(input) } as unknown as AuditService), auditRecords, history };
}

const anchors = new Map<string, ComplaintRelationAnchor>([
  ['cmp_1', anchor('cmp_1', 'branch_main')],
  ['cmp_2', anchor('cmp_2', 'branch_main')],
  ['cmp_other', anchor('cmp_other', 'branch_other')],
]);

function anchor(id: string, branchId: string): ComplaintRelationAnchor {
  return { ...item(id, branchId), categoryId: 'cat_engine', customerId: 'cust_1' };
}

function item(id: string, branchId: string): ComplaintRelationItemRecord {
  return {
    id,
    referenceNumber: id,
    status: ComplaintStatus.SUBMITTED,
    severity: ComplaintSeverity.HIGH,
    subject: 'Engine noise',
    branchId,
    branch: { code: branchId, nameEn: branchId, nameAr: branchId },
    ownerId: null,
    owner: null,
    createdAt: new Date('2026-06-18T09:00:00.000Z'),
    updatedAt: new Date('2026-06-18T10:00:00.000Z'),
  };
}

function input(sourceComplaintId: string, targetComplaintId: string) {
  return { sourceComplaintId, targetComplaintId, branchId: 'branch_main', actorId: 'usr_manager', actorRole: RoleCode.CR_MANAGER, sessionId: 'ses_1', correlationId: 'req_relation', ipAddress: '203.0.113.10', userAgent: 'node:test' };
}

function normalized(key: ComplaintRelationKey): string {
  return [key.sourceComplaintId, key.targetComplaintId].sort().join('|');
}

function request(permissions: string[]): AuthenticatedRequest {
  return { principal: principal(permissions), correlationId: 'req_relation_route', headers: { 'x-forwarded-for': '203.0.113.66', 'user-agent': 'node:test' }, socket: { remoteAddress: '198.51.100.66' } };
}

function principal(permissions: string[]): StaffPrincipal {
  return { sessionId: 'ses_route', userId: 'usr_manager', email: 'manager@cms-auto.test', nameEn: 'Manager', nameAr: 'Manager', roleCode: RoleCode.CR_MANAGER, permissions, branchId: 'branch_main' };
}

function context(req: AuthenticatedRequest, handler: unknown): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => req }), getHandler: () => handler, getClass: () => ComplaintsController } as ExecutionContext;
}

function guardNames(handler: keyof ComplaintsController): string[] {
  const guards = Reflect.getMetadata(GUARDS_METADATA, ComplaintsController.prototype[handler]) as Array<{ name: string }>;
  return guards.map((guard) => guard.name);
}
