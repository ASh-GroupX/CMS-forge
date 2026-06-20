import React from 'react';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import type { StaffDashboardSummary } from '../lib/staff-dashboard-api';

type RolePreview = 'staff' | 'admin' | 'management';
export type DashboardPreviewState = 'loading' | 'empty' | 'error';

type SummaryKey = 'open' | 'overdue' | 'warnings' | 'closed' | 'averageTat';

const roleCards: Record<RolePreview, readonly SummaryKey[]> = {
  staff: ['open', 'warnings', 'overdue'],
  admin: ['open', 'warnings', 'overdue', 'closed', 'averageTat'],
  management: ['open', 'overdue', 'closed', 'averageTat'],
};

const values: Record<SummaryKey, string> = {
  open: '18',
  overdue: '2',
  warnings: '6',
  closed: '11',
  averageTat: '3.4d',
};

export function DashboardSummary({
  locale,
  role,
  state,
  summary,
}: {
  locale: Locale;
  role: RolePreview;
  state?: DashboardPreviewState | undefined;
  summary?: StaffDashboardSummary | undefined;
}) {
  const t = staffShellText[locale].dashboard;
  const cardValues = summary ? valuesFromSummary(summary) : values;

  if (state) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" aria-label={t.title}>
        <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
        <p className="mt-2 text-sm text-slate-600" role={state === 'error' ? 'alert' : 'status'}>
          {t.states[state]}
        </p>
      </section>
    );
  }

  return (
    <section aria-label={t.title} className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      {roleCards[role].map((key) => {
        const [label, description] = t.cards[key];
        return (
          <div key={key} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-600">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-normal">{cardValues[key]}</p>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
        );
      })}
    </section>
  );
}

function valuesFromSummary(summary: StaffDashboardSummary): Record<SummaryKey, string> {
  return {
    open: String(summary.openComplaints),
    overdue: String(summary.overdueComplaints),
    warnings: String(summary.slaWarningComplaints),
    closed: String(summary.closedComplaints),
    averageTat: `${Math.round((summary.averageTatHours / 24) * 10) / 10}d`,
  };
}
