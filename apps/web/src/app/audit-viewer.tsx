import React from 'react';
import { auditViewerText } from '../i18n/staff-audit-viewer';
import type { Locale } from '../i18n/staff-shell';
import type { AdminConfigPreviewState } from './admin-categories-sla';

const rows = [
  ['2026-06-19 10:30', 'System actor placeholder', 'CONFIG_UPDATED', 'Branch placeholder', 'corr-placeholder-001', 'config'],
  ['2026-06-19 10:45', 'Staff actor placeholder', 'SECURITY_DENIED', 'Session placeholder', 'corr-placeholder-002', 'security'],
] as const;

export function AuditViewer({ locale, state }: { locale: Locale; state?: AdminConfigPreviewState | undefined }) {
  const t = auditViewerText[locale];
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
        </div>
        <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground" type="button">{t.filters.export}</button>
      </div>
      {state ? <p className="m-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role={state === 'success' || state === 'loading' ? 'status' : 'alert'}>{t.states[state]}</p> : null}
      <form className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
        {(['actor', 'action', 'target', 'date', 'correlationId'] as const).map((field) => (
          <label className="grid gap-1 text-sm font-medium" key={field}>
            {t.filters[field]}
            <input className="rounded-sm border border-slate-300 px-3 py-2" name={field} type={field === 'date' ? 'date' : 'text'} />
          </label>
        ))}
        <button className="rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm font-semibold xl:col-span-5" type="button">{t.filters.apply}</button>
      </form>
      <div className="overflow-x-auto px-4 pb-4">
        <table className="min-w-[58rem] w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-600">
            <tr>{t.headers.map((header) => <th className="border-b border-slate-200 px-3 py-2 text-start" key={header}>{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(([time, actor, action, target, correlation, kind]) => (
              <tr className="border-b border-slate-100" key={correlation}>
                <td className="px-3 py-2">{time}</td>
                <td className="px-3 py-2">{actor}</td>
                <td className="px-3 py-2"><span className="rounded-sm bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{t.badges[kind]}</span> {action}</td>
                <td className="px-3 py-2">{target}</td>
                <td className="px-3 py-2 font-mono text-xs">{correlation}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{t.safeNote}</p>
      </div>
    </section>
  );
}
