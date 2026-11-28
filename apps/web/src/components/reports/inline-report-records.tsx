'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { useStaffSavedColumns } from '../../lib/use-staff-ui-state';
import { fetchComplaintsRecords, fetchTicketsRecords } from '../../lib/staff-reports-analytics-api';
import { reportRecordDetailHref } from '../../lib/staff-report-navigation';
import { reportDetailText } from '../../i18n/report-detail-workspace';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';
import { buildReportQuery, type EnterpriseReportCriteria } from './use-enterprise-report-data';
import { detailRows, type DetailRow } from './report-workspace-rows';

const pageSize = 25;
const defaults = ['reference', 'kind', 'title', 'status', 'urgency', 'owner', 'department', 'created', 'due'];
type Column = keyof typeof reportDetailText.en.labels;

export function InlineReportRecords({ locale, criteria, officerId, scopeLabel }: {
  locale: Locale; criteria: EnterpriseReportCriteria; officerId?: string; scopeLabel: string;
}) {
  const copy = reportDetailText[locale];
  const labels = reportsAnalyticsI18n[locale].statusBoard;
  const preference = useStaffSavedColumns('department-detail-v1', defaults);
  const columns = (Object.keys(copy.labels) as Column[]).filter(key => key === 'reference' || preference.columns.includes(key));
  const [chooseColumns, setChooseColumns] = useState(false);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [rows, setRows] = useState<DetailRow[]>([]);
  const [totals, setTotals] = useState({ complaints: 0, tickets: 0 });
  const queryKey = JSON.stringify([criteria, officerId]);
  useEffect(() => { setPage(1); }, [queryKey]);
  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    const query = buildReportQuery(criteria);
    const offset = (page - 1) * pageSize;
    Promise.all([
      criteria.recordType === 'tickets' ? null : fetchComplaintsRecords({ ...query.complaints, ...(officerId ? { ownerId: officerId } : {}) }, pageSize, offset, undefined, undefined, { signal: controller.signal }),
      criteria.recordType === 'complaints' ? null : fetchTicketsRecords({ ...query.tickets, ...(officerId ? { assignedEmployeeId: officerId } : {}) }, pageSize, offset, undefined, undefined, { signal: controller.signal }),
    ]).then(([complaints, tickets]) => {
      if (controller.signal.aborted) return;
      if ((criteria.recordType !== 'tickets' && !complaints) || (criteria.recordType !== 'complaints' && !tickets)) throw new Error('Report load failed');
      setRows(detailRows(complaints?.items ?? [], tickets?.items ?? []));
      setTotals({ complaints: complaints?.total ?? 0, tickets: tickets?.total ?? 0 });
      setState('ready');
    }).catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [queryKey, page, reload]);
  const pages = Math.max(1, Math.ceil(totals.complaints / pageSize), Math.ceil(totals.tickets / pageSize));
  const value = (row: DetailRow, column: Column): React.ReactNode => {
    if (column === 'reference') return <Link className="font-semibold text-primary underline underline-offset-4" href={reportRecordDetailHref(row.kind, row.id, locale)}>{row.reference}</Link>;
    if (column === 'kind') return row.kind === 'ticket' ? copy.tickets : copy.complaints;
    if (column === 'status') return labels.statuses[row.status as keyof typeof labels.statuses] ?? row.status;
    if (column === 'urgency') {
      const options = row.kind === 'ticket' ? labels.priorities : labels.severities;
      return options[row.urgency as keyof typeof options] ?? row.urgency;
    }
    if (column === 'overdue') return row.overdue ? copy.yes : copy.no;
    const item = row[column];
    if (!item) return copy.unknown;
    if (['created', 'due', 'firstResponse', 'resolved', 'closed'].includes(column)) return new Date(String(item)).toLocaleString(locale === 'ar' ? 'ar-JO' : 'en-GB', { timeZone: 'Asia/Amman', dateStyle: 'short', timeStyle: 'short' });
    return String(item);
  };
  return <section aria-label={scopeLabel} className="min-w-0 space-y-4 bg-muted/20 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold">{copy.scope} · {scopeLabel}</p>
      <Button variant="outline" size="sm" onClick={() => setChooseColumns(!chooseColumns)} aria-expanded={chooseColumns}>{copy.columns}</Button>
    </div>
    {chooseColumns && <fieldset className="space-y-3 rounded-lg border bg-background p-3">
      <legend className="px-1 text-sm font-medium">{copy.columns}</legend>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(Object.keys(copy.labels) as Column[]).map(key => <label key={key} className="flex items-center gap-2 text-xs">
          <Checkbox checked={key === 'reference' || preference.columns.includes(key)} disabled={key === 'reference'}
            onCheckedChange={checked => preference.setColumns(checked === true ? [...preference.columns, key] : preference.columns.filter(item => item !== key))} />
          {copy.labels[key]}
        </label>)}
      </div>
      <Button size="sm" onClick={preference.save}>{copy.save}</Button>
      {preference.saveState !== 'idle' && <p role="status" className="text-sm">{preference.saveState === 'saved' ? copy.saved : copy.saveFailed}</p>}
    </fieldset>}
    {state === 'loading' && <p role="status">{copy.loading}</p>}
    {state === 'error' && <div role="alert" className="flex items-center gap-3">{copy.failed}<Button size="sm" onClick={() => setReload(value => value + 1)}>{copy.retry}</Button></div>}
    {state === 'ready' && <>
      <p className="text-xs text-muted-foreground">{rows.length} {copy.shown} · {totals.complaints + totals.tickets} {copy.matching}</p>
      <div className="[&>div]:max-h-[28rem] [&>div]:overflow-auto"><Table><TableHeader className="sticky top-0 z-10 bg-card"><TableRow>{columns.map(column => <TableHead key={column} className="whitespace-nowrap text-start">{copy.labels[column]}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{rows.length ? rows.map(row => <TableRow key={`${row.kind}-${row.id}`}>{columns.map(column => <TableCell key={column} className={column === 'title' ? 'min-w-64 max-w-96 whitespace-normal break-words text-start' : 'whitespace-nowrap text-start'}>{value(row, column)}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={columns.length}>{copy.empty}</TableCell></TableRow>}</TableBody>
      </Table></div>
      <nav aria-label={copy.page} className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{copy.previous}</Button>
        <span className="text-sm">{copy.page} {page} / {pages}</span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>{copy.next}</Button>
      </nav>
    </>}
  </section>;
}
