'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { StateBlock } from '../shared/ui-primitives';
import { LocalizedFileInput } from '../shared/localized-file-input';
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

export type PortalSubmissionFixtureState = 'loading' | 'validation' | 'success' | 'error';

type SubmitState = { kind: 'idle' | 'loading' | 'options' }
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
  state?: PortalSubmissionFixtureState | undefined;
}) {
  const t = portalSubmissionText[locale];
  const resolvedOptions = options ?? emptyOptions;
  const categories = resolvedOptions.categories.filter((option) => !option.parentId);
  const optionsUnavailable = !hasRequiredOptions(resolvedOptions);
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const [categoryId, setCategoryId] = useState('');
  const [vehicleRelated, setVehicleRelated] = useState(false);
  const subcategories = resolvedOptions.categories.filter((option) => option.parentId && (!categoryId || option.parentId === categoryId));
  const visibleState = submitState.kind === 'idle' ? previewState(state, reference, locale, attachmentWarning) : submitState;
  const messageState = visibleState;
  const fieldErrors = visibleState.kind === 'validation' ? visibleState.fieldErrors : [];
  const submitted = visibleState.kind === 'success';

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

      {submitted ? null : (
      <form className="grid gap-4 rounded-md border border-line-subtle bg-surface p-portal-card shadow-sm md:grid-cols-2" onSubmit={onSubmit}>
          <StateBlock className="md:col-span-2" message={t.privacy} />
          <FieldGroup title={t.sections.contact}>
            <TextField error={fieldError(fieldErrors, 'customerName', locale)} label={t.fields.customerName} name="customerName" />
            <TextField error={fieldError(fieldErrors, 'customerPhone', locale)} label={t.fields.customerPhone} name="customerPhone" type="tel" />
          </FieldGroup>

          <FieldGroup title={t.sections.complaint}>
            <input name="manualTriage" type="hidden" value={optionsUnavailable ? 'true' : 'false'} />
            {optionsUnavailable ? (
              <div className="grid gap-2 md:col-span-2">
                <StateBlock message={t.states.options} tone="warning" />
                <Button asChild type="button" variant="outline"><a href={`?locale=${locale}`}>{t.actions.retryOptions}</a></Button>
              </div>
            ) : (
              <>
                <SelectField choose={t.choices.choose} error={fieldError(fieldErrors, 'branchId', locale)} label={t.fields.branch} name="branchId" options={selectOptions(resolvedOptions.branches, locale)} />
                <SelectField choose={t.choices.choose} error={fieldError(fieldErrors, 'categoryId', locale)} label={t.fields.category} name="categoryId" onChange={setCategoryId} options={selectOptions(categories, locale)} />
                <SelectField choose={t.choices.choose} disabled={!categoryId} error={fieldError(fieldErrors, 'subcategoryId', locale)} key={categoryId} label={t.fields.subcategory} name="subcategoryId" options={selectOptions(subcategories, locale)} />
                <SelectField choose={t.choices.choose} error={fieldError(fieldErrors, 'severity', locale)} label={t.fields.severity} name="severity" options={resolvedOptions.severities.map((value) => ({ label: t.severityLabels[value], value }))} />
              </>
            )}
            <Label className="grid gap-1 text-sm font-medium">
              {t.fields.incidentAt}
              <Input className="min-h-11" name="incidentAt" type="date" />
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
              <Input className="size-4" name="vehicleRelated" onChange={(event) => setVehicleRelated(event.currentTarget.checked)} type="checkbox" />
              {t.fields.vehicleRelated}
            </Label>
            {vehicleRelated ? <TextField error={fieldError(fieldErrors, 'vehicleVin', locale)} label={t.fields.vehicleVin} name="vehicleVin" /> : null}
          </FieldGroup>

          <FieldGroup title={t.sections.attachments}>
            <details className="rounded-sm border border-line-subtle bg-surface px-3 py-2 md:col-span-2">
              <summary className="cursor-pointer text-sm font-semibold text-content-strong">{t.fields.attachment}</summary>
              <div className="mt-3 grid gap-1 text-sm font-medium">
                <Label htmlFor="portal-attachments">{t.fields.attachment}</Label>
                <LocalizedFileInput accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" id="portal-attachments" locale={locale} multiple name="attachments" />
                <FieldError message={fieldError(fieldErrors, 'attachments', locale)} />
              </div>
              <p className="mt-3 rounded-sm border border-line-subtle bg-surface px-3 py-2 text-sm text-content-muted">{t.attachmentDeferred}</p>
              <ul className="mt-3 grid gap-1 text-sm text-content-muted">
                {t.rules.map((rule) => <li key={rule}>{rule}</li>)}
              </ul>
            </details>
          </FieldGroup>

          <Button className="min-h-11 focus:ring-2 focus:ring-ring md:col-span-2" disabled={visibleState.kind === 'loading'} type="submit">
            {visibleState.kind === 'loading' ? t.actions.submitting : optionsUnavailable ? t.actions.submitManualReview : t.actions.submit}
          </Button>
      </form>
      )}
    </section>
  );
}

