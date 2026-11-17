import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { PremiumDashboard } from '../../src/components/dashboard-premium';
import { TicketStatusExplanation } from '../../src/app/(staff)/internal-tickets/[id]/ticket-status-explanation';

export function TicketDashboardDrilldownFixture({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
  const isAr = locale === 'ar';
  const principal = { sessionId: 'proof', userId: 'admin', email: 'proof@example.invalid', nameEn: 'Admin', nameAr: 'مدير', roleCode: 'ADMIN', permissions: ['COMPLAINT_VIEW_ALL', 'REPORT_VIEW'], branchId: null };
  const crm = { total: 5, inProgress: 2, resolved: 0, closed: 0, escalated: 0, alternativeCarCount: 0, justifiedCount: 1, unjustifiedCount: 1, satisfaction: { satisfied: 1, neutral: 1, unsatisfied: 1 }, rootCauses: [] };
  return <main dir={isAr ? 'rtl' : 'ltr'} className="space-y-8 bg-surface-canvas p-6">
    <section aria-label={isAr ? 'أسباب حالات التذاكر' : 'Ticket status reasons'} className="grid gap-4 md:grid-cols-3">
      <TicketStatusExplanation locale={locale} ticket={{ status: 'WAITING', waitingReason: { reasonEn: 'Waiting for customer response', reasonAr: 'بانتظار رد العميل' }, customWaitingReason: null }} />
      <TicketStatusExplanation locale={locale} ticket={{ status: 'RESOLVED', resolutionReason: { reasonEn: 'Request completed', reasonAr: 'تم إنجاز الطلب' }, resolutionDetails: isAr ? 'تم التواصل مع القسم وتأكيد الإجراء.' : 'The department confirmed the completed action.' }} />
      <TicketStatusExplanation locale={locale} ticket={{ status: 'REJECTED', rejectReason: { reasonEn: 'More information required', reasonAr: 'مطلوب معلومات إضافية' }, rejectDetails: isAr ? 'يرجى إرفاق المستند الناقص.' : 'Please attach the missing document.' }} />
    </section>
    <PremiumDashboard locale={locale} principal={principal as any} data={{ crm }} />
  </main>;
}

if (typeof document !== 'undefined') {
  const locale = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  hydrateRoot(document.getElementById('root')!, <TicketDashboardDrilldownFixture locale={locale} />);
}
