import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { adminCategoriesSlaText } from '../../i18n/staff-admin-categories-sla';
import { staffShellText, type Locale } from '../../i18n/staff-shell';

export type AdminConfigPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';

const categories = [['Service quality', 'Repair delay', 'active'], ['Vehicle issue', 'Engine noise', 'active']] as const;
const severities = [['Critical', '2 hours default', 'active'], ['High', '8 hours default', 'active'], ['Medium', '24 hours default', 'active'], ['Low', '72 hours default', 'active']] as const;
const policies = [['Submitted review', 'Critical', '80% warning', '2 hours', 'global'], ['Investigation', 'High', '80% warning', '8 hours', 'branch']] as const;

export function AdminCategoriesSla({ locale, state }: { locale: Locale; state?: AdminConfigPreviewState | undefined }) {
  const shell = staffShellText[locale];
  const t = adminCategoriesSlaText[locale];

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
          <SettingsTable headers={t.categoryHeaders} locale={locale} rows={categories} title={t.sections.categories} />
          <SettingsTable headers={t.severityHeaders} locale={locale} rows={severities} title={t.sections.severities} />
          <SlaTable locale={locale} />
          <p className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 xl:col-span-2">
            {t.slaNote}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsTable({
  headers,
  locale,
  rows,
  title,
}: {
  headers: readonly string[];
  locale: Locale;
  rows: readonly (readonly [string, string, 'active' | 'inactive'])[];
  title: string;
}) {
  const t = adminCategoriesSlaText[locale];
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50" aria-label={title}>
      <h3 className="border-b border-slate-200 px-3 py-2 text-sm font-semibold">{title}</h3>
      <Table className="min-w-[36rem]">
        <TableHeader className="bg-white text-xs font-semibold uppercase tracking-normal text-slate-600">
          <TableRow>{headers.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(([primary, secondary, status]) => (
            <TableRow className="border-b border-slate-100" key={`${title}-${primary}`}>
              <TableCell className="font-semibold">{primary}</TableCell>
              <TableCell>{secondary}</TableCell>
              <TableCell><StatusBadge>{t.badges[status]}</StatusBadge></TableCell>
              <TableCell><AdminButtons locale={locale} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

function SlaTable({ locale }: { locale: Locale }) {
  const t = adminCategoriesSlaText[locale];
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 xl:col-span-2" aria-label={t.sections.sla}>
      <h3 className="border-b border-slate-200 px-3 py-2 text-sm font-semibold">{t.sections.sla}</h3>
      <Table className="min-w-[54rem]">
        <TableHeader className="bg-white text-xs font-semibold uppercase tracking-normal text-slate-600">
          <TableRow>{t.slaHeaders.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {policies.map(([stage, severity, warning, deadline, scope]) => (
            <TableRow className="border-b border-slate-100" key={`${stage}-${severity}`}>
              {[stage, severity, warning, deadline].map((value) => <TableCell key={value}>{value}</TableCell>)}
              <TableCell><StatusBadge>{scope === 'global' ? t.badges.global : t.badges.branch}</StatusBadge></TableCell>
              <TableCell><AdminButtons locale={locale} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

function AdminButtons({ locale }: { locale: Locale }) {
  const t = adminCategoriesSlaText[locale];
  return (
    <div className="flex gap-2">
      <Button size="sm" type="button" variant="outline">{t.actions.edit}</Button>
      <Button size="sm" type="button" variant="outline">{t.actions.deactivate}</Button>
    </div>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return <Badge className="shadow-none" variant="secondary">{children}</Badge>;
}