export function buildPortalComplaintSubmission(formData: FormData): PortalComplaintCreateRequest {
  const request: PortalComplaintCreateRequest = {
    customerName: textValue(formData, 'customerName'),
    customerPhone: textValue(formData, 'customerPhone'),
    description: textValue(formData, 'description'),
    incidentAt: incidentAtValue(textValue(formData, 'incidentAt')),
    subject: textValue(formData, 'subject'),
    ...(formData.get('manualTriage') === 'true' ? { manualTriage: true } : {}),
    vehicleRelated: formData.get('vehicleRelated') === 'on',
    vehicleVin: optionalTextValue(formData, 'vehicleVin'),
  };
  const categoryId = optionalTextValue(formData, 'categoryId');
  const subcategoryId = optionalTextValue(formData, 'subcategoryId');
  const branchId = optionalTextValue(formData, 'branchId');
  const severity = optionalTextValue(formData, 'severity') as PortalComplaintCreateRequest['severity'] | undefined;
  if (categoryId) request.categoryId = categoryId;
  if (subcategoryId) request.subcategoryId = subcategoryId;
  if (branchId) request.branchId = branchId;
  if (severity) request.severity = severity;
  return request;
}

function PortalSubmissionMessage({ locale, state }: { locale: PortalLocale; state: SubmitState }) {
  const t = portalSubmissionText[locale];
  if (state.kind === 'idle') return null;
  if (state.kind === 'success') {
    return <ReferenceSuccess attachmentCount={state.attachmentCount} attachmentWarning={state.attachmentWarning} locale={locale} referenceNumber={state.referenceNumber} />;
  }
  const message = state.kind === 'loading' ? t.states.loading : state.kind === 'validation' ? t.states.validation : state.kind === 'options' ? t.states.options : t.states.error;
  return <StateBlock message={message} tone={state.kind === 'loading' ? 'neutral' : state.kind === 'options' ? 'warning' : 'error'} />;
}

