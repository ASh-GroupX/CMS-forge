import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { FormSelect } from '../ui/form-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { adminUsersText } from '../../i18n/staff-admin-users';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { ComplaintFormOption, ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';

type AdminAction = (formData: FormData) => void | Promise<void>;

export function AdminMasterDataOverview({
  branchAction,
  categoryAction,
  locale,
  options,
}: {
  branchAction?: AdminAction;
  categoryAction?: AdminAction;
  locale: Locale;
  options?: ComplaintFormOptions | null;
}) {
  const shell = staffShellText[locale];
  const t = adminUsersText[locale].masterData;
  const parentName = new Map((options?.categories ?? []).map((category) => [category.id, localizedName(category, locale)]));

  return (
    <Card aria-label={t.title} className="rounded-md shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <CardDescription className="mt-1 text-sm">{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        {options ? (
          <div className="grid gap-4 xl:grid-cols-3">
            <EditableOptionsTable action={branchAction} itemType="branch" locale={locale} rows={options.branches} title={t.sections.branches} />
            <EditableOptionsTable action={categoryAction} itemType="category" locale={locale} parentName={parentName} rows={options.categories} title={t.sections.categories} />
            <SeverityTable locale={locale} values={options.severities} />
          </div>
        ) : (
          <p className="rounded-sm border bg-muted/40 px-3 py-2 text-sm text-muted-foreground" role="alert">{t.unavailable}</p>
        )}
      </CardContent>
    </Card>
  );
}

function EditableOptionsTable({
  action,
  itemType,
  locale,
  parentName = new Map(),
  rows,
  title,
}: {
  action?: AdminAction | undefined;
  itemType: 'branch' | 'category';
  locale: Locale;
  parentName?: Map<string, string>;
  rows: ComplaintFormOption[];
  title: string;
}) {
  const t = adminUsersText[locale].masterData;
  return (
    <section className="overflow-x-auto rounded-sm border border-line-subtle bg-surface" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line-subtle bg-surface-raised px-3 py-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action ? (
          <details className="rounded-sm border border-line-subtle bg-surface px-2 py-1">
            <summary className="cursor-pointer text-sm font-semibold text-content-strong">{t.addValue}</summary>
            <OptionForm action={action} itemType={itemType} locale={locale} rows={rows} />
          </details>
        ) : null}
      </div>
      <Table className="min-w-[34rem]">
        <TableHeader className="bg-content-strong text-xs font-semibold text-brand-foreground">
          <TableRow>{[...t.headers, t.actionHeader].map((header) => <TableHead className="text-start text-brand-foreground" key={header}>{header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? rows.map((row) => (
            <TableRow key={`${title}-${row.id}`}>
              <TableCell className="font-semibold">{row.code}</TableCell>
              <TableCell>{localizedName(row, locale)}</TableCell>
              <TableCell>{row.nameAr}</TableCell>
              <TableCell>{row.parentId ? parentName.get(row.parentId) ?? t.root : t.root}</TableCell>
              <TableCell>{action ? (
                <details className="rounded-sm border border-line-subtle bg-surface-raised px-2 py-1">
                  <summary className="cursor-pointer text-sm font-semibold text-content-strong">{t.editValue}</summary>
                  <OptionForm action={action} compact item={row} itemType={itemType} locale={locale} rows={rows} />
                </details>
              ) : null}</TableCell>
            </TableRow>
          )) : (
            <TableRow><TableCell className="text-muted-foreground" colSpan={5}>{t.noRows}</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}

function OptionForm({
  action,
  compact = false,
  item,
  itemType,
  locale,
  rows,
}: {
  action: AdminAction;
  compact?: boolean;
  item?: ComplaintFormOption;
  itemType: 'branch' | 'category';
  locale: Locale;
  rows: ComplaintFormOption[];
}) {
  const t = adminUsersText[locale].masterData;
  const button = item ? t.edit : t.add;
  const key = item?.id ?? itemType;
  return (
    <form action={action} className={compact ? 'mt-2 grid min-w-[24rem] gap-2 md:grid-cols-4' : 'mt-2 grid gap-2 p-2 md:grid-cols-4'}>
      <input name="id" type="hidden" value={item?.id ?? ''} />
      <input name="itemType" type="hidden" value={itemType} />
      <input name="locale" type="hidden" value={locale} />
      <Field id={`${itemType}-${key}-code`} label={t.fields.code} name="code" value={item?.code} />
      <Field id={`${itemType}-${key}-nameEn`} label={t.fields.nameEn} name="nameEn" value={item?.nameEn} />
      <Field id={`${itemType}-${key}-nameAr`} label={t.fields.nameAr} name="nameAr" value={item?.nameAr} />
      {itemType === 'category' ? <ParentSelect currentId={item?.id} locale={locale} rows={rows} value={item?.parentId ?? ''} /> : null}
      <Button className={itemType === 'category' ? '' : 'md:col-start-4'} size={compact ? 'sm' : 'default'} type="submit" variant={item ? 'outline' : 'default'}>{button}</Button>
    </form>
  );
}

function ParentSelect({ currentId, locale, rows, value }: { currentId?: string | undefined; locale: Locale; rows: ComplaintFormOption[]; value: string }) {
  const t = adminUsersText[locale].masterData;
  return (
    <label className="grid gap-1 text-sm font-medium">
      {t.headers[3]}
      <FormSelect
        defaultValue={value}
        name="parentId"
        options={rows.filter((row) => !row.parentId && row.id !== currentId).map((row) => ({ label: localizedName(row, locale), value: row.id }))}
        placeholder={t.root}
      />
    </label>
  );
}

function localizedName(item: { nameAr?: string | null; nameEn: string }, locale: Locale): string {
  return locale === 'ar' && item.nameAr ? item.nameAr : item.nameEn;
}

function Field({ id, label, name, value = '' }: { id: string; label: string; name: string; value?: string | undefined }) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{label}</Label>
      <Input defaultValue={value} id={id} name={name} required />
    </div>
  );
}

function SeverityTable({ locale, values }: { locale: Locale; values: string[] }) {
  const t = adminUsersText[locale].masterData;
  return (
    <section className="overflow-x-auto rounded-sm border border-line-subtle bg-surface" aria-label={t.sections.severities}>
      <h3 className="border-b border-line-subtle bg-surface-raised px-3 py-2 text-sm font-semibold">{t.sections.severities}</h3>
      <p className="border-b border-line-subtle px-3 py-2 text-sm text-muted-foreground">{t.severityNote}</p>
      <Table className="min-w-[24rem]">
        <TableHeader className="bg-content-strong text-xs font-semibold text-brand-foreground">
          <TableRow>{t.headers.slice(0, 3).map((header) => <TableHead className="text-start text-brand-foreground" key={header}>{header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {values.map((value) => (
            <TableRow key={value}>
              <TableCell className="font-semibold">{value}</TableCell>
              <TableCell>{value}</TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
