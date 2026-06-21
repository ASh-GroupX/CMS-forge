import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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
  const parentName = new Map((options?.categories ?? []).map((category) => [category.id, category.nameEn]));

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
    <section className="overflow-x-auto rounded-md border bg-muted/30" aria-label={title}>
      <h3 className="border-b px-3 py-2 text-sm font-semibold">{title}</h3>
      {action ? <OptionForm action={action} itemType={itemType} locale={locale} rows={rows} /> : null}
      <Table className="min-w-[42rem]">
        <TableHeader className="bg-muted/40 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          <TableRow>{[...t.headers, t.actionHeader].map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? rows.map((row) => (
            <TableRow key={`${title}-${row.id}`}>
              <TableCell className="font-semibold">{row.code}</TableCell>
              <TableCell>{row.nameEn}</TableCell>
              <TableCell>{row.nameAr}</TableCell>
              <TableCell>{row.parentId ? parentName.get(row.parentId) ?? t.root : t.root}</TableCell>
              <TableCell>{action ? <OptionForm action={action} compact item={row} itemType={itemType} locale={locale} rows={rows} /> : null}</TableCell>
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
    <form action={action} className={compact ? 'grid min-w-[24rem] gap-2 md:grid-cols-4' : 'grid gap-2 border-b p-3 md:grid-cols-4'}>
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
      <select className="rounded-md border border-input bg-background px-3 py-2" defaultValue={value} name="parentId">
        <option value="">{t.root}</option>
        {rows.filter((row) => !row.parentId && row.id !== currentId).map((row) => <option key={row.id} value={row.id}>{row.nameEn}</option>)}
      </select>
    </label>
  );
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
    <section className="overflow-x-auto rounded-md border bg-muted/30" aria-label={t.sections.severities}>
      <h3 className="border-b px-3 py-2 text-sm font-semibold">{t.sections.severities}</h3>
      <p className="border-b px-3 py-2 text-sm text-muted-foreground">{t.severityNote}</p>
      <Table className="min-w-[24rem]">
        <TableHeader className="bg-muted/40 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          <TableRow>{t.headers.slice(0, 3).map((header) => <TableHead className="text-start" key={header}>{header}</TableHead>)}</TableRow>
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
