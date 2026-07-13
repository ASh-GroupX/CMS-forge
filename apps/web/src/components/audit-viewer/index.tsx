import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Field, StateBlock, StatusBadge } from '../shared/ui-primitives';
import { auditViewerText } from '../../i18n/staff-audit-viewer';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { formatDisplayDate } from '../../lib/locale-format';
import { auditExportHref, type StaffAuditFilters, type StaffAuditResult } from '../../lib/staff-audit-api';
import { localeHref } from '../../lib/locale-href';

export type AuditFixtureState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict' | 'denied';

export function AuditViewer({
  filters = {},
  locale,
  result,
  state,
}: {
  filters?: StaffAuditFilters;
  locale: Locale;
  result?: StaffAuditResult | undefined;
  state?: AuditFixtureState | undefined;
}) {
  const shell = staffShellText[locale], t = auditViewerText[locale];
  const rows = result?.items ?? [];
  const visibleState = state ?? (!result ? 'error' : rows.length === 0 ? 'empty' : undefined);
  const exportDisabled = visibleState === 'denied' || visibleState === 'error' || visibleState === 'loading' || rows.length === 0;
  return (
    <Card aria-label={t.title} className="min-w-0 rounded-md border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 border-b border-line-subtle p-4">
        <div>
          <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
          <CardDescription className="mt-1 text-sm text-content-muted">{t.subtitle}</CardDescription>
        </div>
        {exportDisabled ? <Button className="focus:ring-2" type="button" aria-disabled="true">{t.filters.export}</Button> : <Button asChild className="focus:ring-2"><a href={localeHref(auditExportHref(filters), locale)}>{t.filters.export}</a></Button>}
      </CardHeader>
      <CardContent className="p-4">
        {visibleState ? <StateBlock className="mb-4" message={t.states[visibleState]} tone={visibleState === 'success' ? 'success' : visibleState === 'error' || visibleState === 'validation' || visibleState === 'conflict' || visibleState === 'denied' ? 'error' : 'neutral'} /> : null}
        <details className="mb-4 rounded-sm border border-line-subtle bg-surface-raised p-3 md:hidden"><summary className="cursor-pointer text-sm font-semibold">{t.filters.advanced}</summary><AuditFilterForm filters={filters} locale={locale} t={t} /></details>
        <div className="mb-4 hidden md:block"><AuditFilterForm filters={filters} locale={locale} t={t} /></div>
        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-[64rem]">
            <TableHeader className="bg-surface-raised text-xs font-semibold uppercase tracking-normal text-content-muted">
              <TableRow>{t.headers.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow className="border-b border-line-subtle" key={row.id}>
                  <TableCell>{formatDate(row.createdAt, locale, row.displayTimeZone)}</TableCell>
                  <TableCell title={row.actorId ?? undefined}><bdi>{actorLabel(row, locale)}</bdi></TableCell>
                  <TableCell><AuditBadge>{row.eventType}</AuditBadge></TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell><AuditTarget locale={locale} row={row} /></TableCell>
                  <TableCell className="font-mono text-xs" title={row.correlationId ?? undefined}><bdi>{row.correlationId ? shortId(row.correlationId) : '-'}</bdi></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid gap-2 md:hidden">{rows.map((row) => <article className="grid gap-2 rounded-sm border border-line-subtle bg-surface-raised p-3 text-sm" key={row.id}><div className="flex flex-wrap items-start justify-between gap-2"><AuditBadge>{row.eventType}</AuditBadge><time dateTime={row.createdAt}>{formatDate(row.createdAt, locale, row.displayTimeZone)}</time></div><p className="font-semibold">{row.action}</p><dl className="grid gap-2"><div><dt className="text-xs text-content-muted">{t.headers[1]}</dt><dd title={row.actorId ?? undefined}><bdi>{actorLabel(row, locale)}</bdi></dd></div><div><dt className="text-xs text-content-muted">{t.headers[4]}</dt><dd><AuditTarget locale={locale} row={row} /></dd></div><div><dt className="text-xs text-content-muted">{t.headers[5]}</dt><dd className="font-mono text-xs" title={row.correlationId ?? undefined}><bdi>{row.correlationId ? shortId(row.correlationId) : '-'}</bdi></dd></div></dl></article>)}</div>
        <details className="mt-3 rounded-sm border border-line-subtle bg-surface-raised px-3 py-2 text-sm text-content-muted">
          <summary className="cursor-pointer font-semibold">{t.metadata}</summary>
          <dl className="mt-2 grid max-h-56 gap-2 overflow-auto text-xs">
            {metadataRows(rows).map((row) => (
              <div className="grid gap-1 rounded-sm bg-surface px-2 py-2 md:grid-cols-[12rem_1fr]" key={row.key}>
                <dt className="font-mono text-content-strong">{row.key}</dt>
                <dd className="break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
        </details>
        <StateBlock className="mt-3" message={t.safeNote} />
      </CardContent>
    </Card>
  );
}

function AuditFilterForm({ filters, locale, t }: { filters: StaffAuditFilters; locale: Locale; t: typeof auditViewerText.en }) {
  return <form className="mt-3 grid gap-3 md:mt-0 md:grid-cols-2 xl:grid-cols-5" method="get"><input name="locale" type="hidden" value={locale} />{(['eventType', 'actorId', 'targetType', 'targetId', 'correlationId', 'from', 'to', 'page', 'pageSize'] as const).map((field) => <Field id={`audit-${field}`} key={field} label={t.filters[field]}><Input className="focus:ring-2" defaultValue={filters[field]} id={`audit-${field}`} name={field} type={field === 'from' || field === 'to' ? 'date' : field === 'page' || field === 'pageSize' ? 'number' : 'text'} /></Field>)}<Button className="focus:ring-2 xl:col-span-5" type="submit" variant="outline">{t.filters.apply}</Button></form>;
}

function actorLabel(row: StaffAuditResult['items'][number], locale: Locale): string {
  const actor = (locale === 'ar' ? row.actorNameAr || row.actorName : row.actorName || row.actorNameAr) ?? (row.actorId ? shortId(row.actorId) : '-');
  const branch = locale === 'ar' ? row.branchNameAr || row.branchName : row.branchName || row.branchNameAr;
  return branch ? `${actor} · ${branch}` : actor;
}

function AuditTarget({ locale, row }: { locale: Locale; row: StaffAuditResult['items'][number] }) {
  const value = `${row.targetType}${row.targetId ? `:${shortId(row.targetId)}` : ''}`;
  const type = row.targetType.toUpperCase();
  const href = row.targetId && (type === 'COMPLAINT' || type === 'TASK') ? localeHref(`/${type === 'COMPLAINT' ? 'complaints' : 'tasks'}/${row.targetId}`, locale) : null;
  return href ? <a className="font-medium text-brand underline-offset-4 hover:underline" href={href} title={row.targetId ?? undefined}><bdi>{value}</bdi></a> : <bdi title={row.targetId ?? undefined}>{value}</bdi>;
}

function metadataRows(rows: StaffAuditResult['items']): Array<{ key: string; value: string }> {
  return rows.flatMap((row) => flattenMetadata(row.metadata).map(({ key, value }) => ({ key: `${row.id}.${key}`, value }))).slice(0, 80);
}

function flattenMetadata(value: unknown, prefix = 'metadata'): Array<{ key: string; value: string }> {
  if (!value || typeof value !== 'object') return [{ key: prefix, value: String(value ?? '-') }];
  if (Array.isArray(value)) return value.flatMap((item, index) => flattenMetadata(item, `${prefix}.${index}`));
  return Object.entries(value).flatMap(([key, item]) => flattenMetadata(item, `${prefix}.${key}`));
}

function AuditBadge({ children }: { children: React.ReactNode }) {
  return <StatusBadge>{children}</StatusBadge>;
}

function formatDate(value: string, locale: Locale, timeZone: string): string {
  return `${formatDisplayDate(value, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone })} (${timeZone})`;
}

function shortId(value: string): string { return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-4)}` : value; }
