import assert from 'node:assert/strict';
import test from 'node:test';
import { AppException } from '../../core/http-kernel.js';
import type { AuditRecordInput } from '../../core/audit.service.js';
import { DealsRepository } from './deals.repository.js';
import type { UpdateDealStageData } from './deals.repository.js';
import { DealsService } from './deals.service.js';
import type { DealRecord } from './deals.service.js';

test('deal create validates required holder and due fields', () => {
  const service = new DealsService(repo());

  assert.throws(
    () => service.create({ title: 'RX delivery', branchId: 'branch_1', ownerId: 'owner_1', currentHolderId: ' ', stageDueAt: '2026-06-21T09:00:00.000Z' }),
    (error) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
  assert.throws(
    () => service.create({ title: 'RX delivery', branchId: 'branch_1', ownerId: 'owner_1', currentHolderId: 'holder_1', stageDueAt: 'bad' }),
    (error) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('deal stage gate advances exactly one stage with next holder and due date', () => {
  const service = new DealsService(repo());
  const deal = service.create({
    title: 'RX delivery',
    branchId: 'branch_1',
    ownerId: 'owner_1',
    currentHolderId: 'sales_1',
    stageDueAt: '2026-06-21T09:00:00.000Z',
  }, new Date('2026-06-20T08:00:00.000Z'));

  const next = service.advanceStage({
    deal,
    toStage: 'BOOKING',
    currentHolderId: 'sales_manager_1',
    stageDueAt: '2026-06-22T09:00:00.000Z',
  }, new Date('2026-06-20T09:00:00.000Z'));

  assert.equal(next.stage, 'BOOKING');
  assert.equal(next.currentHolderId, 'sales_manager_1');
  assert.equal(next.stageDueAt, '2026-06-22T09:00:00.000Z');
  assert.equal(next.updatedAt, '2026-06-20T09:00:00.000Z');
});

test('deal stage gate rejects skipped transitions and active blockers', () => {
  const service = new DealsService(repo());
  const deal = service.create({
    title: 'RX delivery',
    branchId: 'branch_1',
    ownerId: 'owner_1',
    currentHolderId: 'sales_1',
    stageDueAt: '2026-06-21T09:00:00.000Z',
  });

  assert.throws(
    () => service.advanceStage({ deal, toStage: 'PAYMENT', currentHolderId: 'sales_2', stageDueAt: '2026-06-22T09:00:00.000Z' }),
    (error) => error instanceof AppException && error.code === 'DEAL_INVALID_STAGE_TRANSITION',
  );
  assert.throws(
    () => service.advanceStage({ deal: { ...deal, blocker: 'Customer docs missing' }, toStage: 'BOOKING', currentHolderId: 'sales_2', stageDueAt: '2026-06-22T09:00:00.000Z' }),
    (error) => error instanceof AppException && error.code === 'DEAL_BLOCKED',
  );
});

test('persisted deal transition shares transaction client for deal, audit, and task', async () => {
  const txClient = { deal: {}, task: {}, taskStatusHistory: {}, auditLog: {} };
  const clients: unknown[] = [];
  const auditRecords: AuditRecordInput[] = [];
  const tasks = {
    createInTransaction: async (_input: unknown, _audit: unknown, client: unknown) => {
      clients.push(client);
      return { id: 'task_1' };
    },
  };
  const repository = {
    transaction: async <T>(work: (client: never) => Promise<T>) => work(txClient as never),
    updateStage: async (data: UpdateDealStageData, client: unknown) => {
      clients.push(client);
      return row({ stage: data.stage, currentHolderId: data.currentHolderId, stageDueAt: data.stageDueAt });
    },
  } as unknown as DealsRepository;
  const service = new DealsService(repository, tasks as never, {
    record: async (input: AuditRecordInput, client: unknown) => {
      auditRecords.push(input);
      clients.push(client);
    },
  } as never);

  const result = await service.advanceStagePersisted({
    deal: deal(),
    toStage: 'BOOKING',
    currentHolderId: 'holder_2',
    stageDueAt: '2026-06-22T09:00:00.000Z',
  }, { actorId: 'manager_1', correlationId: 'req_deal' });

  assert.equal(result.taskId, 'task_1');
  assert.equal(result.deal.stage, 'BOOKING');
  assert.deepEqual(clients, [txClient, txClient, txClient]);
  assert.equal(auditRecords[0]?.action, 'deal_stage_advanced');
  assert.deepEqual(auditRecords[0]?.metadata, { fromStage: 'LEAD', toStage: 'BOOKING' });
});

test('deal handoff board derives stage, stuck, holder, and delay data from scoped rows', async () => {
  let scopedBranch: string | null | undefined;
  const repository = {
    listHandoffBoard: async (branchId: string | null) => {
      scopedBranch = branchId;
      return [
        row({ id: 'deal_late', stageDueAt: new Date('2026-06-20T08:00:00.000Z'), currentHolderId: 'holder_a' }),
        row({ id: 'deal_blocked', blocker: 'Missing docs', stage: 'BOOKING', currentHolderId: 'holder_a', stageDueAt: new Date('2026-06-20T09:00:00.000Z') }),
        row({ id: 'deal_ok', stage: 'PAYMENT', currentHolderId: 'holder_b', stageDueAt: new Date('2026-06-21T08:00:00.000Z') }),
      ];
    },
  } as unknown as DealsRepository;
  const service = new DealsService(repository);

  const result = await service.handoffBoard({ roleCode: 'BRANCH_MANAGER', branchId: 'branch_1' }, new Date('2026-06-20T10:00:00.000Z'));

  assert.equal(scopedBranch, 'branch_1');
  assert.equal(result.byStage.find((stage) => stage.stage === 'LEAD')?.count, 1);
  assert.deepEqual(result.stuck.map((deal) => [deal.id, deal.delayAgeMinutes]), [['deal_late', 120], ['deal_blocked', 60]]);
  assert.deepEqual(result.currentHolder, [
    { currentHolderId: 'holder_a', currentHolderName: null, count: 2 },
    { currentHolderId: 'holder_b', currentHolderName: null, count: 1 },
  ]);
});

test('ordinary employee is denied deal handoff board access in service', async () => {
  const service = new DealsService({ listHandoffBoard: async () => [] } as unknown as DealsRepository);

  await assert.rejects(
    service.handoffBoard({ roleCode: 'CR_OFFICER', branchId: 'branch_1' }),
    (error) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
});

function repo(): DealsRepository {
  return new DealsRepository({} as never);
}

function deal(): DealRecord {
  return {
    id: 'deal_1',
    title: 'RX delivery',
    branchId: 'branch_1',
    ownerId: 'owner_1',
    currentHolderId: 'sales_1',
    stage: 'LEAD' as const,
    stageDueAt: '2026-06-21T09:00:00.000Z',
    blocker: null,
    branchName: null,
    createdAt: '2026-06-20T08:00:00.000Z',
    currentHolderName: null,
    ownerName: null,
    updatedAt: '2026-06-20T08:00:00.000Z',
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
