'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { StateBlock } from '../shared/ui-primitives';
import { LocalizedFileInput } from '../shared/localized-file-input';
import { ComplaintVehicleSelect } from '../shared/complaint-vehicle-select';
import { defaultPortalFields, type PortalField } from '../../../../../packages/contracts/src/portal-form';
import { PortalCustomFields, customValues } from './custom-fields';
import { portalSubmissionText, type PortalLocale } from '../../i18n/portal-submission';
import {
  portalSubmissionAttachments,
  submitPortalComplaint,
  type PortalAttachmentWarning,
  type PortalComplaintCreateRequest,
  type PortalFieldError,
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
  const fields = options?.fields ?? defaultPortalFields;
  const field = (key: string) => fields.find((item) => item.key === key) ?? defaultPortalFields.find((item) => item.key === key)!;
  const fieldLabel = (key: string) => { const item = field(key); return `${locale === 'ar' ? item.labelAr : item.labelEn}${item.required ? ' *' : ''}`; };
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const visibleState = submitState.kind === 'idle' ? previewState(state, reference, locale, attachmentWarning) : submitState;
  const messageState = visibleState;
  const fieldErrors = visibleState.kind === 'validation' ? visibleState.fieldErrors : [];
  const submitted = visibleState.kind === 'success';
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const field = fieldErrors[0]?.field;
    if (!field) return;
    const control = formRef.current?.elements.namedItem(field);
    if (control instanceof HTMLElement) control.focus();
  }, [fieldErrors]);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const complaint = buildPortalComplaintSubmission(formData);
    complaint.customFields = customValues(formData, fields);
    const phone = complaint.customerPhone.replace(/[\s()\-]/g, '');
    complaint.customerPhone = !phone ? '' : phone.startsWith('+') ? phone : `${options?.phoneCountryCode ?? '+962'}${phone.replace(/^0+/, '')}`;
    const localErrors = validateSubmission(complaint, fields, portalAttachmentFiles(formData).length);
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
      {options === null && <div className="grid gap-2"><StateBlock message={t.states.options} tone="warning" /><Button asChild variant="outline"><a href={`/portal?locale=${locale}`}>{t.actions.retryOptions}</a></Button></div>}

      {submitted ? null : (
      <form className="relative grid gap-6 rounded-2xl border border-line-subtle bg-surface p-6 md:p-8 shadow-xl md:grid-cols-2" onSubmit={onSubmit} ref={formRef}>
          <StateBlock className="md:col-span-2" message={t.privacy} />
          {fieldErrors.length ? <section className="rounded-sm border border-status-error-border bg-status-error-bg p-3 text-sm text-status-error md:col-span-2" role="alert"><p className="font-semibold">{t.states.validation}</p><ul className="mt-2 grid gap-1">{fieldErrors.map((error) => <li key={`${error.field}-${error.code}`}><a className="underline" href={`#${error.field}`}>{fieldError(fieldErrors, error.field, locale)}</a></li>)}</ul></section> : null}
          <FieldGroup title={t.sections.contact}>
            <TextField error={fieldError(fieldErrors, 'customerName', locale)} label={fieldLabel('customerName')} name="customerName" required={field('customerName').required} />
            <TextField error={fieldError(fieldErrors, 'customerPhone', locale)} label={fieldLabel('customerPhone')} name="customerPhone" type="tel" required={field('customerPhone').required} />
          </FieldGroup>
          <FieldGroup title={t.sections.complaint}>
            <input name="manualTriage" type="hidden" value="true" />
            <Label className="grid gap-1 text-sm font-medium" htmlFor="incidentAt">
              {fieldLabel('incidentAt')}
              <Input aria-describedby={fieldError(fieldErrors, 'incidentAt', locale) ? 'incidentAt-error' : undefined} aria-invalid={Boolean(fieldError(fieldErrors, 'incidentAt', locale))} className="min-h-11" defaultValue={options?.incidentDate ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Amman', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())} id="incidentAt" name="incidentAt" type="date" required={field('incidentAt').required} />
              <FieldError id="incidentAt-error" message={fieldError(fieldErrors, 'incidentAt', locale)} />
            </Label>
            <Label className="grid gap-1 text-sm font-medium md:col-span-2" htmlFor="description">
              {fieldLabel('description')}
              <Textarea aria-describedby={fieldError(fieldErrors, 'description', locale) ? 'description-error' : undefined} aria-invalid={Boolean(fieldError(fieldErrors, 'description', locale))} className="min-h-28" id="description" name="description" required={field('description').required} />
              <FieldError id="description-error" message={fieldError(fieldErrors, 'description', locale)} />
            </Label>
          </FieldGroup>
          <FieldGroup title={t.sections.vehicle}>
            <ComplaintVehicleSelect models={options?.carModels ?? []} locale={locale} brandLabel={locale === 'ar' ? field('vehicleBrand').labelAr : field('vehicleBrand').labelEn} modelLabel={locale === 'ar' ? field('vehicleModel').labelAr : field('vehicleModel').labelEn} requiredBrand={field('vehicleBrand').required} requiredModel={field('vehicleModel').required} />
            <TextField error={fieldError(fieldErrors, 'vehicleVin', locale)} label={fieldLabel('vehicleVin')} name="vehicleVin" required={field('vehicleVin').required} />
            <TextField error={fieldError(fieldErrors, 'odometer', locale)} label={fieldLabel('odometer')} name="odometer" type="number" required={field('odometer').required} />
          </FieldGroup>
          <FieldGroup title={t.sections.attachments}>
            <details className="rounded-sm border border-line-subtle bg-surface px-3 py-2 md:col-span-2">
              <summary className="cursor-pointer text-sm font-semibold text-content-strong">{fieldLabel('attachments')}</summary>
              <div className="mt-3 grid gap-1 text-sm font-medium">
                <Label htmlFor="portal-attachments">{t.fields.attachment}</Label>
                <LocalizedFileInput accept=".jpg,.jpeg,image/jpeg" id="portal-attachments" locale={locale} multiple name="attachments" />
                <FieldError message={fieldError(fieldErrors, 'attachments', locale)} />
              </div>
              <p className="mt-3 rounded-sm border border-line-subtle bg-surface px-3 py-2 text-sm text-content-muted">{t.attachmentDeferred}</p>
              <ul className="mt-3 grid gap-1 text-sm text-content-muted">
                {t.rules.map((rule) => <li key={rule}>{rule}</li>)}
              </ul>
            </details>
          </FieldGroup>
          <FieldGroup title={locale === 'ar' ? 'معلومات إضافية' : 'Additional information'}>
            <PortalCustomFields fields={fields} locale={locale} error={(key) => fieldError(fieldErrors, key, locale)} />
          </FieldGroup>

          <Button className="min-h-12 w-full text-base font-medium transition-transform active:scale-95 shadow-md md:col-span-2" disabled={visibleState.kind === 'loading' || options === null} type="submit">
            {visibleState.kind === 'loading' ? t.actions.submitting : t.actions.submit}
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
    subject: '',
    manualTriage: true,
    vehicleRelated: true,
    vehicleVin: optionalTextValue(formData, 'vehicleVin'),
    vehicleBrand: textValue(formData, 'vehicleBrand'),
    vehicleModel: textValue(formData, 'vehicleModel'),
    odometer: optionalNumberValue(formData, 'odometer'),
  };
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
      <div className="rounded-sm border border-line-subtle bg-surface px-3 py-2 text-sm text-content-muted"><h2 className="font-semibold text-content-strong">{t.next.title}</h2><p className="mt-1">{t.next.items[0]}</p></div>
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
  return (
    <section className="grid content-start gap-5 rounded-xl bg-surface-raised p-5 md:col-span-2 md:grid-cols-2 border border-line shadow-sm transition-shadow hover:shadow-md" aria-label={title}><h2 className="text-base font-semibold tracking-tight md:col-span-2">{title}</h2>{children}</section>
  );
}

function TextField({ error, label, name, type = 'text', required = false }: { error?: string | undefined; label: string; name: string; type?: string; required?: boolean }) {
  return <Label className="grid gap-1 text-sm font-medium" htmlFor={name}>{label}<Input aria-describedby={error ? `${name}-error` : undefined} aria-invalid={Boolean(error)} className="min-h-11" id={name} name={name} type={type} required={required} autoComplete={name === 'customerName' ? 'name' : name === 'customerPhone' ? 'tel' : 'off'} {...(name === 'odometer' ? { min: 0, max: 10000000, step: 1 } : { maxLength: name === 'vehicleVin' ? 17 : 200 })} /><FieldError id={`${name}-error`} message={error} /></Label>;
}

function FieldError({ id, message }: { id?: string; message?: string | undefined }) { return message ? <span className="text-xs font-semibold text-status-error" id={id} role="alert">{message}</span> : null; }

function validateSubmission(input: PortalComplaintCreateRequest, fields: PortalField[] = defaultPortalFields, fileCount = 0): PortalFieldError[] {
  const required = fields.filter((field) => field.enabled && field.required).map((field) => field.key);
  const errors = required
    .filter((field) => field === 'attachments' ? fileCount === 0 : field.startsWith('custom_') ? !String(input.customFields?.[field] ?? '').trim() : !String(input[field as keyof PortalComplaintCreateRequest] ?? '').trim())
    .map((field) => ({ field: field.startsWith('custom_') ? `customFields.${field}` : field, code: 'REQUIRED', message: `${field} is required.` }));
  if (input.vehicleVin && !/^[A-HJ-NPR-Z0-9]{17}$/i.test(input.vehicleVin)) errors.push({ field: 'vehicleVin', code: 'INVALID', message: 'Invalid VIN.' });
  if (input.odometer !== null && input.odometer !== undefined && (!Number.isSafeInteger(input.odometer) || input.odometer < 0 || input.odometer > 10000000)) errors.push({ field: 'odometer', code: 'INVALID', message: 'Invalid odometer.' });
  return errors;
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
function optionalNumberValue(formData: FormData, field: string): number | null {
  const value = textValue(formData, field);
  return value ? Number(value) : null;
}
function incidentAtValue(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value;
}
function portalAttachmentFiles(formData: FormData): File[] {
  if (typeof File === 'undefined') return [];
  return formData.getAll('attachments').filter((value): value is File => value instanceof File && value.size > 0 && Boolean(value.name.trim()));
}