function ReferenceSuccess({ attachmentCount, attachmentWarning, locale, referenceNumber }: { attachmentCount: number; attachmentWarning?: PortalAttachmentWarning | undefined; locale: PortalLocale; referenceNumber: string }) {
  const t = portalSubmissionText[locale];
  const [copied, setCopied] = useState(false);
  const trackHref = `/portal/track?locale=${locale}&reference=${encodeURIComponent(referenceNumber)}`;
  const submitHref = `/portal?locale=${locale}`;
  return (
    <section className="grid gap-3 rounded-md border border-status-success bg-status-success/10 p-3" aria-label={t.states.success} role="status">
      <div className="grid gap-1 text-sm">
        <h2 className="text-base font-semibold text-content-strong">{t.states.success}</h2>
        <p className="text-content-muted">{t.next.items[1]}</p>
        {attachmentCount ? <p className="text-content-muted">{t.states.attachmentsUploaded}: {attachmentCount}</p> : null}
      </div>
      {attachmentWarning ? <StateBlock message={`${t.states.attachmentWarning}: ${attachmentWarning.failedCount}.`} tone="warning" /> : null}
      <Label className="grid gap-1 text-sm font-medium">
        {t.states.reference}
        <Input className="min-h-11 font-mono" readOnly value={referenceNumber} />
      </Label>
      <div className="rounded-sm border border-line-subtle bg-surface px-3 py-2 text-sm text-content-muted"><h2 className="font-semibold text-content-strong">{t.next.title}</h2><ul className="mt-1 grid gap-1">{t.next.items.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (navigator.clipboard) void navigator.clipboard.writeText(referenceNumber).then(() => setCopied(true));
          }}
        >
          {copied ? actionText(t, 'copied', t.states.reference) : actionText(t, 'copyReference', t.states.reference)}
        </Button>
        <Button asChild type="button">
          <a href={trackHref}>{actionText(t, 'track', t.subtitle)}</a>
        </Button>
        <Button asChild type="button" variant="outline">
          <a href={submitHref}>{actionText(t, 'submitAnother', t.actions.submit)}</a>
        </Button>
      </div>
    </section>
  );
}

function actionText(t: (typeof portalSubmissionText)[PortalLocale], key: 'copied' | 'copyReference' | 'submitAnother' | 'track', fallback: string): string {
  return (t.actions as Partial<Record<typeof key, string>>)[key] ?? fallback;
}

function FieldGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="grid content-start gap-3 rounded-md bg-surface-raised p-3 md:col-span-2 md:grid-cols-2" aria-label={title}><h2 className="text-sm font-semibold md:col-span-2">{title}</h2>{children}</section>;
}

function TextField({ error, label, name, type = 'text' }: { error?: string | undefined; label: string; name: string; type?: string }) {
  return <Label className="grid gap-1 text-sm font-medium">{label}<Input className="min-h-11" name={name} type={type} /><FieldError message={error} /></Label>;
}

function SelectField({ choose, disabled = false, error, label, name, onChange, options }: { choose: string; disabled?: boolean; error?: string | undefined; label: string; name: string; onChange?: (value: string) => void; options: Array<{ label: string; value: string }> }) {
  return (
    <Label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="min-h-11 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" defaultValue="" disabled={disabled} name={name} onChange={(event) => onChange?.(event.currentTarget.value)}>
        <option value="">{choose}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <FieldError message={error} />
    </Label>
  );
}

function FieldError({ message }: { message?: string | undefined }) { return message ? <span className="text-xs font-semibold text-status-error">{message}</span> : null; }

function validateSubmission(input: PortalComplaintCreateRequest): PortalFieldError[] {
  const required = input.manualTriage ? ['customerName', 'customerPhone', 'description', 'incidentAt', 'subject'] : ['customerName', 'customerPhone', 'categoryId', 'subcategoryId', 'description', 'incidentAt', 'branchId', 'subject', 'severity'];
  return required
    .filter((field) => !String(input[field as keyof PortalComplaintCreateRequest] ?? '').trim())
    .map((field) => ({ field, code: 'REQUIRED', message: `${field} is required.` }));
}

function fieldError(errors: PortalFieldError[], field: string, locale: PortalLocale): string | undefined {
  const error = errors.find((item) => item.field === field);
  if (!error) return undefined;
  if (field === 'attachments') return portalSubmissionText[locale].validation.attachment;
  return error.code === 'REQUIRED' ? portalSubmissionText[locale].validation.required : portalSubmissionText[locale].validation.invalid;
}

function previewState(state: PortalSubmissionFixtureState | undefined, reference: string | undefined, locale: PortalLocale, attachmentWarning?: PortalAttachmentWarning): SubmitState {
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
