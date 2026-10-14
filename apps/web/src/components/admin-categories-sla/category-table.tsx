import React from 'react';
import { Button } from '../ui/button';
import { FormSelect } from '../ui/form-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StateBlock, StatusBadge } from '../shared/ui-primitives';
import { adminCategoriesSlaText } from '../../i18n/staff-admin-categories-sla';
import type { Locale } from '../../i18n/staff-shell';
import type { AdminCategory } from '../../lib/staff-admin-category-sla-api';
import { TextField } from './text-field';

type AdminAction = (formData: FormData) => void | Promise<void>;

export function CategoryTable({
  action,
  deactivateAction,
  locale,
  rows,
  departments,
  branches,
}: {
  action: AdminAction | undefined;
  deactivateAction: AdminAction | undefined;
  locale: Locale;
  rows: AdminCategory[];
  departments: { id: string; nameEn: string; nameAr?: string | null }[];
  branches: { id: string; nameEn: string; nameAr?: string | null }[];
}) {
  const t = adminCategoriesSlaText[locale];
  const departmentName = new Map(departments.map((dep) => [dep.id, localizedName(dep, locale)]));
  const branchName = new Map(branches.map((b) => [b.id, localizedName(b, locale)]));

  return (
    <section className="overflow-x-auto rounded-md border border-border-subtle bg-surface-muted" aria-label={t.sections.categories}>
      <h3 className="border-b border-border-subtle px-3 py-2 text-sm font-semibold">{t.sections.categories}</h3>
      {action ? <CategoryForm action={action} locale={locale} rows={rows} departments={departments} branches={branches} /> : null}
      <Table className="min-w-[54rem]">
        <TableHeader className="bg-surface-card text-xs font-semibold uppercase tracking-normal text-content-muted">
          <TableRow>
            {t.categoryHeaders.map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}
            <TableHead className="text-start">Type</TableHead>
            <TableHead className="text-start">Status</TableHead>
            <TableHead className="text-start">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? rows.map((row) => (
            <TableRow className="border-b border-border-subtle" key={row.id}>
              <TableCell className="font-semibold">{row.code}</TableCell>
              <TableCell>{localizedName(row, locale)}</TableCell>
              <TableCell>{row.nameAr}</TableCell>
              <TableCell>{row.departmentId ? departmentName.get(row.departmentId) ?? t.root : t.root}</TableCell>
              <TableCell>{row.branchId ? branchName.get(row.branchId) ?? t.root : t.root}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-xs">
                  <span className={row.isExternal ? 'font-semibold text-content-strong' : 'text-content-muted'}>CRM</span>
                  <span className={row.isInternal ? 'font-semibold text-content-strong' : 'text-content-muted'}>Internal</span>
                </div>
              </TableCell>
              <TableCell><StatusBadge>{row.isActive ? t.badges.active : t.badges.inactive}</StatusBadge></TableCell>
              <TableCell><CategoryActions action={action} deactivateAction={deactivateAction} item={row} locale={locale} rows={rows} departments={departments} branches={branches} /></TableCell>
            </TableRow>
          )) : <TableRow><TableCell className="text-content-muted" colSpan={7}>{t.states.empty}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </section>
  );
}

function CategoryActions({
  action,
  deactivateAction,
  item,
  locale,
  rows,
  departments,
  branches,
}: {
  action: AdminAction | undefined;
  deactivateAction: AdminAction | undefined;
  item: AdminCategory;
  locale: Locale;
  rows: AdminCategory[];
  departments: { id: string; nameEn: string; nameAr?: string | null }[];
  branches: { id: string; nameEn: string; nameAr?: string | null }[];
}) {
  const t = adminCategoriesSlaText[locale];
  return (
    <div className="grid min-w-[26rem] gap-2">
      {action ? <CategoryForm action={action} compact item={item} locale={locale} rows={rows} departments={departments} branches={branches} /> : null}
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

function CategoryForm({
  action,
  compact = false,
  item,
  locale,
  rows,
  departments,
  branches,
}: {
  action: AdminAction;
  compact?: boolean | undefined;
  item?: AdminCategory | undefined;
  locale: Locale;
  rows: AdminCategory[];
  departments: { id: string; nameEn: string; nameAr?: string | null }[];
  branches: { id: string; nameEn: string; nameAr?: string | null }[];
}) {
  const t = adminCategoriesSlaText[locale];
  return (
    <form action={action} className={compact ? 'flex flex-col gap-2' : 'flex flex-col gap-4 border-b border-border-subtle p-3'}>
      <div className="grid gap-2 md:grid-cols-5">
        <input name="id" type="hidden" value={item?.id ?? ''} />
        <input name="locale" type="hidden" value={locale} />
        <input name="returnTo" type="hidden" value="/admin/categories" />
        <TextField label={t.fields.code} name="code" value={item?.code} />
        <TextField label={t.fields.nameEn} name="nameEn" value={item?.nameEn} />
        <TextField label={t.fields.nameAr} name="nameAr" value={item?.nameAr} />
        <label className="grid gap-1 text-sm font-medium">
          {t.fields.department}
          <FormSelect
            defaultValue={item?.departmentId ?? ''}
            name="departmentId"
            options={departments.map((dep) => ({ label: localizedName(dep, locale), value: dep.id }))}
            placeholder={t.root}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {t.fields.branch}
          <FormSelect
            defaultValue={item?.branchId ?? ''}
            name="branchId"
            options={branches.map((b) => ({ label: localizedName(b, locale), value: b.id }))}
            placeholder={t.root}
          />
        </label>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="isExternal" value="true" defaultChecked={item?.isExternal ?? true} className="rounded border-line-subtle text-brand" />
          <span className="font-medium">CRM Complaint (Customer)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="isInternal" value="true" defaultChecked={item?.isInternal ?? false} className="rounded border-line-subtle text-brand" />
          <span className="font-medium">Internal (Staff Tasks)</span>
        </label>
        <div className="flex-1" />
        <Button size={compact ? 'sm' : 'default'} type="submit" variant={item ? 'outline' : 'default'}>{item ? t.actions.edit : t.actions.create}</Button>
      </div>
    </form>
  );
}

export function localizedName(item: { nameAr?: string | null; nameEn: string }, locale: Locale): string {
  return locale === 'ar' && item.nameAr ? item.nameAr : item.nameEn;
}
