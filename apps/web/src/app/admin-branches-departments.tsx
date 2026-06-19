import React from 'react';
import { adminBranchesText } from '../i18n/staff-admin-branches';
import type { Locale } from '../i18n/staff-shell';

export type AdminBranchesPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';

const branchRows = [
  ['MAIN', 'Main branch', 'active'],
  ['SERVICE', 'Service branch', 'inactive'],
] as const;

const departmentRows = [
  ['CR', 'Customer relations', 'active'],
  ['SERVICE', 'Service desk', 'active'],
] as const;

export function AdminBranchesDepartments({
  locale,
  state,
}: {
  locale: Locale;
  state?: AdminBranchesPreviewState | undefined;
}) {
  const t = adminBranchesText[locale];

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
        </div>
        <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground" type="button">
          {t.actions.create}
        </button>
      </div>
      {state ? (
        <p className="m-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role={state === 'success' || state === 'loading' ? 'status' : 'alert'}>
          {t.states[state]}
        </p>
      ) : null}
      <div className="grid gap-3 p-4 xl:grid-cols-2">
        <AdminTable locale={locale} rows={branchRows} title={t.sections.branches} />
        <AdminTable locale={locale} rows={departmentRows} title={t.sections.departments} />
      </div>
    </section>
  );
}

function AdminTable({ locale, rows, title }: { locale: Locale; rows: readonly (readonly [string, string, 'active' | 'inactive'])[]; title: string }) {
  const t = adminBranchesText[locale];
  return (
    <section className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50" aria-label={title}>
      <h3 className="border-b border-slate-200 px-3 py-2 text-sm font-semibold">{title}</h3>
      <table className="min-w-[34rem] w-full border-collapse text-sm">
        <thead className="bg-white text-xs font-semibold uppercase tracking-normal text-slate-600">
          <tr>
            {t.headers.map((header) => (
              <th className="border-b border-slate-200 px-3 py-2 text-start" key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([code, name, status]) => (
            <tr className="border-b border-slate-100" key={`${title}-${code}`}>
              <td className="px-3 py-2 font-semibold">{code}</td>
              <td className="px-3 py-2">{name}</td>
              <td className="px-3 py-2">
                <span className="rounded-sm bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{t.badges[status]}</span>
              </td>
              <td className="flex gap-2 px-3 py-2">
                <button className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs font-semibold" type="button">{t.actions.edit}</button>
                <button className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs font-semibold" type="button">{t.actions.deactivate}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
