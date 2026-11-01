import React from 'react';
import { ChevronDown, History } from 'lucide-react';
import { complaintAuditText } from '../../i18n/staff-complaint-audit';
import type { Locale } from '../../i18n/staff-shell';
import type { StaffAuditLoadResult } from '../../lib/staff-audit-api';
import { StateBlock } from '../shared/ui-primitives';

export function ComplaintAuditLogSection({ audit, locale }: { audit?: StaffAuditLoadResult | undefined; locale: Locale }) {
  if (!audit || audit.status === 'denied') return null;
  const text = complaintAuditText[locale];
  const items = audit.status === 'ready' ? audit.data.items : [];

  return (
    <details className="shrink-0 overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-sm group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-surface-canvas/50 px-4 py-3 text-sm font-semibold text-content-strong outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2"><History aria-hidden="true" className="size-4 text-brand" />{text.title}{items.length ? <span className="rounded-md bg-surface-raised px-2 py-0.5 text-xs tabular-nums text-content-muted">{items.length}</span> : null}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-content-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-line-subtle bg-surface-sunken p-4">
        {audit.status === 'error' ? <StateBlock message={text.error} tone="error" /> : items.length === 0 ? <StateBlock message={text.empty} /> : (
          <ol className="grid gap-2">
            {items.map((item) => (
              <li className="grid gap-1 rounded-lg border border-line-subtle bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" key={item.id}>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-content-strong">{item.action.replaceAll('_', ' ')}</p>
                  <p className="mt-1 text-xs text-content-muted">{item.eventType} · {locale === 'ar' ? item.actorNameAr || item.actorName || text.actorFallback : item.actorName || text.actorFallback}</p>
                </div>
                <time className="text-xs tabular-nums text-content-muted" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString(locale === 'ar' ? 'ar-JO' : 'en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: item.displayTimeZone })} · {item.displayTimeZone}</time>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}
