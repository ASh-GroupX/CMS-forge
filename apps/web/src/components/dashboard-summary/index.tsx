import { ArrowUpRight, Bell, CalendarClock, CircleAlert, Plus } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StateBlock, type PrimitiveTone } from '../shared/ui-primitives';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { modernUiText } from '../../i18n/staff-modern-ui';
import type { StaffDashboardSummary } from '../../lib/staff-dashboard-api';
import type { StaffNotification } from '../../lib/staff-notifications-api';
import type { StaffSessionPrincipal } from '../../lib/staff-session-api';
import type { EmployeeTodayTasks, ManagerControlRoomTasks } from '../../lib/staff-tasks-api';
import { localeHref } from '../../lib/locale-href';

type SummaryKey = 'open' | 'overdue' | 'warnings' | 'closed' | 'averageTat';
type MetricItem = { description: string; href: string; label: string; tone?: PrimitiveTone; value: string };

const VALUE_TONE: Record<SummaryKey, PrimitiveTone | undefined> = { open: undefined, overdue: 'danger', warnings: 'warning', closed: undefined, averageTat: 'brand' };
const METRIC_HREF: Record<SummaryKey, string> = {
  open: '/complaints', overdue: '/complaints?sla=BREACHED', warnings: '/complaints?sla=WARNING', closed: '/complaints?status=CLOSED', averageTat: '/reports',
};
const SECONDARY_KEYS: readonly SummaryKey[] = ['overdue', 'warnings', 'closed', 'averageTat'];

export function DashboardSummary({ data, locale, manager, notifications, principal, tasks }: {
  data: StaffDashboardSummary | null;
  locale: Locale;
  manager?: ManagerControlRoomTasks | null;
  notifications?: StaffNotification[] | null;
  principal?: StaffSessionPrincipal | null;
  tasks?: EmployeeTodayTasks | null;
}) {
  const shell = staffShellText[locale];
  const t = shell.dashboard;
  const modern = modernUiText[locale].dashboard;
  const values = data ? valuesFromSummary(locale, data) : null;
  const name = principal ? (locale === 'ar' ? principal.nameAr : principal.nameEn) : '';
  const canCreate = principal?.permissions.includes('COMPLAINT_CREATE') ?? false;
  const urgent = tasks ? { overdue: tasks.overdue.length + tasks.overduePromises.length, dueToday: tasks.dueToday.length } : null;

  return (
    <div className="grid gap-5" dir={shell.dir}>
      <header className="flex flex-col gap-4 rounded-xl bg-content-strong px-5 py-6 text-brand-foreground shadow-md md:flex-row md:items-end md:justify-between md:px-7">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-brand-foreground/70">{t.title}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{modern.greeting.replace('{name}', name || shell.auth.signedIn)}</h2>
          <p className="mt-2 text-sm leading-6 text-brand-foreground/70">{modern.scope}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary"><a href={`/tasks/today?locale=${locale}`}>{modern.openMyWork}<ArrowUpRight aria-hidden="true" className="ms-2 size-4" /></a></Button>
          {canCreate ? <Button asChild><a href={`/complaints/new?locale=${locale}`}><Plus aria-hidden="true" className="me-2 size-4" />{modern.createComplaint}</a></Button> : null}
        </div>
      </header>

      <section aria-labelledby="attention-heading" className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,.75fr)]">
        <Card className="rounded-xl border-line-subtle shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle id="attention-heading" className="text-base">{modern.attention}</CardTitle>
            <Button asChild size="sm" variant="ghost"><a href={`/tasks/today?locale=${locale}`}>{modern.viewAll}</a></Button>
          </CardHeader>
          <CardContent>
            {urgent ? <div className="grid gap-3 sm:grid-cols-2">
              <AttentionItem count={urgent.overdue} href={`/tasks/today?locale=${locale}#overdue`} icon={<CircleAlert className="size-5" />} label={modern.overdue} tone="danger" />
              <AttentionItem count={urgent.dueToday} href={`/tasks/today?locale=${locale}#due-today`} icon={<CalendarClock className="size-5" />} label={modern.dueToday} tone="warning" />
            </div> : <StateBlock message={modern.noAttention} />}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-line-subtle shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">{modern.recentUpdates}</CardTitle>
            <Button asChild size="sm" variant="ghost"><a href={`/notifications?locale=${locale}`}>{modern.viewAll}</a></Button>
          </CardHeader>
          <CardContent className="grid gap-1">
            {notifications?.length ? notifications.slice(0, 8).map((item) => <NotificationItem item={item} key={item.id} locale={locale} fallback={modern.recordUpdate} />) : <StateBlock message={modern.noUpdates} />}
          </CardContent>
        </Card>
      </section>

      <section aria-label={t.title} className="grid gap-3">
        {data === null ? <StateBlock message={t.states.error} tone="error" /> : null}
        {data !== null && Object.values(data).every((value) => value === 0) ? <StateBlock message={t.states.empty} /> : null}
        {values ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.15fr_repeat(4,1fr)]">
          <MetricCard item={metric('open', t, values)} locale={locale} primary />
          {SECONDARY_KEYS.map((key) => <MetricCard item={metric(key, t, values)} key={key} locale={locale} />)}
        </div> : null}
      </section>

      {manager?.workloadByAssignee.length ? <Card className="rounded-xl border-line-subtle shadow-sm">
        <CardHeader><CardTitle className="text-base">{modern.teamWorkload}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {manager.workloadByAssignee.slice(0, 8).map((row) => <a className="flex min-h-12 items-center justify-between rounded-md border border-line-subtle px-3 py-2 hover:bg-surface-raised" href={`/tasks/manager?locale=${locale}`} key={row.assigneeId}><bdi className="truncate text-sm font-semibold">{row.assigneeName ?? shell.workQueue.unassigned}</bdi><Badge variant="secondary">{row.count} {modern.assignedItems}</Badge></a>)}
        </CardContent>
      </Card> : null}
    </div>
  );
}

