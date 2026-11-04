import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { ReportStatusBoard } from '../../src/components/reports/report-status-board';

export function Fixture({ locale = 'en', status = null, from = null }: { locale?: 'en' | 'ar'; status?: string | null; from?: string | null }) {
  return <main dir={locale === 'ar' ? 'rtl' : 'ltr'} className="p-4">
    <ReportStatusBoard locale={locale} departmentId={null} branchId={null} search="" type="all"
      selectedStatus={status} externalDateFrom={from}
      departments={[{ id: 'service', name: 'Service', nameAr: 'الصيانة' }, { id: 'sales', name: 'Sales', nameAr: 'المبيعات' }]} />
  </main>;
}

if (typeof document !== 'undefined') {
  const locale = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const query = new URLSearchParams(location.search);
  hydrateRoot(document.getElementById('root')!, <Fixture locale={locale} status={query.get('status')} from={query.get('from')} />);
}
