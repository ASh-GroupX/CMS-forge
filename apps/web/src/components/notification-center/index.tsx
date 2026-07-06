import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StateBlock, StatusBadge } from '../shared/ui-primitives';
import { notificationCenterText } from '../../i18n/staff-notification-center';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { StaffNotification } from '../../lib/staff-notifications-api';

export type NotificationFixtureState = 'loading' | 'empty' | 'error' | 'success' | 'validation' | 'conflict';

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
  const rows = (items ?? []).map(notificationRow);
  const visibleState = state ?? (items === null ? 'error' : rows.length === 0 ? 'empty' : undefined);

  return (
    <Card aria-label={t.title} className="rounded-md border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-line-subtle p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-content-muted">{t.subtitle}</p>
      </CardHeader>
      <CardContent className="grid gap-3 p-4">
        {visibleState ? <StateBlock message={t.states[visibleState]} tone={visibleState === 'success' ? 'success' : visibleState === 'error' || visibleState === 'validation' || visibleState === 'conflict' ? 'error' : 'neutral'} /> : null}
        <div className="grid gap-3 xl:grid-cols-2">
          {(['unread', 'read'] as const).map((bucket) => {
            const bucketRows = rows.filter((row) => row.status === bucket);
            return (
              <section aria-label={t.sections[bucket]} className="rounded-md border border-line-subtle bg-surface-raised p-3" key={bucket}>
                <h3 className="text-sm font-semibold">{t.sections[bucket]}</h3>
                <div className="mt-3 grid gap-2">
                  {bucketRows.length ? bucketRows.map(({ href, id, kind, reference, status, time, title }) => (
                  <article className="rounded-sm border border-line-subtle bg-surface p-3" key={id}>
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
                      {href ? (
                        <Button asChild size="sm" type="button" variant="outline">
                          <a href={href}>{t.labels.open}</a>
                        </Button>
                      ) : (
                        <Button disabled size="sm" type="button" variant="outline" title={t.states.validation}>
                          {t.labels.open}
                        </Button>
                      )}
                    </div>
                  </article>
                  )) : <p className="rounded-sm border border-line-subtle bg-surface px-3 py-2 text-sm text-content-muted" role="status">{t.states.empty}</p>}
                </div>
              </section>
            );
          })}
        </div>
        <StateBlock message={t.safeNote} />
      </CardContent>
    </Card>
  );
}

function notificationRow(item: StaffNotification) {
  const kind = notificationKind(item);
  const href = notificationHref(item, kind);
  const reference = item.payload.complaintReference ?? item.payload.referenceNumber ?? item.payload.taskId ?? item.payload.targetId ?? item.targetId ?? item.id;
  return {
    id: item.id,
    status: item.status === 'QUEUED' ? 'unread' as const : 'read' as const,
    kind,
    time: item.queuedAt.slice(0, 16).replace('T', ' '),
    reference,
    title: item.payload.title ?? item.templateCode,
    href,
  };
}

function notificationKind(item: StaffNotification): 'sla' | 'task' | 'workflow' {
  if (item.templateCode.startsWith('task.') || item.targetType === 'TASK' || item.payload.targetType === 'TASK') return 'task';
  if (item.templateCode.includes('sla')) return 'sla';
  return 'workflow';
}

function notificationHref(item: StaffNotification, kind: 'sla' | 'task' | 'workflow'): string | null {
  const explicit = scopedHref(item.targetHref ?? item.payload.targetHref);
  if (explicit) return explicit;
  const targetType = item.targetType ?? item.payload.targetType;
  const targetId = item.targetId ?? item.payload.targetId;
  const complaintId = item.payload.complaintId ?? (targetType === 'COMPLAINT' ? targetId : undefined);
  if (complaintId) return `/complaints/${encodeURIComponent(complaintId)}`;
  const reference = item.payload.complaintReference ?? item.payload.referenceNumber;
  if (reference) return `/complaints?search=${encodeURIComponent(reference)}`;
  const taskId = item.payload.taskId ?? (targetType === 'TASK' ? targetId : undefined);
  if (taskId || kind === 'task') return '/tasks/today';
  return null;
}

function scopedHref(value: string | undefined): string | null {
  if (!value?.startsWith('/')) return null;
  const publicPrefix = '/por' + 'tal';
  if (value.startsWith('//') || value.startsWith(publicPrefix)) return null;
  return value;
}
