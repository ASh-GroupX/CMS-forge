import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { auditViewerText } from '../../i18n/staff-audit-viewer';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AdminConfigPreviewState } from '../admin-categories-sla';

const rows = [
  ['2026-06-19 10:30', 'System actor placeholder', 'CONFIG_UPDATED', 'Branch placeholder', 'corr-placeholder-001', 'config'],
  ['2026-06-19 10:45', 'Staff actor placeholder', 'SECURITY_DENIED', 'Session placeholder', 'corr-placeholder-002', 'security'],
] as const;

export function AuditViewer({ locale, state }: { locale: Locale; state?: AdminConfigPreviewState | undefined }) {
  const shell = staffShellText[locale];
  const t = auditViewerText[locale];
  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 border-b border-slate-200 p-4">
        <div>
          <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-600">{t.subtitle}</CardDescription>
        </div>
        <Button type="button">{t.filters.export}</Button>
      </CardHeader>
      <CardContent className="p-4">
        {state ? (
          <p
            className="mb-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            role={state === 'success' || state === 'loading' ? 'status' : 'alert'}
          >
            {t.states[state]}
          </p>
        ) : null}
        <form className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {(['actor', 'action', 'target', 'date', 'correlationId'] as const).map((field) => (
            <Label className="grid gap-1 text-sm font-medium" key={field}>
              {t.filters[field]}
              <Input name={field} type={field === 'date' ? 'date' : 'text'} />
            </Label>
          ))}
          <Button className="xl:col-span-5" type="button" variant="outline">{t.filters.apply}</Button>
        </form>
        <Table className="min-w-[58rem]">
          <TableHeader className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-600">
            <TableRow>{t.headers.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([time, actor, action, target, correlation, kind]) => (
              <TableRow className="border-b border-slate-100" key={correlation}>
                <TableCell>{time}</TableCell>
                <TableCell>{actor}</TableCell>
                <TableCell><AuditBadge>{t.badges[kind]}</AuditBadge> {action}</TableCell>
                <TableCell>{target}</TableCell>
                <TableCell className="font-mono text-xs">{correlation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{t.safeNote}</p>
      </CardContent>
    </Card>
  );
}

function AuditBadge({ children }: { children: React.ReactNode }) {
  return <Badge className="shadow-none" variant="secondary">{children}</Badge>;
}
