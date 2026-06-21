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

export function WorkQueue({
  locale,
  rows,
}: {
  locale: Locale;
  rows: ComplaintQueueItem[] | null;
}) {
  const t = staffShellText[locale].workQueue;
  const isError = rows === null;
  const isEmpty = !isError && rows.length === 0;

  return (
    <Card className="rounded-md border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-slate-600">{t.status}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-2 border-b border-slate-200 p-4 md:grid-cols-5">
          {(['status', 'branch', 'severity', 'sla'] as const).map((key) => (
            <div className="grid gap-1" key={key}>
              <Label>{t.filters[key]}</Label>
              <Select defaultValue="all">
                <SelectTrigger aria-label={t.filters[key]}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.filters.all}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="grid gap-1">
            <Label htmlFor="work-queue-search">{t.filters.search}</Label>
            <Input id="work-queue-search" type="search" />
          </div>
        </div>
        {isError ? (
          <p className="p-4 text-sm text-slate-600" role="alert">
            {t.states.error}
          </p>
        ) : isEmpty ? (
          <p className="p-4 text-sm text-slate-600" role="status">
            {t.states.empty}
          </p>
        ) : (
          <div className="overflow-x-auto">
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
                {rows.map((row) => (
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
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm text-slate-600">
        <span>{t.pagination.page}</span>
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
