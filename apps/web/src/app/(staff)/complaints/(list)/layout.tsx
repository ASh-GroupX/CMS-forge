import React from 'react';
import type { ReactNode } from 'react';
import { resolveLocale, staffShellText } from '../../../../i18n/staff-shell';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '../../../../components/ui/button';

export default async function ComplaintsListLayout({ children }: { children: ReactNode }) {
  const requestHeaders = await headers();
  const locale = resolveLocale(requestHeaders.get('x-cms-locale') ?? undefined);
  const activePath = requestHeaders.get('x-cms-pathname') ?? '/complaints';
  const t = staffShellText[locale];
  const isOperations = activePath.startsWith('/complaints/operations');
  const isBoard = activePath.startsWith('/complaints/board');
  const isQueue = !isOperations && !isBoard;

  return (
    <div className="w-full h-full flex flex-col gap-0 bg-surface-sunken min-w-0">
      <div className="flex items-center justify-between gap-6 px-6 pt-6 pb-2 border-b border-line-subtle bg-surface">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.nav.complaints[0]}</h1>
          <p className="text-content-muted">{t.nav.complaints[1]}</p>
        </div>
        <Button asChild className="gap-2 shrink-0">
          <Link href={`/complaints/new?locale=${locale}`}>
            <Plus aria-hidden="true" className="size-4" />
            <span>{locale === 'ar' ? 'شكوى جديدة' : 'New Complaint'}</span>
          </Link>
        </Button>
      </div>
      <nav className="flex items-center gap-6 px-6 py-2 border-b border-line-subtle bg-surface">
        <a 
          href={`/complaints?locale=${locale}`} 
          className={`text-sm font-semibold transition-colors ${isQueue ? 'text-brand' : 'text-content-strong hover:text-brand'}`}
        >
          {t.nav.queue[0]}
        </a>
        <a 
          href={`/complaints/operations?locale=${locale}`} 
          className={`text-sm font-semibold transition-colors ${isOperations ? 'text-brand' : 'text-content-strong hover:text-brand'}`}
        >
          {t.nav.operations[0]}
        </a>
        <a 
          href={`/complaints/board?locale=${locale}`} 
          className={`text-sm font-semibold transition-colors ${isBoard ? 'text-brand' : 'text-content-strong hover:text-brand'}`}
        >
          {t.nav.ticketBoard[0]}
        </a>
      </nav>
      <div className="flex-1 min-h-0 min-w-0 p-6">
        {children}
      </div>
    </div>
  );
}
