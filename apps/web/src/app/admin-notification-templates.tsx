import React from 'react';
import { adminNotificationTemplatesText } from '../i18n/staff-admin-notification-templates';
import type { Locale } from '../i18n/staff-shell';
import type { AdminConfigPreviewState } from './admin-categories-sla';

const rows = [
  ['Complaint created', 'Email, in-app', 'Arabic + English', 'active'],
  ['SLA warning', 'In-app, SMS-ready', 'Arabic + English', 'inactive'],
] as const;

export function AdminNotificationTemplates({ locale, state }: { locale: Locale; state?: AdminConfigPreviewState | undefined }) {
  const t = adminNotificationTemplatesText[locale];
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>
      {state ? <p className="m-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role={state === 'success' || state === 'loading' ? 'status' : 'alert'}>{t.states[state]}</p> : null}
      <div className="grid gap-3 p-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
        <section className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50" aria-label={t.title}>
          <table className="min-w-[48rem] w-full border-collapse text-sm">
            <thead className="bg-white text-xs font-semibold uppercase tracking-normal text-slate-600">
              <tr>{t.headers.map((header) => <th className="border-b border-slate-200 px-3 py-2 text-start" key={header}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map(([event, channels, languages, status]) => (
                <tr className="border-b border-slate-100" key={event}>
                  <td className="px-3 py-2 font-semibold">{event}</td>
                  <td className="px-3 py-2">{channels}</td>
                  <td className="px-3 py-2">{languages}</td>
                  <td className="px-3 py-2"><Badge>{t.badges[status]}</Badge></td>
                  <td className="flex flex-wrap gap-2 px-3 py-2">
                    <button className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs font-semibold" type="button">{t.actions.edit}</button>
                    <button className="rounded-sm border border-slate-300 bg-white px-2 py-1 text-xs font-semibold" type="button">{status === 'active' ? t.actions.deactivate : t.actions.activate}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <aside className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.previewTitle}>
          <h3 className="text-sm font-semibold">{t.previewTitle}</h3>
          <dl className="mt-3 grid gap-2 text-sm">
            <div><dt className="font-semibold text-slate-600">{t.headers[0]}</dt><dd>{t.preview.event}</dd></div>
            <div><dt className="font-semibold text-slate-600">{t.headers[1]}</dt><dd>{t.preview.channel}</dd></div>
          </dl>
          <p className="mt-3 text-sm">{t.preview.english}</p>
          <p className="mt-2 text-sm">{t.preview.arabic}</p>
          <h4 className="mt-3 text-xs font-semibold uppercase tracking-normal text-slate-600">{t.placeholdersTitle}</h4>
          <div className="mt-2 flex flex-wrap gap-2">{t.placeholders.map((placeholder) => <code className="rounded-sm bg-white px-2 py-1 text-xs" key={placeholder}>{placeholder}</code>)}</div>
          <p className="mt-3 rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">{t.preview.note}</p>
        </aside>
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{children}</span>;
}
