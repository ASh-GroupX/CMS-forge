import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ExternalDataController } from '../../src/modules/external-data/external-data.controller.js';
import { ExternalDataService } from '../../src/modules/external-data/external-data.service.js';
import { CustomersRepository } from '../../src/modules/customers/customers.repository.js';
import { CustomersService } from '../../src/modules/customers/customers.service.js';
import { ComplaintsRepository } from '../../src/modules/complaints/complaints.repository.js';
import { TasksRepository } from '../../src/modules/tasks/tasks.repository.js';
import { ServiceBookingsExportRepository } from '../../src/modules/service-bookings/service-bookings.export.repository.js';
import type { IntegrationApiRequest } from '../../src/modules/integrations/integration-api-key.guard.js';

const key = { keyId: 'key-1', name: 'ERP', createdById: 'admin-1', scopes: ['customers:read', 'complaints:read', 'tasks:read', 'appointments:read'] as const, branchIds: ['b1'], allBranches: false };
const request = (): IntegrationApiRequest => ({ headers: {}, method: 'GET', integrationApiKey: { ...key, scopes: [...key.scopes] } });

test('all four external routes use integration key guard', () => {
  for (const method of ['customers', 'complaints', 'tasks', 'appointments'] as const) {
    const guards = Reflect.getMetadata(GUARDS_METADATA, ExternalDataController.prototype[method]) as Array<{ name: string }>;
    assert.deepEqual(guards.map((guard) => guard.name), ['IntegrationApiKeyGuard']);
  }
});

test('customer page uses stored branch scope, limit and cursor, then audits row count', async () => {
  const calls: unknown[][] = [];
  const audits: unknown[] = [];
  const reader = { exportPage: async (...args: unknown[]) => { calls.push(args); return { items: [{ id: 'c2' }], nextCursor: 'c2' }; } };
  const audit = { record: async (entry: unknown) => { audits.push(entry); } };
  const service = new ExternalDataService(reader as never, reader as never, reader as never, reader as never, audit as never);
  const page = await service.page('customers', { limit: '1', cursor: 'c1' }, request());
  assert.deepEqual(calls[0], [['b1'], 1, 'c1']);
  assert.deepEqual(page, { items: [{ id: 'c2' }], nextCursor: 'c2' });
  assert.deepEqual((audits[0] as { metadata: unknown }).metadata, { resource: 'customers', branchIds: ['b1'], rowCount: 1, nextCursor: 'c2' });
});

test('export denies ungranted resource or branch and oversized pages before reading', async () => {
  let reads = 0;
  const reader = { exportPage: async () => { reads += 1; return { items: [], nextCursor: null }; } };
  const service = new ExternalDataService(reader as never, reader as never, reader as never, reader as never, { record: async () => undefined } as never);
  const onlyCustomer = request();
  onlyCustomer.integrationApiKey!.scopes = ['customers:read'];
  await assert.rejects(service.page('complaints', {}, onlyCustomer));
  await assert.rejects(service.page('customers', { branchId: 'b2' }, request()));
  await assert.rejects(service.page('customers', { limit: '101' }, request()));
  assert.equal(reads, 0);
});

test('owning repositories query stored branches with bounded cursor pages and safe fields', async () => {
  const calls: Array<Record<string, any>> = [];
  const prisma = {
    customer: { findMany: async (args: Record<string, any>) => { calls.push(args); return []; } },
    complaint: { findMany: async (args: Record<string, any>) => { calls.push(args); return []; } },
    task: { findMany: async (args: Record<string, any>) => { calls.push(args); return []; } },
    serviceAppointment: { findMany: async (args: Record<string, any>) => { calls.push(args); return []; } },
  };
  await new CustomersRepository(prisma as never).exportPage(['b1'], 2, 'c1');
  await new ComplaintsRepository(prisma as never).exportPage(['b1'], 2, 'c1');
  await new TasksRepository(prisma as never).exportPage(['b1'], 2, 'c1');
  await new ServiceBookingsExportRepository(prisma as never).page(['b1'], 2, 'c1');
  assert.equal(calls.length, 4);
  for (const call of calls) {
    assert.equal(call.take, 3);
    assert.deepEqual(call.cursor, { id: 'c1' });
    assert.equal(call.skip, 1);
    assert.equal(call.select.notes, undefined);
    assert.equal(call.select.customerPhone, undefined);
    assert.equal(call.select.investigationNotes, undefined);
  }
  assert.deepEqual(calls[0]?.where, { complaints: { some: { branchId: { in: ['b1'] } } } });
  assert.deepEqual(calls[1]?.where, { branchId: { in: ['b1'] } });
  assert.deepEqual(calls[2]?.where, { confidentialityLevel: 'NORMAL', owner: { branchId: { in: ['b1'] } } });
  assert.deepEqual(calls[3]?.where, { branchId: { in: ['b1'] } });
});

test('cursor pages return the next ID without repeating rows', async () => {
  const records = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const repository = {
    exportPage: async (_branches: unknown, limit: number, cursor?: string) => {
      const start = cursor ? records.findIndex((row) => row.id === cursor) + 1 : 0;
      return records.slice(start, start + limit + 1);
    },
  };
  const service = new CustomersService(repository as never);
  const first = await service.exportPage(null, 2);
  const second = await service.exportPage(null, 2, first.nextCursor ?? undefined);
  assert.deepEqual(first.items.map((row) => row.id), ['a', 'b']);
  assert.equal(first.nextCursor, 'b');
  assert.deepEqual(second.items.map((row) => row.id), ['c', 'd']);
  assert.equal(second.nextCursor, null);
});
