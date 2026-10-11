import React from 'react';
import { getCustomer } from '../../../../lib/staff-customers-api';
import { getStaffReportRows } from '../../../../lib/staff-reports-api';
import { FileText, Plus, ArrowLeft } from 'lucide-react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../../i18n/staff-shell';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  const cookieHeader = requestHeaders.get('cookie') ?? '';

  const res = await getCustomer(id);
  if (!res.ok) {
    return <div>Customer not found</div>;
  }
  const customer = res.data.customer;

  // Fetch complaints for this customer by phone
  const complaints = await getStaffReportRows({ cookieHeader, filters: { customer: customer.phone } }) ?? [];

  const t = {
    back: locale === 'ar' ? 'عودة' : 'Back',
    title: locale === 'ar' ? customer.nameAr || customer.nameEn : customer.nameEn,
    phone: locale === 'ar' ? 'رقم الهاتف' : 'Phone',
    dmsCode: locale === 'ar' ? 'الرمز التعريفي' : 'DMS Code',
    complaints: locale === 'ar' ? 'الشكاوى' : 'Complaints',
    recurring: locale === 'ar' ? 'إضافة شكوى متكررة' : 'Report Recurring Issue',
    status: locale === 'ar' ? 'الحالة' : 'Status',
    createdAt: locale === 'ar' ? 'تاريخ الإنشاء' : 'Created At',
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-sunken p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="mb-6 flex flex-col gap-4">
        <Link href="/customers" className="flex w-max items-center text-sm font-medium text-brand hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4 rtl:rotate-180" />
          {t.back}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-content-strong">{t.title}</h1>
            <p className="text-sm text-content-muted">
              {t.phone}: {customer.phone} {customer.dmsCode ? `| ${t.dmsCode}: ${customer.dmsCode}` : ''}
            </p>
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-auto rounded-xl border border-line-subtle bg-surface shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">{t.complaints}</h2>
        <div className="grid gap-4">
          {complaints.length > 0 ? complaints.map(c => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-line-subtle p-4 hover:bg-surface-sunken">
              <div>
                <div className="font-medium text-content-strong">
                  <Link href={`/complaints/${c.id}`} className="hover:underline">{c.referenceNumber} - {c.subject}</Link>
                </div>
                <div className="text-sm text-content-muted mt-1">
                  {t.status}: {c.status} | {t.createdAt}: {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link href={`/complaints/new?customerPhone=${encodeURIComponent(customer.phone)}&relatedTo=${c.id}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t.recurring}
                  </Button>
                </Link>
              </div>
            </div>
          )) : (
            <div className="text-sm text-content-muted py-8 text-center bg-surface-raised rounded-lg border border-line-subtle border-dashed">
              No complaints found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
