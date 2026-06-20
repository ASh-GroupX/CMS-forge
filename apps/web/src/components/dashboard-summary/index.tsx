import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { StaffDashboardSummary } from '../../lib/staff-dashboard-api';

type SummaryKey = 'open' | 'overdue' | 'warnings' | 'closed' | 'averageTat';

const SUMMARY_KEYS: readonly SummaryKey[] = ['open', 'overdue', 'warnings', 'closed', 'averageTat'];

const VALUE_CLASS: Record<SummaryKey, string> = {
  open: 'text-slate-900',
  overdue: 'text-status-error',
  warnings: 'text-status-warning',
  closed: 'text-slate-900',
  averageTat: 'text-brand',
};

const EMPTY_SUMMARY: StaffDashboardSummary = {
  openComplaints: 0,
  overdueComplaints: 0,
  slaWarningComplaints: 0,
  closedComplaints: 0,
  averageTatHours: 0,
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
  const values = valuesFromSummary(locale, data ?? EMPTY_SUMMARY);
  const isEmpty = data !== null && Object.values(data).every((value) => value === 0);

  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        {data === null ? (
          <p className="text-sm text-slate-600" role="alert">
            {t.states.error}
          </p>
        ) : isEmpty ? (
          <p className="text-sm text-slate-600" role="status">
            {t.states.empty}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-3 xl:grid-cols-5">
        {SUMMARY_KEYS.map((key) => {
          const [label, description] = t.cards[key];
          return (
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" key={key}>
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <p className={`mt-2 text-3xl font-semibold tracking-normal ${VALUE_CLASS[key]}`}>{values[key]}</p>
              <p className="mt-1 text-xs text-slate-500">{description}</p>
            </div>
          );
        })}
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
