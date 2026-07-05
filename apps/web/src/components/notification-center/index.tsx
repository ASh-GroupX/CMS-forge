import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StateBlock, StatusBadge } from '../shared/ui-primitives';
import { notificationCenterText } from '../../i18n/staff-notification-center';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { StaffNotification } from '../../lib/staff-notifications-api';

export type NotificationFixtureState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';

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
  state?: NotificationFixtureState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = notificationCenterText[locale];
  const rows = items ? items.map(notificationRow) : notifications.map(([status, kind, time, reference]) => ({ status, kind, time, reference, title: t.badges[kind] }));

  return (
    <Card aria-label={t.title} className="rounded-md border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-line-subtle p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-content-muted">{t.subtitle}</p>
      </CardHeader>
      <CardContent className="grid gap-3 p-4">
        {state ? <StateBlock message={t.states[state]} tone={state === 'success' ? 'success' : state === 'error' || state === 'validation' || state === 'conflict' ? 'error' : 'neutral'} /> : null}
        <div className="grid gap-3 xl:grid-cols-2">
          {(['unread', 'read'] as const).map((bucket) => (
            <section aria-label={t.sections[bucket]} className="rounded-md border border-line-subtle bg-surface-raised p-3" key={bucket}>
              <h3 className="text-sm font-semibold">{t.sections[bucket]}</h3>
              <div className="mt-3 grid gap-2">
                {rows.filter((row) => row.status === bucket).map(({ kind, reference, status, time, title }) => (
                  <article className="rounded-sm border border-line-subtle bg-surface p-3" key={reference}>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={status === 'unread' ? 'warning' : 'neutral'}>{t.badges[status]}</StatusBadge>
                      <StatusBadge tone={kind === 'task' ? 'info' : 'brand'}>{t.badges[kind]}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs text-content-muted">
                      {t.labels.time}: {time}
                    </p>
                    <p className="mt-1 text-xs text-content-muted">
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
        <StateBlock message={t.safeNote} />
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
