import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { employeeTodayText } from '../../i18n/staff-employee-today';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { StaffRelatedRecordOptions } from '../../lib/staff-related-records-api';
import type { EmployeeTodayTasks, StaffTask, StaffTaskStatus } from '../../lib/staff-tasks-api';
import { QuickAddForm, TaskActions, type TaskAction } from './task-action-forms';

type SectionKey = keyof EmployeeTodayTasks;
type EmployeeTodayText = (typeof employeeTodayText)[Locale];

const SECTION_KEYS: readonly SectionKey[] = ['overdue', 'dueToday', 'waitingOnMe', 'assignedToMe', 'overduePromises', 'completed'];

const STATUS_CLASS: Record<StaffTaskStatus, string> = {
  OPEN: 'border-brand/30 bg-brand/10 text-brand',
  IN_PROGRESS: 'border-status-info/30 bg-status-info/10 text-status-info',
  WAITING: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  DONE: 'border-status-success/30 bg-status-success/10 text-status-success',
};

export function EmployeeToday({
  data,
  locale,
  quickAddAction,
  relatedRecords,
  result,
  staff,
  updateAction,
}: {
  data: EmployeeTodayTasks | null;
  locale: Locale;
  quickAddAction?: TaskAction;
  relatedRecords?: StaffRelatedRecordOptions | null | undefined;
  result?: 'error' | 'link-required' | 'success' | undefined;
  staff?: AssignableStaff[] | null | undefined;
  updateAction?: TaskAction | undefined;
}) {
  const shell = staffShellText[locale];
  const t = employeeTodayText[locale];
  const total = data ? SECTION_KEYS.reduce((sum, key) => sum + data[key].length, 0) : 0;

  return (
    <Card aria-label={t.title} className="rounded-md border-border bg-card text-card-foreground shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
          </div>
          {data ? (
            <Badge className="border-brand/30 bg-brand/10 text-brand" variant="outline">
              {formatCount(locale, total, t.total)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {result ? (
          <p className={result === 'success' ? 'mb-3 rounded-sm border border-status-success bg-status-success/10 px-3 py-2 text-sm text-status-success' : 'mb-3 rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error'} role="status">
            {result === 'success' ? t.states.saved : result === 'link-required' ? t.states.linkRequired : t.states.saveFailed}
          </p>
        ) : null}
        {quickAddAction ? <QuickAddForm action={quickAddAction} locale={locale} relatedRecords={relatedRecords} staff={staff} t={t} /> : null}
        {data === null ? (
          <p className="rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error" role="alert">
            {t.states.error}
          </p>
        ) : total === 0 ? (
          <p className="rounded-sm border border-border bg-muted px-3 py-2 text-sm text-muted-foreground" role="status">
            {t.states.empty}
          </p>
        ) : (
          <div className="grid items-start gap-3 xl:grid-cols-2">
            {SECTION_KEYS.map((key) => (
              <TaskSection key={key} locale={locale} sectionKey={key} staff={staff} tasks={data[key]} t={t} updateAction={updateAction} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EmployeeTodayLoading({ locale }: { locale: Locale }) {
  const shell = staffShellText[locale];
  const t = employeeTodayText[locale];

  return (
    <Card aria-label={t.title} className="rounded-md border-border bg-card text-card-foreground shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-border p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-muted-foreground" role="status">{t.states.loading}</p>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-28 animate-pulse rounded-md border border-border bg-muted" key={index} />
        ))}
      </CardContent>
    </Card>
  );
}

function TaskSection({
  locale,
  sectionKey,
  staff,
  tasks,
  t,
  updateAction,
}: {
  locale: Locale;
  sectionKey: SectionKey;
  staff?: AssignableStaff[] | null | undefined;
  tasks: StaffTask[];
  t: EmployeeTodayText;
  updateAction?: TaskAction | undefined;
}) {
  const [title, description] = t.sections[sectionKey];

  return (
    <section className="rounded-md border border-border bg-background p-3" aria-label={title}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-normal">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline">{formatNumber(locale, tasks.length)}</Badge>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-3 rounded-sm bg-muted px-3 py-2 text-sm text-muted-foreground">{t.states.sectionEmpty}</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {tasks.map((task) => <TaskCard key={`${sectionKey}-${task.id}`} locale={locale} staff={staff} task={task} t={t} updateAction={updateAction} />)}
        </div>
      )}
    </section>
  );
}

function TaskCard({ locale, staff, task, t, updateAction }: { locale: Locale; staff?: AssignableStaff[] | null | undefined; task: StaffTask; t: EmployeeTodayText; updateAction?: TaskAction | undefined }) {
  return (
    <article className="rounded-md border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words text-sm font-semibold">{task.title}</h3>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge className={STATUS_CLASS[task.status]} variant="outline">{task.status}</Badge>
          {task.isCustomerPromise ? <Badge variant="secondary">{t.promise}</Badge> : null}
        </div>
      </div>
      <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <Field label={t.fields.assignee} value={task.assigneeName ?? '-'} />
        <Field label={t.fields.due} value={formatDate(task.dueAt)} />
        <Field label={t.fields.owner} value={task.ownerName ?? '-'} />
        <Field label={t.fields.branch} value={task.branchName ?? '-'} />
        <Field label={t.fields.updated} value={formatDate(task.updatedAt)} />
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
      {updateAction ? <TaskActions action={updateAction} locale={locale} staff={staff} task={task} t={t} /> : null}
      {task.links.length ? (
        <div className="mt-3 flex flex-wrap gap-1" aria-label={t.fields.links}>
          {task.links.map((link) => (
            <Badge key={`${link.entityType}-${link.entityId}`} variant="outline">
              {linkTypeLabel(link.entityType, t)}
            </Badge>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function Field({ label, title, value }: { label: string; title?: string | undefined; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="break-words" title={title}>{value}</dd>
    </div>
  );
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

function linkTypeLabel(entityType: string, t: EmployeeTodayText): string {
  return entityType in t.recordTypes ? t.recordTypes[entityType as keyof typeof t.recordTypes] : entityType;
}
