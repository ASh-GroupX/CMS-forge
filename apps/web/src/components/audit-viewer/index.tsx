import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { auditViewerText } from '../../i18n/staff-audit-viewer';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { auditExportHref, type StaffAuditFilters, type StaffAuditResult } from '../../lib/staff-audit-api';

export type AuditPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict' | 'denied';

export function AuditViewer({
  filters = {},
  locale,
  result,
  state,
}: {
  filters?: StaffAuditFilters;
  locale: Locale;
  result?: StaffAuditResult | undefined;
  state?: AuditPreviewState | undefined;
}) {
  const shell = staffShellText[locale], t = auditViewerText[locale];
  const rows = result?.items ?? [];
  const visibleState = state ?? (!result || rows.length === 0 ? 'empty' : undefined);
  const exportDisabled = visibleState === 'denied' || visibleState === 'error' || visibleState === 'loading';
  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 border-b border-slate-200 p-4">
        <div>
          <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-600">{t.subtitle}</CardDescription>
        </div>
        {exportDisabled ? <Button className="focus:ring-2" type="button" aria-disabled="true">{t.filters.export}</Button> : <Button asChild className="focus:ring-2"><a href={auditExportHref(filters)}>{t.filters.export}</a></Button>}
      </CardHeader>
      <CardContent className="p-4">
        {visibleState ? <p className="mb-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role={visibleState === 'success' || visibleState === 'loading' ? 'status' : 'alert'}>{t.states[visibleState]}</p> : null}
        <form className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5" method="get">
          {(['eventType', 'actorId', 'targetType', 'targetId', 'correlationId', 'from', 'to', 'page', 'pageSize'] as const).map((field) => (
            <Label className="grid gap-1 text-sm font-medium" key={field}>
              {t.filters[field]}
              <Input className="focus:ring-2" defaultValue={filters[field]} name={field} type={field === 'from' || field === 'to' ? 'date' : field === 'page' || field === 'pageSize' ? 'number' : 'text'} />
            </Label>
          ))}
          <Button className="focus:ring-2 xl:col-span-5" type="submit" variant="outline">{t.filters.apply}</Button>
        </form>
        <div className="overflow-x-auto">
          <Table className="min-w-[64rem]">
            <TableHeader className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-600">
              <TableRow>{t.headers.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow className="border-b border-slate-100" key={row.id}>
                  <TableCell>{formatDate(row.createdAt, locale)}</TableCell>
                  <TableCell>{row.actorId ?? '-'}</TableCell>
                  <TableCell><AuditBadge>{row.eventType}</AuditBadge></TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.targetType}{row.targetId ? `:${row.targetId}` : ''}</TableCell>
                  <TableCell className="font-mono text-xs">{row.correlationId ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <details className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <summary className="cursor-pointer font-semibold">{t.metadata}</summary>
          <pre className="mt-2 max-h-48 overflow-auto text-xs">{JSON.stringify(rows.map((row) => ({ id: row.id, metadata: row.metadata })), null, 2)}</pre>
        </details>
        <p className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{t.safeNote}</p>
      </CardContent>
    </Card>
  );
}

function AuditBadge({ children }: { children: React.ReactNode }) {
  return <Badge className="shadow-none" variant="secondary">{children}</Badge>;
}

function formatDate(value: string, locale: Locale): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
