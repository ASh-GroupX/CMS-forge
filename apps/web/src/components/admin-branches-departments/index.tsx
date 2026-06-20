import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { adminBranchesText } from '../../i18n/staff-admin-branches';
import { staffShellText, type Locale } from '../../i18n/staff-shell';

export type AdminBranchesPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';

const branchRows = [
  ['MAIN', 'Main branch', 'active'],
  ['SERVICE', 'Service branch', 'inactive'],
] as const;

const departmentRows = [
  ['CR', 'Customer relations', 'active'],
  ['SERVICE', 'Service desk', 'active'],
] as const;

export function AdminBranchesDepartments({
  locale,
  state,
}: {
  locale: Locale;
  state?: AdminBranchesPreviewState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = adminBranchesText[locale];

  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 border-b border-slate-200 p-4">
        <div>
          <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
          <CardDescription className="mt-1 text-sm text-slate-600">{t.subtitle}</CardDescription>
        </div>
        <Button type="button">{t.actions.create}</Button>
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
        <div className="grid gap-3 xl:grid-cols-2">
          <AdminTable locale={locale} rows={branchRows} title={t.sections.branches} />
          <AdminTable locale={locale} rows={departmentRows} title={t.sections.departments} />
        </div>
      </CardContent>
    </Card>
  );
}

function AdminTable({
  locale,
  rows,
  title,
}: {
  locale: Locale;
  rows: readonly (readonly [string, string, 'active' | 'inactive'])[];
  title: string;
}) {
  const t = adminBranchesText[locale];
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50" aria-label={title}>
      <h3 className="border-b border-slate-200 px-3 py-2 text-sm font-semibold">{title}</h3>
      <Table className="min-w-[34rem]">
        <TableHeader className="bg-white text-xs font-semibold uppercase tracking-normal text-slate-600">
          <TableRow>
            {t.headers.map((header) => (
              <TableHead className="text-start" key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([code, name, status]) => (
            <TableRow className="border-b border-slate-100" key={`${title}-${code}`}>
              <TableCell className="font-semibold">{code}</TableCell>
              <TableCell>{name}</TableCell>
              <TableCell>
                <Badge className="shadow-none" variant={status === 'active' ? 'secondary' : 'outline'}>
                  {t.badges[status]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" type="button" variant="outline">{t.actions.edit}</Button>
                  <Button size="sm" type="button" variant="outline">{t.actions.deactivate}</Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
