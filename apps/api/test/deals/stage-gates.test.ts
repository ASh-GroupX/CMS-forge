import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import { MODULE_METADATA } from '@nestjs/common/constants';
import type { ExecutionContext } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import type { AuditRecordInput } from '../../src/core/audit.service.ts';
import { AuditService as CoreAuditService } from '../../src/core/audit.service.ts';
import type { AuditService } from '../../src/core/audit.service.ts';
import { RbacGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException, PrismaService } from '../../src/core/http-kernel.ts';
import { DealsController } from '../../src/modules/deals/deals.controller.ts';
import { DealsModule } from '../../src/modules/deals/deals.module.ts';
import { DealsRepository } from '../../src/modules/deals/deals.repository.ts';
import type { UpdateDealStageData } from '../../src/modules/deals/deals.repository.ts';
import { DealsService } from '../../src/modules/deals/deals.service.ts';
import type { DealRecord } from '../../src/modules/deals/deals.service.ts';

test('deal gate allows the next stage only', () => {
  const service = serviceOnly();
  const deal = service.create({
    title: 'New delivery',
    branchId: 'branch_a',
    ownerId: 'owner_a',
    currentHolderId: 'sales_a',
    stageDueAt: '2026-06-21T09:00:00.000Z',
  });

  assert.equal(service.advanceStage({
    deal,
    toStage: 'QUALIFIED',
    currentHolderId: 'sales_lead_a',
    stageDueAt: '2026-06-22T09:00:00.000Z',
  }).stage, 'QUALIFIED');
});

test('deal gate denies skipped transitions', () => {
  const service = serviceOnly();
  const deal = service.create({
    title: 'New delivery',
    branchId: 'branch_a',
    ownerId: 'owner_a',
    currentHolderId: 'sales_a',
    stageDueAt: '2026-06-21T09:00:00.000Z',
  });

  assert.throws(
    () => service.advanceStage({ deal, toStage: 'FINANCE', currentHolderId: 'finance_a', stageDueAt: '2026-06-22T09:00:00.000Z' }),
    (error) => error instanceof AppException && error.code === 'DEAL_INVALID_STAGE_TRANSITION',
  );
});

