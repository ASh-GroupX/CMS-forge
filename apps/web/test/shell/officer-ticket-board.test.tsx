import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DepartmentKanbanBoard } from '../../src/app/(staff)/internal-tickets/department-kanban-board';

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
