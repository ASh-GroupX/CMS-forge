'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { StaffPicker, type StaffPickerText } from '../shared/staff-picker';
import type { Locale } from '../../i18n/staff-shell';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { CaseCapaAction } from '../../lib/staff-detail-api';
import { createCaseCapa } from '../../lib/staff-detail-api';

export type CapaText = {
  title: string;
  fields: { owner: string; rootCause: string; correctiveAction: string; preventiveAction: string; dueAt: string; status: string };
  staffPicker: StaffPickerText;
  actions: { create: string };
  statusLabels: Record<CaseCapaAction['status'], string>;
  states: { empty: string; error: string; loading: string; success: string };
};

export function CaseCapaPanel({ caseId, caseOwnerId, items, locale, staff, text }: { caseId?: string | undefined; caseOwnerId?: string | undefined; items: CaseCapaAction[]; locale: Locale; staff?: AssignableStaff[] | null | undefined; text: CapaText }) {
  const [rows, setRows] = useState(items);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>(caseId ? 'idle' : 'error');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!caseId) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setStatus('loading');
    try {
      const created = await createCaseCapa(caseId, {
        ownerId: optionalText(form.get('ownerId')),
        rootCause: String(form.get('rootCause') ?? ''),
        correctiveAction: String(form.get('correctiveAction') ?? ''),
        preventiveAction: String(form.get('preventiveAction') ?? ''),
        dueAt: `${String(form.get('dueAt') ?? '')}T12:00:00.000Z`,
        status: String(form.get('status') ?? 'OPEN') as CaseCapaAction['status'],
      });
      setRows((current) => [...current, created]);
      formElement.reset();
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label={text.title}>
      <h3 className="text-sm font-semibold">{text.title}</h3>
      {rows.length ? (
        <ol className="mt-3 grid gap-2 text-sm text-slate-700">
          {rows.map((item) => (
            <li className="rounded-sm border border-slate-200 bg-white px-3 py-2" key={item.id}>
              <div className="font-medium text-slate-900">{item.rootCause}</div>
              <div>{item.correctiveAction}</div>
              <div>{item.preventiveAction}</div>
              <div className="mt-1 text-xs text-slate-500">{item.ownerName} - {text.statusLabels[item.status]} - {item.dueAt.slice(0, 10)}</div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-slate-600" role="status">{text.states.empty}</p>
      )}
      <form className="mt-3 grid gap-2" onSubmit={submit}>
        <StaffPicker initialUserId={caseOwnerId ?? ''} label={text.fields.owner} labelName="ownerLabel" locale={locale} name="ownerId" staff={staff} t={text.staffPicker} />
        <Field id="rootCause" label={text.fields.rootCause} />
        <Field id="correctiveAction" label={text.fields.correctiveAction} />
        <Field id="preventiveAction" label={text.fields.preventiveAction} />
        <div className="grid gap-1">
          <Label htmlFor="capaDueAt">{text.fields.dueAt}</Label>
          <Input id="capaDueAt" name="dueAt" required type="date" />
        </div>
        <div className="grid gap-1">
          <Label>{text.fields.status}</Label>
          <Select defaultValue="OPEN" name="status">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">{text.statusLabels.OPEN}</SelectItem>
              <SelectItem value="IN_PROGRESS">{text.statusLabels.IN_PROGRESS}</SelectItem>
              <SelectItem value="DONE">{text.statusLabels.DONE}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button disabled={!caseId || status === 'loading'} type="submit">{status === 'loading' ? text.states.loading : text.actions.create}</Button>
        {status === 'error' ? <p className="text-sm text-destructive" role="alert">{text.states.error}</p> : null}
        {status === 'success' ? <p className="text-sm text-muted-foreground" role="status">{text.states.success}</p> : null}
      </form>
    </section>
  );
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return text || null;
}

function Field({ id, label }: { id: 'rootCause' | 'correctiveAction' | 'preventiveAction'; label: string }) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={`capa-${id}`}>{label}</Label>
      <Textarea id={`capa-${id}`} name={id} required />
    </div>
  );
}
