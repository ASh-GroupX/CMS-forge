import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { DataTable, Field, FilterBar, StateBlock, StatusBadge as SharedStatusBadge, type PrimitiveTone } from '../shared/ui-primitives';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { ComplaintQueueItem, ComplaintSeverity, ComplaintStatus } from '../../lib/staff-complaints-api';
import type { StaffQueueQuery, StaffQueueResult } from '../../lib/staff-queue-api';

export function WorkQueue({
  locale,
  query = {},
  queue,
  rows,
}: {
  locale: Locale;
  query?: StaffQueueQuery;
  queue?: StaffQueueResult | null;
  rows?: ComplaintQueueItem[] | null;
}) {
  const t = staffShellText[locale].workQueue;
  const queueRows = queue?.rows ?? rows ?? null;
  const isError = queueRows === null;
  const isEmpty = !isError && queueRows.length === 0;
  const page = queue?.page ?? query.page ?? 1;
  const filters = filterOptions(queueRows ?? [], t, query);

  return (
    <Card className="w-full min-w-0 max-w-full overflow-hidden rounded-md border-line-subtle bg-surface shadow-sm" aria-label={t.title}>
      <CardHeader className="border-b border-line-subtle p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-content-muted">{t.status}</p>
      </CardHeader>
      <CardContent className="min-w-0 p-0">
        <FilterBar action="/complaints" className="md:grid-cols-6">
          <input name="locale" type="hidden" value={locale} />
          {(['status', 'branch', 'severity', 'sla'] as const).map((key) => (
            <Field id={`work-queue-${key}`} key={key} label={t.filters[key]}>
              <Select defaultValue={filterValue(key, query)} name={key === 'branch' ? 'branchId' : key}>
                <SelectTrigger aria-label={t.filters[key]} id={`work-queue-${key}`}>
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
            <Input defaultValue={query.search ?? ''} id="work-queue-search" name="search" type="search" />
          </Field>
          <div className="grid content-end">
            <Button type="submit">{t.actions.apply}</Button>
          </div>
        </FilterBar>
        {isError ? (
          <StateBlock className="m-4" message={t.states.error} tone="error" />
        ) : isEmpty ? (
          <StateBlock className="m-4" message={t.states.empty} />
        ) : (
          <>
          <div className="grid gap-3 p-4 md:hidden">
            {queueRows.map((row) => (
              <article className="grid gap-3 rounded-md border border-line-subtle bg-surface p-3" key={row.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate font-medium text-content-strong">{row.referenceNumber}</span>
                    <span className="block text-sm text-content-muted">{row.subject}</span>
                  </div>
                  <a
                    className="shrink-0 rounded-sm text-sm font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
                    href={caseHref(locale, row.id)}
                  >
                    {t.actions.open}
                  </a>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={row.status} />
                  <SeverityBadge severity={row.severity} />
                  <SharedStatusBadge>{t.sla.backendScoped}</SharedStatusBadge>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm text-content-muted">
                  <div>
                    <dt className="font-medium text-content-strong">{t.headers[3]}</dt>
                    <dd>{row.ownerName ?? t.unassigned}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-content-strong">{t.headers[4]}</dt>
                    <dd>{row.branchName ?? row.branchId}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-content-strong">{t.labels.age}</dt>
                    <dd>{formatAge(row.updatedAt, locale)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-content-strong">{t.labels.updated}</dt>
                    <dd>{formatDate(row.updatedAt, locale)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <DataTable headers={t.headers} minWidth="58rem">
                {queueRows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-surface-raised">
                    <TableCell className="py-2 font-medium text-content-strong">
                      <span className="block">{row.referenceNumber}</span>
                      <span className="block text-xs font-normal text-content-muted">{row.subject}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="py-2">
                      <SeverityBadge severity={row.severity} />
                    </TableCell>
                    <TableCell className="py-2">{row.ownerName ?? t.unassigned}</TableCell>
                    <TableCell className="py-2">{row.branchName ?? row.branchId}</TableCell>
                    <TableCell className="py-2">
                      <SharedStatusBadge>{t.sla.backendScoped}</SharedStatusBadge>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="block font-medium">{formatAge(row.updatedAt, locale)}</span>
                      <span className="block text-xs text-content-muted">{formatDate(row.updatedAt, locale)}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <Button asChild size="sm" variant="outline">
                        <a href={caseHref(locale, row.id)}>{t.actions.open}</a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </DataTable>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm text-content-muted">
        <span>{t.pagination.page} {page}</span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Button asChild size="sm" variant="outline">
              <a href={pageHref(locale, query, page - 1)}>{t.pagination.previous}</a>
            </Button>
          ) : (
            <Button disabled size="sm" type="button" variant="outline">{t.pagination.previous}</Button>
          )}
          {queue?.hasNext ? (
            <Button asChild size="sm" variant="outline">
              <a href={pageHref(locale, query, page + 1)}>{t.pagination.next}</a>
            </Button>
          ) : (
            <Button disabled size="sm" type="button" variant="outline">{t.pagination.next}</Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

type FilterOption = { label: string; value: string };
const STATUS_OPTIONS: ComplaintStatus[] = ['DRAFT', 'SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED'];
const SEVERITY_OPTIONS: ComplaintSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function filterOptions(rows: ComplaintQueueItem[], t: typeof staffShellText[Locale]['workQueue'], query: StaffQueueQuery): Record<'status' | 'branch' | 'severity' | 'sla', FilterOption[]> {
  const branches = new Map<string, string>();
  for (const row of rows) branches.set(row.branchId, row.branchName ?? row.branchId);
  if (query.branchId && !branches.has(query.branchId)) branches.set(query.branchId, query.branchId);
  return {
    status: STATUS_OPTIONS.map((status) => ({ label: status, value: status })),
    branch: [...branches].map(([value, label]) => ({ label, value })),
    severity: SEVERITY_OPTIONS.map((severity) => ({ label: severity, value: severity })),
    sla: [{ label: t.sla.backendScoped, value: 'backend-scoped' }],
  };
}

function filterValue(key: 'branch' | 'severity' | 'sla' | 'status', query: StaffQueueQuery): string {
  if (key === 'branch') return query.branchId ?? 'all';
  if (key === 'severity') return query.severity ?? 'all';
  if (key === 'status') return query.status ?? 'all';
  return 'all';
}

function pageHref(locale: Locale, query: StaffQueueQuery, page: number): string {
  const params = new URLSearchParams({ locale, page: String(page) });
  append(params, 'branchId', query.branchId);
  append(params, 'search', query.search);
  append(params, 'severity', query.severity);
  append(params, 'status', query.status);
  return `/complaints?${params.toString()}`;
}

function caseHref(locale: Locale, id: string): string {
  const params = new URLSearchParams({ locale });
  return `/complaints/${encodeURIComponent(id)}?${params.toString()}`;
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

function append(params: URLSearchParams, key: string, value: string | null | undefined): void {
  if (value?.trim()) params.set(key, value.trim());
}

const STATUS_TONE: Partial<Record<ComplaintStatus, PrimitiveTone>> = {
  SUBMITTED: 'info',
  IN_PROGRESS: 'brand',
  MANAGER_REVIEW: 'warning',
  BRANCH_REVIEW: 'warning',
  REOPENED: 'info',
  RESOLVED: 'success',
  CLOSED: 'neutral',
  REJECTED: 'danger',
};

const SEVERITY_TONE: Record<ComplaintSeverity, PrimitiveTone> = {
  CRITICAL: 'danger',
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'neutral',
};

function StatusBadge({ status }: { status: ComplaintStatus }) {
  return <SharedStatusBadge tone={STATUS_TONE[status] ?? 'neutral'}>{status}</SharedStatusBadge>;
}

function SeverityBadge({ severity }: { severity: ComplaintSeverity }) {
  return <SharedStatusBadge tone={SEVERITY_TONE[severity]}>{severity}</SharedStatusBadge>;
}
