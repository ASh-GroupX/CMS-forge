import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notificationCenterText } from '../../i18n/staff-notification-center';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { StaffNotification } from '../../lib/staff-notifications-api';

export type NotificationPreviewState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';

const notifications = [
  ['unread', 'workflow', '2026-06-19 11:00', 'CMP-SCOPED-001'],
  ['read', 'sla', '2026-06-19 09:30', 'CMP-SCOPED-002'],
] as const;

export function NotificationCenter({
  items,
  locale,
  state,
}: {
  items?: StaffNotification[] | null | undefined;
  locale: Locale;
  state?: NotificationPreviewState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = notificationCenterText[locale];
  const rows = items ? items.map(notificationRow) : notifications.map(([status, kind, time, reference]) => ({ status, kind, time, reference, title: t.badges[kind] }));

  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-slate-600">{t.subtitle}</p>
      </CardHeader>
      <CardContent className="grid gap-3 p-4">
        {state ? (
          <p
            className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            role={state === 'success' || state === 'loading' ? 'status' : 'alert'}
          >
            {t.states[state]}
          </p>
        ) : null}
        <div className="grid gap-3 xl:grid-cols-2">
          {(['unread', 'read'] as const).map((bucket) => (
            <section aria-label={t.sections[bucket]} className="rounded-md border border-slate-200 bg-slate-50 p-3" key={bucket}>
              <h3 className="text-sm font-semibold">{t.sections[bucket]}</h3>
              <div className="mt-3 grid gap-2">
                {rows.filter((row) => row.status === bucket).map(({ kind, reference, status, time, title }) => (
                  <article className="rounded-sm border border-slate-200 bg-white p-3" key={reference}>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{t.badges[status]}</Badge>
                      <Badge variant="outline">{t.badges[kind]}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {t.labels.time}: {time}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {kind === 'task' ? t.labels.task : t.labels.complaint}: {reference}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" type="button" variant="outline">
                        {t.labels.open}
                      </Button>
                      {status === 'unread' ? (
                        <Button size="sm" type="button" variant="outline">
                          {t.labels.markRead}
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
        <p className="rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{t.safeNote}</p>
      </CardContent>
    </Card>
  );
}

function notificationRow(item: StaffNotification) {
  return {
    status: item.status === 'QUEUED' ? 'unread' as const : 'read' as const,
    kind: item.templateCode.startsWith('task.') ? 'task' as const : 'workflow' as const,
    time: item.queuedAt.slice(0, 16).replace('T', ' '),
    reference: item.payload.taskId ?? item.id,
    title: item.payload.title ?? item.templateCode,
  };
}
