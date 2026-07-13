import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { blockerReasonLabel, taskStatusLabel } from '../../../../../i18n/domain-labels';
import { managerControlRoomText } from '../../../../../i18n/staff-manager-control-room';
import { resolveLocale, staffShellText } from '../../../../../i18n/staff-shell';
import { formatDisplayDate, missingDisplay } from '../../../../../lib/locale-format';
import { localeHref } from '../../../../../lib/locale-href';
import { getManagerTaskDetailLoadResult } from '../../../../../lib/staff-manager-task-detail-api';

type Props = { cookieHeader?: string; fetchImpl?: typeof fetch; params: Promise<{ id: string }>; searchParams?: Promise<{ locale?: string | string[] }> };

export default async function ManagerTaskDetailPage({ cookieHeader, fetchImpl, params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(Array.isArray(query?.locale) ? query.locale[0] : query?.locale);
  const result = await getManagerTaskDetailLoadResult(id, {
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  });
  const t = managerControlRoomText[locale];
  if (result.status !== 'ready') {
    const message = result.status === 'denied' ? t.states.denied : result.status === 'not_found' ? t.states.notFound : t.states.detailError;
    return <Card dir={staffShellText[locale].dir}><CardContent className="p-4"><p className="rounded-sm border border-status-error bg-status-error/10 p-3 text-status-error" role="alert">{message}</p><BackLink locale={locale} /></CardContent></Card>;
  }
  const task = result.data;
  const date = (value: string) => `${formatDisplayDate(value, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: task.displayTimeZone })} (${task.displayTimeZone})`;
  return (
    <Card dir={staffShellText[locale].dir}>
      <CardHeader className="border-b border-border">
        <p className="text-xs text-muted-foreground"><bdi>{task.id}</bdi></p>
        <div className="flex flex-wrap items-start justify-between gap-3"><CardTitle>{task.title}</CardTitle><Badge variant="outline">{taskStatusLabel(locale, task.status)}</Badge></div>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Fact label={t.fields.assignee} value={task.assigneeName ?? missingDisplay(locale)} />
          <Fact label={t.fields.owner} value={task.ownerName ?? missingDisplay(locale)} />
          <Fact label={t.fields.branch} value={task.branchName ?? missingDisplay(locale)} />
          <Fact label={t.fields.due} value={date(task.dueAt)} />
          <Fact label={t.fields.updated} value={date(task.updatedAt)} />
        </dl>
        {task.nextAction ? <section className="rounded-sm border border-border bg-muted p-3"><h2 className="text-sm font-semibold">{t.fields.nextAction}</h2><p className="mt-1">{task.nextAction.what}</p><p className="mt-1 text-xs text-muted-foreground">{t.fields.nextOwner}: <bdi>{task.nextAction.whoName ?? task.nextAction.whoId}</bdi> · {date(task.nextAction.when)}</p></section> : null}
        {task.stuckReasons.length ? <p className="text-sm font-semibold text-status-warning">{t.fields.reasons}: {task.stuckReasons.map((reason) => blockerReasonLabel(locale, reason)).join(', ')}</p> : null}
        {task.links.length ? <div className="flex flex-wrap gap-2">{task.links.map((link) => link.entityType === 'COMPLAINT'
          ? <a className="rounded-sm border border-border px-3 py-2 text-sm font-semibold text-brand hover:underline" href={localeHref(`/complaints/${link.entityId}`, locale)} key={`${link.entityType}-${link.entityId}`}><bdi>{link.entityType}: {link.entityId}</bdi></a>
          : <Badge key={`${link.entityType}-${link.entityId}`} variant="outline"><bdi>{link.entityType}: {link.entityId}</bdi></Badge>)}</div> : null}
        <div className="flex flex-wrap gap-2">
          {task.capabilities.canOpenInteractive ? <a className="inline-flex min-h-11 items-center rounded-sm bg-brand px-4 text-sm font-semibold text-on-brand" href={localeHref(`/tasks/${task.id}`, locale)}>{t.interactiveDetail}</a> : null}
          <BackLink locale={locale} />
        </div>
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd><bdi>{value}</bdi></dd></div>;
}

function BackLink({ locale }: { locale: 'ar' | 'en' }) {
  return <a className="mt-3 inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-sm font-semibold" href={localeHref('/tasks/manager', locale)}>{managerControlRoomText[locale].back}</a>;
}
