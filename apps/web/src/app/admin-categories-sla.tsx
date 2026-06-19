import React from 'react';
import { adminCategoriesSlaText } from '../i18n/staff-admin-categories-sla';
import type { Locale } from '../i18n/staff-shell';

export type AdminConfigPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';

const categories = [['Service quality', 'Repair delay', 'active'], ['Vehicle issue', 'Engine noise', 'active']] as const;
const severities = [['Critical', '2 hours default', 'active'], ['High', '8 hours default', 'active'], ['Medium', '24 hours default', 'active'], ['Low', '72 hours default', 'active']] as const;
const policies = [['Submitted review', 'Critical', '80% warning', '2 hours', 'global'], ['Investigation', 'High', '80% warning', '8 hours', 'branch']] as const;

export function AdminCategoriesSla({ locale, state }: { locale: Locale; state?: AdminConfigPreviewState | undefined }) {
  const t = adminCategoriesSlaText[locale];
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
        </div>
        <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground" type="button">{t.actions.create}</button>
      </div>
      {state ? <p className="m-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role={state === 'success' || state === 'loading' ? 'status' : 'alert'}>{t.states[state]}</p> : null}
      <div className="grid gap-3 p-4 xl:grid-cols-2">
        <SettingsTable headers={t.categoryHeaders} rows={categories} title={t.sections.categories} locale={locale} />
        <SettingsTable headers={t.severityHeaders} rows={severities} title={t.sections.severities} locale={locale} />
        <section className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50 xl:col-span-2" aria-label={t.sections.sla}>
          <h3 className="border-b border-slate-200 px-3 py-2 text-sm font-semibold">{t.sections.sla}</h3>
          <table className="min-w-[54rem] w-full border-collapse text-sm">
            <thead className="bg-white text-xs font-semibold uppercase tracking-normal text-slate-600">
              <tr>{t.slaHeaders.map((header) => <th className="border-b border-slate-200 px-3 py-2 text-start" key={header}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {policies.map(([stage, severity, warning, deadline, scope]) => (
                <tr className="border-b border-slate-100" key={`${stage}-${severity}`}>
                  {[stage, severity, warning, deadline].map((value) => <td className="px-3 py-2" key={value}>{value}</td>)}
                  <td className="px-3 py-2"><Badge>{scope === 'global' ? t.badges.global : t.badges.branch}</Badge></td>
                  <td className="flex gap-2 px-3 py-2"><AdminButtons locale={locale} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <p className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 xl:col-span-2">{t.slaNote}</p>
      </div>
    </section>
  );
}

function SettingsTable({ headers, locale, rows, title }: { headers: readonly string[]; locale: Locale; rows: readonly (readonly [string, string, 'active' | 'inactive'])[]; title: string }) {
  const t = adminCategoriesSlaText[locale];
  return (
    <section className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50" aria-label={title}>
      <h3 className="border-b border-slate-200 px-3 py-2 text-sm font-semibold">{title}</h3>
      <table className="min-w-[36rem] w-full border-collapse text-sm">
        <thead className="bg-white text-xs font-semibold uppercase tracking-normal text-slate-600">
          <tr>{headers.map((header) => <th className="border-b border-slate-200 px-3 py-2 text-start" key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>{rows.map(([primary, secondary, status]) => <tr className="border-b border-slate-100" key={`${title}-${primary}`}><td className="px-3 py-2 font-semibold">{primary}</td><td className="px-3 py-2">{secondary}</td><td className="px-3 py-2"><Badge>{t.badges[status]}</Badge></td><td className="flex gap-2 px-3 py-2"><AdminButtons locale={locale} /></td></tr>)}</tbody>
      </table>
    </section>
  );
}

function AdminButtons({ locale }: { locale: Locale }) {
  const t = adminCategoriesSlaText[locale];
  return <><button className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs font-semibold" type="button">{t.actions.edit}</button><button className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs font-semibold" type="button">{t.actions.deactivate}</button></>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{children}</span>;
}
