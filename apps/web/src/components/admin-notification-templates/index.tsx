import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StateBlock, StatusBadge } from '../shared/ui-primitives';
import { adminNotificationTemplatesText } from '../../i18n/staff-admin-notification-templates';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AdminConfigFixtureState } from '../admin-categories-sla';

const rows = [
  ['Complaint created', 'Email, in-app', 'Arabic + English', 'active'],
  ['SLA warning', 'In-app, SMS-ready', 'Arabic + English', 'inactive'],
] as const;

export function AdminNotificationTemplates({ locale, state }: { locale: Locale; state?: AdminConfigFixtureState | undefined }) {
  const shell = staffShellText[locale];
  const t = adminNotificationTemplatesText[locale];
  return (
    <Card aria-label={t.title} className="rounded-md border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-line-subtle p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <CardDescription className="mt-1 text-sm text-content-muted">{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {state ? <StateBlock className="mb-4" message={t.states[state]} tone={state === 'success' ? 'success' : state === 'error' || state === 'validation' || state === 'conflict' ? 'error' : 'neutral'} /> : null}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
          <section className="rounded-md border border-line-subtle bg-surface-raised" aria-label={t.title}>
            <Table className="min-w-[48rem]">
              <TableHeader className="bg-surface text-xs font-semibold uppercase tracking-normal text-content-muted">
                <TableRow>{t.headers.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(([event, channels, languages, status]) => (
                  <TableRow className="border-b border-line-subtle" key={event}>
                    <TableCell className="font-semibold">{event}</TableCell>
                    <TableCell>{channels}</TableCell>
                    <TableCell>{languages}</TableCell>
                    <TableCell><StatusBadge tone={status === 'active' ? 'success' : 'neutral'}>{t.badges[status]}</StatusBadge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" type="button" variant="outline">{t.actions.edit}</Button>
                        <Button size="sm" type="button" variant="outline">
                          {status === 'active' ? t.actions.deactivate : t.actions.activate}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
          <aside className="rounded-md border border-line-subtle bg-surface-raised p-3" aria-label={t.previewTitle}>
            <h3 className="text-sm font-semibold">{t.previewTitle}</h3>
            <dl className="mt-3 grid gap-2 text-sm">
              <div><dt className="font-semibold text-content-muted">{t.headers[0]}</dt><dd>{t.preview.event}</dd></div>
              <div><dt className="font-semibold text-content-muted">{t.headers[1]}</dt><dd>{t.preview.channel}</dd></div>
            </dl>
            <p className="mt-3 text-sm">{t.preview.english}</p>
            <p className="mt-2 text-sm">{t.preview.arabic}</p>
            <h4 className="mt-3 text-xs font-semibold uppercase tracking-normal text-content-muted">{t.placeholdersTitle}</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.placeholders.map((placeholder) => <code className="rounded-sm bg-surface px-2 py-1 text-xs" key={placeholder}>{placeholder}</code>)}
            </div>
            <StateBlock className="mt-3" message={t.preview.note} />
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}
