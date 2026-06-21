import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { staffPromisesText } from '../../../../i18n/staff-promises';
import { resolveLocale, staffShellText, type Locale } from '../../../../i18n/staff-shell';
import { getStaffPromises, type StaffPromiseTask, type StaffPromises } from '../../../../lib/staff-promises-api';
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
  const data = await getStaffPromises({ ...(cookieHeader !== undefined ? { cookieHeader } : {}), ...(fetchImpl !== undefined ? { fetchImpl } : {}) });
  const result = readResult(params?.promise);
  return <Promises data={data} locale={locale} {...(result ? { result } : {})} />;
}

export function Promises({ data, locale, result }: { data: StaffPromises | null; locale: Locale; result?: 'error' | 'success' }) {
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
        {result ? <p className={result === 'success' ? 'mb-3 rounded-sm border border-status-success bg-status-success/10 px-3 py-2 text-sm text-status-success' : 'mb-3 rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error'} role="status">{result === 'success' ? t.states.saved : t.states.saveFailed}</p> : null}
        {data === null ? <p className="rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error" role="alert">{t.states.error}</p> : (
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
        <div className="min-w-0"><h2 className="break-words text-sm font-semibold">{task.title}</h2><p className="mt-1 text-xs text-muted-foreground">{task.id}</p></div>
        <Badge className={STATUS_CLASS[task.status]} variant="outline">{task.status}</Badge>
      </div>
      <dl className="mt-3 grid gap-2 text-sm md:grid-cols-3">
        <Field label={t.fields.customer} value={task.customerLabel ?? '-'} />
        <Field label={t.fields.deal} value={task.dealLabel ?? '-'} />
        <Field label={t.fields.due} value={formatDate(task.dueAt)} />
        <Field label={t.fields.owner} title={task.ownerId} value={task.ownerName ?? shortId(task.ownerId)} />
        <Field label={t.fields.assignee} title={task.assigneeId} value={task.assigneeName ?? shortId(task.assigneeId)} />
      </dl>
      {task.nextAction ? <p className="mt-3 rounded-sm border border-border bg-muted px-3 py-2 text-sm"><span className="font-semibold">{t.fields.nextAction}: </span>{task.nextAction.what} <span className="text-muted-foreground">({task.nextAction.whoName ?? shortId(task.nextAction.whoId)} - {formatDate(task.nextAction.when)})</span></p> : null}
      {task.status !== 'DONE' ? <DoneForm locale={locale} taskId={task.id} t={t} /> : null}
      {task.links.length ? <div className="mt-3 flex flex-wrap gap-1" aria-label={t.fields.links}>{task.links.map((link) => <Badge key={`${link.entityType}-${link.entityId}`} variant="outline">{link.entityType}: <span title={link.entityId}>{shortId(link.entityId)}</span></Badge>)}</div> : null}
    </article>
  );
}

function DoneForm({ locale, taskId, t }: { locale: Locale; taskId: string; t: Copy }) {
  return <form action={updatePromiseAction} className="mt-3"><input name="locale" type="hidden" value={locale} /><input name="taskId" type="hidden" value={taskId} /><Button size="sm" type="submit">{t.actions.done}</Button></form>;
}

function Metric({ label, locale, suffix = '', value }: { label: string; locale: Locale; suffix?: string; value: number }) {
  return <div className="rounded-sm border border-border bg-muted px-3 py-2"><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="text-2xl font-semibold">{formatNumber(locale, value)}{suffix}</dd></div>;
}

function Field({ label, title, value }: { label: string; title?: string; value: string }) {
  return <div><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="break-words" title={title}>{value}</dd></div>;
}

function formatNumber(locale: Locale, value: number): string { return new Intl.NumberFormat(locale).format(value); }
function formatDate(value: string): string { return value.slice(0, 16).replace('T', ' '); }
function shortId(value: string): string { return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-4)}` : value; }
function readParam(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function readResult(value: string | string[] | undefined): 'error' | 'success' | undefined { const result = readParam(value); return result === 'success' || result === 'error' ? result : undefined; }
