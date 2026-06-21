import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { managerControlRoomText } from '../../../../i18n/staff-manager-control-room';
import { resolveLocale, staffShellText, type Locale } from '../../../../i18n/staff-shell';
import { getManagerControlRoomTasks, type ManagerControlRoomTasks, type ManagerRollupCount, type ManagerStuckTask, type StaffTask, type StaffTaskStatus } from '../../../../lib/staff-tasks-api';

type SearchParams = { locale?: string | string[] };
type Copy = (typeof managerControlRoomText)[Locale];
type TaskSectionKey = 'dueToday' | 'stuck' | 'escalated' | 'overduePromises';

const TASK_SECTIONS: readonly TaskSectionKey[] = ['dueToday', 'stuck', 'escalated', 'overduePromises'];

const STATUS_CLASS: Record<StaffTaskStatus, string> = {
  OPEN: 'border-brand/30 bg-brand/10 text-brand',
  IN_PROGRESS: 'border-status-info/30 bg-status-info/10 text-status-info',
  WAITING: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  DONE: 'border-status-success/30 bg-status-success/10 text-status-success',
};

export default async function ManagerControlRoomPage({
  cookieHeader,
  fetchImpl,
  searchParams,
}: {
  cookieHeader?: string;
  fetchImpl?: typeof fetch;
  searchParams?: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(readParam(params?.locale));
  const data = await getManagerControlRoomTasks({
    ...(cookieHeader !== undefined ? { cookieHeader } : {}),
    ...(fetchImpl !== undefined ? { fetchImpl } : {}),
  });
  return <ManagerControlRoom data={data} locale={locale} />;
}

export function ManagerControlRoom({ data, locale }: { data: ManagerControlRoomTasks | null; locale: Locale }) {
  const shell = staffShellText[locale];
  const t = managerControlRoomText[locale];
  const total = data ? totalSignals(data) : 0;

  return (
    <Card aria-label={t.title} className="rounded-md border-border bg-card text-card-foreground shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
          {data ? <Badge className="border-brand/30 bg-brand/10 text-brand" variant="outline">{formatCount(locale, total, t.total)}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {data === null ? (
          <p className="rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error" role="alert">{t.states.error}</p>
        ) : total === 0 ? (
          <p className="rounded-sm border border-border bg-muted px-3 py-2 text-sm text-muted-foreground" role="status">{t.states.empty}</p>
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <ScopeChip label={t.filters.scope} value={t.filters.scopeValue} />
              <ScopeChip label={t.filters.team} value={t.filters.teamValue} />
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              <CountSection counts={data.overdueByEmployee} locale={locale} sectionKey="overdueByEmployee" t={t} />
              <CountSection counts={data.workloadByAssignee} locale={locale} sectionKey="workloadByAssignee" t={t} />
              <PromiseKpi data={data.promiseKpi} locale={locale} t={t} />
              {TASK_SECTIONS.map((key) => <TaskSection key={key} locale={locale} sectionKey={key} tasks={data[key]} t={t} />)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ManagerControlRoomLoading({ locale }: { locale: Locale }) {
  const shell = staffShellText[locale];
  const t = managerControlRoomText[locale];

  return (
    <Card aria-label={t.title} className="rounded-md border-border bg-card text-card-foreground shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-border p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-muted-foreground" role="status">{t.states.loading}</p>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => <div className="h-28 animate-pulse rounded-md border border-border bg-muted" key={index} />)}
      </CardContent>
    </Card>
  );
}

function CountSection({ counts, locale, sectionKey, t }: { counts: ManagerRollupCount[]; locale: Locale; sectionKey: 'overdueByEmployee' | 'workloadByAssignee'; t: Copy }) {
  const [title, description] = t.sections[sectionKey];
  return (
    <section className="rounded-md border border-border bg-background p-3" aria-label={title}>
      <SectionHeader count={counts.length} description={description} locale={locale} title={title} />
      {counts.length === 0 ? <EmptyLine t={t} /> : (
        <Table className="mt-3">
          <TableHeader>
            <TableRow><TableHead className="text-start">{t.fields.assignee}</TableHead><TableHead className="text-end">{t.fields.count}</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {counts.map((row) => (
              <TableRow key={`${sectionKey}-${row.assigneeId}`}>
                <TableCell title={row.assigneeId}>{row.assigneeName ?? shortId(row.assigneeId)}</TableCell>
                <TableCell className="text-end font-semibold">{formatNumber(locale, row.count)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

function PromiseKpi({ data, locale, t }: { data: ManagerControlRoomTasks['promiseKpi']; locale: Locale; t: Copy }) {
  const [title, description] = t.sections.promiseKpi;
  return (
    <section className="rounded-md border border-border bg-background p-3" aria-label={title}>
      <SectionHeader count={data.openPromiseCount + data.overduePromiseCount} description={description} locale={locale} title={title} />
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <Metric label={t.promiseKpi.open} locale={locale} value={data.openPromiseCount} />
        <Metric label={t.promiseKpi.overdue} locale={locale} value={data.overduePromiseCount} />
      </dl>
    </section>
  );
}

function TaskSection({ locale, sectionKey, tasks, t }: { locale: Locale; sectionKey: TaskSectionKey; tasks: StaffTask[] | ManagerStuckTask[]; t: Copy }) {
  const [title, description] = t.sections[sectionKey];
  return (
    <section className="rounded-md border border-border bg-background p-3" aria-label={title}>
      <SectionHeader count={tasks.length} description={description} locale={locale} title={title} />
      {tasks.length === 0 ? <EmptyLine t={t} /> : <div className="mt-3 grid gap-2">{tasks.map((task) => <TaskCard key={`${sectionKey}-${task.id}`} locale={locale} task={task} t={t} />)}</div>}
    </section>
  );
}

function TaskCard({ locale, task, t }: { locale: Locale; task: StaffTask | ManagerStuckTask; t: Copy }) {
  const reasons = 'stuckReasons' in task ? task.stuckReasons : [];
  return (
    <article className="rounded-md border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold">{task.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{task.id}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge className={STATUS_CLASS[task.status]} variant="outline">{task.status}</Badge>
          {task.isCustomerPromise ? <Badge variant="secondary">{t.promise}</Badge> : null}
        </div>
      </div>
      <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <Field label={t.fields.assignee} title={task.assigneeId} value={task.assigneeName ?? shortId(task.assigneeId)} />
        <Field label={t.fields.due} value={formatDate(task.dueAt)} />
        <Field label={t.fields.owner} title={task.ownerId} value={task.ownerName ?? shortId(task.ownerId)} />
        <Field label={t.fields.branch} title={task.branchId ?? undefined} value={task.branchName ?? (task.branchId ? shortId(task.branchId) : '-')} />
        <Field label={t.fields.updated} value={formatDate(task.updatedAt)} />
      </dl>
      {task.nextAction ? (
        <div className="mt-3 rounded-sm border border-border bg-muted px-3 py-2 text-sm">
          <p className="font-semibold">{t.fields.nextAction}</p>
          <p className="mt-1 break-words text-muted-foreground">{task.nextAction.what}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.fields.nextOwner}: <span title={task.nextAction.whoId}>{task.nextAction.whoName ?? shortId(task.nextAction.whoId)}</span> - {formatDate(task.nextAction.when)}</p>
        </div>
      ) : null}
      {reasons.length ? <p className="mt-3 text-xs font-semibold text-status-warning">{t.fields.reasons}: {reasons.join(', ')}</p> : null}
      {task.links.length ? (
        <div className="mt-3 flex flex-wrap gap-1" aria-label={t.fields.links}>
          {task.links.map((link) => <Badge key={`${link.entityType}-${link.entityId}`} variant="outline">{link.entityType}: <span title={link.entityId}>{shortId(link.entityId)}</span></Badge>)}
        </div>
      ) : null}
    </article>
  );
}

function ScopeChip({ label, value }: { label: string; value: string }) {
  return <p className="rounded-sm border border-border bg-muted px-3 py-2 text-sm"><span className="font-semibold">{label}</span>: {value}</p>;
}

function SectionHeader({ count, description, locale, title }: { count: number; description: string; locale: Locale; title: string }) {
  return <div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-base font-semibold tracking-normal">{title}</h2><p className="text-xs text-muted-foreground">{description}</p></div><Badge variant="outline">{formatNumber(locale, count)}</Badge></div>;
}

function Metric({ label, locale, value }: { label: string; locale: Locale; value: number }) {
  return <div className="rounded-sm border border-border bg-muted px-3 py-2"><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="text-2xl font-semibold">{formatNumber(locale, value)}</dd></div>;
}

function Field({ label, title, value }: { label: string; title?: string | undefined; value: string }) {
  return <div><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="break-words" title={title}>{value}</dd></div>;
}

function EmptyLine({ t }: { t: Copy }) {
  return <p className="mt-3 rounded-sm bg-muted px-3 py-2 text-sm text-muted-foreground">{t.states.sectionEmpty}</p>;
}

function totalSignals(data: ManagerControlRoomTasks): number {
  return data.overdueByEmployee.length + data.workloadByAssignee.length + data.dueToday.length + data.stuck.length + data.escalated.length + data.overduePromises.length + data.promiseKpi.openPromiseCount + data.promiseKpi.overduePromiseCount;
}

function formatCount(locale: Locale, value: number, label: string): string {
  return `${formatNumber(locale, value)} ${label}`;
}

function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(locale).format(value);
}

function formatDate(value: string): string {
  return value.slice(0, 16).replace('T', ' ');
}

function shortId(value: string): string {
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-4)}` : value;
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
