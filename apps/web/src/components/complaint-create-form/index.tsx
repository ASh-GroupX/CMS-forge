'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { complaintCreateText } from '../../i18n/staff-complaint-create';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import {
  createStaffComplaint,
  type ComplaintStatus,
  type StaffApiFieldError,
  type StaffComplaintCreateRequest,
} from '../../lib/staff-complaints-api';

export type CreateFormPreviewState = 'validation' | 'success' | 'error' | 'loading' | 'network';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; referenceNumber: string; status: ComplaintStatus }
  | { kind: 'validation'; fieldErrors: StaffApiFieldError[] }
  | { kind: 'error'; network: boolean };

export function ComplaintCreateForm({
  locale,
  state,
}: {
  locale: Locale;
  state?: CreateFormPreviewState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = shell.createForm;
  const extra = complaintCreateText[locale];
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const visibleState = submitState.kind === 'idle' ? previewState(state, locale) : submitState;
  const fieldErrors = visibleState.kind === 'validation' ? visibleState.fieldErrors : [];
  const preserveInput = visibleState.kind !== 'idle';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState({ kind: 'loading' });
    const { branchId, complaint } = buildStaffComplaintCreateSubmission(new FormData(event.currentTarget));
    const result = await createStaffComplaint(branchId, complaint);
    if (result.ok) {
      setSubmitState({
        kind: 'success',
        referenceNumber: result.data.complaint.referenceNumber,
        status: result.data.complaint.status,
      });
      return;
    }
    if (result.error.fieldErrors?.length) {
      setSubmitState({ kind: 'validation', fieldErrors: result.error.fieldErrors });
      return;
    }
    setSubmitState({ kind: 'error', network: result.error.kind === 'network' });
  }

  return (
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-slate-600">{t.subtitle}</p>
      </CardHeader>
      <CreateSubmitMessage locale={locale} state={visibleState} />
      <CardContent>
        <form className="grid gap-3 p-4 md:grid-cols-2" onSubmit={onSubmit}>
          <TextField error={fieldError(fieldErrors, 'customerName')} label={extra.fields.customerName} name="customerName" value={preserveInput ? extra.sampleCustomer : ''} />
          <TextField error={fieldError(fieldErrors, 'customerPhone')} label={extra.fields.customerPhone} name="customerPhone" type="tel" value={preserveInput ? extra.samplePhone : ''} />
          <TextField error={fieldError(fieldErrors, 'customerNumber')} label={extra.fields.customerNumber} name="customerNumber" value="" />
          <SelectField choose={t.choose} error={fieldError(fieldErrors, 'categoryId')} label={t.fields.category} name="categoryId" preserve={preserveInput} sampleOption={t.sampleOption} />
          <SelectField choose={t.choose} error={fieldError(fieldErrors, 'subcategoryId')} label={extra.fields.subcategory} name="subcategoryId" preserve={preserveInput} sampleOption={t.sampleOption} />
          <label className="grid gap-1 text-sm font-medium">
            {t.fields.severity}
            <select className="rounded-sm border border-slate-300 px-2 py-2" name="severity" defaultValue={preserveInput ? 'HIGH' : ''}>
              <option value="">{t.choose}</option>
              <option value="HIGH">{t.sampleOption}</option>
            </select>
            <FieldError message={fieldError(fieldErrors, 'severity')} />
          </label>
          <SelectField choose={t.choose} error={fieldError(fieldErrors, 'branchId')} label={t.fields.branch} name="branchId" preserve={preserveInput} sampleOption={t.sampleOption} />
          <div className="grid gap-1">
            <Label htmlFor="incidentAt">{t.fields.incidentDate}</Label>
            <Input id="incidentAt" name="incidentAt" defaultValue={preserveInput ? '2026-06-19' : ''} type="date" />
            <FieldError message={fieldError(fieldErrors, 'incidentAt')} />
          </div>
          <TextField error={fieldError(fieldErrors, 'subject')} label={t.fields.subject} name="subject" value={preserveInput ? t.sampleSubject : ''} wide />
          <div className="grid gap-1 md:col-span-2">
            <Label htmlFor="description">{t.fields.description}</Label>
            <Textarea id="description" name="description" defaultValue={preserveInput ? t.sampleDescription : ''} />
            <FieldError message={fieldError(fieldErrors, 'description') ?? (state === 'validation' ? t.validation.vinRequired : undefined)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input className="size-4" name="vehicleRelated" type="checkbox" defaultChecked={preserveInput} />
            {extra.fields.vehicleRelated}
          </label>
          <TextField error={fieldError(fieldErrors, 'vehicleVin')} label={extra.fields.vehicleVin} name="vehicleVin" value={preserveInput ? 'SEEDDEMO00001' : ''} wide />
          <Button className="md:col-span-2" disabled={visibleState.kind === 'loading'} type="submit">
            {visibleState.kind === 'loading' ? extra.submitting : extra.submit}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function buildStaffComplaintCreateSubmission(formData: FormData): {
  branchId: string;
  complaint: StaffComplaintCreateRequest;
} {
  return {
    branchId: textValue(formData, 'branchId'),
    complaint: {
      customerName: textValue(formData, 'customerName'),
      customerPhone: optionalTextValue(formData, 'customerPhone'),
      customerNumber: optionalTextValue(formData, 'customerNumber'),
      categoryId: textValue(formData, 'categoryId'),
      subcategoryId: textValue(formData, 'subcategoryId'),
      description: textValue(formData, 'description'),
      incidentAt: incidentAtValue(textValue(formData, 'incidentAt')),
      subject: textValue(formData, 'subject'),
      severity: textValue(formData, 'severity') as StaffComplaintCreateRequest['severity'],
      vehicleRelated: formData.get('vehicleRelated') === 'on',
      vehicleVin: optionalTextValue(formData, 'vehicleVin'),
      vehicleId: null,
    },
  };
}

function TextField({ error, label, name, type = 'text', value, wide = false }: { error: string | undefined; label: string; name: string; type?: string; value: string; wide?: boolean }) {
  return (
    <div className={`grid gap-1 ${wide ? 'md:col-span-2' : ''}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={value} type={type} />
      <FieldError message={error} />
    </div>
  );
}

function SelectField({ choose, error, label, name, preserve, sampleOption }: { choose: string; error: string | undefined; label: string; name: string; preserve: boolean; sampleOption: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="rounded-sm border border-slate-300 px-2 py-2" name={name} defaultValue={preserve ? sampleValue(name) : ''}>
        <option value="">{choose}</option>
        <option value={sampleValue(name)}>{sampleOption}</option>
      </select>
      <FieldError message={error} />
    </label>
  );
}

function CreateSubmitMessage({ locale, state }: { locale: Locale; state: SubmitState }) {
  const t = complaintCreateText[locale];
  if (state.kind === 'idle') return null;
  if (state.kind === 'success') {
    return (
      <p className="m-4 rounded-sm border border-status-success bg-status-success/10 px-3 py-2 text-sm text-status-success" role="status">
        {t.success}. {t.reference}: {state.referenceNumber}. {t.status}: {state.status}.
      </p>
    );
  }
  const message = state.kind === 'loading' ? t.submitting : state.kind === 'validation' ? t.validation : state.network ? t.network : t.error;
  return (
    <p className="m-4 rounded-sm border border-status-error bg-status-error/10 px-3 py-2 text-sm text-status-error" role={state.kind === 'loading' ? 'status' : 'alert'}>
      {message}
    </p>
  );
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <span className="text-xs font-semibold text-status-error">{message}</span> : null;
}

function previewState(state: CreateFormPreviewState | undefined, locale: Locale): SubmitState {
  if (state === 'success') return { kind: 'success', referenceNumber: 'CMP-2026-001', status: 'SUBMITTED' };
  if (state === 'validation') return { kind: 'validation', fieldErrors: [{ field: 'customerPhone', code: 'REQUIRED', message: staffShellText[locale].createForm.validation.required }] };
  if (state === 'loading') return { kind: 'loading' };
  if (state === 'network') return { kind: 'error', network: true };
  if (state === 'error') return { kind: 'error', network: false };
  return { kind: 'idle' };
}

function fieldError(errors: StaffApiFieldError[], field: string): string | undefined {
  return errors.find((error) => error.field === field)?.message;
}

function textValue(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalTextValue(formData: FormData, field: string): string | null {
  return textValue(formData, field) || null;
}

function incidentAtValue(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
}

function sampleValue(name: string): string {
  if (name === 'branchId') return 'branch_main';
  if (name === 'subcategoryId') return 'cat_engine';
  return 'cat_parent';
}
