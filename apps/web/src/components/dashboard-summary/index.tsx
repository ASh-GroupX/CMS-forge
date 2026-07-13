import { ArrowLeft, Bell, CalendarClock, CheckCircle2, CircleAlert, Clock3, Gauge, Inbox, Plus, Send, UsersRound } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StateBlock } from '../shared/ui-primitives';
import { modernUiText } from '../../i18n/staff-modern-ui';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { StaffDashboardSummary } from '../../lib/staff-dashboard-api';
import type { StaffNotification } from '../../lib/staff-notifications-api';
import type { StaffSessionPrincipal } from '../../lib/staff-session-api';
import type { EmployeeTodayTasks, ManagerControlRoomTasks } from '../../lib/staff-tasks-api';
import { localeHref } from '../../lib/locale-href';

type Tone = 'danger' | 'warning' | 'brand' | 'success';
type Attention = { count: number; detail: string; href: string; icon: React.ReactNode; label: string; tone: Tone };
const TONE_CLASS: Record<Tone, string> = { danger: 'bg-status-error/10 text-status-error', warning: 'bg-status-warning/10 text-status-warning', brand: 'bg-brand/10 text-brand', success: 'bg-status-success/10 text-status-success' };

export function DashboardSummary({ data, locale, manager, notifications, principal, tasks }: {
  data: StaffDashboardSummary | null;
  locale: Locale;
  manager?: ManagerControlRoomTasks | null;
  notifications?: StaffNotification[] | null;
  principal?: StaffSessionPrincipal | null;
  tasks?: EmployeeTodayTasks | null;
}) {
  const shell = staffShellText[locale];
  const t = modernUiText[locale].dashboard;
  const attention = attentionItems(data, tasks, locale, t);
  const canCreate = principal?.permissions.includes('COMPLAINT_CREATE') ?? false;
  const empty = data !== null && tasks != null && Object.values(data).every((value) => value === 0) && Object.values(tasks).every((items) => items.length === 0);

  if (data === null && tasks === null) return <div dir={shell.dir}><StateBlock message={shell.dashboard.states.error} tone="error" /></div>;

  return <div className="grid gap-4" dir={shell.dir}>
    {empty ? <StateBlock message={shell.dashboard.states.empty} /> : null}
    <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,1fr)]" aria-label={t.attention}>
      <Card className="overflow-hidden rounded-xl border-line-subtle shadow-sm"><PanelHeader href={`/tasks/today?locale=${locale}`} title={t.attention} viewAll={t.viewAll} /><CardContent className="grid p-0 sm:grid-cols-2">
        <div className="divide-y divide-line-subtle border-e border-line-subtle">{attention.slice(0, 3).map((item) => <AttentionRow item={item} key={item.label} />)}</div>
        <div className="divide-y divide-line-subtle">{attention.slice(3).map((item) => <AttentionRow item={item} key={item.label} />)}</div>
      </CardContent></Card>
      <Card className="overflow-hidden rounded-xl border-line-subtle shadow-sm"><PanelHeader href={`/reports?locale=${locale}`} title={t.mainIndicators} viewAll={t.viewAll} /><CardContent className="grid gap-px bg-line-subtle p-0 sm:grid-cols-2">
        <Metric icon={<Clock3 className="size-5" />} label={shell.dashboard.cards.averageTat[0]} tone="brand" value={formatDays(data?.averageTatHours, locale)} />
        <Metric icon={<CheckCircle2 className="size-5" />} label={shell.dashboard.cards.closed[0]} tone="success" value={formatNumber(data?.closedComplaints, locale)} />
        <Metric icon={<Bell className="size-5" />} label={t.updatesShown} tone="brand" value={formatNumber(notifications?.length, locale)} />
        <Metric icon={<Gauge className="size-5" />} label={shell.dashboard.cards.open[0]} tone="warning" value={formatNumber(data?.openComplaints, locale)} />
      </CardContent></Card>
    </section>

    <section className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,1fr)]">
      <Card className="overflow-hidden rounded-xl border-line-subtle shadow-sm"><PanelHeader href={`/notifications?locale=${locale}`} title={t.recentUpdates} viewAll={t.viewAll} /><CardContent className="divide-y divide-line-subtle p-0">
        {notifications?.length ? notifications.slice(0, 5).map((item) => <ActivityRow item={item} key={item.id} locale={locale} fallback={t.recordUpdate} />) : <StateBlock className="m-4" message={t.noUpdates} />}
      </CardContent></Card>
      <Card className="overflow-hidden rounded-xl border-line-subtle shadow-sm"><PanelHeader href={`/tasks/manager?locale=${locale}`} title={t.teamWorkload} viewAll={t.viewAll} /><CardContent className="p-0">
        {manager?.workloadByAssignee.length ? <TeamRows locale={locale} manager={manager} unassigned={shell.workQueue.unassigned} unit={t.openTasks} /> : <StateBlock className="m-4" message={t.noTeamData} />}
      </CardContent></Card>
    </section>

    <footer className="flex flex-wrap justify-center gap-3 pt-1"><Button asChild size="lg"><a href={`/tasks/today?locale=${locale}`}><Send aria-hidden="true" className="me-2 size-5" />{t.openMyWork}</a></Button>{canCreate ? <Button asChild size="lg" variant="outline"><a href={`/complaints/new?locale=${locale}`}><Plus aria-hidden="true" className="me-2 size-5" />{t.createComplaint}</a></Button> : null}</footer>
  </div>;
}

