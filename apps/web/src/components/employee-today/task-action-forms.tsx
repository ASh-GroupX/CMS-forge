'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { employeeTodayText } from '../../i18n/staff-employee-today';
import type { Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { RelatedRecordType, StaffRelatedRecord, StaffRelatedRecordOptions } from '../../lib/staff-related-records-api';
import type { StaffTask, StaffTaskStatus } from '../../lib/staff-tasks-api';

type EmployeeTodayText = (typeof employeeTodayText)[Locale];
export type TaskAction = (formData: FormData) => void | Promise<void>;

const RELATED_RECORD_TYPES: RelatedRecordType[] = ['CUSTOMER', 'COMPLAINT', 'CASE', 'DEAL'];

export function QuickAddForm({ action, locale, relatedRecords, staff, t }: { action: TaskAction; locale: Locale; relatedRecords?: StaffRelatedRecordOptions | null | undefined; staff?: AssignableStaff[] | null | undefined; t: EmployeeTodayText }) {
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
        <StaffPicker locale={locale} staff={staff} t={t} />
        <LabeledInput label={t.fields.when} name="when" required type="datetime-local" />
        <LabeledInput label={t.fields.due} name="dueAt" type="datetime-local" />
        <RelatedRecordPicker locale={locale} relatedRecords={relatedRecords} t={t} />
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

function RelatedRecordPicker({ locale, relatedRecords, t }: { locale: Locale; relatedRecords?: StaffRelatedRecordOptions | null | undefined; t: EmployeeTodayText }) {
  const listId = React.useId();
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const [type, setType] = React.useState<RelatedRecordType>('CUSTOMER');
  const [selectedLabel, setSelectedLabel] = React.useState('');
  const options = relatedRecords?.[type] ?? [];
  const selected = options.find((option) => relatedRecordLabel(option, locale) === selectedLabel);

  return (
    <div className="grid gap-2 md:col-span-2">
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${listId}-type`}>{t.fields.relatedTo}</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
            id={`${listId}-type`}
            name="relatedRecordType"
            onChange={(event) => { setType(event.currentTarget.value as RelatedRecordType); setSelectedLabel(''); }}
            value={type}
          >
            {RELATED_RECORD_TYPES.map((recordType) => <option key={recordType} value={recordType}>{t.recordTypes[recordType]}</option>)}
          </select>
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
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <select
                aria-describedby={`${listId}-selected`}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                id={`${listId}-record`}
                name="relatedRecordLabel"
                onChange={(event) => setSelectedLabel(event.currentTarget.value)}
                ref={selectRef}
                value={selectedLabel}
              >
                <option value="">{t.recordPicker.placeholder}</option>
                {options.map((option) => {
                  const label = relatedRecordLabel(option, locale);
                  return <option key={option.recordId} value={label}>{label}</option>;
                })}
              </select>
              <Button aria-label={t.recordPicker.clear} onClick={() => { setSelectedLabel(''); if (selectRef.current) selectRef.current.value = ''; }} type="button" variant="outline">
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground" id={`${listId}-selected`}>
              {selected ? t.recordPicker.selected.replace('{name}', selectedLabel) : t.recordPicker.prompt}
            </p>
          </div>
        )}
      </div>
      <input name="linkEntityType" type="hidden" value={selected ? selected.recordType : ''} />
      <input name="linkEntityId" type="hidden" value={selected?.recordId ?? ''} />
    </div>
  );
}

function StaffPicker({ locale, staff, t }: { locale: Locale; staff?: AssignableStaff[] | null | undefined; t: EmployeeTodayText }) {
  const listId = React.useId();
  const options = staff?.map((person) => ({ id: person.userId, label: staffLabel(person, locale) })) ?? [];
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const [selectedLabel, setSelectedLabel] = React.useState('');
  const selected = options.find((option) => option.label === selectedLabel);

  if (staff === undefined) return <PickerState label={t.fields.assignee} message={t.staffPicker.loading} />;
  if (staff === null) return <PickerState alert label={t.fields.assignee} message={t.staffPicker.error} />;
  if (staff.length === 0) return <PickerState label={t.fields.assignee} message={t.staffPicker.empty} />;

  return (
    <div className="grid gap-2">
      <Label htmlFor={`${listId}-input`}>{t.fields.assignee}</Label>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          aria-describedby={`${listId}-selected`}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          id={`${listId}-input`}
          name="assigneeLabel"
          onChange={(event) => setSelectedLabel(event.currentTarget.value)}
          ref={selectRef}
          required
          value={selectedLabel}
        >
          <option value="" disabled>{t.staffPicker.placeholder}</option>
          {options.map((option) => <option key={option.id} value={option.label}>{option.label}</option>)}
        </select>
        <Button aria-label={t.staffPicker.clear} onClick={() => { setSelectedLabel(''); if (selectRef.current) selectRef.current.value = ''; }} type="button" variant="outline">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <input name="whoId" type="hidden" value={selected?.id ?? ''} />
      <p className="text-xs text-muted-foreground" id={`${listId}-selected`}>
        {selected ? t.staffPicker.selected.replace('{name}', selected.label) : t.staffPicker.prompt}
      </p>
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

function staffLabel(person: AssignableStaff, locale: Locale): string {
  const name = locale === 'ar' ? person.displayNameAr : person.displayName;
  const role = locale === 'ar' ? person.roleAr : person.role;
  const branch = locale === 'ar' ? person.branchLabelAr : person.branchLabel;
  return [name, role, branch].filter(Boolean).join(' - ');
}

function relatedRecordLabel(record: StaffRelatedRecord, locale: Locale): string {
  const label = locale === 'ar' ? record.labelAr : record.label;
  const context = locale === 'ar' ? record.contextAr : record.context;
  return [label, context].filter(Boolean).join(' - ');
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
