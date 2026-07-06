import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { StateBlock, type PrimitiveTone } from '../shared/ui-primitives';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { StaffDashboardSummary } from '../../lib/staff-dashboard-api';

type SummaryKey = 'open' | 'overdue' | 'warnings' | 'closed' | 'averageTat';

const VALUE_TONE: Record<SummaryKey, PrimitiveTone | undefined> = {
  open: undefined,
  overdue: 'danger',
  warnings: 'warning',
  closed: undefined,
  averageTat: 'brand',
};
const SECONDARY_KEYS: readonly SummaryKey[] = ['overdue', 'warnings', 'closed', 'averageTat'];

export function DashboardSummary({
  locale,
  data,
}: {
  locale: Locale;
  data: StaffDashboardSummary | null;
}) {
  const shell = staffShellText[locale];
  const t = shell.dashboard;
  const values = data ? valuesFromSummary(locale, data) : null;
  const isEmpty = data !== null && Object.values(data).every((value) => value === 0);

  return (
    <section aria-label={t.title} className="rounded-sm border border-line-subtle bg-surface" dir={shell.dir}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line-subtle bg-surface-raised px-3 py-2">
        <h2 className="text-base font-semibold tracking-normal">{t.title}</h2>
        {data === null ? (
          <StateBlock className="mt-2" message={t.states.error} tone="error" />
        ) : isEmpty ? (
          <StateBlock className="mt-2" message={t.states.empty} />
        ) : null}
      </header>
      <div className="p-3">
        {values ? (
          <div className="grid gap-2 lg:grid-cols-[1.1fr_2fr]">
            <MetricCard item={metric('open', t, values)} primary />
            <div className="grid gap-2 md:grid-cols-2">
              {SECONDARY_KEYS.map((key) => <MetricCard item={metric(key, t, values)} key={key} />)}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function DashboardSummaryLoading({ locale }: { locale: Locale }) {
  const shell = staffShellText[locale];
  const t = shell.dashboard;

  return (
    <section aria-label={t.title} className="rounded-sm border border-line-subtle bg-surface" dir={shell.dir}>
      <header className="border-b border-line-subtle bg-surface-raised px-3 py-2">
        <h2 className="text-base font-semibold tracking-normal">{t.title}</h2>
      </header>
      <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-4" role="status" aria-label={t.states.loading}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-24 rounded-sm" key={index} />
        ))}
      </div>
    </section>
  );
}

type MetricItem = { description: string; label: string; tone?: PrimitiveTone | undefined; value: string };

function metric(key: SummaryKey, t: typeof staffShellText[Locale]['dashboard'], values: Record<SummaryKey, string>): MetricItem {
  const [label, description] = t.cards[key];
  return { description, label, tone: VALUE_TONE[key], value: values[key] };
}

function MetricCard({ item, primary = false }: { item: MetricItem; primary?: boolean }) {
  const valueClass = item.tone === 'brand' ? 'text-brand' : item.tone === 'danger' ? 'text-status-error' : item.tone === 'warning' ? 'text-status-warning' : 'text-content-strong';
  return (
    <div className={`rounded-sm border border-line-subtle ${primary ? 'bg-content-strong text-brand-foreground lg:min-h-28' : 'bg-surface'} p-3`}>
      <p className={`text-sm font-medium ${primary ? 'text-brand-foreground/70' : 'text-content-muted'}`}>{item.label}</p>
      <p className={`${primary ? 'text-4xl text-brand-foreground' : 'text-2xl'} mt-2 font-semibold tracking-normal ${primary ? '' : valueClass}`}>{item.value}</p>
      <p className={`mt-1 text-xs ${primary ? 'text-brand-foreground/65' : 'text-content-muted'}`}>
        {item.description}
      </p>
    </div>
  );
}

function valuesFromSummary(locale: Locale, summary: StaffDashboardSummary): Record<SummaryKey, string> {
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return {
    open: format.format(summary.openComplaints),
    overdue: format.format(summary.overdueComplaints),
    warnings: format.format(summary.slaWarningComplaints),
    closed: format.format(summary.closedComplaints),
    averageTat: format.format(Math.round((summary.averageTatHours / 24) * 10) / 10),
  };
}
