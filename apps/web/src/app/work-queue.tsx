import React from 'react';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import type { ComplaintQueueItem } from '../lib/staff-complaints-api';

export type QueuePreviewState = 'loading' | 'empty' | 'error';

type QueueRow = {
  reference: string;
  status: string;
  severity: string;
  owner: string;
  branch: string;
  sla: string;
  updated: string;
  action: string;
};

const rows: QueueRow[] = [
  {
    reference: 'CMP-2026-001',
    status: 'Submitted',
    severity: 'High',
    owner: 'Unassigned',
    branch: 'Main branch',
    sla: 'Warning',
    updated: '2026-06-19',
    action: 'Review',
  },
  {
    reference: 'CMP-2026-002',
    status: 'In progress',
    severity: 'Medium',
    owner: 'CR team',
    branch: 'Service branch',
    sla: 'On track',
    updated: '2026-06-18',
    action: 'Follow up',
  },
] as const;

export function WorkQueue({
  locale,
  rows: realRows,
  state,
}: {
  locale: Locale;
  rows?: ComplaintQueueItem[] | undefined;
  state?: QueuePreviewState | undefined;
}) {
  const t = staffShellText[locale].workQueue;
  const queueRows = realRows?.map(queueRow) ?? rows;

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.status}</p>
      </div>
      <div className="grid gap-2 border-b border-slate-200 p-4 md:grid-cols-5">
        {(['status', 'branch', 'severity', 'sla'] as const).map((key) => (
          <label className="grid gap-1 text-sm font-medium" key={key}>
            {t.filters[key]}
            <select className="rounded-sm border border-slate-300 px-2 py-2">
              <option>{t.filters.all}</option>
            </select>
          </label>
        ))}
        <label className="grid gap-1 text-sm font-medium">
          {t.filters.search}
          <input className="rounded-sm border border-slate-300 px-2 py-2" type="search" />
        </label>
      </div>
      <div className="overflow-x-auto">
        {state ? (
          <p className="p-4 text-sm text-slate-600" role={state === 'error' ? 'alert' : 'status'}>
            {t.states[state]}
          </p>
        ) : (
          <table className="min-w-[58rem] w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-start text-xs font-semibold uppercase tracking-normal text-slate-600">
              <tr>
                {t.headers.map((header) => (
                  <th className="border-b border-slate-200 px-3 py-2 text-start" key={header}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queueRows.map((row) => (
                <tr className="border-b border-slate-100" key={row.reference}>
                  {Object.values(row).map((value) => (
                    <td className="px-3 py-2 text-slate-700" key={`${row.reference}-${value}`}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm text-slate-600">
        <span>{t.pagination.page}</span>
        <div className="flex gap-2">
          <button className="rounded-sm border border-slate-300 px-3 py-1" disabled type="button">
            {t.pagination.previous}
          </button>
          <button className="rounded-sm border border-slate-300 px-3 py-1" disabled type="button">
            {t.pagination.next}
          </button>
        </div>
      </div>
    </section>
  );
}

function queueRow(row: ComplaintQueueItem): QueueRow {
  return {
    reference: row.referenceNumber,
    status: row.status,
    severity: row.severity,
    owner: row.ownerId ?? 'Unassigned',
    branch: row.branchId,
    sla: 'Backend scoped',
    updated: row.updatedAt.slice(0, 10),
    action: 'Open detail',
  };
}
