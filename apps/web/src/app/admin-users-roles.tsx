import React from 'react';
import { adminUsersText } from '../i18n/staff-admin-users';
import type { Locale } from '../i18n/staff-shell';
import type { AdminConfigPreviewState } from './admin-categories-sla';

const rows = [
  ['Staff user placeholder', 'CR Officer', 'Main branch', 'active'],
  ['Manager user placeholder', 'CR Manager', 'Service branch', 'inactive'],
] as const;

export function AdminUsersRoles({ locale, state }: { locale: Locale; state?: AdminConfigPreviewState | undefined }) {
  const t = adminUsersText[locale];

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
      <div className="overflow-x-auto p-4">
        <table className="min-w-[50rem] w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-normal text-slate-600">
            <tr>
              {t.headers.map((header) => (
                <th className="border-b border-slate-200 px-3 py-2 text-start" key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([user, role, branch, status]) => (
              <tr className="border-b border-slate-100" key={user}>
                <td className="px-3 py-2 font-semibold">{user}</td>
                <td className="px-3 py-2">{role}</td>
                <td className="px-3 py-2">{branch}</td>
                <td className="px-3 py-2">
                  <span className="rounded-sm bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{t.badges[status]}</span>
                </td>
                <td className="flex flex-wrap gap-2 px-3 py-2">
                  <button className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs font-semibold" type="button">{t.actions.edit}</button>
                  <button className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs font-semibold" type="button">{t.actions.deactivate}</button>
                  <button className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs font-semibold" type="button">{t.actions.reset}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role="status">
          {t.resetMessage}
        </p>
      </div>
    </section>
  );
}
