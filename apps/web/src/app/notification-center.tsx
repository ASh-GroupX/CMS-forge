import React from 'react';
import { notificationCenterText } from '../i18n/staff-notification-center';
import type { Locale } from '../i18n/staff-shell';

export type NotificationPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';

const notifications = [
  ['unread', 'workflow', 'Workflow update placeholder', '2026-06-19 11:00', 'CMP-SCOPED-001'],
  ['read', 'sla', 'SLA warning placeholder', '2026-06-19 09:30', 'CMP-SCOPED-002'],
] as const;

export function NotificationCenter({ locale, state }: { locale: Locale; state?: NotificationPreviewState | undefined }) {
  const t = notificationCenterText[locale];
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>
      {state ? <p className="m-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role={state === 'success' || state === 'loading' ? 'status' : 'alert'}>{t.states[state]}</p> : null}
      <div className="grid gap-3 p-4 xl:grid-cols-2">
        {(['unread', 'read'] as const).map((bucket) => (
          <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={t.sections[bucket]} key={bucket}>
            <h3 className="text-sm font-semibold">{t.sections[bucket]}</h3>
            <div className="mt-3 grid gap-2">
              {notifications.filter(([status]) => status === bucket).map(([status, kind, title, time, reference]) => (
                <article className="rounded-sm border border-slate-200 bg-white p-3" key={reference}>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{t.badges[status]}</Badge>
                    <Badge>{t.badges[kind]}</Badge>
                  </div>
                  <p className="mt-2 text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs text-slate-600">{t.labels.time}: {time}</p>
                  <p className="mt-1 text-xs text-slate-600">{t.labels.complaint}: {reference}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="rounded-sm border border-slate-300 px-2 py-1 text-xs font-semibold" type="button">{t.labels.open}</button>
                    {status === 'unread' ? <button className="rounded-sm border border-slate-300 px-2 py-1 text-xs font-semibold" type="button">{t.labels.markRead}</button> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        <p className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 xl:col-span-2">{t.safeNote}</p>
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">{children}</span>;
}
