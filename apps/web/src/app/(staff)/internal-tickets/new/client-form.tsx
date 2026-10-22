'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createInternalTicket, getDepartmentFormFields } from '../../../../lib/staff-internal-tickets-actions';
import { attachmentFileToBase64, normalizeAttachmentMime, validateAttachmentFile } from '../../../../lib/attachment-file-policy';
import { staffAttachmentFiles } from '../../../../lib/staff-attachments-api';
import { Paperclip } from 'lucide-react';
import { DueDatePicker, TIME_OPTIONS } from './due-date-picker';
import { CustomFieldsRenderer, CustomFieldDef } from './custom-fields-renderer';

interface DepartmentConfig {
  enablePriorityField: boolean;
  enableDueDateField: boolean;
  enableAttachmentsField: boolean;
  enableOfficerSelection: boolean;
}

export default function CreateInternalTicketForm({
  options,
}: {
  options: { departments: any[]; categories: any[]; employees: any[] };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [dateMode, setDateMode] = useState<'relative' | 'specific'>('relative');
  const [timeIndex, setTimeIndex] = useState(4);
  const [specificDate, setSpecificDate] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<'department' | 'officer'>('department');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedRequestedEmployeeId, setSelectedRequestedEmployeeId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('NORMAL');

  // Department-specific dynamic fields & rules
  const [deptConfig, setDeptConfig] = useState<DepartmentConfig>({
    enablePriorityField: true,
    enableDueDateField: true,
    enableAttachmentsField: true,
    enableOfficerSelection: true,
  });
  const [deptCustomFields, setDeptCustomFields] = useState<CustomFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [loadingFields, setLoadingFields] = useState(false);

  useEffect(() => {
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
        setCustomFieldValues({});
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
  }, [selectedDepartmentId]);

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
            const val = validateAttachmentFile(file);
            if (!val.ok) {
              setError(
                val.code === 'ATTACHMENT_SIZE_EXCEEDED'
                  ? `File "${file.name}" exceeds the 5MB size limit.`
                  : `File "${file.name}" is not allowed. Only JPG images (.jpg, .jpeg) are allowed.`
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
        setError(result.error || 'Failed to create ticket');
        setLoading(false);
        return;
      }

      router.push('/internal-tickets');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to create ticket');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-3xl border border-line-subtle bg-surface p-6 sm:p-8 shadow-sm max-w-2xl">
      {error && <div className="rounded-xl bg-status-error/10 p-4 text-sm font-semibold text-status-error">{error}</div>}

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-bold text-content-strong">Title</label>
        <input required id="title" name="title" className="rounded-xl border border-line-subtle bg-surface-canvas p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors" placeholder="Brief summary of request" />
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
        <textarea required id="description" name="description" rows={5} className="rounded-xl border border-line-subtle bg-surface-canvas p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors" placeholder="Detailed explanation of the task or request..." />
      </div>

      {deptConfig.enableAttachmentsField && (
        <div className="flex flex-col gap-2">
          <label htmlFor="attachments" className="text-sm font-bold text-content-strong flex items-center gap-1.5"><Paperclip className="size-4" /> Attachments</label>
          <input 
            id="attachments" 
            name="attachments" 
            type="file" 
            multiple
            accept=".jpg,.jpeg,image/jpeg"
            className="rounded-xl border border-line-subtle bg-surface-canvas p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20" 
          />
          <p className="text-xs text-content-muted">Only JPG images are allowed (.jpg, .jpeg, max 5MB).</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-line-subtle">
        <button type="button" onClick={() => router.back()} className="rounded-xl px-5 py-2.5 text-sm font-bold text-content-muted hover:bg-surface-raised transition-colors">Cancel</button>
        <button type="submit" disabled={loading} className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-hover hover:shadow disabled:opacity-50 transition-all">
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </div>
    </form>
  );
}
