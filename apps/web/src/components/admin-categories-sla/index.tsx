import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { adminCategoriesSlaText } from '../../i18n/staff-admin-categories-sla';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AdminCategory, AdminCategorySlaConfig, AdminSlaPolicy } from '../../lib/staff-admin-category-sla-api';

export type AdminConfigPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';
type AdminAction = (formData: FormData) => void | Promise<void>;

export function AdminCategoriesSla({
  categoryAction,
  config,
  deactivateCategoryAction,
  locale,
  slaAction,
  state,
}: {
  categoryAction?: AdminAction;
  config?: AdminCategorySlaConfig | null;
  deactivateCategoryAction?: AdminAction;
  locale: Locale;
  slaAction?: AdminAction;
  state?: AdminConfigPreviewState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = adminCategoriesSlaText[locale];
  const categories = config?.categories ?? [];
  const policies = config?.policies ?? [];
  const visibleState = state ?? (config && categories.length === 0 && policies.length === 0 ? 'empty' : undefined);

  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <CardDescription className="mt-1 text-sm text-slate-600">{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        {visibleState ? <p className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role={visibleState === 'success' || visibleState === 'loading' || visibleState === 'empty' ? 'status' : 'alert'}>{t.states[visibleState]}</p> : null}
        <p className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{t.auditNote}</p>
        <div className="grid gap-3 xl:grid-cols-2">
          <CategoryTable action={categoryAction} deactivateAction={deactivateCategoryAction} locale={locale} rows={categories} />
          <SeverityTable locale={locale} policies={policies} />
          <SlaTable action={slaAction} locale={locale} policies={policies} />
          <p className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 xl:col-span-2">{t.slaNote}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryTable({ action, deactivateAction, locale, rows }: { action: AdminAction | undefined; deactivateAction: AdminAction | undefined; locale: Locale; rows: AdminCategory[] }) {
  const t = adminCategoriesSlaText[locale];
  const parentName = new Map(rows.map((row) => [row.id, row.nameEn]));
  return (
    <section className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50" aria-label={t.sections.categories}>
      <h3 className="border-b border-slate-200 px-3 py-2 text-sm font-semibold">{t.sections.categories}</h3>
      {action ? <CategoryForm action={action} locale={locale} rows={rows} /> : null}
      <Table className="min-w-[54rem]">
        <TableHeader className="bg-white text-xs font-semibold uppercase tracking-normal text-slate-600">
          <TableRow>{t.categoryHeaders.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? rows.map((row) => (
            <TableRow className="border-b border-slate-100" key={row.id}>
              <TableCell className="font-semibold">{row.code}</TableCell>
              <TableCell>{row.nameEn}</TableCell>
              <TableCell>{row.nameAr}</TableCell>
              <TableCell>{row.parentId ? parentName.get(row.parentId) ?? t.root : t.root}</TableCell>
              <TableCell><StatusBadge>{row.isActive ? t.badges.active : t.badges.inactive}</StatusBadge></TableCell>
              <TableCell><CategoryActions action={action} deactivateAction={deactivateAction} item={row} locale={locale} rows={rows} /></TableCell>
            </TableRow>
          )) : <TableRow><TableCell className="text-slate-600" colSpan={6}>{t.states.empty}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </section>
  );
}

function CategoryActions({ action, deactivateAction, item, locale, rows }: { action: AdminAction | undefined; deactivateAction: AdminAction | undefined; item: AdminCategory; locale: Locale; rows: AdminCategory[] }) {
  const t = adminCategoriesSlaText[locale];
  return (
    <div className="grid min-w-[26rem] gap-2">
      {action ? <CategoryForm action={action} compact item={item} locale={locale} rows={rows} /> : null}
      {deactivateAction ? (
        <form action={deactivateAction} className="flex gap-2">
          <input name="id" type="hidden" value={item.id} />
          <input name="locale" type="hidden" value={locale} />
          <Button disabled={!item.isActive} size="sm" type="submit" variant="outline">{t.actions.deactivate}</Button>
        </form>
      ) : null}
    </div>
  );
}

function CategoryForm({ action, compact = false, item, locale, rows }: { action: AdminAction; compact?: boolean; item?: AdminCategory; locale: Locale; rows: AdminCategory[] }) {
  const t = adminCategoriesSlaText[locale];
  return (
    <form action={action} className={compact ? 'grid gap-2 md:grid-cols-5' : 'grid gap-2 border-b border-slate-200 p-3 md:grid-cols-5'}>
      <input name="id" type="hidden" value={item?.id ?? ''} />
      <input name="locale" type="hidden" value={locale} />
      <input name="returnTo" type="hidden" value="/admin/categories" />
      <Field label={t.fields.code} name="code" value={item?.code} />
      <Field label={t.fields.nameEn} name="nameEn" value={item?.nameEn} />
      <Field label={t.fields.nameAr} name="nameAr" value={item?.nameAr} />
      <label className="grid gap-1 text-sm font-medium">
        {t.fields.parent}
        <select className="rounded-md border border-slate-300 bg-white px-3 py-2" defaultValue={item?.parentId ?? ''} name="parentId">
          <option value="">{t.root}</option>
          {rows.filter((row) => row.parentId === null && row.id !== item?.id).map((row) => <option key={row.id} value={row.id}>{row.nameEn}</option>)}
        </select>
      </label>
      <Button className="self-end" size={compact ? 'sm' : 'default'} type="submit" variant={item ? 'outline' : 'default'}>{item ? t.actions.edit : t.actions.create}</Button>
    </form>
  );
}

function SeverityTable({ locale, policies }: { locale: Locale; policies: AdminSlaPolicy[] }) {
  const t = adminCategoriesSlaText[locale];
  const severities = Array.from(new Set(policies.map((policy) => policy.severity)));
  return (
    <section className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50" aria-label={t.sections.severities}>
      <h3 className="border-b border-slate-200 px-3 py-2 text-sm font-semibold">{t.sections.severities}</h3>
      <Table className="min-w-[30rem]">
        <TableHeader className="bg-white text-xs font-semibold uppercase tracking-normal text-slate-600">
          <TableRow>{t.severityHeaders.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>{severities.length ? severities.map((severity) => <TableRow key={severity}><TableCell className="font-semibold">{severity}</TableCell><TableCell>{t.severitySource}</TableCell></TableRow>) : <TableRow><TableCell className="text-slate-600" colSpan={2}>{t.states.empty}</TableCell></TableRow>}</TableBody>
      </Table>
    </section>
  );
}

function SlaTable({ action, locale, policies }: { action: AdminAction | undefined; locale: Locale; policies: AdminSlaPolicy[] }) {
  const t = adminCategoriesSlaText[locale];
  return (
    <section className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50 xl:col-span-2" aria-label={t.sections.sla}>
      <h3 className="border-b border-slate-200 px-3 py-2 text-sm font-semibold">{t.sections.sla}</h3>
      <Table className="min-w-[64rem]">
        <TableHeader className="bg-white text-xs font-semibold uppercase tracking-normal text-slate-600">
          <TableRow>{t.slaHeaders.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {policies.length ? policies.map((policy) => <SlaRow action={action} key={policy.id} locale={locale} policy={policy} />) : <TableRow><TableCell className="text-slate-600" colSpan={8}>{t.states.empty}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </section>
  );
}

function SlaRow({ action, locale, policy }: { action: AdminAction | undefined; locale: Locale; policy: AdminSlaPolicy }) {
  const t = adminCategoriesSlaText[locale];
  return (
    <TableRow className="border-b border-slate-100">
      <TableCell className="font-semibold">{policy.stage}</TableCell>
      <TableCell>{policy.severity}</TableCell>
      <TableCell>{policy.durationMinutes}</TableCell>
      <TableCell>{policy.warningPercent}%</TableCell>
      <TableCell>{policy.branchTimezone} / {policy.workingCalendarMode}</TableCell>
      <TableCell>{policy.escalationLevel1}</TableCell>
      <TableCell><StatusBadge>{policy.isActive ? t.badges.active : t.badges.inactive}</StatusBadge></TableCell>
      <TableCell>{action ? <SlaForm action={action} locale={locale} policy={policy} /> : null}</TableCell>
    </TableRow>
  );
}

function SlaForm({ action, locale, policy }: { action: AdminAction; locale: Locale; policy: AdminSlaPolicy }) {
  const t = adminCategoriesSlaText[locale];
  return (
    <form action={action} className="grid min-w-[36rem] gap-2 md:grid-cols-5">
      <input name="id" type="hidden" value={policy.id} />
      <input name="locale" type="hidden" value={locale} />
      <NumberField label={t.fields.durationMinutes} name="durationMinutes" value={policy.durationMinutes} />
      <NumberField label={t.fields.warningPercent} name="warningPercent" value={policy.warningPercent} />
      <Field label={t.fields.timezone} name="branchTimezone" value={policy.branchTimezone} />
      <label className="grid gap-1 text-sm font-medium">
        {t.fields.calendar}
        <select className="rounded-md border border-slate-300 bg-white px-3 py-2" defaultValue={policy.workingCalendarMode} name="workingCalendarMode">
          <option value="ALWAYS_ON">{t.modes.ALWAYS_ON}</option>
          <option value="CALENDAR_HOURS">{t.modes.CALENDAR_HOURS}</option>
        </select>
      </label>
      <Field label={t.fields.escalationLevel1} name="escalationLevel1" value={policy.escalationLevel1} />
      <Field label={t.fields.escalationLevel2} name="escalationLevel2" value={policy.escalationLevel2 ?? ''} />
      <NumberField label={t.fields.escalationLevel2AfterBreachMinutes} name="escalationLevel2AfterBreachMinutes" value={policy.escalationLevel2AfterBreachMinutes ?? ''} />
      <Field label={t.fields.escalationLevel3} name="escalationLevel3" value={policy.escalationLevel3 ?? ''} />
      <NumberField label={t.fields.escalationLevel3AfterBreachMinutes} name="escalationLevel3AfterBreachMinutes" value={policy.escalationLevel3AfterBreachMinutes ?? ''} />
      <Button className="self-end" size="sm" type="submit" variant="outline">{t.actions.edit}</Button>
    </form>
  );
}

function Field({ label, name, value = '' }: { label: string; name: string; value?: string | number | undefined }) {
  const id = `${name}-${String(value || 'new').replace(/\W+/g, '-')}`;
  return <div className="grid gap-1"><Label htmlFor={id}>{label}</Label><Input defaultValue={value} id={id} name={name} /></div>;
}

function NumberField({ label, name, value }: { label: string; name: string; value: number | '' }) {
  const id = `${name}-${String(value || 'blank')}`;
  return <div className="grid gap-1"><Label htmlFor={id}>{label}</Label><Input defaultValue={value} id={id} min={1} name={name} type="number" /></div>;
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return <Badge className="shadow-none" variant="secondary">{children}</Badge>;
}
