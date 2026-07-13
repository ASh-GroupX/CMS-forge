import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { DataTable, Field, FilterBar, StateBlock, StatusBadge as SharedStatusBadge, type PrimitiveTone } from '../shared/ui-primitives';
import { complaintStatusLabel, severityLabel, slaStateLabel } from '../../i18n/domain-labels';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { modernUiText } from '../../i18n/staff-modern-ui';
import { formatDisplayDate, formatDisplayNumber } from '../../lib/locale-format';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import type { ComplaintQueueItem, ComplaintSeverity, ComplaintStatus } from '../../lib/staff-complaints-api';
import type { StaffQueueQuery, StaffQueueResult } from '../../lib/staff-queue-api';

export function WorkQueue({
  locale,
  options,
  query = {},
  queue,
  rows,
  state,
}: {
  locale: Locale;
  options?: ComplaintFormOptions | null | undefined;
  query?: StaffQueueQuery;
  queue?: StaffQueueResult | null;
  rows?: ComplaintQueueItem[] | null;
  state?: 'denied' | 'error' | undefined;
}) {
  const t = staffShellText[locale].workQueue;
  const quick = modernUiText[locale].queue;
  const queueRows = queue?.rows ?? rows ?? null;
  const visibleRows = queueRows;
  const isError = visibleRows === null;
  const errorMessage = state === 'denied' ? t.states.denied : t.states.error;
  const isEmpty = !isError && visibleRows.length === 0;
  const page = queue?.page ?? query.page ?? 1;
  const filters = filterOptions(queueRows ?? [], t, query, options, locale);
  const activeFilters = activeFilterLabels(query, filters, quick);

  return (
    <Card className="w-full min-w-0 max-w-full overflow-hidden rounded-sm border-line-subtle bg-surface shadow-none" aria-label={t.title}>
      <CardHeader className="border-b border-line-subtle bg-surface-raised p-3">
        <CardTitle className="text-base tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-content-muted">{t.status}</p>
      </CardHeader>
      <CardContent className="min-w-0 p-0">
        <div className="flex flex-wrap items-center gap-2 border-b border-line-subtle p-3" aria-label={quick.title}>
          <span className="me-1 text-xs font-semibold text-content-muted">{quick.title}</span>
          <Button asChild size="sm" variant={query.ownerScope === 'ME' ? 'default' : 'outline'}><a href={quickFilterHref(locale, 'ownerScope', 'ME')}>{quick.mine}</a></Button>
          <Button asChild size="sm" variant={query.ownerScope === 'UNASSIGNED' ? 'default' : 'outline'}><a href={quickFilterHref(locale, 'ownerScope', 'UNASSIGNED')}>{quick.unassigned}</a></Button>
          <Button asChild size="sm" variant={query.sla === 'BREACHED' ? 'default' : 'outline'}><a href={quickFilterHref(locale, 'sla', 'BREACHED')}>{quick.overdue}</a></Button>
          {activeFilters.length ? <Button asChild className="ms-auto" size="sm" variant="ghost"><a href={`/complaints?locale=${locale}`}>{quick.clear}</a></Button> : null}
        </div>
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
        <div className="flex flex-wrap items-center gap-2 border-b border-line-subtle px-3 pb-3 text-xs text-content-muted"><span>{formatDisplayNumber(visibleRows?.length ?? 0, locale)} {quick.results}</span>{activeFilters.length ? <><span aria-hidden="true">·</span><span>{quick.active}:</span>{activeFilters.map((label) => <span className="rounded-full border border-line-subtle bg-surface-raised px-2 py-1 text-content-strong" key={label}>{label}</span>)}</> : <span>{t.filterHelp}</span>}</div>
        {isError ? (
          <StateBlock className="m-4" message={errorMessage} tone="error" />
        ) : isEmpty ? (
          <StateBlock className="m-4" message={t.states.empty} />
        ) : (
          <>
          <div className="grid gap-2 p-3 md:hidden">
            {visibleRows.map((row) => (
              <article className="grid gap-3 rounded-sm border border-line-subtle bg-surface p-3" key={row.id}>
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
                  <StatusBadge locale={locale} status={row.status} />
                  <SeverityBadge locale={locale} severity={row.severity} />
                  <SlaBadge locale={locale} row={row} />
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
                    <dd>{formatAge(row.createdAt, locale)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-content-strong">{t.labels.updated}</dt>
                    <dd>{formatDate(row.updatedAt, locale)}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-medium text-content-strong">{t.headers[7]}</dt>
                    <dd>{row.nextAction ?? t.actions.open}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <DataTable headers={t.headers} minWidth="58rem">
                {visibleRows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-surface-raised">
                    <TableCell className="py-2 font-medium text-content-strong">
                      <span className="block">{row.referenceNumber}</span>
                      <span className="block text-xs font-normal text-content-muted">{row.subject}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <StatusBadge locale={locale} status={row.status} />
                    </TableCell>
                    <TableCell className="py-2">
                      <SeverityBadge locale={locale} severity={row.severity} />
                    </TableCell>
                    <TableCell className="py-2">{row.ownerName ?? t.unassigned}</TableCell>
                    <TableCell className="py-2">{row.branchName ?? row.branchId}</TableCell>
                    <TableCell className="py-2">
                      <SlaBadge locale={locale} row={row} />
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="block font-medium">{formatAge(row.createdAt, locale)}</span>
                      <span className="block text-xs text-content-muted">{formatDate(row.updatedAt, locale)}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="mb-1 block max-w-56 truncate text-sm text-content-strong">{row.nextAction ?? t.actions.open}</span>
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
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-line-subtle bg-surface-raised p-3 text-sm text-content-muted">
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

function filterOptions(rows: ComplaintQueueItem[], t: typeof staffShellText[Locale]['workQueue'], query: StaffQueueQuery, options: ComplaintFormOptions | null | undefined, locale: Locale): Record<'status' | 'branch' | 'severity' | 'sla', FilterOption[]> {
  const branches = new Map<string, string>();
  for (const branch of options?.branches ?? []) branches.set(branch.id, locale === 'ar' ? branch.nameAr : branch.nameEn);
  for (const row of rows) if (!branches.has(row.branchId)) branches.set(row.branchId, row.branchName ?? row.branchId);
  if (query.branchId && !branches.has(query.branchId)) branches.set(query.branchId, query.branchId);
  return {
    status: STATUS_OPTIONS.map((status) => ({ label: complaintStatusLabel(locale, status), value: status })),
    branch: [...branches].map(([value, label]) => ({ label, value })),
    severity: SEVERITY_OPTIONS.map((severity) => ({ label: severityLabel(locale, severity), value: severity })),
    sla: ['ON_TRACK', 'WARNING', 'BREACHED', 'CLOSED'].map((value) => ({ label: slaStateLabel(locale, value), value })),
  };
}

function filterValue(key: 'branch' | 'severity' | 'sla' | 'status', query: StaffQueueQuery): string {
  if (key === 'branch') return query.branchId ?? 'all';
  if (key === 'severity') return query.severity ?? 'all';
  if (key === 'status') return query.status ?? 'all';
  return query.sla ?? 'all';
}

function pageHref(locale: Locale, query: StaffQueueQuery, page: number): string {
  const params = new URLSearchParams({ locale, page: String(page) });
  append(params, 'branchId', query.branchId);
  append(params, 'search', query.search);
  append(params, 'severity', query.severity);
  append(params, 'sla', query.sla);
  append(params, 'status', query.status);
  append(params, 'ownerScope', query.ownerScope);
  return `/complaints?${params.toString()}`;
}

function quickFilterHref(locale: Locale, key: 'ownerScope' | 'sla', value: string): string { return `/complaints?${new URLSearchParams({ locale, [key]: value }).toString()}`; }

function activeFilterLabels(query: StaffQueueQuery, filters: Record<'status' | 'branch' | 'severity' | 'sla', FilterOption[]>, quick: typeof modernUiText[Locale]['queue']): string[] {
  const labels = [
    query.ownerScope === 'ME' ? quick.mine : query.ownerScope === 'UNASSIGNED' ? quick.unassigned : null,
    query.status ? filters.status.find((item) => item.value === query.status)?.label : null,
    query.branchId ? filters.branch.find((item) => item.value === query.branchId)?.label : null,
    query.severity ? filters.severity.find((item) => item.value === query.severity)?.label : null,
    query.sla ? filters.sla.find((item) => item.value === query.sla)?.label : null,
    query.search,
  ];
  return labels.filter((value): value is string => Boolean(value));
}

function caseHref(locale: Locale, id: string): string {
  const params = new URLSearchParams({ locale });
  return `/complaints/${encodeURIComponent(id)}?${params.toString()}`;
}

function formatDate(value: string, locale: Locale): string {
  return formatDisplayDate(value, locale);
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

function StatusBadge({ locale, status }: { locale: Locale; status: ComplaintStatus }) {
  return <SharedStatusBadge tone={STATUS_TONE[status] ?? 'neutral'}>{complaintStatusLabel(locale, status)}</SharedStatusBadge>;
}

function SeverityBadge({ locale, severity }: { locale: Locale; severity: ComplaintSeverity }) {
  return <SharedStatusBadge tone={SEVERITY_TONE[severity]}>{severityLabel(locale, severity)}</SharedStatusBadge>;
}

function SlaBadge({ locale, row }: { locale: Locale; row: ComplaintQueueItem }) {
  const detail = row.slaPercentElapsed === null || row.slaPercentElapsed === undefined ? '' : ` ${formatDisplayNumber(row.slaPercentElapsed, locale)}%`;
  return <SharedStatusBadge tone={SLA_TONE[row.slaState]}>{slaStateLabel(locale, row.slaState)}{detail}</SharedStatusBadge>;
}

const SLA_TONE: Record<ComplaintQueueItem['slaState'], PrimitiveTone> = {
  ON_TRACK: 'success',
  WARNING: 'warning',
  BREACHED: 'danger',
  CLOSED: 'neutral',
};
