import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card aria-label={t.title} className="rounded-md border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-line-subtle p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        {data === null ? (
          <StateBlock className="mt-2" message={t.states.error} tone="error" />
        ) : isEmpty ? (
          <StateBlock className="mt-2" message={t.states.empty} />
        ) : null}
      </CardHeader>
      <CardContent className="p-4">
        {values ? (
          <div className="grid gap-3 lg:grid-cols-[1.2fr_2fr]">
            <MetricCard item={metric('open', t, values)} primary />
            <div className="grid gap-2 md:grid-cols-2">
              {SECONDARY_KEYS.map((key) => <MetricCard item={metric(key, t, values)} key={key} />)}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DashboardSummaryLoading({ locale }: { locale: Locale }) {
  const shell = staffShellText[locale];
  const t = shell.dashboard;

  return (
    <Card aria-label={t.title} className="rounded-md border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-line-subtle p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4" role="status" aria-label={t.states.loading}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-28 rounded-md" key={index} />
        ))}
      </CardContent>
    </Card>
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
    <div className={`rounded-md border border-line-subtle bg-surface p-3 shadow-sm ${primary ? 'lg:min-h-32' : ''}`}>
      <p className="text-sm font-medium text-content-muted">{item.label}</p>
      <p className={`${primary ? 'text-4xl' : 'text-2xl'} mt-2 font-semibold tracking-normal ${valueClass}`}>{item.value}</p>
      <p className="mt-1 text-xs text-content-muted">{item.description}</p>
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
