'use client';

import React, { useState } from 'react';
import { AlertTriangle, Clock3, Inbox, User2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Button } from '../ui/button';
import { StateBlock } from '../shared/ui-primitives';
import type { ComplaintQueueItem } from '../../lib/staff-complaints-api';
import type { Locale } from '../../i18n/staff-shell';
import type { TeamQueueCopy } from '../../i18n/staff-team-queue';
import { teamQueueText } from '../../i18n/staff-team-queue';

export function TeamQueueScreen({ departmentName, items, locale, state }: {
  departmentName: string;
  items: ComplaintQueueItem[] | null;
  locale: Locale;
  state?: 'denied' | 'error';
}) {
  const t = teamQueueText[locale];
  const [claimingId, setClaimingId] = useState<string | null>(null);

  if (state || !items) {
    return (
      <section aria-label={t.title} className="grid content-start gap-4">
        <header>
          <h2 className="text-lg font-bold tracking-tight text-content-strong">{t.title}</h2>
          <p className="mt-1 text-sm text-content-muted">{t.subtitle}</p>
        </header>
        <StateBlock message={state === 'denied' ? t.denied : t.error} tone="error" />
      </section>
    );
  }

  const handleClaim = (id: string, reference: string) => {
    setClaimingId(id);
    // Simulate API call for Phase 1 layout validation
    setTimeout(() => {
      setClaimingId(null);
      toast.success(t.claimSuccess.replace('{reference}', reference));
    }, 1000);
  };

  return (
    <section aria-label={t.title} className="grid content-start gap-5">
      <Toaster dir={locale === 'ar' ? 'rtl' : 'ltr'} position="bottom-center" richColors />

      <header>
        <h2 className="text-lg font-bold tracking-tight text-content-strong">{t.title}</h2>
        <p className="mt-1 text-sm text-content-muted">{t.subtitle}</p>
      </header>

      <div className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-raised p-4">
        <h3 className="font-semibold text-content-strong">
          {t.departmentLabel.replace('{name}', departmentName)}
        </h3>
        <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-bold tabular-nums text-brand">
          {t.unassignedCount.replace('{count}', String(items.length))}
        </span>
      </div>

      {items.length === 0 ? (
        <StateBlock message={t.empty} tone="neutral" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line-subtle shadow-sm">
          {items.map((item) => (
            <div
              className="group flex min-h-16 w-full items-center justify-between gap-4 border-b border-line-subtle bg-surface px-4 py-3 transition-colors hover:bg-surface-raised"
              key={item.id}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-raised text-content-subtle group-hover:bg-brand/10 group-hover:text-brand">
                  <Inbox aria-hidden="true" className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-bold text-content-strong">
                    <span>{item.referenceNumber}</span>
                    {item.slaState === 'BREACHED' && (
                      <span className="flex items-center gap-1 rounded bg-status-error/10 px-1.5 py-0.5 text-[0.625rem] text-status-error">
                        <AlertTriangle aria-hidden="true" className="size-3" />
                        {t.sla}
                      </span>
                    )}
                    {item.slaState === 'WARNING' && item.slaDueAt && (
                      <span className="flex items-center gap-1 rounded bg-status-warning/10 px-1.5 py-0.5 text-[0.625rem] text-status-warning">
                        <Clock3 aria-hidden="true" className="size-3" />
                        {t.sla}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-content-muted">{item.subject}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <div className="hidden text-end sm:block">
                  <p className="text-[0.6875rem] font-semibold text-content-strong">{item.severity}</p>
                  <p className="text-[0.6875rem] text-content-muted">{formatDate(item.createdAt, locale)}</p>
                </div>
                <Button
                  className="w-24"
                  disabled={claimingId === item.id}
                  onClick={() => handleClaim(item.id, item.referenceNumber)}
                  size="sm"
                >
                  {claimingId === item.id ? t.claiming : t.claim}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDate(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
