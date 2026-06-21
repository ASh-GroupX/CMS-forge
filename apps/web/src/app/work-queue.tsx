import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import type { ComplaintQueueItem } from '../lib/staff-complaints-api';

export type QueuePreviewState = 'loading' | 'empty' | 'error' | 'success' | 'conflict';

type QueueRow = {
  reference: string;
  status: string;
  severity: string;
  subject: string;
  owner: string;
  branch: string;
  sla: string;
  updated: string;
  action: string;
};

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
  const queueRows = (realRows ?? []).map((row) => queueRow(row, t));
  const isEmpty = state === 'empty' || (!state && queueRows.length === 0);
  const message = state ? t.states[state] : isEmpty ? t.states.empty : null;
  const messageRole = state === 'error' || state === 'conflict' ? 'alert' : 'status';

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
        {state === 'loading' ? (
          <div className="grid gap-3 p-4" role="status">
            <span className="text-sm text-slate-600">{t.states.loading}</span>
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : (
          <>
            {message ? (
              <p className="p-4 text-sm text-slate-600" role={messageRole}>
                {message}
              </p>
            ) : null}
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
              {queueRows.map((row) => (
                    <TableRow key={row.reference}>
                      <TableCell className="font-medium text-slate-900">
                        <span className="block">{row.reference}</span>
                        <span className="block text-xs font-normal text-slate-600">{row.subject}</span>
                      </TableCell>
                      <TableCell><Badge variant="outline">{row.status}</Badge></TableCell>
                      <TableCell><Badge variant={severityVariant(row.severity)}>{row.severity}</Badge></TableCell>
                      <TableCell>{row.owner}</TableCell>
                      <TableCell>{row.branch}</TableCell>
                      <TableCell><Badge variant="secondary">{row.sla}</Badge></TableCell>
                      <TableCell>{row.updated}</TableCell>
                      <TableCell>{row.action}</TableCell>
                    </TableRow>
              ))}
                </TableBody>
              </Table>
            </div>
          </>
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

function queueRow(row: ComplaintQueueItem, t: typeof staffShellText[Locale]['workQueue']): QueueRow {
  return {
    reference: row.referenceNumber,
    status: row.status,
    severity: row.severity,
    subject: row.subject,
    owner: row.ownerName ?? t.unassigned,
    branch: row.branchName ?? row.branchId,
    sla: t.sla.backendScoped,
    updated: row.updatedAt.slice(0, 10),
    action: t.actions.open,
  };
}

function severityVariant(severity: string): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (severity === 'CRITICAL') return 'destructive';
  if (severity === 'HIGH') return 'default';
  if (severity === 'MEDIUM') return 'secondary';
  return 'outline';
}
