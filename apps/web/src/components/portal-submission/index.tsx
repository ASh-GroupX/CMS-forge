'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { portalSubmissionText, type PortalLocale } from '../../i18n/portal-submission';
import {
  portalSubmissionAttachments,
  submitPortalComplaint,
  type PortalComplaintCreateRequest,
  type PortalFieldError,
  type PortalSubmissionOption,
  type PortalSubmissionOptions,
} from '../../lib/portal-submission-api';

export type PortalSubmissionPreviewState = 'loading' | 'validation' | 'success' | 'error';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; referenceNumber: string; attachmentCount: number }
  | { kind: 'validation'; fieldErrors: PortalFieldError[] }
  | { kind: 'error'; network: boolean };

export function PortalSubmissionScreen({
  locale,
  options = emptyOptions,
  reference,
  state,
}: {
  locale: PortalLocale;
  options?: PortalSubmissionOptions;
  reference?: string | undefined;
  state?: PortalSubmissionPreviewState | undefined;
}) {
  const t = portalSubmissionText[locale];
  const switchLocale = locale === 'ar' ? 'en' : 'ar';
  const categories = options.categories.filter((option) => !option.parentId);
  const subcategories = options.categories.filter((option) => option.parentId);
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const visibleState = submitState.kind === 'idle' ? previewState(state, reference, locale) : submitState;
  const fieldErrors = visibleState.kind === 'validation' ? visibleState.fieldErrors : [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const complaint = buildPortalComplaintSubmission(formData);
    const localErrors = validateSubmission(complaint);
    const attachmentResult = await portalSubmissionAttachments(portalAttachmentFiles(formData));
    if (!attachmentResult.ok) localErrors.push(attachmentResult.error);
    if (localErrors.length) {
      setSubmitState({ kind: 'validation', fieldErrors: localErrors });
      return;
    }
    if (!attachmentResult.ok) return;

    setSubmitState({ kind: 'loading' });
    const result = await submitPortalComplaint(attachmentResult.attachments.length ? { ...complaint, attachments: attachmentResult.attachments } : complaint);
    if (result.ok) {
      setSubmitState({ kind: 'success', referenceNumber: result.data.complaint.referenceNumber, attachmentCount: result.data.complaint.attachments?.length ?? 0 });
      return;
    }
    if (result.error.fieldErrors?.length || result.error.code === 'VALIDATION_FAILED') {
      setSubmitState({ kind: 'validation', fieldErrors: result.error.fieldErrors ?? [{ field: 'description', code: 'INVALID', message: result.error.message }] });
      return;
    }
    setSubmitState({ kind: 'error', network: result.error.kind === 'network' });
  }

  return (
    <main lang={t.lang} dir={t.dir} className="min-h-screen bg-neutral p-4 text-neutral-foreground md:p-6">
      <div className="mx-auto grid max-w-5xl gap-4">
        <Card className="rounded-md border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-4">
            <div>
              <CardTitle className="text-2xl tracking-normal">{t.title}</CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">{t.subtitle}</p>
            </div>
            <Button asChild size="sm" variant="outline" className="focus:ring-2 focus:ring-ring">
              <a href={`/portal?locale=${switchLocale}`} aria-label={t.switchLabel}>{t.switchTarget}</a>
            </Button>
          </CardHeader>
        </Card>

        <PortalSubmissionMessage locale={locale} state={visibleState} />

        <form className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2" onSubmit={onSubmit}>
          <FieldGroup title={t.sections.contact}>
            <TextField error={fieldError(fieldErrors, 'customerName', locale)} label={t.fields.customerName} name="customerName" />
            <TextField error={fieldError(fieldErrors, 'customerPhone', locale)} label={t.fields.customerPhone} name="customerPhone" type="tel" />
          </FieldGroup>

          <FieldGroup title={t.sections.complaint}>
            <SelectField choose={t.choices.choose} error={fieldError(fieldErrors, 'branchId', locale)} label={t.fields.branch} name="branchId" options={selectOptions(options.branches, locale)} />
            <SelectField choose={t.choices.choose} error={fieldError(fieldErrors, 'categoryId', locale)} label={t.fields.category} name="categoryId" options={selectOptions(categories, locale)} />
            <SelectField choose={t.choices.choose} error={fieldError(fieldErrors, 'subcategoryId', locale)} label={t.fields.subcategory} name="subcategoryId" options={selectOptions(subcategories, locale)} />
            <SelectField choose={t.choices.choose} error={fieldError(fieldErrors, 'severity', locale)} label={t.fields.severity} name="severity" options={options.severities.map((value) => ({ label: t.severityLabels[value], value }))} />
            <Label className="grid gap-1 text-sm font-medium">
              {t.fields.incidentAt}
              <Input name="incidentAt" type="date" />
              <FieldError message={fieldError(fieldErrors, 'incidentAt', locale)} />
            </Label>
            <TextField error={fieldError(fieldErrors, 'subject', locale)} label={t.fields.subject} name="subject" />
            <Label className="grid gap-1 text-sm font-medium md:col-span-2">
              {t.fields.description}
              <Textarea className="min-h-28" name="description" />
              <FieldError message={fieldError(fieldErrors, 'description', locale)} />
            </Label>
          </FieldGroup>

          <FieldGroup title={t.sections.vehicle}>
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Input className="size-4" name="vehicleRelated" type="checkbox" />
              {t.fields.vehicleRelated}
            </Label>
            <TextField error={fieldError(fieldErrors, 'vehicleVin', locale)} label={t.fields.vehicleVin} name="vehicleVin" />
          </FieldGroup>

          <FieldGroup title={t.sections.attachments}>
            <Label className="grid gap-1 text-sm font-medium md:col-span-2">
              {t.fields.attachment}
              <Input accept=".jpg,.jpeg,.png,.webp,.pdf,.mp3,.wav,.ogg,.mp4,.mov,.webm,image/jpeg,image/png,image/webp,application/pdf,audio/mpeg,audio/wav,audio/ogg,video/mp4,video/quicktime,video/webm" multiple name="attachments" type="file" />
              <FieldError message={fieldError(fieldErrors, 'attachments', locale)} />
            </Label>
            <p className="rounded-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 md:col-span-2">{t.attachmentDeferred}</p>
            <ul className="grid gap-1 text-sm text-slate-600 md:col-span-2">
              {t.rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </FieldGroup>

          <p className="rounded-sm bg-slate-100 px-3 py-2 text-sm text-slate-700 md:col-span-2">{t.privacy}</p>
          <Button className="focus:ring-2 focus:ring-ring md:col-span-2" disabled={visibleState.kind === 'loading'} type="submit">
            {visibleState.kind === 'loading' ? t.actions.submitting : t.actions.submit}
          </Button>
        </form>
      </div>
    </main>
  );
}

export function buildPortalComplaintSubmission(formData: FormData): PortalComplaintCreateRequest {
  return {
    customerName: textValue(formData, 'customerName'),
    customerPhone: textValue(formData, 'customerPhone'),
    categoryId: textValue(formData, 'categoryId'),
    subcategoryId: textValue(formData, 'subcategoryId'),
    description: textValue(formData, 'description'),
    incidentAt: incidentAtValue(textValue(formData, 'incidentAt')),
    branchId: textValue(formData, 'branchId'),
    subject: textValue(formData, 'subject'),
    severity: textValue(formData, 'severity') as PortalComplaintCreateRequest['severity'],
    vehicleRelated: formData.get('vehicleRelated') === 'on',
    vehicleVin: optionalTextValue(formData, 'vehicleVin'),
  };
}

function PortalSubmissionMessage({ locale, state }: { locale: PortalLocale; state: SubmitState }) {
  const t = portalSubmissionText[locale];
  if (state.kind === 'idle') return null;
  if (state.kind === 'success') {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900" role="status">
        {t.states.success}. {t.states.reference}: {state.referenceNumber}.
        {state.attachmentCount ? ` ${t.states.attachmentsUploaded}: ${state.attachmentCount}.` : ''}
      </p>
    );
  }
  const message = state.kind === 'loading' ? t.states.loading : state.kind === 'validation' ? t.states.validation : t.states.error;
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role={state.kind === 'loading' ? 'status' : 'alert'}>
      {message}
    </p>
  );
}

function FieldGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="grid content-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:col-span-2 md:grid-cols-2" aria-label={title}>
      <h2 className="text-sm font-semibold md:col-span-2">{title}</h2>
      {children}
    </section>
  );
}

function TextField({ error, label, name, type = 'text' }: { error?: string | undefined; label: string; name: string; type?: string }) {
  return (
    <Label className="grid gap-1 text-sm font-medium">
      {label}
      <Input name={name} type={type} />
      <FieldError message={error} />
    </Label>
  );
}

function SelectField({ choose, error, label, name, options }: { choose: string; error?: string | undefined; label: string; name: string; options: Array<{ label: string; value: string }> }) {
  return (
    <Label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue="" name={name}>
        <option value="">{choose}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <FieldError message={error} />
    </Label>
  );
}

function FieldError({ message }: { message?: string | undefined }) {
  return message ? <span className="text-xs font-semibold text-red-700">{message}</span> : null;
}

function validateSubmission(input: PortalComplaintCreateRequest): PortalFieldError[] {
  return ['customerName', 'customerPhone', 'categoryId', 'subcategoryId', 'description', 'incidentAt', 'branchId', 'subject', 'severity']
    .filter((field) => !String(input[field as keyof PortalComplaintCreateRequest] ?? '').trim())
    .map((field) => ({ field, code: 'REQUIRED', message: `${field} is required.` }));
}

function fieldError(errors: PortalFieldError[], field: string, locale: PortalLocale): string | undefined {
  const error = errors.find((item) => item.field === field);
  if (!error) return undefined;
  if (field === 'attachments') return portalSubmissionText[locale].validation.attachment;
  return error.code === 'REQUIRED' ? portalSubmissionText[locale].validation.required : portalSubmissionText[locale].validation.invalid;
}

function previewState(state: PortalSubmissionPreviewState | undefined, reference: string | undefined, locale: PortalLocale): SubmitState {
  if (state === 'success') return { kind: 'success', referenceNumber: reference ?? 'CMP-PORTAL-001', attachmentCount: 0 };
  if (state === 'validation') return { kind: 'validation', fieldErrors: [{ field: 'customerName', code: 'REQUIRED', message: portalSubmissionText[locale].validation.required }] };
  if (state === 'loading') return { kind: 'loading' };
  if (state === 'error') return { kind: 'error', network: false };
  return { kind: 'idle' };
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

function portalAttachmentFiles(formData: FormData): File[] {
  if (typeof File === 'undefined') return [];
  return formData.getAll('attachments').filter((value): value is File => value instanceof File && value.size > 0 && Boolean(value.name.trim()));
}

function selectOptions(options: PortalSubmissionOption[], locale: PortalLocale): Array<{ label: string; value: string }> {
  return options.map((option) => ({ label: locale === 'ar' ? option.nameAr : option.nameEn, value: option.id }));
}

const emptyOptions: PortalSubmissionOptions = { branches: [], categories: [], severities: [] };
