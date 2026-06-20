import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { adminNotificationTemplatesText } from '../../i18n/staff-admin-notification-templates';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AdminConfigPreviewState } from '../admin-categories-sla';

const rows = [
  ['Complaint created', 'Email, in-app', 'Arabic + English', 'active'],
  ['SLA warning', 'In-app, SMS-ready', 'Arabic + English', 'inactive'],
] as const;

export function AdminNotificationTemplates({ locale, state }: { locale: Locale; state?: AdminConfigPreviewState | undefined }) {
  const shell = staffShellText[locale];
  const t = adminNotificationTemplatesText[locale];
  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <CardDescription className="mt-1 text-sm text-slate-600">{t.subtitle}</CardDescription>
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
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
          <section className="rounded-md border border-slate-200 bg-slate-50" aria-label={t.title}>
            <Table className="min-w-[48rem]">
              <TableHeader className="bg-white text-xs font-semibold uppercase tracking-normal text-slate-600">
                <TableRow>{t.headers.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(([event, channels, languages, status]) => (
                  <TableRow className="border-b border-slate-100" key={event}>
                    <TableCell className="font-semibold">{event}</TableCell>
                    <TableCell>{channels}</TableCell>
                    <TableCell>{languages}</TableCell>
                    <TableCell><Badge className="shadow-none" variant="secondary">{t.badges[status]}</Badge></TableCell>
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
          <aside className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.previewTitle}>
            <h3 className="text-sm font-semibold">{t.previewTitle}</h3>
            <dl className="mt-3 grid gap-2 text-sm">
              <div><dt className="font-semibold text-slate-600">{t.headers[0]}</dt><dd>{t.preview.event}</dd></div>
              <div><dt className="font-semibold text-slate-600">{t.headers[1]}</dt><dd>{t.preview.channel}</dd></div>
            </dl>
            <p className="mt-3 text-sm">{t.preview.english}</p>
            <p className="mt-2 text-sm">{t.preview.arabic}</p>
            <h4 className="mt-3 text-xs font-semibold uppercase tracking-normal text-slate-600">{t.placeholdersTitle}</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {t.placeholders.map((placeholder) => <code className="rounded-sm bg-white px-2 py-1 text-xs" key={placeholder}>{placeholder}</code>)}
            </div>
            <p className="mt-3 rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{t.preview.note}</p>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}
