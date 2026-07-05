import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricStrip, StateBlock, type PrimitiveTone } from '../shared/ui-primitives';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { StaffDashboardSummary } from '../../lib/staff-dashboard-api';

type SummaryKey = 'open' | 'overdue' | 'warnings' | 'closed' | 'averageTat';

const SUMMARY_KEYS: readonly SummaryKey[] = ['open', 'overdue', 'warnings', 'closed', 'averageTat'];

const VALUE_TONE: Record<SummaryKey, PrimitiveTone | undefined> = {
  open: undefined,
  overdue: 'danger',
  warnings: 'warning',
  closed: undefined,
  averageTat: 'brand',
};

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
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        {data === null ? (
          <StateBlock className="mt-2" message={t.states.error} tone="error" />
        ) : isEmpty ? (
          <StateBlock className="mt-2" message={t.states.empty} />
        ) : null}
      </CardHeader>
      <CardContent className="p-4">
        {values ? (
          <MetricStrip
            items={SUMMARY_KEYS.map((key) => {
              const [label, description] = t.cards[key];
              return { description, label, tone: VALUE_TONE[key], value: values[key] };
            })}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

export function DashboardSummaryLoading({ locale }: { locale: Locale }) {
  const shell = staffShellText[locale];
  const t = shell.dashboard;

  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
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
