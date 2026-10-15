import React from 'react';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { resolveLocale } from '../../../i18n/staff-shell';

export default async function InternalTicketsLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  const isAr = locale === 'ar';

  return (
    <div className="w-full flex flex-col gap-6 bg-surface rounded-3xl p-6 shadow-sm border border-line-subtle" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isAr ? 'التذاكر الداخلية' : 'Internal Tickets'}</h1>
          <p className="text-content-muted">{isAr ? 'إدارة الطلبات وسير العمل بين الأقسام.' : 'Manage cross-department requests and workflow.'}</p>
        </div>
        <Button asChild className="gap-2 shrink-0">
          <Link href={`/internal-tickets/new?locale=${locale}`}>
            <Plus aria-hidden="true" className="size-4" />
            <span>{isAr ? 'تذكرة جديدة' : 'New Ticket'}</span>
          </Link>
        </Button>
      </div>
      <nav className="flex items-center gap-6 border-b border-line-subtle pb-3">
        <Link href={`/internal-tickets?locale=${locale}`} className="text-sm font-semibold text-content-strong hover:text-brand transition-colors">
          {isAr ? 'القسم' : 'Department'}
        </Link>
        <Link href={`/internal-tickets/my-work?locale=${locale}`} className="text-sm font-semibold text-content-strong hover:text-brand transition-colors">
          {isAr ? 'عملي' : 'My Work'}
        </Link>
      </nav>
      {children}
    </div>
  );
}
