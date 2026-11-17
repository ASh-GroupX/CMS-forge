import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PremiumDashboard } from '../../src/components/dashboard-premium';

const principal = {
  sessionId: 'session', userId: 'admin', email: 'admin@example.invalid', nameEn: 'Admin', nameAr: 'مدير',
  roleCode: 'ADMIN', permissions: ['COMPLAINT_VIEW_ALL', 'REPORT_VIEW'], branchId: null,
};
const crm = {
  total: 5, inProgress: 2, resolved: 0, closed: 0, escalated: 0, alternativeCarCount: 0,
  justifiedCount: 1, unjustifiedCount: 1,
  satisfaction: { satisfied: 1, neutral: 1, unsatisfied: 1 }, rootCauses: [],
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
