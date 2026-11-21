import assert from 'node:assert/strict';
import test from 'node:test';
import { InternalTicketsRepository } from './internal-tickets.repository.js';
import { InternalTicketsService } from './internal-tickets.service.js';
import { AppException } from '../../core/http-kernel.js';

test('internal-tickets service can be constructed', () => {
  assert.ok(new InternalTicketsService(new InternalTicketsRepository(null as any), null as any, null as any));
});

test('department ticket read includes sent and received flows but excludes pending approval', async () => {
  let query: any;
  const repository = { findMany: async (input: any) => { query = input; return []; } };
  const service = new InternalTicketsService(repository as any, null as any, null as any);

  await service.getDepartmentTickets('department-1');

  assert.deepEqual(query.where, {
    OR: [
      { targetDepartmentId: 'department-1', status: { notIn: ['PENDING_APPROVAL'] } },
      { requestedBy: { departmentId: 'department-1' }, status: { notIn: ['PENDING_APPROVAL'] } },
    ],
  });
});

test('internal officer ticket list includes only requested or assigned tickets', async () => {
  let where: any;
  const service = new InternalTicketsService({ findMany: async (query: any) => { where = query.where; return []; } } as any, null as any, null as any);
  await service.getMyTickets('department-1', 'officer-1', 'INTERNAL_OFFICER');
  assert.deepEqual(where, { OR: [{ requestedById: 'officer-1' }, { assignedEmployeeId: 'officer-1' }] });
  await service.getMyTickets('department-1', 'manager-1', 'INTERNAL_MANAGER');
  assert.ok(where.OR.some((entry: any) => entry.targetDepartmentId === 'department-1'));
});

test('internal officer cannot open another department member ticket', async () => {
  const ticket = { id: 'ticket-1', targetDepartmentId: 'department-1', requestedById: 'manager-1', assignedEmployeeId: 'officer-2', requestedBy: { departmentId: 'department-1' } };
  const service = new InternalTicketsService({ findById: async () => ticket } as any, null as any, null as any);
  await assert.rejects(service.getTicket('ticket-1', { roleCode: 'INTERNAL_OFFICER', userId: 'officer-1', departmentId: 'department-1' }), (error: any) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN');
  assert.equal((await service.getTicket('ticket-1', { roleCode: 'INTERNAL_OFFICER', userId: 'officer-2', departmentId: 'department-1' })).id, 'ticket-1');
});

test('waiting transition stores a readable reason snapshot in activity history', async () => {
  let activity: any;
  const tx = {
    ticketWaitingReason: { findUnique: async () => ({ reasonEn: 'Waiting for customer', reasonAr: 'بانتظار العميل' }) },
    internalTicket: { update: async () => ({ id: 'ticket-1', status: 'WAITING' }) },
    ticketActivity: { create: async ({ data }: any) => { activity = data; } },
  };
  const repository = { transaction: async (work: any) => work(tx) };
  const service = new InternalTicketsService(repository as any, null as any, null as any);

  await service.wait('ticket-1', 'actor-1', { waitingReasonId: 'reason-1' });

  assert.equal(activity.details.reason, 'Waiting for customer');
  assert.equal(activity.details.reasonAr, 'بانتظار العميل');
});

test('adding a note notifies each participant once after commit and excludes the author', async () => {
  const calls: any[] = [];
  let committed = false;
  const tx = {
    internalTicket: { findUnique: async () => ({ id: 'ticket-1' }) },
    ticketNote: { create: async () => ({ id: 'note-1' }) },
    ticketActivity: { create: async () => ({}) },
  };
  const repository = {
    transaction: async (work: any) => {
      const result = await work(tx);
      committed = true;
      return result;
    },
    notificationContext: async () => ({
      referenceNumber: 'TKT-1', title: 'Printer issue', requestedById: 'creator',
      assignedEmployeeId: 'assignee', requestedEmployeeId: 'assignee',
      targetDepartment: { users: [{ id: 'author' }, { id: 'assignee' }, { id: 'department-user' }] },
    }),
  };
  const notifications = {
    queueInternal: async (input: any) => {
      assert.equal(committed, true);
      calls.push(input);
      return {};
    },
  };
  const service = new InternalTicketsService(repository as any, null as any, notifications as any);

  await service.addNote('ticket-1', 'author', { content: 'Please respond' });

  assert.deepEqual(calls.map((call) => call.recipientUserId).sort(), ['assignee', 'creator', 'department-user']);
  assert.ok(calls.every((call) => call.payload.href === '/internal-tickets/ticket-1'));
  assert.ok(calls.every((call) => call.templateCode === 'internal_ticket.note_added'));
});

test('creating a ticket notifies its active recipients after commit', async () => {
  const calls: any[] = [];
  let committed = false;
  const tx = {
    userTicketRule: { findUnique: async () => null },
    departmentTicketCustomField: { findMany: async () => [] },
    internalTicket: { create: async () => ({ id: 'ticket-2', referenceNumber: 'TKT-2', title: 'New request' }) },
    ticketActivity: { create: async () => ({}) },
  };
  const repository = {
    transaction: async (work: any) => {
      const result = await work(tx);
      committed = true;
      return result;
    },
    notificationContext: async () => ({
      referenceNumber: 'TKT-2', title: 'New request', requestedById: 'creator',
      assignedEmployeeId: 'recipient', requestedEmployeeId: 'recipient',
      targetDepartment: { users: [{ id: 'recipient' }] },
    }),
  };
  const notifications = { queueInternal: async (input: any) => { assert.equal(committed, true); calls.push(input); return {}; } };
  const service = new InternalTicketsService(repository as any, null as any, notifications as any);

  await service.create(
    { userId: 'creator', roleCode: 'ADMIN', permissions: [] },
    { title: 'New request', description: 'Details', targetDepartmentId: 'department-1', categoryId: 'category-1' } as any,
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].recipientUserId, 'recipient');
  assert.equal(calls[0].templateCode, 'internal_ticket.created');
});

