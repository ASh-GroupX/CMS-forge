import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { employeeTodayText } from '../../i18n/staff-employee-today';
import type { Locale } from '../../i18n/staff-shell';
import type { StaffTask, StaffTaskStatus } from '../../lib/staff-tasks-api';

type EmployeeTodayText = (typeof employeeTodayText)[Locale];
export type TaskAction = (formData: FormData) => void | Promise<void>;

export function QuickAddForm({ action, locale, t }: { action: TaskAction; locale: Locale; t: EmployeeTodayText }) {
  return (
    <form action={action} className="mb-4 grid gap-3 rounded-md border border-border bg-muted/40 p-3">
      <input name="locale" type="hidden" value={locale} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-normal">{t.actions.quickAdd}</h2>
        <label className="flex items-center gap-2 text-sm">
          <input className="size-4 rounded border-border" name="isCustomerPromise" type="checkbox" />
          {t.actions.customerPromise}
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <LabeledInput label={t.fields.title} name="title" required />
        <LabeledInput label={t.fields.assignee} name="whoId" required />
        <LabeledInput label={t.fields.when} name="when" required type="datetime-local" />
        <LabeledInput label={t.fields.due} name="dueAt" type="datetime-local" />
        <LabeledInput label={t.fields.linkEntityType} name="linkEntityType" />
        <LabeledInput label={t.fields.linkEntityId} name="linkEntityId" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="quick-add-what">{t.fields.what}</Label>
        <Textarea id="quick-add-what" name="what" required />
      </div>
      <div>
        <Button type="submit">{t.actions.add}</Button>
      </div>
    </form>
  );
}

export function TaskActions({ action, locale, task, t }: { action: TaskAction; locale: Locale; task: StaffTask; t: EmployeeTodayText }) {
  const nextWhat = task.nextAction?.what ?? task.title;
  const nextWho = task.nextAction?.whoId ?? task.assigneeId;
  const nextWhen = toDateTimeLocal(task.nextAction?.when ?? task.dueAt);

  return (
    <div className="mt-3 grid gap-2 border-t border-border pt-3">
      <div className="flex flex-wrap gap-2">
        <StatusForm action={action} label={t.actions.done} locale={locale} status="DONE" task={task} />
        <StatusForm action={action} label={t.actions.waiting} locale={locale} nextAction={{ what: nextWhat, whoId: nextWho, when: nextWhen }} status="WAITING" task={task} />
      </div>
      <form action={action} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
        <HiddenTaskFields locale={locale} taskId={task.id} />
        <LabeledInput defaultValue={task.assigneeId} label={t.fields.assignee} name="assigneeId" required />
        <LabeledInput defaultValue={nextWhat} label={t.fields.nextAction} name="nextActionWhat" required />
        <LabeledInput defaultValue={nextWho} label={t.fields.nextOwner} name="nextActionWhoId" required />
        <div className="grid gap-2">
          <Label htmlFor={`next-when-${task.id}`}>{t.fields.when}</Label>
          <Input defaultValue={nextWhen} id={`next-when-${task.id}`} name="nextActionWhen" required type="datetime-local" />
        </div>
        <div className="md:col-span-4">
          <Button size="sm" type="submit" variant="outline">{t.actions.update}</Button>
        </div>
      </form>
    </div>
  );
}

function StatusForm({
  action,
  label,
  locale,
  nextAction,
  status,
  task,
}: {
  action: TaskAction;
  label: string;
  locale: Locale;
  nextAction?: { what: string; whoId: string; when: string };
  status: StaffTaskStatus;
  task: StaffTask;
}) {
  return (
    <form action={action}>
      <HiddenTaskFields locale={locale} taskId={task.id} />
      <input name="status" type="hidden" value={status} />
      {nextAction ? (
        <>
          <input name="nextActionWhat" type="hidden" value={nextAction.what} />
          <input name="nextActionWhoId" type="hidden" value={nextAction.whoId} />
          <input name="nextActionWhen" type="hidden" value={nextAction.when} />
        </>
      ) : null}
      <Button size="sm" type="submit" variant={status === 'DONE' ? 'default' : 'outline'}>{label}</Button>
    </form>
  );
}

function HiddenTaskFields({ locale, taskId }: { locale: Locale; taskId: string }) {
  return (
    <>
      <input name="locale" type="hidden" value={locale} />
      <input name="taskId" type="hidden" value={taskId} />
    </>
  );
}

function LabeledInput({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `${name}-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} {...props} />
    </div>
  );
}

function toDateTimeLocal(value: string): string {
  return value.slice(0, 16);
}
