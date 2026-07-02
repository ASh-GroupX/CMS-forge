'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

export type CreateFormPreviewState = 'validation' | 'success' | 'error' | 'loading' | 'network';

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
  state?: CreateFormPreviewState | undefined;
}) {
  const shell = staffShellText[locale];
  const t = shell.createForm;
  const extra = complaintCreateText[locale];
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const visibleState = submitState.kind === 'idle' ? previewState(state, locale) : submitState;
  const fieldErrors = visibleState.kind === 'validation' ? visibleState.fieldErrors : [];
  const preserveInput = visibleState.kind !== 'idle';
  const selectedMatch = lookupSelection?.source === 'DMS' ? lookupSelection.match : null;
  const sourceState = selectedMatch ? 'dms' : lookupSelection?.source === 'MANUAL' ? 'manual' : 'none';
  const defaults = formDefaults({ extra, preserveInput, selectedMatch, t });
  const branches = options?.branches ?? [];
  const categories = options?.categories ?? [];
  const subcategories = categories.filter((item) => item.parentId);
  const categoryOptions = categories.filter((item) => !item.parentId);
  const severityOptions = options?.severities ?? ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

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
    <Card aria-label={t.title} className="rounded-md border-slate-200 bg-white shadow-sm" dir={shell.dir}>
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="text-lg tracking-normal">{t.title}</CardTitle>
        <p className="text-sm text-slate-600">{t.subtitle}</p>
      </CardHeader>
      <CreateSubmitMessage locale={locale} state={visibleState} />
      <p className="mx-4 mt-4 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" role="status">
        <span className="font-semibold">{extra.source.title}: </span>{extra.source[sourceState]}
      </p>
      <CardContent>
        <form className="grid gap-3 p-4 md:grid-cols-2" key={defaults.key} onSubmit={onSubmit}>
          <input name="customerSource" type="hidden" value={defaults.customerSource} />
          {defaults.vehicleSource ? <input name="vehicleSource" type="hidden" value={defaults.vehicleSource} /> : null}
          <input name="vehiclePlate" type="hidden" value={defaults.vehiclePlate} />
          <input name="vehicleBrand" type="hidden" value={defaults.vehicleBrand} />
          <input name="vehicleModel" type="hidden" value={defaults.vehicleModel} />
          <input name="vehicleModelYear" type="hidden" value={defaults.vehicleModelYear} />
          <TextField error={fieldError(fieldErrors, 'customerName')} label={extra.fields.customerName} name="customerName" value={defaults.customerName} />
          <TextField error={fieldError(fieldErrors, 'customerPhone')} label={extra.fields.customerPhone} name="customerPhone" type="tel" value={defaults.customerPhone} />
          <TextField error={fieldError(fieldErrors, 'customerNumber')} label={extra.fields.customerNumber} name="customerNumber" value={defaults.customerNumber} />
          <SelectField choose={t.choose} error={fieldError(fieldErrors, 'categoryId')} label={t.fields.category} name="categoryId" options={categoryOptions} preserve={preserveInput} />
          <SelectField choose={t.choose} error={fieldError(fieldErrors, 'subcategoryId')} label={extra.fields.subcategory} name="subcategoryId" options={subcategories.length ? subcategories : categories} preserve={preserveInput} />
          <label className="grid gap-1 text-sm font-medium">
            {t.fields.severity}
            <select className="rounded-sm border border-slate-300 px-2 py-2" name="severity" defaultValue={preserveInput ? 'HIGH' : ''}>
              <option value="">{t.choose}</option>
              {severityOptions.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
            </select>
            <FieldError message={fieldError(fieldErrors, 'severity')} />
          </label>
          <SelectField choose={t.choose} error={fieldError(fieldErrors, 'branchId')} label={t.fields.branch} name="branchId" options={branches} preserve={preserveInput} />
          <div className="grid gap-1">
            <Label htmlFor="incidentAt">{t.fields.incidentDate}</Label>
            <Input id="incidentAt" name="incidentAt" defaultValue={defaults.incidentAt} type="date" />
            <FieldError message={fieldError(fieldErrors, 'incidentAt')} />
          </div>
          <TextField error={fieldError(fieldErrors, 'subject')} label={t.fields.subject} name="subject" value={defaults.subject} wide />
          <div className="grid gap-1 md:col-span-2">
            <Label htmlFor="description">{t.fields.description}</Label>
            <Textarea id="description" name="description" defaultValue={defaults.description} />
            <FieldError message={fieldError(fieldErrors, 'description') ?? (state === 'validation' ? t.validation.vinRequired : undefined)} />
          </div>
          <div className="grid gap-1 md:col-span-2">
            <Label htmlFor="attachments">{extra.attachments.label}</Label>
            <Input accept={staffAttachmentAccept} id="attachments" multiple name="attachments" type="file" />
            <p className="text-xs text-slate-600">{extra.attachments.rules}</p>
          </div>
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
    <div className={`grid gap-1 ${wide ? 'md:col-span-2' : ''}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={value} type={type} />
      <FieldError message={error} />
    </div>
  );
}

function SelectField({ choose, error, label, name, options, preserve }: { choose: string; error: string | undefined; label: string; name: string; options: ComplaintFormOption[]; preserve: boolean }) {
  const value = preserve ? options[0]?.id ?? '' : '';
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="rounded-sm border border-slate-300 px-2 py-2" name={name} defaultValue={value}>
        <option value="">{choose}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.nameEn}</option>)}
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
        {state.attachmentCount ? ` ${t.attachments.uploaded}: ${state.attachmentCount}.` : ''}
        {state.failedAttachmentCount ? ` ${t.attachments.partialFailure}: ${state.failedAttachmentCount}.` : ''}
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

function formDefaults({
  extra,
  preserveInput,
  selectedMatch,
  t,
}: {
  extra: typeof complaintCreateText[Locale];
  preserveInput: boolean;
  selectedMatch: DmsCustomerVehicleMatch | null;
  t: typeof staffShellText[Locale]['createForm'];
}) {
  const hasVehicle = Boolean(selectedMatch?.vin || selectedMatch?.plateNumber || selectedMatch?.brand || selectedMatch?.model);
  return {
    key: selectedMatch ? `${selectedMatch.customerCode ?? ''}-${selectedMatch.primaryPhone}-${selectedMatch.vin ?? ''}` : preserveInput ? 'preview' : 'manual',
    customerName: selectedMatch?.customerName ?? (preserveInput ? extra.sampleCustomer : ''),
    customerPhone: selectedMatch?.primaryPhone ?? (preserveInput ? extra.samplePhone : ''),
    customerNumber: selectedMatch?.customerCode ?? '',
    customerSource: selectedMatch ? 'DMS' : 'MANUAL',
    description: preserveInput ? t.sampleDescription : '',
    incidentAt: preserveInput ? '2026-06-19' : '',
    subject: preserveInput ? t.sampleSubject : '',
    vehicleBrand: selectedMatch?.brand ?? '',
    vehicleModel: selectedMatch?.model ?? '',
    vehicleModelYear: selectedMatch?.modelYear === undefined ? '' : String(selectedMatch.modelYear),
    vehiclePlate: selectedMatch?.plateNumber ?? '',
    vehicleRelated: hasVehicle || preserveInput,
    vehicleSource: hasVehicle ? 'DMS' : preserveInput ? 'MANUAL' : '',
    vehicleVin: selectedMatch?.vin ?? (preserveInput ? 'SEEDDEMO00001' : ''),
  };
}
