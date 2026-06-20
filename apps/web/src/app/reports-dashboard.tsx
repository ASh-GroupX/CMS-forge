import React from 'react';
import { reportsDashboardText } from '../i18n/staff-reports-dashboard';
import type { Locale } from '../i18n/staff-shell';
import type { StaffReportRow } from '../lib/staff-reports-api';

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
  locale,
  rows,
  state,
}: {
  locale: Locale;
  rows?: StaffReportRow[] | undefined;
  state?: ReportsPreviewState | undefined;
}) {
  const t = reportsDashboardText[locale];
  const realRows = rows?.slice(0, 17);
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>
      {state ? <p className="m-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role={state === 'success' || state === 'loading' ? 'status' : 'alert'}>{t.states[state]}</p> : null}
      <div className="overflow-x-auto p-4">
        <section className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.export.title}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{t.export.title}</h3>
            <div className="flex flex-wrap gap-2">
              <a className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs font-semibold" href="/reports/export?format=csv">{t.export.csv}</a>
              <a className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-xs font-semibold" href="/reports/export?format=excel">{t.export.excel}</a>
            </div>
          </div>
          <ul className="mt-3 grid gap-1 text-sm text-slate-700 md:grid-cols-3">
            <li>{t.export.rowLimit}</li>
            <li>{t.export.scoped}</li>
            <li>{t.export.audit}</li>
          </ul>
        </section>
        <table className="min-w-[56rem] w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-600">
            <tr>{t.headers.map((header) => <th className="border-b border-slate-200 px-3 py-2 text-start" key={header}>{header}</th>)}</tr>
          </thead>
          <tbody>
            {realRows
              ? realRows.map((row) => (
                  <tr className="border-b border-slate-100" key={row.id}>
                    <td className="px-3 py-2 font-semibold">{row.referenceNumber} - {row.subject}</td>
                    <td className="px-3 py-2">{row.branchId}{row.ownerId ? ` / ${row.ownerId}` : ''}</td>
                    <td className="px-3 py-2"><Badge>{row.categoryId}</Badge></td>
                    <td className="px-3 py-2"><Badge>{row.status}</Badge></td>
                  </tr>
                ))
              : reports.map(([id, name, audience, category]) => (
                  <tr className="border-b border-slate-100" key={id}>
                    <td className="px-3 py-2 font-semibold">{id} - {name}</td>
                    <td className="px-3 py-2">{audience}</td>
                    <td className="px-3 py-2"><Badge>{t.badges[category]}</Badge></td>
                    <td className="px-3 py-2"><Badge>{t.badges.pending}</Badge></td>
                  </tr>
                ))}
          </tbody>
        </table>
        <p className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{t.safeNote}</p>
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{children}</span>;
}
