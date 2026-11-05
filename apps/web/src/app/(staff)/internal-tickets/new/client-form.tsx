'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createInternalTicket, getDepartmentFormFields } from '../../../../lib/staff-internal-tickets-actions';
import { attachmentFileToBase64, normalizeAttachmentMime, validateStaffAttachmentFile } from '../../../../lib/attachment-file-policy';
import { staffAttachmentFiles } from '../../../../lib/staff-attachments-api';
import { Paperclip } from 'lucide-react';
import { DueDatePicker, TIME_OPTIONS } from './due-date-picker';
import { CustomFieldsRenderer, CustomFieldDef } from './custom-fields-renderer';
import { ticketPhoneRuleText } from '../../../../i18n/staff-ticket-phone-rule';
import { useTicketDraft, type TicketDraft } from '../../../../lib/use-ticket-draft';
import { staffNavigationText } from '../../../../i18n/staff-navigation';
import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';

interface DepartmentConfig {
  enablePriorityField: boolean;
  enableDueDateField: boolean;
  enableAttachmentsField: boolean;
  enableOfficerSelection: boolean;
}

export default function CreateInternalTicketForm({
  options,
  locale = 'en',
  draftOwner = null,
}: {
  options: { departments: any[]; categories: any[]; employees: any[] };
  locale?: 'en' | 'ar';
  draftOwner?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const draftState = useTicketDraft(draftOwner);
  const { draft, update, ready: draftReady } = draftState;
  const { title, description, dateMode, timeIndex, specificDate, assignmentMode, selectedDepartmentId,
    selectedRequestedEmployeeId, selectedCategoryId, selectedPriority, customFieldValues } = draft;
  function draftField<K extends keyof TicketDraft>(key: K) { return (value: React.SetStateAction<TicketDraft[K]>) => update(key, value); }
  const setDateMode = draftField('dateMode'), setTimeIndex = draftField('timeIndex'), setSpecificDate = draftField('specificDate');
  const setAssignmentMode = draftField('assignmentMode'), setSelectedRequestedEmployeeId = draftField('selectedRequestedEmployeeId');
  const setSelectedCategoryId = draftField('selectedCategoryId'), setSelectedPriority = draftField('selectedPriority');
  const setCustomFieldValues = draftField('customFieldValues');
  const setSelectedDepartmentId = (value: string) => { update('selectedDepartmentId', value); update('customFieldValues', {}); update('selectedRequestedEmployeeId', ''); };
  const navigation = staffNavigationText[locale];
  const [discardOpen, setDiscardOpen] = useState(false);

  // Department-specific dynamic fields & rules
  const [deptConfig, setDeptConfig] = useState<DepartmentConfig>({
    enablePriorityField: true,
    enableDueDateField: true,
    enableAttachmentsField: true,
    enableOfficerSelection: true,
  });
  const [deptCustomFields, setDeptCustomFields] = useState<CustomFieldDef[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [phoneAcknowledgements, setPhoneAcknowledgements] = useState<Record<string, boolean>>({});
  const [phoneLookupVersion, setPhoneLookupVersion] = useState(0);

  useEffect(() => {
    if (!draftReady) return;
    setPhoneAcknowledgements({});
    if (!selectedDepartmentId) {
      setDeptConfig({
        enablePriorityField: true,
        enableDueDateField: true,
        enableAttachmentsField: true,
        enableOfficerSelection: true,
      });
      setDeptCustomFields([]);
      setCustomFieldValues({});
      return;
    }

    let isMounted = true;
    setLoadingFields(true);
    getDepartmentFormFields(selectedDepartmentId)
      .then((res) => {
        if (!isMounted) return;
        if (res.config) {
          setDeptConfig(res.config);
          if (!res.config.enableOfficerSelection) {
            setAssignmentMode('department');
            setSelectedRequestedEmployeeId('');
          }
        } else {
          setDeptConfig({
            enablePriorityField: true,
            enableDueDateField: true,
            enableAttachmentsField: true,
            enableOfficerSelection: true,
          });
        }
        setDeptCustomFields(res.customFields || []);
      })
      .catch((err) => {
        console.error('Failed to load department fields:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingFields(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDepartmentId, draftReady]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const targetDepartmentId = formData.get('targetDepartmentId') as string;
    const categoryId = formData.get('categoryId') as string;

    // Validate required custom fields
    for (const f of deptCustomFields) {
      if (f.isRequired) {
        const val = customFieldValues[f.id];
        if (val === undefined || val === null || val === '') {
          setError(`Field "${f.nameEn}" is required.`);
          setLoading(false);
          return;
        }
      }
    }

    let finalDueAt: string | undefined = undefined;
    if (deptConfig.enableDueDateField) {
      if (dateMode === 'relative') {
        const selectedOption = TIME_OPTIONS[timeIndex] || TIME_OPTIONS[4];
        const hours = selectedOption?.hours ?? 24;
        const date = new Date(Date.now() + hours * 60 * 60 * 1000);
        finalDueAt = date.toISOString();
      } else if (specificDate) {
        finalDueAt = new Date(specificDate).toISOString();
      }
    }

    try {
      const payload: any = { title, description, targetDepartmentId, categoryId };
      payload.acknowledgedPhoneFields = Object.keys(phoneAcknowledgements).filter(id => phoneAcknowledgements[id]);
      if (deptConfig.enableOfficerSelection && selectedRequestedEmployeeId) {
        payload.requestedEmployeeId = selectedRequestedEmployeeId;
      }
      if (deptConfig.enablePriorityField && selectedPriority) {
        payload.priority = selectedPriority;
      }
      if (finalDueAt) payload.dueAt = finalDueAt;
      if (Object.keys(customFieldValues).length > 0) {
        payload.customFields = customFieldValues;
      }

      if (deptConfig.enableAttachmentsField) {
        const files = staffAttachmentFiles(formData);
        if (files.length > 0) {
          for (const file of files) {
            const val = validateStaffAttachmentFile(file);
            if (!val.ok) {
              setError(
                val.code === 'ATTACHMENT_SIZE_EXCEEDED'
                  ? `File "${file.name}" exceeds the 5MB size limit.`
                  : `File "${file.name}" is not allowed. Only JPG, PNG, or WebP images are allowed.`
              );
              setLoading(false);
              return;
            }
          }

          payload.attachments = await Promise.all(
            files.map(async (f) => ({
              fileName: f.name,
              contentType: normalizeAttachmentMime(f.name, f.type),
              sizeBytes: f.size,
              contentBase64: await attachmentFileToBase64(f),
            }))
          );
        }
      }

      const result = await createInternalTicket(payload);
      if (result && !result.success) {
        if (result.code === 'DUPLICATE_CUSTOMER_PHONE') setPhoneLookupVersion(version => version + 1);
        setError(result.code === 'DUPLICATE_CUSTOMER_PHONE' ? ticketPhoneRuleText[locale].duplicate : result.error || 'Failed to create ticket');
        setLoading(false);
        return;
      }

      draftState.clear(true);
      router.push(`/internal-tickets?locale=${locale}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create ticket');
      setLoading(false);
    }
  }

  return (
    <form ref={draftState.formRef} onChangeCapture={draftState.captureFiles} data-draft-persisted={draftReady && draftState.available && Boolean(draftOwner)} data-draft-has-files={draft.attachmentNames.length > 0} onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-3xl border border-line-subtle bg-surface p-6 sm:p-8 shadow-sm max-w-2xl">
      {error && <div className="rounded-xl bg-status-error/10 p-4 text-sm font-semibold text-status-error">{error}</div>}
      <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
        <p role="status">{draftState.available ? draftState.restored ? navigation.restored : navigation.draftSaved : navigation.draftUnavailable}</p>
        {draftState.missingFiles && <p role="alert" className="text-destructive">{navigation.missingFiles}</p>}
        <Button type="button" size="sm" variant="outline" onClick={() => setDiscardOpen(true)}>{navigation.discard}</Button>
      </div>
      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}><DialogContent dir={locale === 'ar' ? 'rtl' : 'ltr'}><DialogHeader><DialogTitle>{navigation.discard}</DialogTitle><DialogDescription>{navigation.discardHint}</DialogDescription></DialogHeader><DialogFooter>
        <Button type="button" variant="outline" onClick={() => setDiscardOpen(false)}>{navigation.stay}</Button>
        <Button type="button" onClick={() => { draftState.clear(true); setPhoneAcknowledgements({}); setDiscardOpen(false); }}>{navigation.discard}</Button>
      </DialogFooter></DialogContent></Dialog>

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-bold text-content-strong">Title</label>
        <input required id="title" name="title" value={title} onChange={event => update('title', event.target.value)} className="rounded-xl border border-line-subtle bg-surface-canvas p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors" placeholder="Brief summary of request" />
      </div>

      <div className="flex flex-col gap-5 border border-line-subtle rounded-2xl p-5 bg-surface-canvas/50">
        <label className="text-sm font-bold text-content-strong">How should this ticket be assigned?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setAssignmentMode('department');
              setSelectedRequestedEmployeeId('');
            }}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
              assignmentMode === 'department'
                ? 'border-brand bg-brand/5 text-brand font-bold shadow-sm'
                : 'border-line-subtle bg-surface hover:border-brand/30 text-content-muted'
            }`}
          >
            Send to Department
            <span className="text-xs font-normal text-content-subtle mt-1">Manager will assign it</span>
          </button>
          <button
            type="button"
            aria-pressed={assignmentMode === 'officer'}
            disabled={!deptConfig.enableOfficerSelection}
            onClick={() => setAssignmentMode('officer')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
              !deptConfig.enableOfficerSelection
                ? 'opacity-40 cursor-not-allowed border-line-subtle bg-surface'
                : assignmentMode === 'officer'
                ? 'border-brand bg-brand/5 text-brand font-bold shadow-sm'
                : 'border-line-subtle bg-surface hover:border-brand/30 text-content-muted'
            }`}
          >
            Specific Officer
            <span className="text-xs font-normal text-content-subtle mt-1">
              {!deptConfig.enableOfficerSelection ? 'Disabled by department rule' : "Bypasses manager's inbox"}
            </span>
          </button>
        </div>

        {options.departments?.length === 0 && (
          <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-3 text-xs text-status-warning">
            Your department is currently not permitted to send internal tickets to any department. Contact your administrator to adjust routing rules in Admin Hub.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="targetDepartmentId" className="text-sm font-bold text-content-strong">Department</label>
            <select
              required
              id="targetDepartmentId"
              name="targetDepartmentId"
              value={selectedDepartmentId}
              onChange={(e) => {
                setSelectedDepartmentId(e.target.value);
                setSelectedCategoryId('');
                setSelectedRequestedEmployeeId('');
              }}
              className="rounded-xl border border-line-subtle bg-surface p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
            >
              <option value="">{options.departments?.length ? 'Select a department...' : 'No permitted target departments'}</option>
              {options.departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nameEn}{d.nameAr ? ` - ${d.nameAr}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="categoryId" className="text-sm font-bold text-content-strong">Category</label>
            <select
              required
              id="categoryId"
              name="categoryId"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="rounded-xl border border-line-subtle bg-surface p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
            >
              <option value="">Select a category...</option>
              {options.categories?.filter((c: any) => !c.departmentId || c.departmentId === selectedDepartmentId).map((c: any) => (
                <option key={c.id} value={c.id}>{c.nameEn}</option>
              ))}
            </select>
          </div>

          {assignmentMode === 'officer' && deptConfig.enableOfficerSelection && (
            <div className="flex flex-col gap-2 sm:col-span-2 mt-2 pt-4 border-t border-line-subtle border-dashed">
              <label htmlFor="requestedEmployeeId" className="text-sm font-bold text-content-strong">Select Officer</label>
              <select
                required
                id="requestedEmployeeId"
                name="requestedEmployeeId"
                value={selectedRequestedEmployeeId}
                onChange={(e) => setSelectedRequestedEmployeeId(e.target.value)}
                disabled={!selectedDepartmentId}
                className="rounded-xl border border-line-subtle bg-surface p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors disabled:opacity-50"
              >
                <option value="">Choose an officer...</option>
                {options.employees?.filter((e: any) => e.departmentId === selectedDepartmentId && e.role?.code !== 'DEPARTMENT_MANGER').map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.nameEn || e.nameAr || 'Unknown'}{e.phone ? ` (${e.phone})` : ''} - {e.activeTicketsCount ?? 0} active tasks
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loadingFields && (
        <div className="text-xs text-brand font-medium animate-pulse py-1">Loading department custom rules and fields...</div>
      )}

      {/* Target Department Custom Fields */}
      <CustomFieldsRenderer
        isAr={locale === 'ar'}
        lookupVersion={phoneLookupVersion}
        onPhoneAcknowledge={(id, accepted) => setPhoneAcknowledgements(previous => ({ ...previous, [id]: accepted }))}
        fields={deptCustomFields}
        values={customFieldValues}
        onChange={(fieldId, val) => setCustomFieldValues((prev) => ({ ...prev, [fieldId]: val }))}
      />

      {/* Priority Picker */}
      {deptConfig.enablePriorityField && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-content-strong">Level of Emergency (Priority)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'LOW', label: 'Low', active: 'border-line-strong bg-surface-raised text-content-strong' },
              { id: 'NORMAL', label: 'Normal', active: 'border-brand bg-brand/10 text-brand' },
              { id: 'HIGH', label: 'High', active: 'border-status-warning bg-status-warning/10 text-status-warning' },
              { id: 'URGENT', label: 'Urgent', active: 'border-status-error bg-status-error/10 text-status-error' },
            ].map((p) => (
              <button
                key={p.id}
                aria-pressed={selectedPriority === p.id}
                type="button"
                onClick={() => setSelectedPriority(p.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                  selectedPriority === p.id ? `${p.active} font-bold shadow-sm` : 'border-line-subtle bg-surface hover:border-line-strong text-content-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Flexible Due Date Picker */}
      {deptConfig.enableDueDateField && (
        <DueDatePicker
          dateMode={dateMode}
          setDateMode={setDateMode}
          timeIndex={timeIndex}
          setTimeIndex={setTimeIndex}
          specificDate={specificDate}
          setSpecificDate={setSpecificDate}
        />
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-bold text-content-strong">Description</label>
        <textarea required id="description" name="description" value={description} onChange={event => update('description', event.target.value)} rows={5} className="rounded-xl border border-line-subtle bg-surface-canvas p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors" placeholder="Detailed explanation of the task or request..." />
      </div>

      {deptConfig.enableAttachmentsField && (
        <div className="flex flex-col gap-2">
          <label htmlFor="attachments" className="text-sm font-bold text-content-strong flex items-center gap-1.5"><Paperclip className="size-4" /> Attachments</label>
          <input 
            ref={draftState.attachmentRef}
            id="attachments" 
            name="attachments" 
            type="file" 
            multiple
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="rounded-xl border border-line-subtle bg-surface-canvas p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20" 
          />
          <p className="text-xs text-content-muted">JPG, PNG, and WebP images are allowed (max 5MB each).</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-line-subtle">
        <Button asChild variant="outline"><a href={`/internal-tickets?locale=${locale}`}>{navigation.back}</a></Button>
        <button type="submit" disabled={loading} className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-hover hover:shadow disabled:opacity-50 transition-all">
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </div>
    </form>
  );
}
