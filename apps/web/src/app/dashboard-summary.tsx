import React from 'react';
import { StateBlock, type PrimitiveTone } from '../components/shared/ui-primitives';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import type { StaffDashboardSummary } from '../lib/staff-dashboard-api';

type RolePreview = 'staff' | 'admin' | 'management';
export type DashboardFixtureState = 'loading' | 'empty' | 'error';

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
const tone: Record<SummaryKey, PrimitiveTone | undefined> = { open: undefined, overdue: 'danger', warnings: 'warning', closed: undefined, averageTat: 'brand' };

export function DashboardSummary({
  locale,
  role,
  state,
  summary,
}: {
  locale: Locale;
  role: RolePreview;
  state?: DashboardFixtureState | undefined;
  summary?: StaffDashboardSummary | undefined;
}) {
  const t = staffShellText[locale].dashboard;
  const cardValues = summary ? valuesFromSummary(summary) : values;

  if (state) {
    return (
      <section className="rounded-sm border border-line-subtle bg-surface" aria-label={t.title}>
        <header className="border-b border-line-subtle bg-surface-raised px-3 py-2">
          <h2 className="text-base font-semibold tracking-normal">{t.title}</h2>
        </header>
        <StateBlock className="m-3" message={t.states[state]} tone={state === 'error' ? 'error' : 'neutral'} />
      </section>
    );
  }

  const primary = roleCards[role][0] ?? 'open';
  const secondary = roleCards[role].slice(1);
  return (
    <section aria-label={t.title} className="rounded-sm border border-line-subtle bg-surface">
      <header className="border-b border-line-subtle bg-surface-raised px-3 py-2">
        <h2 className="text-base font-semibold tracking-normal">{t.title}</h2>
      </header>
      <div className="grid gap-2 p-3 lg:grid-cols-[1.1fr_2fr]">
        <MetricCard item={metric(primary, t, cardValues)} primary />
        <div className="grid gap-2 md:grid-cols-2">
          {secondary.map((key) => <MetricCard item={metric(key, t, cardValues)} key={key} />)}
        </div>
      </div>
    </section>
  );
}

function metric(key: SummaryKey, t: typeof staffShellText[Locale]['dashboard'], values: Record<SummaryKey, string>) {
  const [label, description] = t.cards[key];
  return { description, label, tone: tone[key], value: values[key] };
}

function MetricCard({ item, primary = false }: { item: { description: string; label: string; tone?: PrimitiveTone | undefined; value: string }; primary?: boolean }) {
  const valueClass = item.tone === 'brand' ? 'text-brand' : item.tone === 'danger' ? 'text-status-error' : item.tone === 'warning' ? 'text-status-warning' : 'text-content-strong';
  return (
    <div className={`rounded-sm border border-line-subtle ${primary ? 'bg-content-strong text-brand-foreground lg:min-h-28' : 'bg-surface'} p-3`}>
      <p className={`text-sm font-medium ${primary ? 'text-brand-foreground/70' : 'text-content-muted'}`}>{item.label}</p>
      <p className={`${primary ? 'text-4xl text-brand-foreground' : 'text-2xl'} mt-2 font-semibold tracking-normal ${primary ? '' : valueClass}`}>{item.value}</p>
      <p className={`mt-1 text-xs ${primary ? 'text-brand-foreground/65' : 'text-content-muted'}`}>{item.description}</p>
    </div>
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
