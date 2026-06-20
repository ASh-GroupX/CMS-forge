import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { adminUsersText } from '../../i18n/staff-admin-users';
import { staffShellText, type Locale } from '../../i18n/staff-shell';

export type AdminUsersPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';

const rows = [
  ['Staff user placeholder', 'CR Officer', 'Main branch', 'active'],
  ['Manager user placeholder', 'CR Manager', 'Service branch', 'inactive'],
] as const;

export function AdminUsersRoles({ locale, state }: { locale: Locale; state?: AdminUsersPreviewState | undefined }) {
  const shell = staffShellText[locale];
  const t = adminUsersText[locale];

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
        <Table className="min-w-[50rem]">
          <TableHeader className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-600">
            <TableRow>
              {t.headers.map((header) => (
                <TableHead className="text-start" key={header}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([user, role, branch, status]) => (
              <TableRow className="border-b border-slate-100" key={user}>
                <TableCell className="font-semibold">{user}</TableCell>
                <TableCell>{role}</TableCell>
                <TableCell>{branch}</TableCell>
                <TableCell>
                  <Badge className="shadow-none" variant={status === 'active' ? 'secondary' : 'outline'}>
                    {t.badges[status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" type="button" variant="outline">{t.actions.edit}</Button>
                    <Button size="sm" type="button" variant="outline">{t.actions.deactivate}</Button>
                    <Button size="sm" type="button" variant="outline">{t.actions.reset}</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role="status">
          {t.resetMessage}
        </p>
      </CardContent>
    </Card>
  );
}