test('deal gate validates blockers and due dates', () => {
  const service = serviceOnly();
  const deal = service.create({
    title: 'New delivery',
    branchId: 'branch_a',
    ownerId: 'owner_a',
    currentHolderId: 'sales_a',
    stageDueAt: '2026-06-21T09:00:00.000Z',
  });

  assert.throws(
    () => service.advanceStage({ deal: { ...deal, blocker: 'Missing approval' }, toStage: 'QUALIFIED', currentHolderId: 'sales_lead_a', stageDueAt: '2026-06-22T09:00:00.000Z' }),
    (error) => error instanceof AppException && error.code === 'DEAL_BLOCKED',
  );
  assert.throws(
    () => service.advanceStage({ deal, toStage: 'QUALIFIED', currentHolderId: 'sales_lead_a', stageDueAt: 'not-a-date' }),
    (error) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('deal persisted transition writes deal, audit, and task in one transaction', async () => {
  const txClient = { deal: {}, auditLog: {}, task: {}, taskStatusHistory: {} };
  const clients: unknown[] = [];
  const auditRecords: AuditRecordInput[] = [];
  const repository = {
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    updateStage: async (data: UpdateDealStageData, client: unknown) => {
      clients.push(client);
      return row({ stage: data.stage, currentHolderId: data.currentHolderId, stageDueAt: data.stageDueAt });
    },
  } as unknown as DealsRepository;
  const tasks = {
    createInTransaction: async (_input: unknown, _audit: unknown, client: unknown) => {
      clients.push(client);
      return { id: 'task_deal_next' };
    },
  };
  const service = new DealsService(repository, tasks as never, {
    record: async (input: AuditRecordInput, client: unknown) => {
      auditRecords.push(input);
      clients.push(client);
    },
  } as never);

  const result = await service.advanceStagePersisted({
    deal: deal(),
    toStage: 'QUALIFIED',
    currentHolderId: 'sales_lead_a',
    stageDueAt: '2026-06-22T09:00:00.000Z',
  }, { actorId: 'manager_a' });

  assert.equal(result.taskId, 'task_deal_next');
  assert.deepEqual(clients, [txClient, txClient, txClient]);
  assert.equal(auditRecords[0]?.action, 'deal_stage_advanced');
});

test('manager sees scoped deal handoff board derived from deal data', async () => {
  let scopedBranch: string | null | undefined;
  const service = new DealsService({
    listHandoffBoard: async (branchId: string | null) => {
      scopedBranch = branchId;
      return [
        row({ id: 'late', currentHolderId: 'holder_a', stageDueAt: new Date('2026-06-20T08:00:00.000Z') }),
        row({ id: 'blocked', currentHolderId: 'holder_b', blocker: 'Missing docs' }),
      ];
    },
  } as unknown as DealsRepository);

  const result = await service.handoffBoard({ roleCode: RoleCode.BRANCH_MANAGER, branchId: 'branch_a' }, new Date('2026-06-20T10:00:00.000Z'));

  assert.equal(scopedBranch, 'branch_a');
  assert.deepEqual(result.stuck.map((item) => item.id), ['late', 'blocked']);
  assert.deepEqual(result.currentHolder, [{ currentHolderId: 'holder_a', count: 1 }, { currentHolderId: 'holder_b', count: 1 }]);
});

test('ordinary employee is denied by deal handoff board RBAC', async () => {
  const guard = new RbacGuard(new Reflector(), { record: async () => undefined } as AuditService);

  await assert.rejects(
    guard.canActivate(context(request(employee))),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
});

test('deals module wires audit service with Prisma for runtime RBAC denies', () => {
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, DealsModule) as unknown[];
  assert.ok(providers.some((provider) => {
    if (!provider || typeof provider !== 'object') return false;
    const wired = provider as { provide?: unknown; inject?: unknown[] };
    return wired.provide === CoreAuditService && wired.inject?.includes(PrismaService);
  }));
});

test('cross-branch deal handoff board request is denied and audited', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  await assert.rejects(
    guard.canActivate(context(request(branchManager, '/deals/handoff-board?branchId=branch_b'))),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.action, 'branch_scope_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata, { deniedBranchId: 'branch_b' });
});

function serviceOnly(): DealsService {
  return new DealsService(new DealsRepository({} as never));
}

const branchManager: StaffPrincipal = {
  sessionId: 'session_deal',
  userId: 'manager_a',
  email: 'manager@example.test',
  nameEn: 'Manager',
  nameAr: 'Manager',
  roleCode: RoleCode.BRANCH_MANAGER,
  branchId: 'branch_a',
};

const employee: StaffPrincipal = { ...branchManager, userId: 'employee_a', roleCode: RoleCode.CR_OFFICER };

function request(principal: StaffPrincipal, url = '/deals/handoff-board'): AuthenticatedRequest {
  return {
    principal,
    url,
    correlationId: 'req_deals',
    headers: { 'x-forwarded-for': '203.0.113.20, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.20' },
  };
}

function context(req: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => DealsController.prototype.handoffBoard,
    getClass: () => DealsController,
  } as ExecutionContext;
}

function deal(): DealRecord {
  return {
    id: 'deal_a',
    title: 'New delivery',
    branchId: 'branch_a',
    ownerId: 'owner_a',
    currentHolderId: 'sales_a',
    stage: 'LEAD' as const,
    stageDueAt: '2026-06-21T09:00:00.000Z',
    blocker: null,
    createdAt: '2026-06-20T09:00:00.000Z',
    updatedAt: '2026-06-20T09:00:00.000Z',
  };
}

type DealRowFixture = Omit<DealRecord, 'stageDueAt' | 'createdAt' | 'updatedAt'> & {
  stageDueAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function row(overrides: Partial<DealRowFixture> = {}) {
  const source = { ...deal(), ...overrides };
  return {
    ...source,
    stageDueAt: new Date(source.stageDueAt),
    createdAt: new Date(source.createdAt),
    updatedAt: new Date(source.updatedAt),
  };
}
