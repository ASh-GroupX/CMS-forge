import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StaffPicker } from '../shared/staff-picker';
import { StateBlock, StatusBadge } from '../shared/ui-primitives';
import { reportCatalogText, reportsDashboardText } from '../../i18n/staff-reports-dashboard';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { ComplaintFormOption, ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import type { StaffReportCatalog, StaffReportKpis, StaffReportRow } from '../../lib/staff-reports-api';

export type ReportsPreviewState = 'ready' | 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'denied' | 'conflict';
export type ReportsFilters = { branchId: string; categoryId: string; dateFrom: string; dateTo: string; departmentId: string; ownerId: string; severity: string };

export function ReportsDashboard({
  catalog,
  filters = { branchId: '', categoryId: '', dateFrom: '', dateTo: '', departmentId: '', ownerId: '', severity: '' },
  kpis,
  locale,
  options,
  rows,
  staff,
  state,
}: {
  catalog?: StaffReportCatalog | undefined;
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
  const severities = options?.severities ?? [];
  const exportQuery = reportQuery(filters);
  const operationalRows = rows?.slice(0, 17);
  const exportEnabled = state !== 'denied' && state !== 'error' && state !== 'loading';
  const catalogRows = catalogRowsFrom(catalog, reports, t);
  const kpiCards = kpis ? [
    [t.kpis.onTime, `${kpis.onTimeCompletionPercent}%`],
    [t.kpis.activeOverdue, String(kpis.activeOverdueCount)],
    [t.kpis.averageDelay, t.hours(kpis.averageDelayHours)],
    [t.kpis.promiseKept, `${kpis.customerPromiseKeptPercent}%`],
    [t.kpis.slaBreachRate, `${kpis.slaBreachRate}%`],
    [t.kpis.medianTat, t.hours(kpis.medianTatHours)],
    [t.kpis.reopenRate, `${kpis.reopenRate}%`],
    [t.kpis.reopenedEvents, String(kpis.reopenedCount)],
    [t.kpis.escalations, String(kpis.escalationCount)],
    [t.kpis.agingZeroToOne, String(kpis.agingBuckets.zeroToOneDays)],
    [t.kpis.agingTwoToThree, String(kpis.agingBuckets.twoToThreeDays)],
    [t.kpis.agingFourToSeven, String(kpis.agingBuckets.fourToSevenDays)],
    [t.kpis.agingOverSeven, String(kpis.agingBuckets.overSevenDays)],
    [t.kpis.firstResponse, t.hours(kpis.averageFirstResponseHours)],
    [t.kpis.resolution, t.hours(kpis.averageResolutionHours)],
  ] as const : null;
  const primaryKpi = kpiCards?.[0];
  const supportingKpis = kpiCards?.slice(1);
  return (
    <Card aria-label={t.title} className="max-w-full overflow-hidden rounded-md border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-line-subtle p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <CardDescription className="mt-1 text-sm text-content-muted">{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {state ? <StateBlock className="mb-4" message={t.states[state]} tone={state === 'success' ? 'success' : state === 'error' || state === 'validation' || state === 'conflict' || state === 'denied' ? 'error' : 'neutral'} /> : null}
        <form action="/reports" className="mb-3 rounded-md border border-line-subtle bg-surface-raised p-3" method="get">
          <input name="locale" type="hidden" value={locale} />
          {filters.departmentId ? <input name="departmentId" type="hidden" value={filters.departmentId} /> : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <DateField label={t.filters.dateFrom} name="dateFrom" value={filters.dateFrom} />
            <DateField label={t.filters.dateTo} name="dateTo" value={filters.dateTo} />
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
            <SelectField
              choose={t.filters.allSeverities}
              disabledLabel={t.filters.unavailable}
              label={t.filters.severity}
              name="severity"
              options={severities}
              value={filters.severity}
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
        <section className="mb-3 rounded-md border border-line-subtle bg-surface p-3" aria-label={t.kpis.title}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">{t.kpis.title}</h3>
              <p className="mt-1 text-xs text-content-muted">{t.kpis.subtitle}</p>
            </div>
            <ReportBadge>{kpis ? t.kpis.backend : t.kpis.unavailable}</ReportBadge>
          </div>
          {primaryKpi ? (
            <div className="mt-3 grid gap-2 xl:grid-cols-[minmax(14rem,1fr)_minmax(0,3fr)]">
              <dl className="rounded-sm border border-line-subtle bg-brand-soft px-4 py-3">
                <dt className="text-xs font-semibold text-brand">{primaryKpi[0]}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-normal text-content-strong">{primaryKpi[1]}</dd>
              </dl>
              <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {supportingKpis?.map(([label, value]) => (
                  <div className="rounded-sm border border-line-subtle bg-surface-raised px-3 py-2" key={label}>
                    <dt className="text-xs font-semibold text-content-muted">{label}</dt>
                    <dd className="mt-1 text-lg font-semibold tracking-normal text-content-strong">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <StateBlock className="mt-3" message={t.kpis.empty} />
          )}
        </section>
        <section className="mb-3 rounded-md border border-line-subtle bg-surface-raised p-3" aria-label={t.export.title}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">{t.export.title}</h3>
              <p className="mt-1 text-xs text-content-muted">{t.export.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {exportEnabled ? (
                <>
                  <Button asChild size="sm" type="button" variant="outline"><a href={`/reports/export?format=csv${exportQuery}`}>{t.export.csv}</a></Button>
                  <Button asChild size="sm" type="button" variant="outline"><a href={`/reports/export?format=excel${exportQuery}`}>{t.export.excel}</a></Button>
                </>
              ) : (
                <>
                  <Button aria-label={t.states.denied} disabled size="sm" title={t.states.denied} type="button" variant="outline">{t.export.csv}</Button>
                  <Button aria-label={t.states.denied} disabled size="sm" title={t.states.denied} type="button" variant="outline">{t.export.excel}</Button>
                </>
              )}
            </div>
          </div>
          <ul className="mt-3 grid gap-1 text-sm text-content-muted md:grid-cols-3">
            <li>{t.export.rowLimit}</li>
            <li>{t.export.scoped}</li>
            <li>{t.export.audit}</li>
          </ul>
        </section>
        <section className="mb-3" aria-label={t.catalog.title}>
          <h3 className="mb-2 text-sm font-semibold">{t.catalog.title}</h3>
          <div className="overflow-x-auto">
            <Table className="min-w-[56rem]">
              <TableHeader className="bg-surface-raised text-xs font-semibold uppercase tracking-normal text-content-muted">
                <TableRow>{t.headers.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
              </TableHeader>
              <TableBody>
                {catalogRows.map((row) => (
                  <TableRow className="border-b border-line-subtle" key={row.id}>
                    <TableCell className="font-semibold">{row.id} - {row.name}</TableCell>
                    <TableCell>{row.audience}</TableCell>
                    <TableCell>{row.filters}</TableCell>
                    <TableCell><ReportBadge>{row.status}</ReportBadge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
        <div className="overflow-x-auto">
          <h3 className="mb-2 text-sm font-semibold">{t.operationalRows.title}</h3>
          <Table className="min-w-[56rem]">
            <TableHeader className="bg-surface-raised text-xs font-semibold uppercase tracking-normal text-content-muted">
              <TableRow>{t.operationalRows.headers.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {operationalRows?.length
                ? operationalRows.map((row) => (
                    <TableRow className="border-b border-line-subtle" key={row.id}>
                      <TableCell className="font-semibold">{row.referenceNumber} - {row.subject}</TableCell>
                      <TableCell>{rowScopeLabel(row, branches, staff, locale, t.filters.unavailable)}</TableCell>
                      <TableCell><ReportBadge>{optionLabel(categories, row.categoryId, locale) ?? t.filters.unavailable}</ReportBadge></TableCell>
                      <TableCell><ReportBadge>{row.status}</ReportBadge></TableCell>
                    </TableRow>
                  ))
                : (
                    <TableRow className="border-b border-line-subtle">
                      <TableCell className="text-content-muted" colSpan={4}>{t.operationalRows.empty}</TableCell>
                    </TableRow>
                  )}
            </TableBody>
          </Table>
        </div>
        <StateBlock className="mt-3" message={t.safeNote} />
      </CardContent>
    </Card>
  );
}

function DateField({ label, name, value }: { label: string; name: string; value: string }) {
  const id = `reports-${name}`;
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><input className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm" defaultValue={value} id={id} name={name} type="date" /></div>;
}

function SelectField({ choose, disabledLabel, label, name, options, value }: { choose: string; disabledLabel: string; label: string; name: string; options: string[]; value: string }) {
  const id = `reports-${name}`;
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm" defaultValue={options.includes(value) ? value : ''} disabled={options.length === 0} id={id} name={name}>
    <option value="">{options.length === 0 ? disabledLabel : choose}</option>
    {options.map((option) => <option key={option} value={option}>{option}</option>)}
  </select></div>;
}

function OptionField({ choose, disabledLabel, label, locale, name, options, value }: { choose: string; disabledLabel: string; label: string; locale: Locale; name: string; options: ComplaintFormOption[]; value: string }) {
  const id = `reports-${name}`;
  return <div className="grid gap-2"><Label htmlFor={id}>{label}</Label><select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm" defaultValue={options.length === 0 ? '' : value} disabled={options.length === 0} id={id} name={name}>
    <option value="">{options.length === 0 ? disabledLabel : choose}</option>
    {options.map((option) => <option key={option.id} value={option.id}>{optionLabelText(option, locale)}</option>)}
  </select></div>;
}

function ReportBadge({ children }: { children: React.ReactNode }) { return <StatusBadge>{children}</StatusBadge>; }

function reportQuery(filters: ReportsFilters): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `&${text}` : '';
}

function catalogRowsFrom(catalog: StaffReportCatalog | undefined, fallback: readonly (readonly [string, string, string, unknown])[], t: typeof reportsDashboardText.en) {
  return catalog?.items.map((item) => {
    const translated = fallback.find(([id]) => id === item.id);
    return {
      id: item.id,
      name: translated?.[1] ?? item.name,
      audience: translated?.[2] ?? item.users,
      filters: item.requiredFilters.map((filter) => reportFilterLabel(filter, t)).join(', '),
      status: item.status === 'DELIVERED' ? t.badges.delivered : item.signoffRequired ? t.badges.deferredSignoff : t.badges.deferred,
    };
  }) ?? fallback.map(([id, name, audience]) => ({
    id,
    name,
    audience,
    filters: t.filters.unavailable,
    status: t.badges.pending,
  }));
}

function reportFilterLabel(filter: string, t: typeof reportsDashboardText.en): string {
  return ({ date: t.filters.dateFrom, dateFrom: t.filters.dateFrom, dateTo: t.filters.dateTo, branch: t.filters.branch, category: t.filters.category, severity: t.filters.severity, owner: t.filters.owner, department: t.filters.department } as Record<string, string>)[filter] ?? filter;
}

function rowScopeLabel(row: StaffReportRow, branches: ComplaintFormOption[], staff: AssignableStaff[] | null | undefined, locale: Locale, unavailable: string): string {
  const branch = optionLabel(branches, row.branchId, locale) ?? unavailable;
  const owner = row.ownerId ? staffLabel(staff?.find((person) => person.userId === row.ownerId), locale) ?? unavailable : null;
  return owner ? `${branch} / ${owner}` : branch;
}

function optionLabel(options: ComplaintFormOption[], id: string, locale: Locale): string | null { const option = options.find((item) => item.id === id); return option ? optionLabelText(option, locale) : null; }

function optionLabelText(option: ComplaintFormOption, locale: Locale): string { return locale === 'ar' ? option.nameAr : option.nameEn; }

function staffLabel(person: AssignableStaff | undefined, locale: Locale): string | null {
  if (!person) return null;
  return [locale === 'ar' ? person.displayNameAr : person.displayName, locale === 'ar' ? person.roleAr : person.role].filter(Boolean).join(' - ');
}
