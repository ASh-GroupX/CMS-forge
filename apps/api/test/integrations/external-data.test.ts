import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ExternalDataController } from '../../src/modules/external-data/external-data.controller.js';
import { ExternalDataService } from '../../src/modules/external-data/external-data.service.js';
import { CustomersRepository } from '../../src/modules/customers/customers.repository.js';
import { CustomersService } from '../../src/modules/customers/customers.service.js';
import { ComplaintsRepository } from '../../src/modules/complaints/complaints.repository.js';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.js';
import { TasksRepository } from '../../src/modules/tasks/tasks.repository.js';
import { ServiceBookingsExportRepository } from '../../src/modules/service-bookings/service-bookings.export.repository.js';
import { InternalTicketsRepository } from '../../src/modules/internal-tickets/internal-tickets.repository.js';
import { InternalTicketsService } from '../../src/modules/internal-tickets/internal-tickets.service.js';
import type { IntegrationApiRequest } from '../../src/modules/integrations/integration-api-key.guard.js';

const key = { keyId: 'key-1', name: 'ERP', createdById: 'admin-1', scopes: ['customers:read', 'complaints:read', 'tasks:read', 'appointments:read', 'tickets:read'] as const, branchIds: ['b1'], allBranches: false };
const request = (): IntegrationApiRequest => ({ headers: {}, method: 'GET', integrationApiKey: { ...key, scopes: [...key.scopes] } });

test('all external routes use integration key guard', () => {
  for (const method of ['customers', 'complaints', 'tasks', 'appointments', 'tickets', 'complaintEvents', 'ticketEvents'] as const) {
    const guards = Reflect.getMetadata(GUARDS_METADATA, ExternalDataController.prototype[method]) as Array<{ name: string }>;
    assert.deepEqual(guards.map((guard) => guard.name), ['IntegrationApiKeyGuard']);
  }
});

test('customer page uses stored branch scope, limit and cursor, then audits row count', async () => {
  const calls: unknown[][] = [];
  const audits: unknown[] = [];
  const reader = { exportPage: async (...args: unknown[]) => { calls.push(args); return { items: [{ id: 'c2' }], nextCursor: 'c2' }; } };
  const audit = { record: async (entry: unknown) => { audits.push(entry); } };
  const service = new ExternalDataService(reader as never, reader as never, reader as never, reader as never, reader as never, audit as never);
  const page = await service.page('customers', { limit: '1', cursor: 'c1' }, request());
  assert.deepEqual(calls[0], [['b1'], 1, 'c1']);
  assert.deepEqual(page, { items: [{ id: 'c2' }], nextCursor: 'c2' });
  assert.deepEqual((audits[0] as { metadata: unknown }).metadata, { resource: 'customers', branchIds: ['b1'], rowCount: 1, nextCursor: 'c2' });
});

test('export denies ungranted resource or branch and oversized pages before reading', async () => {
  let reads = 0;
  const reader = { exportPage: async () => { reads += 1; return { items: [], nextCursor: null }; } };
  const service = new ExternalDataService(reader as never, reader as never, reader as never, reader as never, reader as never, { record: async () => undefined } as never);
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
    internalTicket: { findMany: async (args: Record<string, any>) => { calls.push(args); return []; } },
    complaintStatusHistory: { findMany: async () => [] },
    ticketActivity: { findMany: async () => [] },
  };
  await new CustomersRepository(prisma as never).exportPage(['b1'], 2, 'c1');
  await new ComplaintsRepository(prisma as never).exportPage(['b1'], 2, 'c1');
  await new TasksRepository(prisma as never).exportPage(['b1'], 2, 'c1');
  await new ServiceBookingsExportRepository(prisma as never).page(['b1'], 2, 'c1');
  await new InternalTicketsRepository(prisma as never).exportPage(['b1'], 2, 'c1');
  assert.equal(calls.length, 5);
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
  assert.deepEqual(calls[4]?.where, { requestedBy: { branchId: { in: ['b1'] } } });
  assert.equal(calls[4]?.select.notes, undefined);
  assert.equal(calls[4]?.select.activities.select.details, undefined);
  assert.equal(calls[1]?.select.createdBy.select.passwordHash, undefined);
  assert.equal(calls[1]?.select.statusHistory.select.reason, undefined);
});

