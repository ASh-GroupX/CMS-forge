import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DepartmentKanbanBoard } from '../../src/app/(staff)/internal-tickets/department-kanban-board';
import { selectDepartmentBoardTickets } from '../../src/app/(staff)/internal-tickets/page';
import { filterDepartmentTicketFlow } from '../../src/app/(staff)/internal-tickets/my-work/page';

test('outgoing team ticket stays in Sent and off the sender department board', () => {
  const tickets = [
    { id: 'outgoing', targetDepartmentId: 'erp', requestedBy: { departmentId: 'sales' }, status: 'ASSIGNED', assignedEmployeeId: null },
    { id: 'received', targetDepartmentId: 'sales', requestedBy: { departmentId: 'erp' }, status: 'ASSIGNED', assignedEmployeeId: null },
  ];
  assert.deepEqual(selectDepartmentBoardTickets(tickets, 'sales', false).map((ticket) => ticket.id), ['received']);
  assert.deepEqual(selectDepartmentBoardTickets(tickets, 'erp', false).map((ticket) => ticket.id), ['outgoing']);
  assert.deepEqual(selectDepartmentBoardTickets(tickets, null, false), []);
  assert.deepEqual(selectDepartmentBoardTickets(tickets, null, true), tickets);
  assert.deepEqual(filterDepartmentTicketFlow(tickets, 'department-sent', 'sales').map((ticket) => ticket.id), ['outgoing']);
  const board = renderToStaticMarkup(<DepartmentKanbanBoard initialTickets={selectDepartmentBoardTickets(tickets, 'sales', false)} team={[]} isAdmin={false} isManager={false} locale="en" principalUserId="sales-officer" principalNameEn="Sales officer" />);
  assert.doesNotMatch(board, /outgoing/);
});

test('officer sees their own named column even when team workload is denied', () => {
  const tickets = [
    { id: 'team', title: 'Shared request', status: 'ASSIGNED', assignedEmployeeId: null, requestedBy: { nameEn: 'Manager' } },
    { id: 'mine', title: 'My assigned request', status: 'ASSIGNED', assignedEmployeeId: 'officer-1', requestedBy: { nameEn: 'Manager' } },
  ];
  for (const locale of ['en', 'ar'] as const) {
    const html = renderToStaticMarkup(<DepartmentKanbanBoard initialTickets={tickets} team={[]} isAdmin={false} isManager={false} locale={locale} principalUserId="officer-1" principalNameEn="Omar" principalNameAr="عمر" />);
    assert.match(html, /Shared request/);
    assert.match(html, /My assigned request/);
    assert.match(html, new RegExp(locale === 'ar' ? 'عمر' : 'Omar'));
  }
  const signedOut = renderToStaticMarkup(<DepartmentKanbanBoard initialTickets={[]} team={[]} isAdmin={false} isManager={false} locale="en" />);
  assert.doesNotMatch(signedOut, /Omar/);
});