function AttentionItem({ count, href, icon, label, tone }: { count: number; href: string; icon: React.ReactNode; label: string; tone: 'danger' | 'warning' }) {
  return <a className="flex min-h-20 items-center gap-3 rounded-lg border border-line-subtle bg-surface-raised p-4 hover:border-line-strong" href={href}><span className={tone === 'danger' ? 'text-status-error' : 'text-status-warning'} aria-hidden="true">{icon}</span><span><strong className="block text-2xl tabular-nums">{count}</strong><span className="text-sm text-content-muted">{label}</span></span><ArrowUpRight aria-hidden="true" className="ms-auto size-4 text-content-subtle" /></a>;
}

function NotificationItem({ fallback, item, locale }: { fallback: string; item: StaffNotification; locale: Locale }) {
  const href = notificationHref(item);
  const title = item.payload.title ?? item.payload.message ?? fallback;
  const time = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.queuedAt));
  const content = <><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-brand"><Bell aria-hidden="true" className="size-4" /></span><span className="min-w-0"><bdi className="block truncate text-sm font-semibold">{title}</bdi><time className="text-xs text-content-muted" dateTime={item.queuedAt}>{time}</time></span></>;
  return href ? <a className="flex min-h-12 items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-raised" href={localeHref(href, locale)}>{content}</a> : <div className="flex min-h-12 items-center gap-3 px-2 py-2">{content}</div>;
}

function notificationHref(item: StaffNotification): string | null {
  const explicit = item.targetHref ?? item.payload.targetHref ?? item.payload.href;
  if (explicit?.startsWith('/') && !explicit.startsWith('//') && !explicit.startsWith('/portal')) return explicit;
  const complaintId = item.payload.complaintId ?? (item.targetType === 'COMPLAINT' ? item.targetId : undefined);
  if (complaintId) return `/complaints/${encodeURIComponent(complaintId)}`;
  const taskId = item.payload.taskId ?? (item.targetType === 'TASK' ? item.targetId : undefined);
  return taskId ? `/tasks/${encodeURIComponent(taskId)}` : null;
}

export function DashboardSummaryLoading({ locale }: { locale: Locale }) {
  const t = staffShellText[locale].dashboard;
  return <div className="grid gap-5" dir={staffShellText[locale].dir} role="status" aria-label={t.states.loading}><Skeleton className="h-44 rounded-xl" /><div className="grid gap-3 lg:grid-cols-2"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton className="h-32 rounded-xl" key={index} />)}</div></div>;
}

function metric(key: SummaryKey, t: typeof staffShellText[Locale]['dashboard'], values: Record<SummaryKey, string>): MetricItem {
  const [label, description] = t.cards[key];
  const tone = VALUE_TONE[key];
  return { description, href: METRIC_HREF[key], label, ...(tone ? { tone } : {}), value: values[key] };
}

function MetricCard({ item, locale, primary = false }: { item: MetricItem; locale: Locale; primary?: boolean }) {
  const valueClass = item.tone === 'brand' ? 'text-brand' : item.tone === 'danger' ? 'text-status-error' : item.tone === 'warning' ? 'text-status-warning' : 'text-content-strong';
  return <Card className={`rounded-xl border-line-subtle shadow-sm ${primary ? 'bg-content-strong text-brand-foreground' : ''}`}><a className="block h-full rounded-xl focus:outline-none focus:ring-2 focus:ring-brand" href={localeHref(item.href, locale)}><CardContent className="p-4"><p className={`text-sm font-medium ${primary ? 'text-brand-foreground/70' : 'text-content-muted'}`}>{item.label}</p><p className={`mt-3 text-3xl font-semibold tracking-tight ${primary ? 'text-brand-foreground' : valueClass}`}>{item.value}</p><p className={`mt-1 text-xs leading-5 ${primary ? 'text-brand-foreground/65' : 'text-content-muted'}`}>{item.description}</p></CardContent></a></Card>;
}

function valuesFromSummary(locale: Locale, summary: StaffDashboardSummary): Record<SummaryKey, string> {
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return { open: format.format(summary.openComplaints), overdue: format.format(summary.overdueComplaints), warnings: format.format(summary.slaWarningComplaints), closed: format.format(summary.closedComplaints), averageTat: format.format(Math.round((summary.averageTatHours / 24) * 10) / 10) };
}
