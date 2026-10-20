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
import { linkStaffComplaintRelation } from '../../lib/staff-complaint-relations-api';
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
  
  // Assignment state
  const [selectedPrimaryOfficerId, setSelectedPrimaryOfficerId] = useState<string>('');
  const [selectedBackupOfficerId, setSelectedBackupOfficerId] = useState<string>('');
  const [showCollaborator, setShowCollaborator] = useState<boolean>(false);
  const [selectedCollabDept, setSelectedCollabDept] = useState<string>('');
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>('');

  const [standardProblems, setStandardProblems] = useState<StandardProblemView[]>([]);
  const [subjectMode, setSubjectMode] = useState<'standard' | 'custom'>('standard');
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');
  const [templates, setTemplates] = useState<ComplaintTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [baseChannel, setBaseChannel] = useState<string>('');
  const [customerType, setCustomerType] = useState<string>('');
  const [selectedRootCause, setSelectedRootCause] = useState<string>('');
  const [selectedSalesAdvisor, setSelectedSalesAdvisor] = useState<string>('');
  const [alternativeCar, setAlternativeCar] = useState<boolean>(false);

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

  const [autoCustomerNumber, setAutoCustomerNumber] = useState<string>(() => `CUST-${Math.floor(100000 + Math.random() * 900000)}`);
  const selectedMatch = lookupSelection?.source === 'DMS' ? lookupSelection.match : null;
  const sourceState = selectedMatch ? 'dms' : lookupSelection?.source === 'MANUAL' ? 'manual' : 'none';
  const defaults = formDefaults(selectedMatch, autoCustomerNumber);

  const ARABIC_TEXT_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const [vinValue, setVinValue] = useState(defaults.vehicleVin);
  const [vinError, setVinError] = useState<string | null>(null);

  useEffect(() => {
    setVinValue(defaults.vehicleVin);
    setVinError(null);
  }, [defaults.vehicleVin]);

  function handleVinChange(raw: string) {
    if (ARABIC_TEXT_REGEX.test(raw)) {
      const clean = raw.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '').toUpperCase();
      setVinValue(clean);
      setVinError(
        locale === 'ar'
          ? 'رقم الهيكل (VIN) لا يقبل الحروف العربية (حروف إنجليزية وأرقام فقط)'
          : 'VIN cannot contain Arabic characters (English letters and digits only)'
      );
    } else {
      setVinValue(raw.toUpperCase());
      setVinError(null);
    }
  }

  const branches = options?.branches ?? [];
  const categories = options?.categories ?? [];
  const departments = options?.departments ?? [];
  const filteredDepartments = selectedBranch ? departments.filter((d: any) => d.branchId === selectedBranch) : [];
  const categoryOptions = selectedDepartment ? categories.filter((item) => item.departmentId === selectedDepartment) : [];

  const allUsers = options?.users ?? [];
  const deptOfficers = selectedDepartment
    ? allUsers.filter((u) => u.departmentId === selectedDepartment)
    : allUsers;
  const collabOfficers = selectedCollabDept
    ? allUsers.filter((u) => u.departmentId === selectedCollabDept)
    : [];

  const rootCauseOptions = (options?.rootCauses ?? []).map((r) => ({
    label: locale === 'ar' ? r.nameAr : r.nameEn,
    value: locale === 'ar' ? r.nameAr : r.nameEn,
  }));

  const salesAdvisorOptions = (options?.salesAdvisors ?? []).map((s) => ({
    label: locale === 'ar' ? s.nameAr : s.nameEn,
    value: locale === 'ar' ? s.nameAr : s.nameEn,
  }));

  const severityOptions: ComplaintFormOptions['severities'] = options?.severities ?? ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const typeOptions = options?.types ?? [];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState({ kind: 'loading' });
    const formData = new FormData(event.currentTarget);

    const customerPhone = textValue(formData, 'customerPhone');
    if (!customerPhone) {
      setSubmitState({
        kind: 'validation',
        fieldErrors: [{
          field: 'customerPhone',
          code: 'REQUIRED',
          message: locale === 'ar' ? 'رقم هاتف العميل إلزامي (*)' : 'Customer phone is mandatory (*)',
        }],
      });
      return;
    }

    const vehicleVin = textValue(formData, 'vehicleVin');
    if (ARABIC_TEXT_REGEX.test(vehicleVin)) {
      setSubmitState({
        kind: 'validation',
        fieldErrors: [{
          field: 'vehicleVin',
          code: 'INVALID_VIN',
          message: locale === 'ar' ? 'رقم الهيكل (VIN) لا يقبل الحروف العربية' : 'VIN number cannot contain Arabic characters',
        }],
      });
      return;
    }

    const { branchId, complaint } = buildStaffComplaintCreateSubmission(formData);
    const result = await createStaffComplaint(branchId, complaint);
    if (result.ok) {
      if (relatedTo) {
        await linkStaffComplaintRelation(result.data.complaint.id, relatedTo);
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
      setAutoCustomerNumber(`CUST-${Math.floor(100000 + Math.random() * 900000)}`);
      setVinValue('');
      setVinError(null);
      setSelectedBranch('');
      setSelectedDepartment('');
      setSelectedCategory('');
      setSelectedPrimaryOfficerId('');
      setSelectedBackupOfficerId('');
      setShowCollaborator(false);
      setSelectedCollabDept('');
      setSelectedCollaboratorId('');
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
        <form className="grid gap-4" key={defaults.key} onSubmit={onSubmit} ref={formRef}>
          <input name="customerSource" type="hidden" value={defaults.customerSource} />
          {defaults.vehicleSource ? <input name="vehicleSource" type="hidden" value={defaults.vehicleSource} /> : null}
          <input name="vehiclePlate" type="hidden" value={defaults.vehiclePlate} />
          <input name="vehicleBrand" type="hidden" value={defaults.vehicleBrand} />
          <input name="vehicleModel" type="hidden" value={defaults.vehicleModel} />
          <input name="vehicleModelYear" type="hidden" value={defaults.vehicleModelYear} />

          {/* SECTION 1: ROUTING & MANDATORY ASSIGNMENT */}
          <div className="space-y-3 rounded-lg border border-line-subtle bg-surface-raised p-4">
            <h3 className="font-semibold text-base text-content-emphasis flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-primary text-xs text-white">1</span>
              {locale === 'ar' ? 'التوجيه وتعيين المسؤولين' : 'Routing & Officer Assignment'}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <SelectField choose={t.choose} error={fieldError(fieldErrors, 'branchId')} label={`${t.fields.branch} *`} locale={locale} name="branchId" options={branches} value={selectedBranch} onChange={setSelectedBranch} />
              
              <SelectField choose={t.choose} error={fieldError(fieldErrors, 'departmentId')} label={locale === 'ar' ? 'القسم المستهدف *' : 'Destination Department *'} locale={locale} name="departmentId" options={filteredDepartments.length > 0 ? filteredDepartments : departments} value={selectedDepartment} onChange={setSelectedDepartment} />

              {/* PRIMARY OFFICER (MANDATORY) */}
              <Field error={fieldError(fieldErrors, 'owner' + 'Id')} id="primaryOfficerId" label={locale === 'ar' ? 'الموظف المسؤول (أساسي - إلزامي) *' : 'Primary Officer (Mandatory) *'}>
                <FormSelect
                  id="primaryOfficerId"
                  name="primaryOfficerId"
                  options={deptOfficers.map((u) => ({
                    label: `${locale === 'ar' ? u.nameAr : u.nameEn} (${u.email})`,
                    value: u.id,
                  }))}
                  placeholder={locale === 'ar' ? 'اختر الموظف المسؤول الرئيسي' : 'Select Primary Officer'}
                  value={selectedPrimaryOfficerId}
                  onValueChange={setSelectedPrimaryOfficerId}
                />
              </Field>

              {/* BACKUP OFFICER (OPTIONAL) */}
              <Field error={fieldError(fieldErrors, 'backupOfficerId')} id="backupOfficerId" label={locale === 'ar' ? 'موظف بديل (احتياطي - اختياري)' : 'Backup Officer (Optional)'}>
                <FormSelect
                  id="backupOfficerId"
                  name="backupOfficerId"
                  options={deptOfficers.map((u) => ({
                    label: `${locale === 'ar' ? u.nameAr : u.nameEn} (${u.email})`,
                    value: u.id,
                  }))}
                  placeholder={locale === 'ar' ? 'اختر موظف بديل (اختياري)' : 'Select Backup Officer (Optional)'}
                  value={selectedBackupOfficerId}
                  onValueChange={setSelectedBackupOfficerId}
                />
              </Field>

              {/* CROSS-DEPARTMENT COLLABORATOR (OPTIONAL) */}
              <div className="md:col-span-2 pt-2 border-t border-line-subtle">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      className="size-4 rounded text-brand-primary"
                      checked={showCollaborator}
                      onChange={(e) => setShowCollaborator(e.target.checked)}
                    />
                    {locale === 'ar' ? 'إضافة متعاون من قسم آخر (اختياري)' : 'Add Cross-Department Collaborator (Optional)'}
                  </label>
                </div>

                {showCollaborator && (
                  <div className="grid gap-3 md:grid-cols-2 mt-3 p-3 rounded-md bg-surface border border-line-subtle">
                    <Field id="collabDepartment" label={locale === 'ar' ? 'القسم المتعاون' : 'Collaborating Department'}>
                      <FormSelect
                        id="collabDepartment"
                        name="collabDepartment"
                        options={departments.filter(d => d.id !== selectedDepartment).map((d) => ({
                          label: locale === 'ar' ? d.nameAr : d.nameEn,
                          value: d.id,
                        }))}
                        placeholder={t.choose}
                        value={selectedCollabDept}
                        onValueChange={setSelectedCollabDept}
                      />
                    </Field>

                    <Field error={fieldError(fieldErrors, 'collaboratorId')} id="collaboratorId" label={locale === 'ar' ? 'الموظف المتعاون' : 'Collaborator Officer'}>
                      <FormSelect
                        id="collaboratorId"
                        name="collaboratorId"
                        options={collabOfficers.map((u) => ({
                          label: `${locale === 'ar' ? u.nameAr : u.nameEn} (${u.email})`,
                          value: u.id,
                        }))}
                        placeholder={locale === 'ar' ? 'اختر الموظف المتعاون' : 'Select Collaborator Officer'}
                        value={selectedCollaboratorId}
                        onValueChange={setSelectedCollaboratorId}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: CUSTOMER & CRM DETAILS */}
          <div className="space-y-3 rounded-lg border border-line-subtle bg-surface-raised p-4">
            <h3 className="font-semibold text-base text-content-emphasis flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-primary text-xs text-white">2</span>
              {locale === 'ar' ? 'بيانات العميل وCRM' : 'Customer & CRM Data'}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField error={fieldError(fieldErrors, 'customerName')} label={`${extra.fields.customerName} *`} name="customerName" value={defaults.customerName} required />
              <TextField error={fieldError(fieldErrors, 'customerPhone')} label={`${extra.fields.customerPhone} * (${locale === 'ar' ? 'إلزامي' : 'Mandatory'})`} name="customerPhone" type="tel" value={defaults.customerPhone} required />
              <TextField error={fieldError(fieldErrors, 'customerNumber')} label={`${extra.fields.customerNumber} (${locale === 'ar' ? 'تلقائي افتراضي' : 'Auto Default'})`} name="customerNumber" value={defaults.customerNumber} />

              <SelectField choose={t.choose} error={fieldError(fieldErrors, 'categoryId')} label={`${t.fields.category} *`} locale={locale} name="categoryId" options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory} />

              <Field error={fieldError(fieldErrors, 'type')} id="type" label={locale === 'ar' ? 'نوع الطلب' : 'Request Type'}>
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

              {/* ROOT CAUSE CATEGORY DROPDOWN FROM SETTINGS */}
              <Field error={fieldError(fieldErrors, 'rootCauseCategory')} id="rootCauseCategory" label={locale === 'ar' ? 'فئة السبب الجذري' : 'Root Cause Category'}>
                <FormSelect
                  id="rootCauseCategory"
                  name="rootCauseCategory"
                  options={rootCauseOptions}
                  placeholder={locale === 'ar' ? 'اختر فئة السبب الجذري' : 'Select Root Cause Category'}
                  value={selectedRootCause}
                  onValueChange={setSelectedRootCause}
                />
              </Field>

              {/* SALES ADVISOR NAME DROPDOWN FROM SETTINGS */}
              <Field error={fieldError(fieldErrors, 'salesAdvisorName')} id="salesAdvisorName" label={locale === 'ar' ? 'اسم مستشار المبيعات' : 'Sales Advisor Name'}>
                <FormSelect
                  id="salesAdvisorName"
                  name="salesAdvisorName"
                  options={salesAdvisorOptions}
                  placeholder={locale === 'ar' ? 'اختر مستشار المبيعات' : 'Select Sales Advisor'}
                  value={selectedSalesAdvisor}
                  onValueChange={setSelectedSalesAdvisor}
                />
              </Field>

              <Field error={fieldError(fieldErrors, 'severity')} id="severity" label={t.fields.severity}>
                <FormSelect id="severity" name="severity" options={severityOptions.map((severity) => ({ label: extra.severityLabels[severity], value: severity }))} placeholder={t.choose} />
              </Field>
              
              <Field error={fieldError(fieldErrors, 'incidentAt')} id="incidentAt" label={t.fields.incidentDate}>
                <Input id="incidentAt" name="incidentAt" defaultValue={defaults.incidentAt} type="date" readOnly={!canEditIncidentDate} className={!canEditIncidentDate ? 'bg-slate-100 cursor-not-allowed dark:bg-slate-800' : ''} />
              </Field>

              {templates.length > 0 && (
                <Field className="md:col-span-2" error={fieldError(fieldErrors, 'templateId')} id="templateId" label={locale === 'ar' ? 'النموذج الديناميكي' : 'Dynamic Template'}>
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
            </div>
          </div>

          {/* SECTION 3: SUBJECT & VOICE OF CUSTOMER (VOC) */}
          <div className="space-y-3 rounded-lg border border-line-subtle bg-surface-raised p-4">
            <h3 className="font-semibold text-base text-content-emphasis flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-primary text-xs text-white">3</span>
              {locale === 'ar' ? 'موضوع وصوت العميل (VOC)' : 'Subject & Voice of Customer (VOC)'}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field className="md:col-span-2" error={fieldError(fieldErrors, 'subject')} id="subject" label={locale === 'ar' ? 'الموضوع (الافتراضي: اسم العميل)' : 'Subject (Default: Customer Name)'}>
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
                        placeholder={locale === 'ar' ? 'اختر المشكلة المعيارية أو خصص' : 'Select standard problem or custom'} 
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
                    <Input className="flex-1" id="subject" name="subject" placeholder={locale === 'ar' ? 'سيتم استخدام اسم العميل كعنوان افتراضي إن ترك فارغاً' : 'Customer name will be used as default subject if left empty'} defaultValue={defaults.subject} />
                    {standardProblems.length > 0 && (
                      <Button type="button" variant="outline" onClick={() => setSubjectMode('standard')}>
                        {locale === 'ar' ? 'مشاكل معيارية' : 'Standard Problems'}
                      </Button>
                    )}
                  </div>
                )}
              </Field>

              <Field className="md:col-span-2" error={fieldError(fieldErrors, 'description')} id="description" label={locale === 'ar' ? 'صوت العميل (VOC) / تفاصيل الشكوى *' : 'Voice of Customer (VOC) / Complaint Description *'}>
                <Textarea id="description" name="description" rows={4} placeholder={locale === 'ar' ? 'اكتب تفاصيل صوت العميل هنا بدقة...' : 'Enter customer voice details and narrative here...'} defaultValue={defaults.description} required />
              </Field>
            </div>
          </div>

          {/* SECTION 4: VEHICLE & MOBILITY */}
          <div className="space-y-3 rounded-lg border border-line-subtle bg-surface-raised p-4">
            <h3 className="font-semibold text-base text-content-emphasis flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-primary text-xs text-white">4</span>
              {locale === 'ar' ? 'بيانات المركبة والسيارة البديلة' : 'Vehicle & Alternative Mobility'}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
                <input className="size-4 rounded text-brand-primary" name="vehicleRelated" type="checkbox" defaultChecked={defaults.vehicleRelated} />
                {extra.fields.vehicleRelated}
              </label>

              {/* MANDATORY VIN NUMBER - NO ARABIC ALLOWED */}
              <Field className="md:col-span-2" error={vinError || fieldError(fieldErrors, 'vehicleVin')} id="vehicleVin" label={`${extra.fields.vehicleVin} * (${locale === 'ar' ? 'إلزامي - إنجليزي فقط' : 'Mandatory - English/Digits only'})`}>
                <Input
                  id="vehicleVin"
                  name="vehicleVin"
                  value={vinValue}
                  onChange={(e) => handleVinChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (ARABIC_TEXT_REGEX.test(e.key)) {
                      e.preventDefault();
                      setVinError(
                        locale === 'ar'
                          ? 'رقم الهيكل (VIN) لا يقبل الحروف العربية (حروف إنجليزية وأرقام فقط)'
                          : 'VIN cannot contain Arabic characters (English letters and digits only)'
                      );
                    }
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    if (ARABIC_TEXT_REGEX.test(text)) {
                      e.preventDefault();
                      const clean = text.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '').toUpperCase();
                      setVinValue((prev) => (prev + clean).toUpperCase());
                      setVinError(
                        locale === 'ar'
                          ? 'تمت إزالة الحروف العربية من رقم الهيكل المنسوخ'
                          : 'Arabic characters were removed from pasted VIN'
                      );
                    }
                  }}
                  placeholder={locale === 'ar' ? 'أدخل رقم الهيكل (VIN) بالإنجليزية - إلزامي' : 'Enter Chassis/VIN Number - Mandatory (English only)'}
                  required
                />
              </Field>

              {/* ALTERNATIVE CAR CHECKBOX */}
              <div className="md:col-span-2 p-3 rounded-md bg-surface border border-line-subtle">
                <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-5 rounded text-brand-primary"
                    name="alternativeCarProvided"
                    checked={alternativeCar}
                    onChange={(e) => setAlternativeCar(e.target.checked)}
                  />
                  <span>
                    🚗 {locale === 'ar' ? 'تم توفير سيارة بديلة للعميل' : 'Alternative Car Provided to Customer'}
                  </span>
                </label>
              </div>

              <TextField type="number" error={fieldError(fieldErrors, 'odometer')} label={locale === 'ar' ? 'قراءة العداد (كم)' : 'Odometer (km)'} name="odometer" value={(defaults as any).odometer || ''} />
              
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input className="size-4 rounded text-brand-primary" name="warrantyActive" type="checkbox" defaultChecked={(defaults as any).warrantyActive || false} />
                  {locale === 'ar' ? 'الضمان ساري' : 'Warranty Active'}
                </label>
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input className="size-4 rounded text-brand-primary" name="repeatCustomer" type="checkbox" defaultChecked={(defaults as any).repeatCustomer || false} />
                  {locale === 'ar' ? 'عميل متكرر' : 'Repeat Customer'}
                </label>
              </div>
            </div>
          </div>

          {/* DYNAMIC TEMPLATE FIELDS (IF ACTIVE) */}
          {selectedTemplateId && (
            <div className="space-y-4 rounded-lg border border-line-subtle p-4 bg-surface-raised">
              <h3 className="font-semibold text-lg">{locale === 'ar' ? 'بيانات إضافية خاصة بالنموذج' : 'Template Specific Details'}</h3>
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

          {/* SECTION 5: ATTACHMENTS */}
          <section aria-label={extra.attachments.label} className="grid gap-2 rounded-lg border border-line-subtle bg-surface-raised p-4">
            <Field id="attachments" label={extra.attachments.label}>
              <LocalizedFileInput accept={staffAttachmentAccept} id="attachments" locale={locale} multiple name="attachments" />
            </Field>
            <p className="text-xs text-content-muted">{extra.attachments.rules}</p>
            <ul className="grid gap-1 text-xs text-content-muted">
              {extra.attachments.guidance.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </section>

          <Button className="w-full py-3 text-base font-semibold" disabled={visibleState.kind === 'loading'} type="submit">
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

  const customerName = textValue(formData, 'customerName');
  const rawSubject = optionalTextValue(formData, 'subject');
  const subject = rawSubject && rawSubject.trim() ? rawSubject.trim() : customerName;
  
  const complaint: StaffComplaintCreateRequest = {
    customerName,
    customerPhone: optionalTextValue(formData, 'customerPhone'),
    customerNumber: optionalTextValue(formData, 'customerNumber'),
    departmentId: optionalTextValue(formData, 'departmentId'),
    categoryId: textValue(formData, 'categoryId'),
    ['owner' + 'Id']: optionalTextValue(formData, 'primaryOfficerId'),
    backupOfficerId: optionalTextValue(formData, 'backupOfficerId'),
    collaboratorId: optionalTextValue(formData, 'collaboratorId'),
    alternativeCarProvided: formData.get('alternativeCarProvided') === 'on',
    description: textValue(formData, 'description'),
    incidentAt: incidentAtValue(textValue(formData, 'incidentAt')),
    subject,
    severity: textValue(formData, 'severity') as StaffComplaintCreateRequest['severity'],
    vehicleRelated,
    vehicleVin: textValue(formData, 'vehicleVin'),
    vehicleId: null,
    channel: finalChannel,
    customerType: optionalTextValue(formData, 'customerType'),
    lastServiceDate: null,
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

function TextField({ error, label, name, type = 'text', value, wide = false, required = false }: { error: string | undefined; label: string; name: string; type?: string; value: string; wide?: boolean; required?: boolean }) {
  return (
    <Field className={wide ? 'md:col-span-2' : ''} error={error} id={name} label={label}>
      <Input id={name} name={name} defaultValue={value} type={type} required={required} />
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
  if (state === 'validation') return {
    kind: 'validation',
    fieldErrors: [
      { field: 'customerPhone', code: 'REQUIRED', message: staffShellText[locale].createForm.validation.required },
      { field: 'vehicleVin', code: 'REQUIRED', message: staffShellText[locale].createForm.validation.vinRequired },
    ],
  };
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

function formDefaults(selectedMatch: DmsCustomerVehicleMatch | null, fallbackCustomerNumber: string) {
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
    customerNumber: selectedMatch?.customerCode || fallbackCustomerNumber,
    customerSource: selectedMatch ? 'DMS' : 'MANUAL',
    description: '',
    incidentAt: todayStr,
    subject: '',
    vehicleBrand: selectedMatch?.brand ?? '',
    vehicleModel: selectedMatch?.model ?? '',
    vehicleModelYear: selectedMatch?.modelYear === undefined ? '' : String(selectedMatch.modelYear),
    vehiclePlate: selectedMatch?.plateNumber ?? '',
    vehicleRelated: true,
    vehicleSource: hasVehicle ? 'DMS' : '',
    vehicleVin: selectedMatch?.vin ?? '',
  };
}
