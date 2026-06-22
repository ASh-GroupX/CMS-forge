import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { sentTasksText } from '../../i18n/staff-sent-tasks';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { SentTask } from '../../lib/staff-sent-tasks-api';
import type { StaffTaskStatus } from '../../lib/staff-tasks-api';

type TaskAction = (formData: FormData) => void | Promise<void>;
type Text = (typeof sentTasksText)[Locale];

const STATUS_CLASS: Record<StaffTaskStatus, string> = {
  OPEN: 'border-brand/30 bg-brand/10 text-brand',
  IN_PROGRESS: 'border-status-info/30 bg-status-info/10 text-status-info',
  WAITING: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  DONE: 'border-status-success/30 bg-status-success/10 text-status-success',
};

export function SentTasks({
  commentAction,
  data,
  locale,
  nudgeAction,
  result,
}: {
  commentAction?: TaskAction;
  data: SentTask[] | null;
  locale: Locale;
  nudgeAction?: TaskAction;
  result?: 'error' | 'success' | undefined;
}) {
  const shell = staffShellText[locale];
  const t = sentTasksText[locale];
  return (
    <Card aria-label={t.title} className="rounded-md border-border bg-card text-card-foreground shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
          {data ? <Badge variant="outline">{`${formatNumber(locale, data.length)} ${t.total}`}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {result ? (
          <p className={result === 'success' ? 'mb-3 rounded-sm border border-status-success bg-status-success/10 px-3 py-2 text-sm text-status-success' : 'mb-3 rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error'} role="status">
            {result === 'success' ? t.states.saved : t.states.saveFailed}
          </p>
        ) : null}
        {data === null ? (
          <p className="rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error" role="alert">{t.states.error}</p>
        ) : data.length === 0 ? (
          <p className="rounded-sm border border-border bg-muted px-3 py-2 text-sm text-muted-foreground" role="status">{t.states.empty}</p>
        ) : (
          <div className="grid items-start gap-3 xl:grid-cols-2">
            {data.map((task) => <SentTaskCard key={task.id} locale={locale} task={task} t={t} {...(commentAction ? { commentAction } : {})} {...(nudgeAction ? { nudgeAction } : {})} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SentTaskCard({ commentAction, locale, nudgeAction, task, t }: { commentAction?: TaskAction; locale: Locale; nudgeAction?: TaskAction; task: SentTask; t: Text }) {
  return (
    <article className="rounded-md border border-border bg-background p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words text-sm font-semibold">{task.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{task.id}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge className={STATUS_CLASS[task.status]} variant="outline">{task.status}</Badge>
          {task.isCustomerPromise ? <Badge variant="secondary">{t.promise}</Badge> : null}
        </div>
      </div>
      <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <Field label={t.fields.assignee} value={task.assigneeName ?? '-'} />
        <Field label={t.fields.due} value={formatDate(task.dueAt)} />
        <Field label={t.fields.updated} value={formatDate(task.updatedAt)} />
        <Field label={t.fields.branch} value={task.branchName ?? (task.branchId ? shortId(task.branchId) : '-')} {...(task.branchId ? { title: task.branchId } : {})} />
      </dl>
      {task.nextAction ? (
        <div className="mt-3 rounded-sm border border-border bg-muted px-3 py-2 text-sm">
          <p className="font-semibold">{t.fields.nextAction}</p>
          <p className="mt-1 break-words text-muted-foreground">{task.nextAction.what}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.fields.nextOwner}: <span>{task.nextAction.whoName ?? '-'}</span> - {formatDate(task.nextAction.when)}
          </p>
        </div>
      ) : null}
      {task.links.length ? (
        <div className="mt-3 flex flex-wrap gap-1" aria-label={t.fields.links}>
          {task.links.map((link) => <Badge key={`${link.entityType}-${link.entityId}`} variant="outline">{link.entityType}: <span title={link.entityId}>{shortId(link.entityId)}</span></Badge>)}
        </div>
      ) : null}
      <section className="mt-3 grid gap-2 border-t border-border pt-3" aria-label={t.fields.comment}>
        {task.comments.length === 0 ? <p className="rounded-sm bg-muted px-3 py-2 text-sm text-muted-foreground">{t.states.noComments}</p> : task.comments.map((comment) => (
          <article className="rounded-sm border border-border bg-card px-3 py-2 text-sm" key={comment.id}>
            <p className="font-semibold">{comment.authorName ?? '-'}</p>
            <p className="mt-1 break-words text-muted-foreground">{comment.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
          </article>
        ))}
        {commentAction ? (
          <form action={commentAction} className="grid gap-2">
            <HiddenFields locale={locale} taskId={task.id} />
            <Textarea aria-label={t.fields.comment} name="body" required />
            <Button size="sm" type="submit" variant="outline">{t.actions.comment}</Button>
          </form>
        ) : null}
        {nudgeAction ? (
          <form action={nudgeAction} className="grid gap-2">
            <HiddenFields locale={locale} taskId={task.id} />
            <Textarea aria-label={t.fields.message} name="message" />
            <Button size="sm" type="submit">{t.actions.remind}</Button>
          </form>
        ) : null}
      </section>
    </article>
  );
}

function HiddenFields({ locale, taskId }: { locale: Locale; taskId: string }) {
  return (
    <>
      <input name="locale" type="hidden" value={locale} />
      <input name="taskId" type="hidden" value={taskId} />
    </>
  );
}

function Field({ label, title, value }: { label: string; title?: string | undefined; value: string }) {
  return <div><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="break-words" title={title}>{value}</dd></div>;
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
