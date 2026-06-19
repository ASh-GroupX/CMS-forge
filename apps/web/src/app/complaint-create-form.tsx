'use client';

import React, { useState } from 'react';
import { complaintCreateText } from '../i18n/staff-complaint-create';
import { staffShellText, type Locale } from '../i18n/staff-shell';
import {
  createStaffComplaint,
  type ComplaintStatus,
  type StaffApiFieldError,
  type StaffComplaintCreateRequest,
} from '../lib/staff-complaints-api';

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
  const t = staffShellText[locale].createForm;
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
    <section className="rounded-md border border-slate-200 bg-white shadow-sm" aria-label={t.title}>
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-semibold tracking-normal">{t.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{t.subtitle}</p>
      </div>
      <CreateSubmitMessage locale={locale} state={visibleState} />
      <form className="grid gap-3 p-4 md:grid-cols-2" onSubmit={onSubmit}>
        <TextField
          error={fieldError(fieldErrors, 'customerName')}
          label={extra.fields.customerName}
          name="customerName"
          value={preserveInput ? extra.sampleCustomer : ''}
        />
        <TextField
          error={fieldError(fieldErrors, 'customerPhone')}
          label={extra.fields.customerPhone}
          name="customerPhone"
          type="tel"
          value={preserveInput ? extra.samplePhone : ''}
        />
        <TextField
          error={fieldError(fieldErrors, 'customerNumber')}
          label={extra.fields.customerNumber}
          name="customerNumber"
          value=""
        />
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
        <label className="grid gap-1 text-sm font-medium">
          {t.fields.incidentDate}
          <input className="rounded-sm border border-slate-300 px-2 py-2" name="incidentAt" defaultValue={preserveInput ? '2026-06-19' : ''} type="date" />
          <FieldError message={fieldError(fieldErrors, 'incidentAt')} />
        </label>
        <TextField error={fieldError(fieldErrors, 'subject')} label={t.fields.subject} name="subject" value={preserveInput ? t.sampleSubject : ''} wide />
        <label className="grid gap-1 text-sm font-medium md:col-span-2">
          {t.fields.description}
          <textarea className="min-h-24 rounded-sm border border-slate-300 px-2 py-2" name="description" defaultValue={preserveInput ? t.sampleDescription : ''} />
          <FieldError message={fieldError(fieldErrors, 'description') ?? (state === 'validation' ? t.validation.vinRequired : undefined)} />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
          <input className="size-4" name="vehicleRelated" type="checkbox" defaultChecked={preserveInput} />
          {extra.fields.vehicleRelated}
        </label>
        <TextField error={fieldError(fieldErrors, 'vehicleVin')} label={extra.fields.vehicleVin} name="vehicleVin" value={preserveInput ? 'SEEDDEMO00001' : ''} wide />
        <button className="rounded-sm bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60 md:col-span-2" disabled={visibleState.kind === 'loading'} type="submit">
          {visibleState.kind === 'loading' ? extra.submitting : extra.submit}
        </button>
      </form>
    </section>
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

function TextField({
  error,
  label,
  name,
  type = 'text',
  value,
  wide = false,
}: {
  error: string | undefined;
  label: string;
  name: string;
  type?: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <label className={`grid gap-1 text-sm font-medium ${wide ? 'md:col-span-2' : ''}`}>
      {label}
      <input className="rounded-sm border border-slate-300 px-2 py-2" name={name} defaultValue={value} type={type} />
      <FieldError message={error} />
    </label>
  );
}

function SelectField({
  choose,
  error,
  label,
  name,
  preserve,
  sampleOption,
}: {
  choose: string;
  error: string | undefined;
  label: string;
  name: string;
  preserve: boolean;
  sampleOption: string;
}) {
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
      <p className="m-4 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
        {t.success}. {t.reference}: {state.referenceNumber}. {t.status}: {state.status}.
      </p>
    );
  }
  const message = state.kind === 'loading' ? t.submitting : state.kind === 'validation' ? t.validation : state.network ? t.network : t.error;
  return (
    <p className="m-4 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role={state.kind === 'loading' ? 'status' : 'alert'}>
      {message}
    </p>
  );
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <span className="text-xs font-semibold text-red-700">{message}</span> : null;
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
