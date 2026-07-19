'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StaffPicker } from '../shared/staff-picker';
import { AssignmentPicker } from '../shared/assignment-picker';
import { employeeTodayText } from '../../i18n/staff-employee-today';
import type { Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { StaffAssignmentOptions } from '../../lib/staff-assignment-options-api';
import type { RelatedRecordType, StaffRelatedRecord, StaffRelatedRecordOptions } from '../../lib/staff-related-records-api';
import type { StaffTask, StaffTaskStatus } from '../../lib/staff-tasks-api';
import { formatZonedDateTimeLocal } from '../../lib/locale-format';

type EmployeeTodayText = (typeof employeeTodayText)[Locale];
export type TaskAction = (formData: FormData) => void | Promise<void>;
type RelatedRecordsAction = () => Promise<StaffRelatedRecordOptions | null>;

const RELATED_RECORD_TYPES: RelatedRecordType[] = ['CUSTOMER', 'COMPLAINT', 'CASE', 'DEAL'];

export function QuickAddForm({ action, assignmentOptions, loadRelatedRecordsAction, locale, relatedRecords, staff, t, timeZone }: { action: TaskAction; assignmentOptions?: StaffAssignmentOptions | null | undefined; loadRelatedRecordsAction?: RelatedRecordsAction | undefined; locale: Locale; relatedRecords?: StaffRelatedRecordOptions | null | undefined; staff?: AssignableStaff[] | null | undefined; t: EmployeeTodayText; timeZone: string }) {
  const [loadedRecords, setLoadedRecords] = React.useState<StaffRelatedRecordOptions | null | undefined>(relatedRecords);
  const [loadingRecords, setLoadingRecords] = React.useState(false);

  async function loadRecords(event: React.SyntheticEvent<HTMLDetailsElement>) {
    if (!event.currentTarget.open || loadedRecords !== undefined || loadingRecords || !loadRelatedRecordsAction) return;
    setLoadingRecords(true);
    setLoadedRecords(await loadRelatedRecordsAction());
    setLoadingRecords(false);
  }

  return (
    <details className="mb-4 rounded-sm border border-line-subtle bg-surface-raised" onToggle={(event) => { void loadRecords(event); }}>
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-content-strong">{t.actions.quickAdd}</summary>
      <form action={action} className="grid gap-3 border-t border-line-subtle p-3">
        <input name="locale" type="hidden" value={locale} />
        <div className="flex justify-end">
          <label className="flex items-center gap-2 text-sm">
            <input className="size-4 rounded border-border" name="isCustomerPromise" type="checkbox" />
            {t.actions.customerPromise}
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <LabeledInput label={t.fields.title} name="title" required />
          <div className="md:col-span-2"><AssignmentPicker locale={locale} options={assignmentOptions} /></div>
          <StaffPicker label={t.fields.nextOwner} labelName="assigneeLabel" locale={locale} name="whoId" staff={staff} t={t.staffPicker} />
          <LabeledInput label={`${t.fields.when} (${timeZone})`} name="when" required type="datetime-local" />
          <LabeledInput label={`${t.fields.due} (${timeZone})`} name="dueAt" type="datetime-local" />
          <RelatedRecordPicker locale={locale} relatedRecords={loadingRecords ? undefined : loadedRecords} t={t} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="quick-add-what">{t.fields.what}</Label>
          <Textarea id="quick-add-what" name="what" required />
        </div>
        <div>
          <Button type="submit">{t.actions.add}</Button>
        </div>
      </form>
    </details>
  );
}

function RelatedRecordPicker({ locale, relatedRecords, t }: { locale: Locale; relatedRecords?: StaffRelatedRecordOptions | null | undefined; t: EmployeeTodayText }) {
  const listId = React.useId();
  const [type, setType] = React.useState<RelatedRecordType>('CUSTOMER');
  const [selectedValue, setSelectedValue] = React.useState('');
  const options = (relatedRecords?.[type] ?? []).map((record, index) => ({ record, value: String(index) }));
  const selected = options.find((option) => option.value === selectedValue)?.record;
  const selectedLabel = selected ? relatedRecordLabel(selected, locale) : '';

  return (
    <div className="grid gap-2 md:col-span-2">
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${listId}-type`}>{t.fields.relatedTo}</Label>
          <FormSelect
            id={`${listId}-type`}
            name="relatedRecordType"
            onValueChange={(nextType) => { setType(nextType as RelatedRecordType); setSelectedValue(''); }}
            options={RELATED_RECORD_TYPES.map((recordType) => ({ label: t.recordTypes[recordType], value: recordType }))}
            value={type}
          />
        </div>
        {relatedRecords === undefined ? (
          <PickerState label={t.fields.relatedRecord} message={t.recordPicker.loading} />
        ) : relatedRecords === null ? (
          <PickerState alert label={t.fields.relatedRecord} message={t.recordPicker.error} />
        ) : options.length === 0 ? (
          <PickerState label={t.fields.relatedRecord} message={t.recordPicker.empty} />
        ) : (
          <div className="grid gap-2">
            <Label htmlFor={`${listId}-record`}>{t.fields.relatedRecord}</Label>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <FormSelect
                aria-describedby={`${listId}-selected`}
                id={`${listId}-record`}
                onValueChange={setSelectedValue}
                options={options.map((option) => ({ label: relatedRecordLabel(option.record, locale), value: option.value }))}
                placeholder={t.recordPicker.placeholder}
                value={selectedValue}
              />
              <Button aria-label={t.recordPicker.clear} onClick={() => setSelectedValue('')} type="button" variant="outline">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="break-words text-xs text-muted-foreground" id={`${listId}-selected`}>
              {selected ? t.recordPicker.selected.replace('{name}', selectedLabel) : t.recordPicker.prompt}
            </p>
          </div>
        )}
      </div>
      <input name="linkEntityType" type="hidden" value={selected ? selected.recordType : ''} />
      <input name="linkEntityId" type="hidden" value={selected?.recordId ?? ''} />
      <input name="relatedRecordLabel" type="hidden" value={selectedLabel} />
    </div>
  );
}

function PickerState({ alert = false, label, message }: { alert?: boolean; label: string; message: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <p className={`rounded-sm border px-3 py-2 text-sm ${alert ? 'border-status-error bg-status-error/10 text-status-error' : 'border-border bg-background text-muted-foreground'}`} role={alert ? 'alert' : 'status'}>
        {message}
      </p>
    </div>
  );
}

function relatedRecordLabel(record: StaffRelatedRecord, locale: Locale): string {
  const label = locale === 'ar' ? record.labelAr : record.label;
  const context = locale === 'ar' ? record.contextAr : record.context;
  return [label, context].filter(Boolean).join(' - ');
}

export function TaskActions({ action, assignmentOptions, locale, staff, task, t }: { action: TaskAction; assignmentOptions?: StaffAssignmentOptions | null | undefined; locale: Locale; staff?: AssignableStaff[] | null | undefined; task: StaffTask; t: EmployeeTodayText }) {
  const nextWhat = task.nextAction?.what ?? task.title;
  const nextWho = task.nextAction?.whoId ?? task.assigneeId ?? '';
  const nextWhen = formatZonedDateTimeLocal(task.nextAction?.when ?? task.dueAt, task.displayTimeZone);

  return (
    <div className="mt-3 grid gap-2 border-t border-line-subtle pt-3">
      <div className="flex flex-wrap gap-2">
        <StatusForm action={action} label={t.actions.done} locale={locale} status="DONE" task={task} t={t} />
        <StatusForm action={action} label={t.actions.waiting} locale={locale} nextAction={{ what: nextWhat, whoId: nextWho, when: nextWhen }} staff={staff} status="WAITING" task={task} t={t} />
      </div>
      <details className="rounded-sm border border-line-subtle bg-surface-raised px-3 py-2">
        <summary className="cursor-pointer text-sm font-semibold text-content-strong">{t.actions.updateDetails}</summary>
        <form action={action} className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
          <HiddenTaskFields locale={locale} taskId={task.id} />
          <div className="md:col-span-2"><AssignmentPicker departmentName="assignedDepartmentId" initialDepartmentId={task.assignedDepartmentId ?? ''} initialUserId={task.assigneeId ?? ''} locale={locale} options={assignmentOptions} userName="assigneeId" /></div>
          <LabeledInput defaultValue={nextWhat} label={t.fields.nextAction} name="nextActionWhat" required />
          <StaffPicker initialUserId={nextWho} label={t.fields.nextOwner} labelName="nextActionWhoLabel" locale={locale} name="nextActionWhoId" staff={staff} t={t.staffPicker} />
          <div className="grid gap-2">
            <Label htmlFor={`next-when-${task.id}`}>{t.fields.when} ({task.displayTimeZone})</Label>
            <Input defaultValue={nextWhen} id={`next-when-${task.id}`} name="nextActionWhen" required type="datetime-local" />
          </div>
          <div className="md:col-span-4">
            <Button size="sm" type="submit" variant="outline">{t.actions.update}</Button>
          </div>
        </form>
      </details>
    </div>
  );
}

function StatusForm({
  action,
  label,
  locale,
  nextAction,
  staff,
  status,
  task,
  t,
}: {
  action: TaskAction;
  label: string;
  locale: Locale;
  nextAction?: { what: string; whoId: string; when: string };
  staff?: AssignableStaff[] | null | undefined;
  status: StaffTaskStatus;
  task: StaffTask;
  t: EmployeeTodayText;
}) {
  return (
    <details className="rounded-sm border border-line-subtle bg-surface-raised px-3 py-2">
      <summary className="cursor-pointer text-sm font-semibold text-content-strong">{label}</summary>
      <form action={action} className="mt-3 grid gap-2">
        <HiddenTaskFields locale={locale} taskId={task.id} />
        <input name="status" type="hidden" value={status} />
        <p className="text-sm text-content-muted">{status === 'DONE' ? t.help.done : t.help.waiting}</p>
        {nextAction ? (
          <div className="grid gap-2 md:grid-cols-3">
            <LabeledInput defaultValue={nextAction.what} label={t.fields.nextAction} name="nextActionWhat" required />
            <StaffPicker initialUserId={nextAction.whoId} label={t.fields.nextOwner} labelName="nextActionWhoLabel" locale={locale} name="nextActionWhoId" staff={staff} t={t.staffPicker} />
            <LabeledInput defaultValue={nextAction.when} label={`${t.fields.when} (${task.displayTimeZone})`} name="nextActionWhen" required type="datetime-local" />
          </div>
        ) : null}
        <Label className="grid gap-1 text-sm font-medium">
          {t.fields.statusNote}
          <Textarea className="min-h-20 bg-surface" name="statusNote" required />
        </Label>
        <Button size="sm" type="submit" variant={status === 'DONE' ? 'default' : 'outline'}>{label}</Button>
      </form>
    </details>
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
