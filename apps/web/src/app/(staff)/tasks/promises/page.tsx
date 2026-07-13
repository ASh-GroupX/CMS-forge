import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { taskStatusLabel } from '../../../../i18n/domain-labels';
import { staffPromisesText } from '../../../../i18n/staff-promises';
import { resolveLocale, staffShellText, type Locale } from '../../../../i18n/staff-shell';
import { formatDisplayDate } from '../../../../lib/locale-format';
import { getStaffPromisesLoadResult, type StaffPromiseTask, type StaffPromises } from '../../../../lib/staff-promises-api';
import { updatePromiseAction } from './actions';

type SearchParams = { locale?: string | string[]; promise?: string | string[] };
type Copy = (typeof staffPromisesText)[Locale];

const STATUS_CLASS: Record<StaffPromiseTask['status'], string> = {
  OPEN: 'border-brand/30 bg-brand/10 text-brand',
  IN_PROGRESS: 'border-status-info/30 bg-status-info/10 text-status-info',
  WAITING: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  DONE: 'border-status-success/30 bg-status-success/10 text-status-success',
};

export default async function PromisesPage({
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
  const data = await getStaffPromisesLoadResult({ ...(cookieHeader !== undefined ? { cookieHeader } : {}), ...(fetchImpl !== undefined ? { fetchImpl } : {}) });
  const result = readResult(params?.promise);
  return <Promises data={data.status === 'ready' ? data.data : null} locale={locale} {...(result ? { result } : {})} state={data.status === 'ready' ? undefined : data.status} />;
}

export function Promises({ data, locale, result, state }: { data: StaffPromises | null; locale: Locale; result?: 'denied' | 'error' | 'success'; state?: 'denied' | 'error' | undefined }) {
  const shell = staffShellText[locale];
  const t = staffPromisesText[locale];
  return (
    <Card aria-label={t.title} className="rounded-md border-border bg-card text-card-foreground shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><CardTitle className="text-lg tracking-normal">{t.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p></div>
          {data ? <Badge className="border-brand/30 bg-brand/10 text-brand" variant="outline">{formatNumber(locale, data.promises.length)} {t.total}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {result ? <p className={result === 'success' ? 'mb-3 rounded-sm border border-status-success bg-status-success/10 px-3 py-2 text-sm text-status-success' : 'mb-3 rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error'} role="status">{result === 'success' ? t.states.saved : result === 'denied' ? t.states.denied : t.states.saveFailed}</p> : null}
        {data === null ? <p className="rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error" role="alert">{state === 'denied' ? t.states.denied : t.states.error}</p> : (
          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-3">
              <Metric label={t.kpis.open} locale={locale} value={data.openPromiseCount} />
              <Metric label={t.kpis.overdue} locale={locale} value={data.overduePromiseCount} />
              <Metric label={t.kpis.kept} locale={locale} suffix="%" value={data.keptOnTimePercent} />
            </div>
            {data.promises.length === 0 ? <p className="rounded-sm border border-border bg-muted px-3 py-2 text-sm text-muted-foreground" role="status">{t.states.empty}</p> : <div className="grid gap-2">{data.promises.map((task) => <PromiseCard key={task.id} locale={locale} task={task} t={t} />)}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PromisesLoading({ locale }: { locale: Locale }) {
  const shell = staffShellText[locale];
  const t = staffPromisesText[locale];
  return (
    <Card aria-label={t.title} className="rounded-md border-border bg-card text-card-foreground shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-border p-4"><CardTitle className="text-lg tracking-normal">{t.title}</CardTitle><p className="text-sm text-muted-foreground" role="status">{t.states.loading}</p></CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <div className="h-24 animate-pulse rounded-md border border-border bg-muted" key={index} />)}</CardContent>
    </Card>
  );
}

function PromiseCard({ locale, task, t }: { locale: Locale; task: StaffPromiseTask; t: Copy }) {
  return (
    <article className="rounded-md border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><h2 className="break-words text-sm font-semibold">{task.title}</h2></div>
        <Badge className={STATUS_CLASS[task.status]} title={task.status} variant="outline">{taskStatusLabel(locale, task.status)}</Badge>
      </div>
      <dl className="mt-3 grid gap-2 text-sm md:grid-cols-3">
        <Field label={t.fields.customer} value={task.customerLabel ?? '-'} />
        <Field label={t.fields.deal} value={task.dealLabel ?? '-'} />
        <Field label={t.fields.due} value={formatDate(task.dueAt, locale, task.displayTimeZone)} />
        <Field label={t.fields.owner} value={task.ownerName ?? '-'} />
        <Field label={t.fields.assignee} value={task.assigneeName ?? '-'} />
      </dl>
      {task.nextAction ? <p className="mt-3 rounded-sm border border-border bg-muted px-3 py-2 text-sm"><span className="font-semibold">{t.fields.nextAction}: </span>{task.nextAction.what} <span className="text-muted-foreground">({task.nextAction.whoName ?? '-'} - {formatDate(task.nextAction.when, locale, task.displayTimeZone)})</span></p> : null}
      {task.status !== 'DONE' ? <DoneForm locale={locale} taskId={task.id} t={t} /> : null}
      {task.links.length ? <div className="mt-3 flex flex-wrap gap-1" aria-label={t.fields.links}>{task.links.map((link) => <Badge key={`${link.entityType}-${link.entityId}`} variant="outline">{linkTypeLabel(link.entityType, t)}</Badge>)}</div> : null}
    </article>
  );
}

function DoneForm({ locale, taskId, t }: { locale: Locale; taskId: string; t: Copy }) {
  return (
    <details className="mt-3 rounded-sm border border-border bg-muted px-3 py-2">
      <summary className="cursor-pointer text-sm font-semibold">{t.actions.done}</summary>
      <form action={updatePromiseAction} className="mt-3 grid gap-2">
        <input name="locale" type="hidden" value={locale} />
        <input name="taskId" type="hidden" value={taskId} />
        <Label className="grid gap-1 text-sm font-medium">
          {t.fields.statusNote}
          <Textarea className="min-h-20 bg-background" name="statusNote" required />
        </Label>
        <Button size="sm" type="submit">{t.actions.done}</Button>
      </form>
    </details>
  );
}

function Metric({ label, locale, suffix = '', value }: { label: string; locale: Locale; suffix?: string; value: number }) {
  return <div className="rounded-sm border border-border bg-muted px-3 py-2"><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="text-2xl font-semibold">{formatNumber(locale, value)}{suffix}</dd></div>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="break-words">{value}</dd></div>;
}

function formatNumber(locale: Locale, value: number): string { return new Intl.NumberFormat(locale).format(value); }
function formatDate(value: string, locale: Locale, timeZone: string): string { return `${formatDisplayDate(value, locale, { dateStyle: 'medium', timeStyle: 'short', timeZone })} (${timeZone})`; }
function linkTypeLabel(entityType: string, t: Copy): string {
  return entityType in t.recordTypes ? t.recordTypes[entityType as keyof typeof t.recordTypes] : entityType;
}
function readParam(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function readResult(value: string | string[] | undefined): 'denied' | 'error' | 'success' | undefined { const result = readParam(value); return result === 'success' || result === 'error' || result === 'denied' ? result : undefined; }
