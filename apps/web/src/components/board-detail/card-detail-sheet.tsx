'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import React, { type ReactNode } from 'react';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';

// Shared, presentational quick-look drawer for both boards (task + ticket).
// It owns no data fetching and makes no state decisions — each board passes in a
// title, meta rows, a body (read-only threaded updates / timeline) and a link to
// the full detail page. Heavy interactions live on that detail page by design
// (docs/CMSS_REVAMP_PLAN.md B6: "link to detail page").

export type CardDetailMeta = { label: string; value: string; tone?: 'default' | 'muted' | 'danger' };

export function CardDetailSheet({
  open, onOpenChange, dir, reference, title, badges, meta, updatesLabel, children, detailHref, detailLabel, closeLabel, description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dir: 'rtl' | 'ltr';
  reference?: string;
  title: string;
  badges?: ReactNode;
  meta: CardDetailMeta[];
  updatesLabel: string;
  children: ReactNode;
  detailHref: string;
  detailLabel: string;
  closeLabel: string;
  description: string;
}) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        aria-label={title}
        className="flex w-full max-w-md flex-col gap-0 border-line-subtle bg-surface p-0 sm:max-w-md"
        dir={dir}
        side={dir === 'rtl' ? 'left' : 'right'}
      >
        <SheetHeader className="space-y-1 border-b border-line-subtle p-5 text-start">
          {reference ? <p className="font-mono text-xs font-bold text-content-muted">{reference}</p> : null}
          <SheetTitle className="text-base font-bold leading-snug text-content-strong">{title}</SheetTitle>
          <SheetDescription className="text-xs text-content-subtle">{description}</SheetDescription>
          {badges ? <div className="flex flex-wrap items-center gap-1.5 pt-1">{badges}</div> : null}
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {meta.map((row) => (
              <div className="min-w-0" key={row.label}>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-content-subtle">{row.label}</dt>
                <dd className={`mt-0.5 truncate text-sm font-medium ${row.tone === 'danger' ? 'text-status-error' : row.tone === 'muted' ? 'text-content-muted' : 'text-content-strong'}`}>{row.value}</dd>
              </div>
            ))}
          </dl>
          <section aria-label={updatesLabel} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-content-subtle">{updatesLabel}</h3>
            {children}
          </section>
        </div>
        <div className="border-t border-line-subtle p-5">
          <Link
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            href={detailHref}
          >
            <ExternalLink aria-hidden="true" className="size-4" />
            {detailLabel}
          </Link>
          <span className="sr-only">{closeLabel}</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
