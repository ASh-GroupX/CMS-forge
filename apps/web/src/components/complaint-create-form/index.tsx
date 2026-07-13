'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, StateBlock } from '../shared/ui-primitives';
import { LocalizedFileInput } from '../shared/localized-file-input';
import { complaintStatusLabel } from '../../i18n/domain-labels';
import { complaintCreateText } from '../../i18n/staff-complaint-create';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { staffAttachmentAccept, staffAttachmentFiles, uploadStaffComplaintAttachments } from '../../lib/staff-attachments-api';
import type { ComplaintFormOption, ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import {
  createStaffComplaint,
  type ComplaintStatus,
  type DmsCustomerVehicleMatch,
  type StaffApiFieldError,
  type StaffComplaintCreateRequest,
} from '../../lib/staff-complaints-api';
import type { LookupSelection } from '../customer-vehicle-lookup';

export type CreateFormFixtureState = 'validation' | 'success' | 'error' | 'loading' | 'network';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; referenceNumber: string; status: ComplaintStatus; attachmentCount: number; failedAttachmentCount: number }
  | { kind: 'validation'; fieldErrors: StaffApiFieldError[] }
  | { kind: 'error'; network: boolean };

export function ComplaintCreateForm({
  locale,
  lookupSelection,
  options,
  state,
}: {
  locale: Locale;
  lookupSelection?: LookupSelection | null | undefined;
  options?: ComplaintFormOptions | null | undefined;
  state?: CreateFormFixtureState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = shell.createForm;
  const extra = complaintCreateText[locale];
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const visibleState = submitState.kind === 'idle' ? previewState(state, locale) : submitState;
  const fieldErrors = visibleState.kind === 'validation' ? visibleState.fieldErrors : [];
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const field = fieldErrors[0]?.field;
    if (!field) return;
    const control = formRef.current?.elements.namedItem(field);
    if (control instanceof HTMLElement) control.focus();
  }, [fieldErrors]);
  const selectedMatch = lookupSelection?.source === 'DMS' ? lookupSelection.match : null;
  const sourceState = selectedMatch ? 'dms' : lookupSelection?.source === 'MANUAL' ? 'manual' : 'none';
  const defaults = formDefaults(selectedMatch);
  const branches = options?.branches ?? [];
  const categories = options?.categories ?? [];
  const subcategories = categories.filter((item) => item.parentId);
  const categoryOptions = categories.filter((item) => !item.parentId);
  const severityOptions: ComplaintFormOptions['severities'] = options?.severities ?? ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState({ kind: 'loading' });
    const formData = new FormData(event.currentTarget);
    const { branchId, complaint } = buildStaffComplaintCreateSubmission(formData);
    const result = await createStaffComplaint(branchId, complaint);
    if (result.ok) {
      const attachments = await uploadStaffComplaintAttachments(result.data.complaint.id, staffAttachmentFiles(formData));
      setSubmitState({
        kind: 'success',
        attachmentCount: attachments.uploadedCount,
        failedAttachmentCount: attachments.failedCount,
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
    <Card aria-label={t.title} className="rounded-md border-line-subtle bg-surface shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-line-subtle p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-content-muted">{t.subtitle}</p>
      </CardHeader>
      <CreateSubmitMessage locale={locale} state={visibleState} />
      <CardContent className="grid gap-4 p-4">
        <StateBlock message={extra.source[sourceState]} title={extra.source.title} />
        <form className="grid gap-3 md:grid-cols-2" key={defaults.key} onSubmit={onSubmit} ref={formRef}>
          <input name="customerSource" type="hidden" value={defaults.customerSource} />
          {defaults.vehicleSource ? <input name="vehicleSource" type="hidden" value={defaults.vehicleSource} /> : null}
          <input name="vehiclePlate" type="hidden" value={defaults.vehiclePlate} />
          <input name="vehicleBrand" type="hidden" value={defaults.vehicleBrand} />
          <input name="vehicleModel" type="hidden" value={defaults.vehicleModel} />
          <input name="vehicleModelYear" type="hidden" value={defaults.vehicleModelYear} />
          <TextField error={fieldError(fieldErrors, 'customerName')} label={extra.fields.customerName} name="customerName" value={defaults.customerName} />
          <TextField error={fieldError(fieldErrors, 'customerPhone')} label={extra.fields.customerPhone} name="customerPhone" type="tel" value={defaults.customerPhone} />
          <TextField error={fieldError(fieldErrors, 'customerNumber')} label={extra.fields.customerNumber} name="customerNumber" value={defaults.customerNumber} />
          <SelectField choose={t.choose} error={fieldError(fieldErrors, 'categoryId')} label={t.fields.category} locale={locale} name="categoryId" options={categoryOptions} />
          <SelectField choose={t.choose} error={fieldError(fieldErrors, 'subcategoryId')} label={extra.fields.subcategory} locale={locale} name="subcategoryId" options={subcategories.length ? subcategories : categories} />
          <Field error={fieldError(fieldErrors, 'severity')} id="severity" label={t.fields.severity}>
            <select className="rounded-sm border border-line-subtle bg-surface px-2 py-2" id="severity" name="severity" defaultValue="">
              <option value="">{t.choose}</option>
              {severityOptions.map((severity) => <option key={severity} value={severity}>{extra.severityLabels[severity]}</option>)}
            </select>
          </Field>
          <SelectField choose={t.choose} error={fieldError(fieldErrors, 'branchId')} label={t.fields.branch} locale={locale} name="branchId" options={branches} />
          <Field error={fieldError(fieldErrors, 'incidentAt')} id="incidentAt" label={t.fields.incidentDate}>
            <Input id="incidentAt" name="incidentAt" defaultValue={defaults.incidentAt} type="date" />
          </Field>
          <TextField error={fieldError(fieldErrors, 'subject')} label={t.fields.subject} name="subject" value={defaults.subject} wide />
          <Field className="md:col-span-2" error={fieldError(fieldErrors, 'description') ?? (state === 'validation' ? t.validation.vinRequired : undefined)} id="description" label={t.fields.description}>
            <Textarea id="description" name="description" defaultValue={defaults.description} />
          </Field>
          <section aria-label={extra.attachments.label} className="grid gap-2 rounded-md border border-line-subtle bg-surface-raised p-3 md:col-span-2">
            <Field id="attachments" label={extra.attachments.label}>
              <LocalizedFileInput accept={staffAttachmentAccept} id="attachments" locale={locale} multiple name="attachments" />
            </Field>
            <p className="text-xs text-content-muted">{extra.attachments.rules}</p>
            <ul className="grid gap-1 text-xs text-content-muted">
              {extra.attachments.guidance.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </section>
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input className="size-4" name="vehicleRelated" type="checkbox" defaultChecked={defaults.vehicleRelated} />
            {extra.fields.vehicleRelated}
          </label>
          <TextField error={fieldError(fieldErrors, 'vehicleVin')} label={extra.fields.vehicleVin} name="vehicleVin" value={defaults.vehicleVin} wide />
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
  const vehicleRelated = formData.get('vehicleRelated') === 'on';
  const complaint: StaffComplaintCreateRequest = {
    customerName: textValue(formData, 'customerName'),
    customerPhone: optionalTextValue(formData, 'customerPhone'),
    customerNumber: optionalTextValue(formData, 'customerNumber'),
    categoryId: textValue(formData, 'categoryId'),
    subcategoryId: textValue(formData, 'subcategoryId'),
    description: textValue(formData, 'description'),
    incidentAt: incidentAtValue(textValue(formData, 'incidentAt')),
    subject: textValue(formData, 'subject'),
    severity: textValue(formData, 'severity') as StaffComplaintCreateRequest['severity'],
    vehicleRelated,
    vehicleVin: optionalTextValue(formData, 'vehicleVin'),
    vehicleId: null,
  };
  const customerSource = dataSourceValue(formData, 'customerSource');
  const vehicleSource = vehicleRelated ? dataSourceValue(formData, 'vehicleSource') : undefined;
  const vehiclePlate = optionalTextValue(formData, 'vehiclePlate');
  const vehicleBrand = optionalTextValue(formData, 'vehicleBrand');
  const vehicleModel = optionalTextValue(formData, 'vehicleModel');
  const vehicleModelYear = optionalNumberValue(formData, 'vehicleModelYear');
  if (customerSource) complaint.customerSource = customerSource;
  if (vehicleSource) complaint.vehicleSource = vehicleSource;
  if (vehiclePlate) complaint.vehiclePlate = vehiclePlate;
  if (vehicleBrand) complaint.vehicleBrand = vehicleBrand;
  if (vehicleModel) complaint.vehicleModel = vehicleModel;
  if (vehicleModelYear !== null) complaint.vehicleModelYear = vehicleModelYear;
  return {
    branchId: textValue(formData, 'branchId'),
    complaint,
  };
}

function TextField({ error, label, name, type = 'text', value, wide = false }: { error: string | undefined; label: string; name: string; type?: string; value: string; wide?: boolean }) {
  return (
    <Field className={wide ? 'md:col-span-2' : ''} error={error} id={name} label={label}>
      <Input id={name} name={name} defaultValue={value} type={type} />
    </Field>
  );
}

function SelectField({ choose, error, label, locale, name, options }: { choose: string; error: string | undefined; label: string; locale: Locale; name: string; options: ComplaintFormOption[] }) {
  return (
    <Field error={error} id={name} label={label}>
      <select className="rounded-sm border border-line-subtle bg-surface px-2 py-2" id={name} name={name} defaultValue="">
        <option value="">{choose}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{locale === 'ar' ? option.nameAr : option.nameEn}</option>)}
      </select>
    </Field>
  );
}

function CreateSubmitMessage({ locale, state }: { locale: Locale; state: SubmitState }) {
  const t = complaintCreateText[locale];
  if (state.kind === 'idle') return null;
  if (state.kind === 'success') {
    return (
      <p className="m-4 rounded-sm border border-status-success-border bg-status-success-bg px-3 py-2 text-sm text-status-success" role="status">
        {t.success}. {t.reference}: {state.referenceNumber}. {t.status}: {complaintStatusLabel(locale, state.status)}.
        {state.attachmentCount ? ` ${t.attachments.uploaded}: ${state.attachmentCount}.` : ''}
        {state.failedAttachmentCount ? ` ${t.attachments.partialFailure}: ${state.failedAttachmentCount}.` : ''}
      </p>
    );
  }
  const message = state.kind === 'loading' ? t.submitting : state.kind === 'validation' ? t.validation : state.network ? t.network : t.error;
  if (state.kind === 'validation') {
    return (
      <section className="m-4 rounded-sm border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error" role="alert">
        <p className="font-semibold">{t.errorSummary}</p>
        <p className="mt-1">{message}</p>
        <ul className="mt-2 grid gap-1">
          {state.fieldErrors.map((error) => <li key={`${error.field}-${error.code}`}><a className="underline" href={`#${error.field}`}>{error.message}</a></li>)}
        </ul>
      </section>
    );
  }
  return (
    <p className="m-4 rounded-sm border border-status-error-border bg-status-error-bg px-3 py-2 text-sm text-status-error" role={state.kind === 'loading' ? 'status' : 'alert'}>
      {message}
    </p>
  );
}

function previewState(state: CreateFormFixtureState | undefined, locale: Locale): SubmitState {
  if (state === 'success') return { kind: 'success', attachmentCount: 1, failedAttachmentCount: 0, referenceNumber: 'CMP-2026-001', status: 'SUBMITTED' };
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

function optionalNumberValue(formData: FormData, field: string): number | null {
  const value = textValue(formData, field);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function dataSourceValue(formData: FormData, field: string): StaffComplaintCreateRequest['customerSource'] | undefined {
  const value = textValue(formData, field);
  return value === 'LOCAL' || value === 'MANUAL' || value === 'DMS' ? value : undefined;
}

function incidentAtValue(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
}

function formDefaults(selectedMatch: DmsCustomerVehicleMatch | null) {
  const hasVehicle = Boolean(selectedMatch?.vin || selectedMatch?.plateNumber || selectedMatch?.brand || selectedMatch?.model);
  return {
    key: selectedMatch ? `${selectedMatch.customerCode ?? ''}-${selectedMatch.primaryPhone}-${selectedMatch.vin ?? ''}` : 'manual',
    customerName: selectedMatch?.customerName ?? '',
    customerPhone: selectedMatch?.primaryPhone ?? '',
    customerNumber: selectedMatch?.customerCode ?? '',
    customerSource: selectedMatch ? 'DMS' : 'MANUAL',
    description: '',
    incidentAt: '',
    subject: '',
    vehicleBrand: selectedMatch?.brand ?? '',
    vehicleModel: selectedMatch?.model ?? '',
    vehicleModelYear: selectedMatch?.modelYear === undefined ? '' : String(selectedMatch.modelYear),
    vehiclePlate: selectedMatch?.plateNumber ?? '',
    vehicleRelated: hasVehicle,
    vehicleSource: hasVehicle ? 'DMS' : '',
    vehicleVin: selectedMatch?.vin ?? '',
  };
}
