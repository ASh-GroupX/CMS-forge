import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PremiumDashboard } from '../../src/components/dashboard-premium';
import { filterDepartmentTicketFlow } from '../../src/app/(staff)/internal-tickets/my-work/page';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';

const principal = {
  sessionId: 'session', userId: 'admin', email: 'admin@example.invalid', nameEn: 'Admin', nameAr: 'مدير',
  roleCode: 'ADMIN', permissions: ['COMPLAINT_VIEW_ALL', 'REPORT_VIEW'], branchId: null,
};
const crm = {
  total: 5, inProgress: 2, resolved: 0, closed: 0, escalated: 0, alternativeCarCount: 0,
  justifiedCount: 1, unjustifiedCount: 1,
  satisfaction: { satisfied: 1, neutral: 1, unsatisfied: 1 }, rootCauses: [],
};
const managerPrincipal = {
  ...principal, roleCode: 'INTERNAL_MANAGER', departmentId: 'dept-it', viewMode: 'INTERNAL_TICKETS',
  permissions: ['TICKET_VIEW_DEPARTMENT'],
};

test('dashboard justification and satisfaction cards link to filtered complaint queues in both locales', () => {
  for (const locale of ['en', 'ar'] as const) {
    const html = renderToStaticMarkup(<PremiumDashboard locale={locale} principal={principal as any} data={{ crm }} />);
    assert.ok(html.includes(`href="/complaints?isJustified=true&amp;locale=${locale}"`));
    assert.ok(html.includes(`href="/complaints?isJustified=false&amp;locale=${locale}"`));
    assert.ok(html.includes(`href="/complaints?satisfactionStatus=SATISFIED&amp;locale=${locale}"`));
    assert.ok(html.includes(`href="/complaints?satisfactionStatus=UNSATISFIED&amp;locale=${locale}"`));
  }
});

test('manager dashboard retains analysis and performance while department cards link to exact lists', () => {
  for (const locale of ['en', 'ar'] as const) {
    const html = renderToStaticMarkup(<AppRouterContext.Provider value={{ push() {} } as any}><SearchParamsContext.Provider value={new URLSearchParams()}><PremiumDashboard locale={locale} principal={managerPrincipal as any} data={{ manager: { receivedTickets: 12, sentTickets: 9 } }} /></SearchParamsContext.Provider></AppRouterContext.Provider>);
    assert.ok(html.includes(`/internal-tickets/my-work?filter=department-received&amp;locale=${locale}`));
    assert.ok(html.includes(`/internal-tickets/my-work?filter=department-sent&amp;locale=${locale}`));
    assert.ok(html.includes(locale === 'en' ? 'Avg Completion' : 'متوسط الإنجاز'));
    assert.ok(html.includes(locale === 'en' ? 'Performance KPI' : 'مؤشر الأداء'));
    assert.ok(html.includes(locale === 'en' ? 'Employee Performance &amp; Ratings' : 'أداء الموظفين وتقييمهم'));
  }
});

test('department card destinations keep only the matching server-scoped ticket flow', () => {
  const tickets = [
    { id: 'received', status: 'NEW', targetDepartmentId: 'dept-it', requestedBy: { departmentId: 'dept-sales' } },
    { id: 'sent', status: 'IN_PROGRESS', targetDepartmentId: 'dept-sales', requestedBy: { departmentId: 'dept-it' } },
    { id: 'pending', status: 'PENDING_APPROVAL', targetDepartmentId: 'dept-sales', requestedBy: { departmentId: 'dept-it' } },
    { id: 'other', status: 'NEW', targetDepartmentId: 'dept-service', requestedBy: { departmentId: 'dept-sales' } },
  ];
  assert.deepEqual(filterDepartmentTicketFlow(tickets, 'department-received', 'dept-it').map((ticket) => ticket.id), ['received']);
  assert.deepEqual(filterDepartmentTicketFlow(tickets, 'department-sent', 'dept-it').map((ticket) => ticket.id), ['sent']);
});
