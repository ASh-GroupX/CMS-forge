import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import { DataTable, Field, FilterBar, StateBlock, StatusBadge, type PrimitiveTone } from '../components/shared/ui-primitives';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import type { ComplaintQueueItem } from '../lib/staff-complaints-api';

export type QueueFixtureState = 'loading' | 'empty' | 'error' | 'success' | 'conflict';

type QueueRow = {
  reference: string;
  status: string;
  severity: string;
  subject: string;
  owner: string;
  branch: string;
  sla: string;
  age: string;
  updated: string;
  action: string;
  href: string;
};

export function WorkQueue({
  locale,
  rows: realRows,
  state,
}: {
  locale: Locale;
  rows?: ComplaintQueueItem[] | undefined;
  state?: QueueFixtureState | undefined;
}) {
  const t = staffShellText[locale].workQueue;
  const queueRows = (realRows ?? []).map((row) => queueRow(row, t, locale));
  const isEmpty = state === 'empty' || (!state && queueRows.length === 0);
  const message = state ? t.states[state] : isEmpty ? t.states.empty : null;
  const messageRole = state === 'error' || state === 'conflict' ? 'alert' : 'status';
  const filters = filterOptions(queueRows, t);

  return (
    <Card className="rounded-md border-line-subtle bg-surface shadow-sm" aria-label={t.title}>
      <CardHeader className="border-b border-line-subtle p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-content-muted">{t.status}</p>
      </CardHeader>
      <CardContent className="p-0">
        <FilterBar action="/complaints" className="md:grid-cols-5">
        {(['status', 'branch', 'severity', 'sla'] as const).map((key) => (
          <Field id={`preview-work-queue-${key}`} key={key} label={t.filters[key]}>
            <Select defaultValue="all">
              <SelectTrigger aria-label={t.filters[key]} id={`preview-work-queue-${key}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.filters.all}</SelectItem>
                {filters[key].map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ))}
          <Field id="work-queue-search" label={t.filters.search}>
            <Input id="work-queue-search" type="search" />
          </Field>
        </FilterBar>
        {state === 'loading' ? (
          <div className="grid gap-3 p-4" role="status">
            <span className="text-sm text-content-muted">{t.states.loading}</span>
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : (
          <>
            {message ? (
              <StateBlock className="m-4" message={message} tone={messageRole === 'alert' ? 'error' : 'neutral'} />
            ) : null}
            <DataTable headers={t.headers} minWidth="58rem">
              {queueRows.map((row) => (
                    <TableRow className="hover:bg-surface-raised" key={row.reference}>
                      <TableCell className="py-2 font-medium text-content-strong">
                        <span className="block">{row.reference}</span>
                        <span className="block text-xs font-normal text-content-muted">{row.subject}</span>
                      </TableCell>
                      <TableCell className="py-2"><StatusBadge tone={statusTone(row.status)}>{row.status}</StatusBadge></TableCell>
                      <TableCell className="py-2"><StatusBadge tone={severityTone(row.severity)}>{row.severity}</StatusBadge></TableCell>
                      <TableCell>{row.owner}</TableCell>
                      <TableCell>{row.branch}</TableCell>
                      <TableCell><StatusBadge>{row.sla}</StatusBadge></TableCell>
                      <TableCell>
                        <span className="block font-medium">{row.age}</span>
                        <span className="block text-xs text-content-muted">{row.updated}</span>
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="outline"><a href={row.href}>{row.action}</a></Button>
                      </TableCell>
                    </TableRow>
              ))}
            </DataTable>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm text-content-muted">
        <span>{t.pagination.page} 1</span>
        <div className="flex gap-2">
          <Button disabled size="sm" type="button" variant="outline">
            {t.pagination.previous}
          </Button>
          <Button disabled size="sm" type="button" variant="outline">
            {t.pagination.next}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

function queueRow(row: ComplaintQueueItem, t: typeof staffShellText[Locale]['workQueue'], locale: Locale): QueueRow {
  return {
    reference: row.referenceNumber,
    status: row.status,
    severity: row.severity,
    subject: row.subject,
    owner: row.ownerName ?? t.unassigned,
    branch: row.branchName ?? row.branchId,
    sla: t.sla.backendScoped,
    age: formatAge(row.updatedAt, locale),
    updated: formatDate(row.updatedAt, locale),
    action: t.actions.open,
    href: `/complaints/${encodeURIComponent(row.id)}?locale=${locale}`,
  };
}

function formatDate(value: string, locale: Locale): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

function formatAge(value: string, locale: Locale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(days) + (locale === 'ar' ? ' يوم' : 'd');
}

function statusTone(status: string): PrimitiveTone {
  if (status === 'IN_PROGRESS') return 'brand';
  if (status === 'MANAGER_REVIEW' || status === 'BRANCH_REVIEW') return 'warning';
  if (status === 'RESOLVED') return 'success';
  if (status === 'REJECTED') return 'danger';
  if (status === 'SUBMITTED' || status === 'REOPENED') return 'info';
  return 'neutral';
}

function severityTone(severity: string): PrimitiveTone {
  if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger';
  if (severity === 'MEDIUM') return 'warning';
  return 'neutral';
}

type FilterOption = { label: string; value: string };
const STATUS_OPTIONS = ['DRAFT', 'SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED'];
const SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function filterOptions(rows: QueueRow[], t: typeof staffShellText[Locale]['workQueue']): Record<'status' | 'branch' | 'severity' | 'sla', FilterOption[]> {
  return {
    status: STATUS_OPTIONS.map((status) => ({ label: status, value: status })),
    branch: [...new Set(rows.map((row) => row.branch))].map((branch) => ({ label: branch, value: branch })),
    severity: SEVERITY_OPTIONS.map((severity) => ({ label: severity, value: severity })),
    sla: [{ label: t.sla.backendScoped, value: 'backend-scoped' }],
  };
}
