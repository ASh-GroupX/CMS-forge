import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { EnterpriseReportsDashboard } from '../../src/components/reports/enterprise-reports-dashboard';
import { StaffNavigationScope } from '../../src/lib/use-staff-ui-state';
export function Fixture({ locale = 'en' }: { locale?: 'en' | 'ar' }) {
  return <StaffNavigationScope owner="workspace-proof"><main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="p-4">
    <EnterpriseReportsDashboard locale={locale} isAdmin={true}
      departments={[{ id: 'service', name: locale === 'ar' ? 'الصيانة' : 'Service' }]}
      departmentsPerformance={[]} complaintsAnalytics={null} ticketsAnalytics={null}
      complaintsRecords={[]} ticketsRecords={[]} />
  </main></StaffNavigationScope>;
}
if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root')!, <Fixture locale={document.documentElement.lang === 'ar' ? 'ar' : 'en'} />);