test('complaint export identifies the employee who accepted intake from history', async () => {
  const person = { id: 'u1', nameEn: 'Agent', nameAr: 'وكيل' };
  const history = [{ action: 'ACCEPT_INTAKE', actor: person, createdAt: new Date('2026-01-01') }];
  const repository = { exportPage: async () => [{ id: 'c1', statusHistory: history }],
    exportAcceptances: async () => [{ id: 'c1', statusHistory: [{ actor: person, createdAt: history[0]?.createdAt }] }] };
  const complaints = new ComplaintsService(repository as never, {} as never);
  const page = await complaints.exportPage(['b1'], 1);
  assert.deepEqual(page.items[0]?.acceptedBy, person);
  assert.deepEqual(page.items[0]?.acceptedAt, history[0]?.createdAt);
});

test('long histories are previewed at 100 and full events remain cursor paginated', async () => {
  const activities = Array.from({ length: 101 }, (_, i) => ({ id: `a${i}`, action: 'UPDATED',
    actorId: 'u1', actor: { id: 'u1', nameEn: 'Agent', nameAr: 'وكيل' }, createdAt: new Date('2026-01-01') }));
  const ticket = { id: 't1', requestedBy: { id: 'u1', nameEn: 'Agent', nameAr: 'وكيل', branchId: 'b1' },
    targetDepartment: { id: 'd1', branchId: null, nameEn: 'Service', nameAr: 'الخدمة' }, activities };
  const repository = { exportPage: async () => [ticket], exportAcceptances: async () => [{ id: 't1', activities: [{ actor: ticket.requestedBy, createdAt: activities[0]?.createdAt }] }],
    exportEventsPage: async (_id: string, _branches: unknown, limit: number, cursor?: string) =>
    activities.slice(cursor ? activities.findIndex((item) => item.id === cursor) + 1 : 0, cursor ? activities.findIndex((item) => item.id === cursor) + 1 + limit + 1 : limit + 1) };
  const service = new InternalTicketsService(repository as never, {} as never);
  const preview = await service.exportPage(['b1'], 1);
  assert.equal(preview.items[0]?.activities.length, 100);
  assert.equal(preview.items[0]?.activitiesHasMore, true);
  assert.equal(preview.items[0]?.acceptedBy?.id, 'u1');
  const first = await service.exportEventsPage('t1', ['b1'], 100);
  const second = await service.exportEventsPage('t1', ['b1'], 100, first.nextCursor ?? undefined);
  assert.equal(first.items.length, 100);
  assert.equal(second.items.length, 1);
  assert.equal(second.nextCursor, null);
});

test('event endpoints reject a key without resource or branch scope', async () => {
  const calls: unknown[] = [];
  const reader = { exportEventsPage: async (...args: unknown[]) => { calls.push(args); return { items: [], nextCursor: null }; } };
  const service = new ExternalDataService(reader as never, reader as never, reader as never, reader as never, reader as never, { record: async () => undefined } as never);
  const customerOnly = request(); customerOnly.integrationApiKey!.scopes = ['customers:read'];
  await assert.rejects(service.events('tickets', 't1', {}, customerOnly));
  await assert.rejects(service.events('complaints', 'c1', { branchId: 'other' }, request()));
  assert.equal(calls.length, 0);
});

test('ticket acceptance comes from persisted activity and a key without tickets scope is denied', async () => {
  const person = { id: 'u1', nameEn: 'Agent', nameAr: 'وكيل' };
  const ticket = { id: 't1', requestedBy: { ...person, branchId: 'b1' }, assignedEmployee: person,
    targetDepartment: { id: 'd1', branchId: null, nameEn: 'Service', nameAr: 'الخدمة' },
    activities: [{ action: 'ACCEPTED', actorId: 'u1', actor: person, createdAt: new Date('2026-01-01') }] };
  const repository = { exportPage: async () => [ticket],
    exportAcceptances: async () => [{ id: 't1', activities: [{ actor: person, createdAt: ticket.activities[0]?.createdAt }] }] };
  const tickets = new InternalTicketsService(repository as never, {} as never);
  const page = await tickets.exportPage(['b1'], 1);
  assert.deepEqual(page.items[0]?.acceptedBy, person);
  assert.equal(page.items[0]?.branchId, 'b1');
  const service = new ExternalDataService({} as never, {} as never, {} as never, {} as never, tickets, { record: async () => undefined } as never);
  const noTickets = request();
  noTickets.integrationApiKey!.scopes = ['customers:read'];
  await assert.rejects(service.page('tickets', {}, noTickets));
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