function PanelHeader({ href, title, viewAll }: { href: string; title: string; viewAll: string }) { return <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-line-subtle px-5 py-4"><CardTitle className="text-base font-bold">{title}</CardTitle><Button asChild className="h-8 px-2 text-brand" size="sm" variant="ghost"><a href={href}>{viewAll}<ArrowLeft aria-hidden="true" className="ms-1 size-4" /></a></Button></CardHeader>; }
function AttentionRow({ item }: { item: Attention }) { return <a className="grid min-h-[4.7rem] grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-3 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand" href={item.href}><span className={`grid size-10 place-items-center rounded-lg ${TONE_CLASS[item.tone]}`} aria-hidden="true">{item.icon}</span><span className="min-w-0"><span className="block text-sm font-bold">{item.count} {item.label}</span><span className="block truncate text-xs text-content-muted">{item.detail}</span></span><CircleAlert aria-hidden="true" className={`size-4 ${item.tone === 'danger' ? 'text-status-error' : 'text-status-warning'}`} /></a>; }
function Metric({ icon, label, tone, value }: { icon: React.ReactNode; label: string; tone: Tone; value: string }) { return <div className="flex min-h-[7.1rem] items-center gap-3 bg-surface p-4"><span className={`grid size-11 place-items-center rounded-full ${TONE_CLASS[tone]}`} aria-hidden="true">{icon}</span><div><p className="text-xs text-content-muted">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{value}</p></div></div>; }
function ActivityRow({ fallback, item, locale }: { fallback: string; item: StaffNotification; locale: Locale }) {
  const href = notificationHref(item); const title = item.payload.title ?? fallback; const message = item.payload.message ?? item.payload.referenceNumber ?? item.payload.complaintReference ?? fallback; const time = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.queuedAt));
  const content = <><span className={`grid size-9 shrink-0 place-items-center rounded-full ${item.readAt ? 'bg-status-success/10 text-status-success' : 'bg-brand/10 text-brand'}`}><Bell aria-hidden="true" className="size-4" /></span><span className="min-w-0 flex-1"><bdi className="block truncate text-sm font-bold">{title}</bdi><bdi className="block truncate text-xs text-content-muted">{message}</bdi></span><time className="shrink-0 text-xs text-content-subtle" dateTime={item.queuedAt}>{time}</time>{item.readAt ? null : <span className="size-2 rounded-full bg-brand" aria-label={modernUiText[locale].dashboard.unread} />}</>;
  const className = "flex min-h-[3.55rem] items-center gap-3 px-4 py-2 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand";
  return href ? <a className={className} href={localeHref(href, locale)}>{content}</a> : <div className={className}>{content}</div>;
}
function TeamRows({ locale, manager, unassigned, unit }: { locale: Locale; manager: ManagerControlRoomTasks; unassigned: string; unit: string }) { const rows = manager.workloadByAssignee.slice(0, 5); const max = Math.max(...rows.map((row) => row.count), 1); return <div className="divide-y divide-line-subtle">{rows.map((row) => <a className="grid min-h-[3.55rem] grid-cols-[minmax(7rem,1fr)_minmax(5rem,1.3fr)_auto] items-center gap-3 px-4 py-2 hover:bg-surface-raised" href={`/tasks/manager?locale=${locale}`} key={row.assigneeId}><span className="flex min-w-0 items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/5 text-xs font-bold text-brand">{initials(row.assigneeName ?? unassigned, locale)}</span><bdi className="truncate text-sm font-semibold">{row.assigneeName ?? unassigned}</bdi></span><span className="h-2 overflow-hidden rounded-full bg-surface-raised"><span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(10, Math.round((row.count / max) * 100))}%` }} /></span><span className="text-xs font-semibold tabular-nums">{formatNumber(row.count, locale)} {unit}</span></a>)}</div>; }

function attentionItems(data: StaffDashboardSummary | null, tasks: EmployeeTodayTasks | null | undefined, locale: Locale, t: typeof modernUiText[Locale]['dashboard']): Attention[] { const q = `?locale=${locale}`; return [
  { count: data?.overdueComplaints ?? 0, detail: t.overdueDetail, href: `/complaints?sla=BREACHED&locale=${locale}`, icon: <Inbox className="size-5" />, label: t.complaints, tone: 'danger' },
  { count: tasks?.overdue.length ?? 0, detail: t.overdueDetail, href: `/tasks/today${q}#overdue`, icon: <CheckSquareIcon />, label: t.tasks, tone: 'danger' },
  { count: tasks?.overduePromises.length ?? 0, detail: t.overdueDetail, href: `/tasks/promises${q}`, icon: <UsersRound className="size-5" />, label: t.promises, tone: 'danger' },
  { count: tasks?.dueToday.length ?? 0, detail: t.dueTodayDetail, href: `/tasks/today${q}#due-today`, icon: <CalendarClock className="size-5" />, label: t.tasks, tone: 'warning' },
  { count: data?.slaWarningComplaints ?? 0, detail: t.dueSoonDetail, href: `/complaints?sla=WARNING&locale=${locale}`, icon: <Inbox className="size-5" />, label: t.complaints, tone: 'warning' },
  { count: tasks?.waitingOnMe.length ?? 0, detail: t.waitingDetail, href: `/tasks/today${q}`, icon: <UsersRound className="size-5" />, label: t.waitingOnMe, tone: 'warning' },
]; }
function CheckSquareIcon() { return <CheckCircle2 className="size-5" />; }
function notificationHref(item: StaffNotification): string | null { const explicit = item.targetHref ?? item.payload.targetHref ?? item.payload.href; if (explicit?.startsWith('/') && !explicit.startsWith('//') && !explicit.startsWith('/portal')) return explicit; const complaintId = item.payload.complaintId ?? (item.targetType === 'COMPLAINT' ? item.targetId : undefined); if (complaintId) return `/complaints/${encodeURIComponent(complaintId)}`; const taskId = item.payload.taskId ?? (item.targetType === 'TASK' ? item.targetId : undefined); return taskId ? `/tasks/${encodeURIComponent(taskId)}` : null; }
function formatNumber(value: number | undefined, locale: Locale) { return new Intl.NumberFormat(locale).format(value ?? 0); }
function formatDays(hours: number | undefined, locale: Locale) { return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.round((((hours ?? 0) / 24) * 10)) / 10); }
function initials(value: string, locale: Locale) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase(locale); }

export function DashboardSummaryLoading({ locale }: { locale: Locale }) { const label = staffShellText[locale].dashboard.states.loading; return <div className="grid gap-4" dir={staffShellText[locale].dir} role="status" aria-label={label}><div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,1fr)]"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div><div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,1fr)]"><Skeleton className="h-80 rounded-xl" /><Skeleton className="h-80 rounded-xl" /></div></div>; }
