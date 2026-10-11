import React from 'react';
import { Users, Search, ChevronRight } from 'lucide-react';
import { headers } from 'next/headers';
import { resolveLocale } from '../../../i18n/staff-shell';
import { searchCustomers } from '../../../lib/staff-customers-api';
import Link from 'next/link';

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  const params = await searchParams;
  const q = params.q ?? '';

  let results: any[] = [];
  if (q) {
    const res = await searchCustomers(q);
    if (res.ok) results = res.data.items;
  }

  const t = {
    title: locale === 'ar' ? 'العملاء' : 'Customers',
    subtitle: locale === 'ar' ? 'إدارة العملاء والمركبات.' : 'Manage customers and vehicles.',
    emptyState: locale === 'ar' ? 'ابحث عن عميل للبدء' : 'Search for a customer to begin',
    searchPlaceholder: locale === 'ar' ? 'ابحث برقم الهاتف أو الرمز التعريفي' : 'Search by phone number or DMS code',
    noResults: locale === 'ar' ? 'لم يتم العثور على عملاء' : 'No customers found',
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface p-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-content-strong">{t.title}</h1>
          <p className="text-sm text-content-muted">{t.subtitle}</p>
        </div>
      </header>
      
      <div className="mb-6">
        <form className="relative max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-content-subtle" />
          </div>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t.searchPlaceholder}
            className="block w-full rounded-md border border-line-subtle bg-surface px-10 py-2 text-sm text-content-strong focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </form>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-line-subtle bg-surface shadow-sm">
        {q ? (
          results.length > 0 ? (
            <ul className="divide-y divide-line-subtle">
              {results.map((c) => (
                <li key={c.id}>
                  <Link href={`/customers/${c.id}`} className="flex items-center justify-between p-4 hover:bg-surface-sunken">
                    <div>
                      <div className="font-medium text-content-strong">{locale === 'ar' ? c.nameAr : c.nameEn}</div>
                      <div className="text-sm text-content-muted">{c.phone} {c.dmsCode ? `• ${c.dmsCode}` : ''}</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-content-subtle rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-full items-center justify-center text-content-muted">
              {t.noResults}
            </div>
          )
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-brand-subtle p-4 mb-4">
              <Users className="size-8 text-brand" aria-hidden="true" />
            </div>
            <p className="text-lg font-medium text-content-strong">{t.emptyState}</p>
          </div>
        )}
      </div>
    </div>
  );
}
