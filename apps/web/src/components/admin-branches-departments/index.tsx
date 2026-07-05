import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StateBlock, StatusBadge } from '../shared/ui-primitives';
import { adminBranchesText } from '../../i18n/staff-admin-branches';
import { staffShellText, type Locale } from '../../i18n/staff-shell';

export type AdminBranchesFixtureState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';

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
  state?: AdminBranchesFixtureState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = adminBranchesText[locale];

  return (
    <Card aria-label={t.title} className="rounded-md border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 border-b border-line-subtle p-4">
        <div>
          <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
          <CardDescription className="mt-1 text-sm text-content-muted">{t.subtitle}</CardDescription>
        </div>
        <Button type="button">{t.actions.create}</Button>
      </CardHeader>
      <CardContent className="p-4">
        {state ? <StateBlock className="mb-4" message={t.states[state]} tone={state === 'success' ? 'success' : state === 'error' || state === 'validation' || state === 'conflict' ? 'error' : 'neutral'} /> : null}
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
    <section className="rounded-md border border-line-subtle bg-surface-raised" aria-label={title}>
      <h3 className="border-b border-line-subtle px-3 py-2 text-sm font-semibold">{title}</h3>
      <Table className="min-w-[34rem]">
        <TableHeader className="bg-surface text-xs font-semibold uppercase tracking-normal text-content-muted">
          <TableRow>
            {t.headers.map((header) => (
              <TableHead className="text-start" key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([code, name, status]) => (
            <TableRow className="border-b border-line-subtle" key={`${title}-${code}`}>
              <TableCell className="font-semibold">{code}</TableCell>
              <TableCell>{name}</TableCell>
              <TableCell>
                <StatusBadge tone={status === 'active' ? 'success' : 'neutral'}>{t.badges[status]}</StatusBadge>
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
