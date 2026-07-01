import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    <Card className="rounded-md border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-slate-600">{t.status}</p>
      </CardHeader>
      <CardContent className="p-0">
        <form action="/complaints" className="grid gap-2 border-b border-slate-200 p-4 md:grid-cols-6" method="get">
          <input name="locale" type="hidden" value={locale} />
          {(['status', 'branch', 'severity', 'sla'] as const).map((key) => (
            <div className="grid gap-1" key={key}>
              <Label>{t.filters[key]}</Label>
              <Select defaultValue={filterValue(key, query)} name={key === 'branch' ? 'branchId' : key}>
                <SelectTrigger aria-label={t.filters[key]}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.filters.all}</SelectItem>
                  {filters[key].map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="grid gap-1">
            <Label htmlFor="work-queue-search">{t.filters.search}</Label>
            <Input defaultValue={query.search ?? ''} id="work-queue-search" name="search" type="search" />
          </div>
          <div className="grid content-end">
            <Button type="submit">{t.actions.apply}</Button>
          </div>
        </form>
        {isError ? (
          <p className="p-4 text-sm text-slate-600" role="alert">
            {t.states.error}
          </p>
        ) : isEmpty ? (
          <p className="p-4 text-sm text-slate-600" role="status">
            {t.states.empty}
          </p>
        ) : (
          <>
          <div className="grid gap-3 p-4 md:hidden">
            {queueRows.map((row) => (
              <article className="grid gap-3 rounded-md border border-slate-200 p-3" key={row.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate font-medium text-slate-900">{row.referenceNumber}</span>
                    <span className="block text-sm text-slate-600">{row.subject}</span>
                  </div>
                  <a
                    className="shrink-0 rounded-sm text-sm font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
                    href={`/complaints/${encodeURIComponent(row.id)}`}
                  >
                    {t.actions.open}
                  </a>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={row.status} />
                  <SeverityBadge severity={row.severity} />
                  <Badge className="border-slate-300" variant="outline">
                    {t.sla.backendScoped}
                  </Badge>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                  <div>
                    <dt className="font-medium text-slate-700">{t.headers[3]}</dt>
                    <dd>{row.ownerName ?? t.unassigned}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-700">{t.headers[4]}</dt>
                    <dd>{row.branchName ?? row.branchId}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-medium text-slate-700">{t.headers[6]}</dt>
                    <dd>{row.updatedAt.slice(0, 10)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table className="min-w-[58rem]">
              <TableHeader className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-600">
                <TableRow>
                  {t.headers.map((header) => (
                    <TableHead className="text-start" key={header}>
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueRows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50">
                    <TableCell className="py-2.5 font-medium text-slate-900">
                      <span className="block">{row.referenceNumber}</span>
                      <span className="block text-xs font-normal text-slate-600">{row.subject}</span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="py-2.5">
                      <SeverityBadge severity={row.severity} />
                    </TableCell>
                    <TableCell className="py-2.5">{row.ownerName ?? t.unassigned}</TableCell>
                    <TableCell className="py-2.5">{row.branchName ?? row.branchId}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge className="border-slate-300" variant="outline">
                        {t.sla.backendScoped}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">{row.updatedAt.slice(0, 10)}</TableCell>
                    <TableCell className="py-2.5">
                      <a
                        className="rounded-sm text-sm font-medium text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-brand"
                        href={`/complaints/${encodeURIComponent(row.id)}`}
                      >
                        {t.actions.open}
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm text-slate-600">
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

function append(params: URLSearchParams, key: string, value: string | null | undefined): void {
  if (value?.trim()) params.set(key, value.trim());
}

const STATUS_CLASS: Partial<Record<ComplaintStatus, string>> = {
  SUBMITTED: 'border-transparent bg-status-info text-white',
  IN_PROGRESS: 'border-transparent bg-brand text-brand-foreground',
  MANAGER_REVIEW: 'border-transparent bg-status-warning text-slate-900',
  BRANCH_REVIEW: 'border-transparent bg-status-warning text-slate-900',
  REOPENED: 'border-transparent bg-status-info text-white',
  RESOLVED: 'border-transparent bg-status-success text-white',
  CLOSED: 'border-transparent bg-muted text-muted-foreground',
  REJECTED: 'border-transparent bg-destructive text-destructive-foreground',
};

const SEVERITY_CLASS: Record<ComplaintSeverity, string> = {
  CRITICAL: 'border-transparent bg-destructive text-destructive-foreground',
  HIGH: 'border-transparent bg-status-error text-white',
  MEDIUM: 'border-transparent bg-status-warning text-slate-900',
  LOW: 'border-slate-300',
};

function StatusBadge({ status }: { status: ComplaintStatus }) {
  return (
    <Badge className={STATUS_CLASS[status] ?? 'border-slate-300'} variant="outline">
      {status}
    </Badge>
  );
}

function SeverityBadge({ severity }: { severity: ComplaintSeverity }) {
  return (
    <Badge className={SEVERITY_CLASS[severity]} variant="outline">
      {severity}
    </Badge>
  );
}
