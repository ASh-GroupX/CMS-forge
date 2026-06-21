import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { reportsDashboardText } from '../../i18n/staff-reports-dashboard';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { StaffReportKpis, StaffReportRow } from '../../lib/staff-reports-api';

export type ReportsPreviewState = 'ready' | 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'denied' | 'conflict';

const reports = [
  ['RPT-001', 'Open complaints summary', 'Managers, Management', 'operations'],
  ['RPT-002', 'Overdue complaints', 'Managers, Management', 'sla'],
  ['RPT-003', 'SLA warning complaints', 'Managers, CR team', 'sla'],
  ['RPT-004', 'Average TAT', 'Management', 'executive'],
  ['RPT-005', 'Closure performance by branch', 'Management', 'executive'],
  ['RPT-006', 'Complaints by category', 'Management, CR Manager', 'operations'],
  ['RPT-007', 'Complaints by brand/model', 'Management', 'executive'],
  ['RPT-008', 'Complaints by department', 'Management', 'operations'],
  ['RPT-009', 'Owner workload', 'CR Manager, Branch Manager', 'operations'],
  ['RPT-010', 'Reopened complaints', 'Management, CR Manager', 'operations'],
  ['RPT-011', 'Rejected complaints', 'CR Manager', 'operations'],
  ['RPT-012', 'Customer satisfaction', 'Management', 'executive'],
  ['RPT-013', 'Aging report', 'Management, Managers', 'sla'],
  ['RPT-014', 'Compensation tracking', 'Authorized managers', 'executive'],
  ['RPT-015', 'DMS lookup failure report', 'Admin, IT', 'admin'],
  ['RPT-016', 'Notification delivery report', 'Admin, CR Manager', 'admin'],
  ['RPT-017', 'Audit activity report', 'Admin', 'admin'],
] as const;

export function ReportsDashboard({
  kpis,
  locale,
  rows,
  state,
}: {
  kpis?: StaffReportKpis | undefined;
  locale: Locale;
  rows?: StaffReportRow[] | undefined;
  state?: ReportsPreviewState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = reportsDashboardText[locale];
  const realRows = rows?.slice(0, 17);
  const kpiCards = kpis ? [
    [t.kpis.onTime, `${kpis.onTimeCompletionPercent}%`],
    [t.kpis.activeOverdue, String(kpis.activeOverdueCount)],
    [t.kpis.averageDelay, t.hours(kpis.averageDelayHours)],
    [t.kpis.promiseKept, `${kpis.customerPromiseKeptPercent}%`],
    [t.kpis.reopened, String(kpis.reopenedCount)],
    [t.kpis.escalations, String(kpis.escalationCount)],
    [t.kpis.firstResponse, t.hours(kpis.averageFirstResponseHours)],
    [t.kpis.resolution, t.hours(kpis.averageResolutionHours)],
  ] as const : null;
  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <CardDescription className="mt-1 text-sm text-slate-600">{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {state ? (
          <p
            className="mb-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            role={state === 'success' || state === 'loading' ? 'status' : 'alert'}
          >
            {t.states[state]}
          </p>
        ) : null}
        <section className="mb-3 rounded-md border border-slate-200 bg-white p-3" aria-label={t.kpis.title}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{t.kpis.title}</h3>
              <p className="mt-1 text-xs text-slate-600">{t.kpis.subtitle}</p>
            </div>
            <ReportBadge>{kpis ? t.kpis.backend : t.kpis.unavailable}</ReportBadge>
          </div>
          {kpiCards ? (
            <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {kpiCards.map(([label, value]) => (
                <div className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2" key={label}>
                  <dt className="text-xs font-semibold text-slate-600">{label}</dt>
                  <dd className="mt-1 text-lg font-semibold tracking-normal text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{t.kpis.empty}</p>
          )}
        </section>
        <section className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.export.title}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{t.export.title}</h3>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" type="button" variant="outline"><a href="/reports/export?format=csv">{t.export.csv}</a></Button>
              <Button asChild size="sm" type="button" variant="outline"><a href="/reports/export?format=excel">{t.export.excel}</a></Button>
            </div>
          </div>
          <ul className="mt-3 grid gap-1 text-sm text-slate-700 md:grid-cols-3">
            <li>{t.export.rowLimit}</li>
            <li>{t.export.scoped}</li>
            <li>{t.export.audit}</li>
          </ul>
        </section>
        <Table className="min-w-[56rem]">
          <TableHeader className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-600">
            <TableRow>{t.headers.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {realRows
              ? realRows.map((row) => (
                  <TableRow className="border-b border-slate-100" key={row.id}>
                    <TableCell className="font-semibold">{row.referenceNumber} - {row.subject}</TableCell>
                    <TableCell>{row.branchId}{row.ownerId ? ` / ${row.ownerId}` : ''}</TableCell>
                    <TableCell><ReportBadge>{row.categoryId}</ReportBadge></TableCell>
                    <TableCell><ReportBadge>{row.status}</ReportBadge></TableCell>
                  </TableRow>
                ))
              : reports.map(([id, name, audience, category]) => (
                  <TableRow className="border-b border-slate-100" key={id}>
                    <TableCell className="font-semibold">{id} - {name}</TableCell>
                    <TableCell>{audience}</TableCell>
                    <TableCell><ReportBadge>{t.badges[category]}</ReportBadge></TableCell>
                    <TableCell><ReportBadge>{t.badges.pending}</ReportBadge></TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <p className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{t.safeNote}</p>
      </CardContent>
    </Card>
  );
}

function ReportBadge({ children }: { children: React.ReactNode }) {
  return <Badge className="shadow-none" variant="secondary">{children}</Badge>;
}
