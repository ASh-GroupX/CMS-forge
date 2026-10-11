'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/form-select';
import { Textarea } from '@/components/ui/textarea';
import { Field, StateBlock } from '../shared/ui-primitives';
import { LocalizedFileInput } from '../shared/localized-file-input';
import { complaintStatusLabel, complaintTypeLabel } from '../../i18n/domain-labels';
import { complaintCreateText } from '../../i18n/staff-complaint-create';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { staffAttachmentAccept, staffAttachmentFiles, uploadStaffComplaintAttachments } from '../../lib/staff-attachments-api';
import { fetchStandardProblems, type StandardProblemView } from '../../lib/admin-standard-problems-api';
import type { ComplaintFormOption, ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import {
  createStaffComplaint,
  type ComplaintStatus,
  type DmsCustomerVehicleMatch,
  type StaffApiFieldError,
  type StaffComplaintCreateRequest,
} from '../../lib/staff-complaints-api';
import type { LookupSelection } from '../customer-vehicle-lookup';
import { getDepartmentTemplates, type ComplaintTemplate } from '../../lib/api/complaint-templates';

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
  relatedTo,
  canEditIncidentDate,
}: {
  locale: Locale;
  lookupSelection?: LookupSelection | null | undefined;
  options?: ComplaintFormOptions | null | undefined;
  state?: CreateFormFixtureState | undefined;
  relatedTo?: string | undefined;
  canEditIncidentDate?: boolean | undefined;
}) {
  const shell = staffShellText[locale];
  const t = shell.createForm;
  const extra = complaintCreateText[locale];
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [standardProblems, setStandardProblems] = useState<StandardProblemView[]>([]);
  const [subjectMode, setSubjectMode] = useState<'standard' | 'custom'>('standard');
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');
  const [templates, setTemplates] = useState<ComplaintTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [baseChannel, setBaseChannel] = useState<string>('');
  const [customerType, setCustomerType] = useState<string>('');
  useEffect(() => {
    if (selectedDepartment) {
      fetchStandardProblems(selectedDepartment).then(probs => {
        setStandardProblems(probs);
        if (probs.length > 0) {
          setSubjectMode('standard');
          setSelectedProblemId('');
        } else {
          setSubjectMode('custom');
        }
      }).catch(() => {
        setStandardProblems([]);
        setSubjectMode('custom');
      });
      getDepartmentTemplates(selectedDepartment).then(t => {
        setTemplates(t.filter(x => x.isActive));
        setSelectedTemplateId('');
      }).catch(() => setTemplates([]));
    } else {
      setStandardProblems([]);
      setSubjectMode('custom');
      setTemplates([]);
      setSelectedTemplateId('');
    }
  }, [selectedDepartment]);
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
  const departments = options?.departments ?? [];
  const filteredDepartments = selectedBranch ? departments.filter((d: any) => d.branchId === selectedBranch) : [];
  const categoryOptions = selectedDepartment ? categories.filter((item) => item.departmentId === selectedDepartment) : [];

  const severityOptions: ComplaintFormOptions['severities'] = options?.severities ?? ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const typeOptions = options?.types ?? [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState({ kind: 'loading' });
    const formData = new FormData(event.currentTarget);
    const { branchId, complaint } = buildStaffComplaintCreateSubmission(formData);
    const result = await createStaffComplaint(branchId, complaint);
    if (result.ok) {
      if (relatedTo) {
        try {
          await fetch(`/api/complaints/${result.data.complaint.id}/related`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-csrf-token': document.cookie.split('cms_csrf_token=')[1]?.split(';')[0] ?? '' },
            body: JSON.stringify({ targetId: relatedTo })
          });
        } catch {}
      }
      const attachments = await uploadStaffComplaintAttachments(result.data.complaint.id, staffAttachmentFiles(formData));
      setSubmitState({
        kind: 'success',
        attachmentCount: attachments.uploadedCount,
        failedAttachmentCount: attachments.failedCount,
        referenceNumber: result.data.complaint.referenceNumber,
        status: result.data.complaint.status,
      });
      formRef.current?.reset();
      setSelectedBranch('');
      setSelectedDepartment('');
      setSelectedCategory('');
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
          <SelectField choose={t.choose} error={fieldError(fieldErrors, 'branchId')} label={t.fields.branch} locale={locale} name="branchId" options={branches} value={selectedBranch} onChange={setSelectedBranch} />
          {selectedBranch && filteredDepartments.length === 0 ? null : (
            <SelectField choose={t.choose} error={fieldError(fieldErrors, 'departmentId')} label={"Department"} locale={locale} name="departmentId" options={filteredDepartments} value={selectedDepartment} onChange={setSelectedDepartment} />
          )}
          <SelectField choose={t.choose} error={fieldError(fieldErrors, 'categoryId')} label={t.fields.category} locale={locale} name="categoryId" options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory} />

          <Field error={fieldError(fieldErrors, 'type')} id="type" label={locale === 'ar' ? 'نوع الطلب (الأساسي)' : 'Request Type'}>
            <FormSelect id="type" name="type" defaultValue="COMPLAINT" options={typeOptions.map((type) => ({ label: complaintTypeLabel(locale, type), value: type }))} placeholder={t.choose} />
          </Field>

          <Field error={fieldError(fieldErrors, 'baseChannel')} id="baseChannel" label={locale === 'ar' ? 'القناة' : 'Channel'}>
            <FormSelect 
              id="baseChannel" 
              name="baseChannel" 
              options={[
                { label: locale === 'ar' ? 'زيارة شخصية' : 'Walk-in', value: 'Walk-in' },
                { label: locale === 'ar' ? 'وسائل التواصل الاجتماعي' : 'Social Media', value: 'Social Media' },
                { label: locale === 'ar' ? 'هاتف / اتصال' : 'Phone / Call', value: 'Phone / Call' }
              ]} 
              placeholder={t.choose} 
              value={baseChannel}
              onValueChange={setBaseChannel}
            />
          </Field>
          
          {baseChannel === 'Walk-in' && (
            <TextField error={fieldError(fieldErrors, 'channelAssignedTo')} label={locale === 'ar' ? 'تم التعيين إلى (الاسم)' : 'Assigned To (Name)'} name="channelAssignedTo" value="" />
          )}
          
          {baseChannel === 'Social Media' && (
            <Field error={fieldError(fieldErrors, 'channelPlatform')} id="channelPlatform" label={locale === 'ar' ? 'المنصة' : 'Platform'}>
              <FormSelect 
                id="channelPlatform" 
                name="channelPlatform" 
                options={[
                  { label: locale === 'ar' ? 'سناب شات' : 'Snapchat', value: 'Snapchat' },
                  { label: locale === 'ar' ? 'فيسبوك' : 'Facebook', value: 'Facebook' },
                  { label: locale === 'ar' ? 'الموقع الإلكتروني' : 'Website', value: 'Website' },
                  { label: locale === 'ar' ? 'لينكد إن' : 'LinkedIn', value: 'LinkedIn' },
                ]} 
                placeholder={t.choose} 
              />
            </Field>
          )}

          <Field error={fieldError(fieldErrors, 'customerType')} id="customerType" label={locale === 'ar' ? 'نوع العميل' : 'Customer Type'}>
            <FormSelect 
              id="customerType" 
              name="customerType" 
              options={[
                { label: locale === 'ar' ? 'فرد' : 'Individual', value: 'Individual' },
                { label: locale === 'ar' ? 'شركة / مؤسسة' : 'Corporate', value: 'Corporate' },
                { label: locale === 'ar' ? 'شخصية هامة (VIP)' : 'VIP', value: 'VIP' }
              ]} 
              placeholder={t.choose}
              value={customerType}
              onValueChange={setCustomerType}
            />
          </Field>

          {templates.length > 0 && (
            <Field error={fieldError(fieldErrors, 'templateId')} id="templateId" label={locale === 'ar' ? 'النموذج الديناميكي' : 'Dynamic Template'}>
              <FormSelect 
                id="templateId" 
                name="templateId" 
                options={templates.map((tpl) => ({ label: tpl.name, value: tpl.id }))} 
                placeholder={t.choose} 
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              />
            </Field>
          )}

          <Field error={fieldError(fieldErrors, 'severity')} id="severity" label={t.fields.severity}>
            <FormSelect id="severity" name="severity" options={severityOptions.map((severity) => ({ label: extra.severityLabels[severity], value: severity }))} placeholder={t.choose} />
          </Field>
          
          <Field error={fieldError(fieldErrors, 'incidentAt')} id="incidentAt" label={t.fields.incidentDate}>
            <Input id="incidentAt" name="incidentAt" defaultValue={defaults.incidentAt} type="date" readOnly={!canEditIncidentDate} className={!canEditIncidentDate ? 'bg-slate-100 cursor-not-allowed dark:bg-slate-800' : ''} />
          </Field>
          
          <Field className="md:col-span-2" error={fieldError(fieldErrors, 'subject')} id="subject" label={t.fields.subject}>
            {subjectMode === 'standard' && standardProblems.length > 0 ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <FormSelect 
                    id="standardProblemSelect" 
                    name="standardProblemSelect" 
                    options={[
                      ...standardProblems.map(p => ({ label: locale === 'ar' ? p.titleAr : p.titleEn, value: locale === 'ar' ? p.titleAr : p.titleEn })),
                      { label: locale === 'ar' ? 'أخرى (تخصيص)' : 'Other (Custom)', value: 'custom' }
                    ]} 
                    placeholder={t.choose} 
                    value={selectedProblemId}
                    onValueChange={(val) => {
                      setSelectedProblemId(val);
                      if (val === 'custom') {
                        setSubjectMode('custom');
                      }
                    }}
                  />
                  {selectedProblemId !== 'custom' && selectedProblemId !== '' && (
                    <input type="hidden" name="subject" value={selectedProblemId} />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input className="flex-1" id="subject" name="subject" defaultValue={defaults.subject} />
                {standardProblems.length > 0 && (
                  <Button type="button" variant="outline" onClick={() => setSubjectMode('standard')}>
                    {locale === 'ar' ? 'إلغاء التخصيص' : 'Cancel Custom'}
                  </Button>
                )}
              </div>
            )}
          </Field>
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

          {selectedTemplateId && (
            <div className="md:col-span-2 mt-4 space-y-4 rounded-md border border-line-subtle p-4 bg-surface-raised">
              <h3 className="font-semibold text-lg">{locale === 'ar' ? 'بيانات إضافية' : 'Additional Information'}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {templates.find(t => t.id === selectedTemplateId)?.schema.map(field => (
                  <Field key={field.id} className={field.type === 'long_text' ? 'md:col-span-2' : ''} id={`dyn_${field.id}`} label={field.label} error={fieldError(fieldErrors, `dyn_${field.id}`)}>
                    {field.type === 'long_text' ? (
                      <Textarea id={`dyn_${field.id}`} name={`dyn_${field.id}`} required={field.required} />
                    ) : field.type === 'dropdown' ? (
                      <FormSelect id={`dyn_${field.id}`} name={`dyn_${field.id}`} options={(field.options || []).map(o => ({label: o, value: o}))} placeholder={t.choose} />
                    ) : field.type === 'radio' ? (
                      <div className="flex flex-col gap-2 mt-2">
                        {(field.options || []).map(o => (
                          <label key={o} className="flex items-center gap-2 text-sm"><input type="radio" name={`dyn_${field.id}`} value={o} required={field.required} /> {o}</label>
                        ))}
                      </div>
                    ) : field.type === 'checkbox' ? (
                      <div className="flex flex-col gap-2 mt-2">
                        {(field.options || []).map(o => (
                          <label key={o} className="flex items-center gap-2 text-sm"><input type="checkbox" name={`dyn_${field.id}`} value={o} /> {o}</label>
                        ))}
                      </div>
                    ) : (
                      <Input id={`dyn_${field.id}`} name={`dyn_${field.id}`} type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} required={field.required} />
                    )}
                    {field.helpText && <p className="text-xs text-content-muted mt-1">{field.helpText}</p>}
                  </Field>
                ))}
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input className="size-4" name="vehicleRelated" type="checkbox" defaultChecked={defaults.vehicleRelated} />
            {extra.fields.vehicleRelated}
          </label>
          <TextField error={fieldError(fieldErrors, 'vehicleVin')} label={extra.fields.vehicleVin} name="vehicleVin" value={defaults.vehicleVin} wide />
          
          {/* NEW CRM FIELDS */}
          <div className="md:col-span-2 mt-4 space-y-4 rounded-md border border-line-subtle p-4 bg-surface-raised">
            <h3 className="font-semibold text-lg">{locale === 'ar' ? 'بيانات CRM' : 'CRM Data'}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField error={fieldError(fieldErrors, 'channel')} label={locale === 'ar' ? 'القناة' : 'Channel'} name="channel" value={(defaults as any).channel || ''} />
              <TextField error={fieldError(fieldErrors, 'customerType')} label={locale === 'ar' ? 'نوع العميل' : 'Customer Type'} name="customerType" value={(defaults as any).customerType || ''} />
              <TextField error={fieldError(fieldErrors, 'salesAdvisorName')} label={locale === 'ar' ? 'اسم مستشار المبيعات' : 'Sales Advisor Name'} name="salesAdvisorName" value={(defaults as any).salesAdvisorName || ''} />
              <TextField error={fieldError(fieldErrors, 'rootCauseCategory')} label={locale === 'ar' ? 'فئة السبب الجذري' : 'Root Cause Category'} name="rootCauseCategory" value={(defaults as any).rootCauseCategory || ''} />
              <Field error={fieldError(fieldErrors, 'lastServiceDate')} id="lastServiceDate" label={locale === 'ar' ? 'تاريخ آخر خدمة' : 'Last Service Date'}>
                <Input id="lastServiceDate" name="lastServiceDate" type="date" defaultValue={(defaults as any).lastServiceDate || ''} />
              </Field>
              <TextField type="number" error={fieldError(fieldErrors, 'odometer')} label={locale === 'ar' ? 'قراءة العداد' : 'Odometer'} name="odometer" value={(defaults as any).odometer || ''} />
              
              <div className="flex gap-4 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input className="size-4" name="warrantyActive" type="checkbox" defaultChecked={(defaults as any).warrantyActive || false} />
                  {locale === 'ar' ? 'الضمان ساري' : 'Warranty Active'}
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input className="size-4" name="repeatCustomer" type="checkbox" defaultChecked={(defaults as any).repeatCustomer || false} />
                  {locale === 'ar' ? 'عميل متكرر' : 'Repeat Customer'}
                </label>
              </div>
            </div>
          </div>
          {/* END NEW CRM FIELDS */}

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
  
  const templateData: Record<string, any> = {};
  for (const [key, value] of (formData as any).entries()) {
    if (key.startsWith('dyn_')) {
      const fieldId = key.replace('dyn_', '');
      const existing = templateData[fieldId];
      if (existing !== undefined) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          templateData[fieldId] = [existing, value];
        }
      } else {
        templateData[fieldId] = value;
      }
    }
  }
  
  const baseChannel = optionalTextValue(formData, 'baseChannel');
  let finalChannel = baseChannel;
  if (baseChannel === 'Walk-in') {
    const assignedTo = optionalTextValue(formData, 'channelAssignedTo');
    if (assignedTo) finalChannel = `${baseChannel} (Assigned to: ${assignedTo})`;
  } else if (baseChannel === 'Social Media') {
    const platform = optionalTextValue(formData, 'channelPlatform');
    if (platform) finalChannel = `${baseChannel} (${platform})`;
  }
  
  const complaint: StaffComplaintCreateRequest = {
    customerName: textValue(formData, 'customerName'),
    customerPhone: optionalTextValue(formData, 'customerPhone'),
    customerNumber: optionalTextValue(formData, 'customerNumber'),
    departmentId: optionalTextValue(formData, 'departmentId'),
    categoryId: textValue(formData, 'categoryId'),

    description: textValue(formData, 'description'),
    incidentAt: incidentAtValue(textValue(formData, 'incidentAt')),
    subject: textValue(formData, 'subject'),
    severity: textValue(formData, 'severity') as StaffComplaintCreateRequest['severity'],
    vehicleRelated,
    vehicleVin: optionalTextValue(formData, 'vehicleVin'),
    vehicleId: null,
    channel: finalChannel,
    customerType: optionalTextValue(formData, 'customerType'),
    lastServiceDate: incidentAtValue(textValue(formData, 'lastServiceDate')) || null,
    odometer: optionalNumberValue(formData, 'odometer'),
    warrantyActive: formData.get('warrantyActive') === 'on',
    salesAdvisorName: optionalTextValue(formData, 'salesAdvisorName'),
    rootCauseCategory: optionalTextValue(formData, 'rootCauseCategory'),
    repeatCustomer: formData.get('repeatCustomer') === 'on',
    templateId: optionalTextValue(formData, 'templateId'),
    templateData: Object.keys(templateData).length > 0 ? templateData : undefined,
    type: textValue(formData, 'type') || 'COMPLAINT',
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

function SelectField({ choose, error, label, locale, name, options, value, onChange }: { choose: string; error: string | undefined; label: string; locale: Locale; name: string; options: ComplaintFormOption[]; value?: string; onChange?: (val: string) => void }) {
  return (
    <Field error={error} id={name} label={label}>
      <FormSelect id={name} name={name} options={options.map((option) => ({ label: locale === 'ar' ? option.nameAr : option.nameEn, value: option.id }))} placeholder={choose} value={value} onValueChange={onChange} />
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
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  
  return {
    key: selectedMatch ? `${selectedMatch.customerCode ?? ''}-${selectedMatch.primaryPhone}-${selectedMatch.vin ?? ''}` : 'manual',
    customerName: selectedMatch?.customerName ?? '',
    customerPhone: selectedMatch?.primaryPhone ?? '',
    customerNumber: selectedMatch?.customerCode ?? '',
    customerSource: selectedMatch ? 'DMS' : 'MANUAL',
    description: '',
    incidentAt: todayStr,
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
