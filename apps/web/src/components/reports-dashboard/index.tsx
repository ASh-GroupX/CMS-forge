import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StaffPicker } from '../shared/staff-picker';
import { reportCatalogText, reportsDashboardText } from '../../i18n/staff-reports-dashboard';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { ComplaintFormOption, ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import type { StaffReportKpis, StaffReportRow } from '../../lib/staff-reports-api';

export type ReportsPreviewState = 'ready' | 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'denied' | 'conflict';
export type ReportsFilters = { branchId: string; categoryId: string; ownerId: string };

export function ReportsDashboard({
  filters = { branchId: '', categoryId: '', ownerId: '' },
  kpis,
  locale,
  options,
  rows,
  staff,
  state,
}: {
  filters?: ReportsFilters | undefined;
  kpis?: StaffReportKpis | undefined;
  locale: Locale;
  options?: ComplaintFormOptions | null | undefined;
  rows?: StaffReportRow[] | undefined;
  staff?: AssignableStaff[] | null | undefined;
  state?: ReportsPreviewState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = reportsDashboardText[locale];
  const reports = reportCatalogText[locale];
  const branches = options?.branches ?? [];
  const categories = options?.categories?.filter((item) => !item.parentId) ?? [];
  const exportQuery = reportQuery(filters);
  const realRows = rows?.slice(0, 17);
  const kpiCards = kpis ? [
    [t.kpis.onTime, `${kpis.onTimeCompletionPercent}%`],
    [t.kpis.activeOverdue, String(kpis.activeOverdueCount)],
    [t.kpis.averageDelay, t.hours(kpis.averageDelayHours)],
    [t.kpis.promiseKept, `${kpis.customerPromiseKeptPercent}%`],
    [t.kpis.reopened, String(kpis.reopenedCount)],
    [t.kpis.escalations, String(kpis.escalationCount)],
    [t.kpis.firstResponse, t.hours(kpis.averageFirstResponseHours)],
    [t.kpis.resolution, t.hours(kpis.averageResolutionHours)],
  ] as const : null;
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
        <form action="/reports" className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3" method="get">
          <input name="locale" type="hidden" value={locale} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <OptionField
              choose={t.filters.allBranches}
              disabledLabel={t.filters.unavailable}
              label={t.filters.branch}
              locale={locale}
              name="branchId"
              options={branches}
              value={filters.branchId}
            />
            <OptionField
              choose={t.filters.allCategories}
              disabledLabel={t.filters.unavailable}
              label={t.filters.category}
              locale={locale}
              name="categoryId"
              options={categories}
              value={filters.categoryId}
            />
            <div className="xl:col-span-2">
              <StaffPicker
                initialUserId={filters.ownerId}
                label={t.filters.owner}
                locale={locale}
                name="ownerId"
                required={false}
                staff={staff}
                t={t.filters.ownerPicker}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" type="submit">{t.filters.apply}</Button>
            <Button asChild size="sm" type="button" variant="outline"><a href={`/reports?locale=${locale}`}>{t.filters.clear}</a></Button>
          </div>
        </form>
        <section className="mb-3 rounded-md border border-slate-200 bg-white p-3" aria-label={t.kpis.title}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{t.kpis.title}</h3>
              <p className="mt-1 text-xs text-slate-600">{t.kpis.subtitle}</p>
            </div>
            <ReportBadge>{kpis ? t.kpis.backend : t.kpis.unavailable}</ReportBadge>
          </div>
          {kpiCards ? (
            <dl className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {kpiCards.map(([label, value]) => (
                <div className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2" key={label}>
                  <dt className="text-xs font-semibold text-slate-600">{label}</dt>
                  <dd className="mt-1 text-lg font-semibold tracking-normal text-slate-950">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{t.kpis.empty}</p>
          )}
        </section>
        <section className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.export.title}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{t.export.title}</h3>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" type="button" variant="outline"><a href={`/reports/export?format=csv${exportQuery}`}>{t.export.csv}</a></Button>
              <Button asChild size="sm" type="button" variant="outline"><a href={`/reports/export?format=excel${exportQuery}`}>{t.export.excel}</a></Button>
            </div>
          </div>
          <ul className="mt-3 grid gap-1 text-sm text-slate-700 md:grid-cols-3">
            <li>{t.export.rowLimit}</li>
            <li>{t.export.scoped}</li>
            <li>{t.export.audit}</li>
          </ul>
        </section>
        <Table className="min-w-[56rem]">
          <TableHeader className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-600">
            <TableRow>{t.headers.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
          </TableHeader>
          <TableBody>
            {realRows
              ? realRows.map((row) => (
                  <TableRow className="border-b border-slate-100" key={row.id}>
                    <TableCell className="font-semibold">{row.referenceNumber} - {row.subject}</TableCell>
                    <TableCell>{rowScopeLabel(row, branches, staff, locale, t.filters.unavailable)}</TableCell>
                    <TableCell><ReportBadge>{optionLabel(categories, row.categoryId, locale) ?? t.filters.unavailable}</ReportBadge></TableCell>
                    <TableCell><ReportBadge>{row.status}</ReportBadge></TableCell>
                  </TableRow>
                ))
              : reports.map(([id, name, audience, category]) => (
                  <TableRow className="border-b border-slate-100" key={id}>
                    <TableCell className="font-semibold">{id} - {name}</TableCell>
                    <TableCell>{audience}</TableCell>
                    <TableCell><ReportBadge>{t.badges[category]}</ReportBadge></TableCell>
                    <TableCell><ReportBadge>{t.badges.pending}</ReportBadge></TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        <p className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{t.safeNote}</p>
      </CardContent>
    </Card>
  );
}

function OptionField({
  choose,
  disabledLabel,
  label,
  locale,
  name,
  options,
  value,
}: {
  choose: string;
  disabledLabel: string;
  label: string;
  locale: Locale;
  name: string;
  options: ComplaintFormOption[];
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`reports-${name}`}>{label}</Label>
      <select
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        defaultValue={options.length === 0 ? '' : value}
        disabled={options.length === 0}
        id={`reports-${name}`}
        name={name}
      >
        <option value="">{options.length === 0 ? disabledLabel : choose}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{optionLabelText(option, locale)}</option>)}
      </select>
    </div>
  );
}

function ReportBadge({ children }: { children: React.ReactNode }) {
  return <Badge className="shadow-none" variant="secondary">{children}</Badge>;
}

function reportQuery(filters: ReportsFilters): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `&${text}` : '';
}

function rowScopeLabel(row: StaffReportRow, branches: ComplaintFormOption[], staff: AssignableStaff[] | null | undefined, locale: Locale, unavailable: string): string {
  const branch = optionLabel(branches, row.branchId, locale) ?? unavailable;
  const owner = row.ownerId ? staffLabel(staff?.find((person) => person.userId === row.ownerId), locale) ?? unavailable : null;
  return owner ? `${branch} / ${owner}` : branch;
}

function optionLabel(options: ComplaintFormOption[], id: string, locale: Locale): string | null {
  const option = options.find((item) => item.id === id);
  return option ? optionLabelText(option, locale) : null;
}

function optionLabelText(option: ComplaintFormOption, locale: Locale): string {
  return locale === 'ar' ? option.nameAr : option.nameEn;
}

function staffLabel(person: AssignableStaff | undefined, locale: Locale): string | null {
  if (!person) return null;
  return [locale === 'ar' ? person.displayNameAr : person.displayName, locale === 'ar' ? person.roleAr : person.role].filter(Boolean).join(' - ');
}
