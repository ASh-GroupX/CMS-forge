'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { portalSubmissionText, type PortalLocale } from '../../i18n/portal-submission';
import {
  portalSubmissionAttachments,
  submitPortalComplaint,
  type PortalAttachmentWarning,
  type PortalComplaintCreateRequest,
  type PortalFieldError,
  type PortalSubmissionOption,
  type PortalSubmissionOptions,
} from '../../lib/portal-submission-api';

export type PortalSubmissionPreviewState = 'loading' | 'validation' | 'success' | 'error';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'options' }
  | { kind: 'success'; referenceNumber: string; attachmentCount: number; attachmentWarning?: PortalAttachmentWarning }
  | { kind: 'validation'; fieldErrors: PortalFieldError[] }
  | { kind: 'error'; network: boolean };

export function PortalSubmissionScreen({
  locale,
  attachmentWarning,
  options,
  reference,
  state,
}: {
  locale: PortalLocale;
  attachmentWarning?: PortalAttachmentWarning | undefined;
  options?: PortalSubmissionOptions | null | undefined;
  reference?: string | undefined;
  state?: PortalSubmissionPreviewState | undefined;
}) {
  const t = portalSubmissionText[locale];
  const resolvedOptions = options ?? emptyOptions;
  const categories = resolvedOptions.categories.filter((option) => !option.parentId);
  const subcategories = resolvedOptions.categories.filter((option) => option.parentId);
  const optionsUnavailable = !hasRequiredOptions(resolvedOptions);
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const visibleState = submitState.kind === 'idle' ? previewState(state, reference, locale, attachmentWarning) : submitState;
  const messageState = optionsUnavailable && visibleState.kind === 'idle' ? { kind: 'options' as const } : visibleState;
  const fieldErrors = visibleState.kind === 'validation' ? visibleState.fieldErrors : [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (optionsUnavailable) {
      setSubmitState({ kind: 'options' });
      return;
    }
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
      setSubmitState({
        kind: 'success',
        referenceNumber: result.data.complaint.referenceNumber,
        attachmentCount: result.data.complaint.attachments?.length ?? 0,
        ...(result.data.complaint.attachmentWarning ? { attachmentWarning: result.data.complaint.attachmentWarning } : {}),
      });
      return;
    }
    if (result.error.fieldErrors?.length || result.error.code === 'VALIDATION_FAILED') {
      setSubmitState({ kind: 'validation', fieldErrors: result.error.fieldErrors ?? [{ field: 'description', code: 'INVALID', message: result.error.message }] });
      return;
    }
    setSubmitState({ kind: 'error', network: result.error.kind === 'network' });
  }

  return (
    <section lang={t.lang} dir={t.dir} className="grid gap-4" aria-label={t.title}>
      <PortalSubmissionMessage locale={locale} state={messageState} />

      <form className="grid gap-4 rounded-md border border-line-subtle bg-surface p-portal-card shadow-sm md:grid-cols-2" onSubmit={onSubmit}>
          <FieldGroup title={t.sections.contact}>
            <TextField error={fieldError(fieldErrors, 'customerName', locale)} label={t.fields.customerName} name="customerName" />
            <TextField error={fieldError(fieldErrors, 'customerPhone', locale)} label={t.fields.customerPhone} name="customerPhone" type="tel" />
          </FieldGroup>

          <FieldGroup title={t.sections.complaint}>
            <SelectField choose={t.choices.choose} disabled={optionsUnavailable} error={fieldError(fieldErrors, 'branchId', locale)} label={t.fields.branch} name="branchId" options={selectOptions(resolvedOptions.branches, locale)} />
            <SelectField choose={t.choices.choose} disabled={optionsUnavailable} error={fieldError(fieldErrors, 'categoryId', locale)} label={t.fields.category} name="categoryId" options={selectOptions(categories, locale)} />
            <SelectField choose={t.choices.choose} disabled={optionsUnavailable} error={fieldError(fieldErrors, 'subcategoryId', locale)} label={t.fields.subcategory} name="subcategoryId" options={selectOptions(subcategories, locale)} />
            <SelectField choose={t.choices.choose} disabled={optionsUnavailable} error={fieldError(fieldErrors, 'severity', locale)} label={t.fields.severity} name="severity" options={resolvedOptions.severities.map((value) => ({ label: t.severityLabels[value], value }))} />
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
              <Input accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" multiple name="attachments" type="file" />
              <FieldError message={fieldError(fieldErrors, 'attachments', locale)} />
            </Label>
            <p className="rounded-sm border border-line-subtle bg-surface px-3 py-2 text-sm text-content-muted md:col-span-2">{t.attachmentDeferred}</p>
            <ul className="grid gap-1 text-sm text-content-muted md:col-span-2">
              {t.rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </FieldGroup>

          <p className="rounded-sm bg-surface-raised px-3 py-2 text-sm text-content-muted md:col-span-2">{t.privacy}</p>
          <Button className="focus:ring-2 focus:ring-ring md:col-span-2" disabled={visibleState.kind === 'loading' || optionsUnavailable} type="submit">
            {visibleState.kind === 'loading' ? t.actions.submitting : t.actions.submit}
          </Button>
      </form>
    </section>
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
      <>
        <p className="rounded-md border border-status-success-border bg-status-success-bg px-4 py-3 text-sm font-medium text-status-success" role="status">
          {t.states.success}. {t.states.reference}: {state.referenceNumber}.
          {state.attachmentCount ? ` ${t.states.attachmentsUploaded}: ${state.attachmentCount}.` : ''}
        </p>
        {state.attachmentWarning ? (
          <p className="rounded-md border border-status-warning-border bg-status-warning-bg px-4 py-3 text-sm font-medium text-status-warning" role="status">
            {t.states.attachmentWarning}: {state.attachmentWarning.failedCount}.
          </p>
        ) : null}
      </>
    );
  }
  const message = state.kind === 'loading' ? t.states.loading : state.kind === 'validation' ? t.states.validation : state.kind === 'options' ? t.states.options : t.states.error;
  return (
    <p className="rounded-md border border-status-error-border bg-status-error-bg px-4 py-3 text-sm font-medium text-status-error" role={state.kind === 'loading' ? 'status' : 'alert'}>
      {message}
    </p>
  );
}

function FieldGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="grid content-start gap-3 rounded-md border border-line-subtle bg-surface-raised p-3 md:col-span-2 md:grid-cols-2" aria-label={title}>
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

function SelectField({ choose, disabled = false, error, label, name, options }: { choose: string; disabled?: boolean; error?: string | undefined; label: string; name: string; options: Array<{ label: string; value: string }> }) {
  return (
    <Label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue="" disabled={disabled} name={name}>
        <option value="">{choose}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <FieldError message={error} />
    </Label>
  );
}

function FieldError({ message }: { message?: string | undefined }) {
  return message ? <span className="text-xs font-semibold text-status-error">{message}</span> : null;
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

function previewState(state: PortalSubmissionPreviewState | undefined, reference: string | undefined, locale: PortalLocale, attachmentWarning?: PortalAttachmentWarning): SubmitState {
  if (state === 'success') return { kind: 'success', referenceNumber: reference ?? 'CMP-PORTAL-001', attachmentCount: 0, ...(attachmentWarning ? { attachmentWarning } : {}) };
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

function hasRequiredOptions(options: PortalSubmissionOptions): boolean {
  return Boolean(options.branches.length && options.categories.some((option) => !option.parentId) && options.categories.some((option) => option.parentId) && options.severities.length);
}

const emptyOptions: PortalSubmissionOptions = { branches: [], categories: [], severities: [] };