test('simultaneous ticket creates use distinct references and retry returns the original', async () => {
  const stored = new Map<string, any>();
  let writes = 0;
  const tx = {
    userTicketRule: { findUnique: async () => null },
    departmentTicketCustomField: { findMany: async () => [] },
    internalTicket: { create: async ({ data }: any) => { writes++; const row = { ...data, id: data.id }; stored.set(row.id, row); return row; } },
    ticketActivity: { create: async () => ({}) },
  };
  const repository = { findById: async (id: string) => stored.get(id) ?? null, transaction: async (work: any) => work(tx) };
  const service = new InternalTicketsService(repository as any, null as any, null as any);
  const principal = { userId: 'staff-1', roleCode: 'ADMIN', permissions: [] };
  const base = { title: 'Request', description: 'Details', targetDepartmentId: 'department-1', categoryId: 'category-1' };
  const requests = Array.from({ length: 20 }, (_, index) => ({ ...base, requestId: `11111111-1111-4111-8111-${String(index).padStart(12, '0')}` }));
  const rows = await Promise.all(requests.map((input) => service.create(principal, input as any)));
  assert.equal(new Set(rows.map((row) => row.referenceNumber)).size, rows.length);
  assert.equal((await service.create(principal, requests[0] as any)).id, rows[0]?.id);
  assert.equal(writes, 20);
  await assert.rejects(service.create({ ...principal, userId: 'staff-2' }, requests[0] as any), (error: any) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN');
});

test('ticket attachment storage finishes before opening the database transaction', async () => {
  let stored = false;
  let metadata: any;
  const attachments = { storeObject: async () => { await new Promise((resolve) => setTimeout(resolve, 10)); stored = true; return { storageKey: 'attachments/staged.jpg' }; } };
  const tx = {
    userTicketRule: { findUnique: async () => null },
    departmentTicketCustomField: { findMany: async () => [] },
    internalTicket: { create: async ({ data }: any) => ({ ...data, id: 'ticket-1' }) },
    ticketActivity: { create: async () => ({}) },
    ticketAttachment: { create: async ({ data }: any) => { metadata = data; } },
  };
  const repository = { transaction: async (work: any) => { assert.equal(stored, true); return work(tx); } };
  const service = new InternalTicketsService(repository as any, attachments as any, null as any);
  const result = await service.create({ userId: 'staff-1', roleCode: 'ADMIN' }, { title: 'Request', description: 'Details', targetDepartmentId: 'department-1', categoryId: 'category-1', attachments: [{ fileName: 'photo.jpg', contentType: 'image/jpeg', sizeBytes: 5, contentBase64: 'aGVsbG8=' }] } as any);
  assert.equal(result.id, 'ticket-1');
  assert.equal(metadata.storageKey, 'attachments/staged.jpg');
  assert.equal(metadata.ticketId, 'ticket-1');
});

test('simultaneous ticket replay resolves the saved row after a unique ID conflict', async () => {
  const requestId = '33333333-3333-4333-8333-333333333333';
  let lookups = 0;
  const repository = {
    findById: async () => ++lookups === 1 ? null : { id: requestId, requestedById: 'staff-1' },
    transaction: async () => { throw { code: 'P2002' }; },
  };
  const service = new InternalTicketsService(repository as any, null as any, null as any);
  const result = await service.create({ userId: 'staff-1', roleCode: 'ADMIN' }, { requestId, title: 'Request', description: 'Details', targetDepartmentId: 'department-1', categoryId: 'category-1' } as any);
  assert.equal(result.id, requestId);
});
