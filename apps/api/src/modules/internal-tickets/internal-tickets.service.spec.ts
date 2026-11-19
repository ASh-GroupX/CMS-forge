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
