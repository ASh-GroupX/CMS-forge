'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInternalTicket } from '../../../../lib/staff-internal-tickets-actions';
import { attachmentFileToBase64, normalizeAttachmentMime, validateAttachmentFile } from '../../../../lib/attachment-file-policy';
import { staffAttachmentFiles } from '../../../../lib/staff-attachments-api';
import { Calendar, Clock, Paperclip } from 'lucide-react';

const TIME_OPTIONS = [
  { label: '1 Hour', hours: 1 },
  { label: '3 Hours', hours: 3 },
  { label: '6 Hours', hours: 6 },
  { label: '12 Hours', hours: 12 },
  { label: '1 Day', hours: 24 },
  { label: '3 Days', hours: 72 },
  { label: '5 Days', hours: 120 },
  { label: '1 Week', hours: 168 },
] as const;

export default function CreateInternalTicketForm({ options }: { options: { departments: any[], categories: any[], employees: any[] } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [dateMode, setDateMode] = useState<'relative' | 'specific'>('relative');
  const [timeIndex, setTimeIndex] = useState(4); // Default to '1 Day'
  const [specificDate, setSpecificDate] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<'department' | 'officer'>('department');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedRequestedEmployeeId, setSelectedRequestedEmployeeId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('NORMAL');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const targetDepartmentId = formData.get('targetDepartmentId') as string;
    const categoryId = formData.get('categoryId') as string;
    const priority = formData.get('priority') as string;
    
    let finalDueAt: string | undefined = undefined;

    if (dateMode === 'relative') {
      const selectedOption = TIME_OPTIONS[timeIndex] || TIME_OPTIONS[4];
      const hours = selectedOption?.hours ?? 24;
      const date = new Date(Date.now() + hours * 60 * 60 * 1000);
      finalDueAt = date.toISOString();
    } else if (specificDate) {
      finalDueAt = new Date(specificDate).toISOString();
    }

    try {
      const payload: any = { title, description, targetDepartmentId, categoryId };
      if (selectedRequestedEmployeeId) payload.requestedEmployeeId = selectedRequestedEmployeeId;
      if (priority) payload.priority = priority;
      if (finalDueAt) payload.dueAt = finalDueAt;

      const files = staffAttachmentFiles(formData);
      if (files.length > 0) {
        for (const file of files) {
          const val = validateAttachmentFile(file);
          if (!val.ok) {
            if (val.code === 'ATTACHMENT_SIZE_EXCEEDED') {
              setError(`File "${file.name}" exceeds the 5MB size limit.`);
            } else {
              setError(`File "${file.name}" is not allowed. Only JPG images (.jpg, .jpeg) are allowed.`);
            }
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
            onClick={() => setAssignmentMode('officer')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
              assignmentMode === 'officer' 
                ? 'border-brand bg-brand/5 text-brand font-bold shadow-sm' 
                : 'border-line-subtle bg-surface hover:border-brand/30 text-content-muted'
            }`}
          >
            Specific Officer
            <span className="text-xs font-normal text-content-subtle mt-1">Bypasses manager's inbox</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="targetDepartmentId" className="text-sm font-bold text-content-strong">Department</label>
            <select required id="targetDepartmentId" name="targetDepartmentId" value={selectedDepartmentId} onChange={(e) => {
              setSelectedDepartmentId(e.target.value);
              setSelectedCategoryId('');
              setSelectedRequestedEmployeeId('');
            }} className="rounded-xl border border-line-subtle bg-surface p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors">
              <option value="">Select a department...</option>
              {options.departments?.map((d) => (
                <option key={d.id} value={d.id}>{d.nameEn}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="categoryId" className="text-sm font-bold text-content-strong">Category</label>
            <select required id="categoryId" name="categoryId" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} className="rounded-xl border border-line-subtle bg-surface p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors">
              <option value="">Select a category...</option>
              {options.categories?.filter((c: any) => !c.departmentId || c.departmentId === selectedDepartmentId).map((c: any) => (
                <option key={c.id} value={c.id}>{c.nameEn}</option>
              ))}
            </select>
          </div>

          {assignmentMode === 'officer' && (
            <div className="flex flex-col gap-2 sm:col-span-2 mt-2 pt-4 border-t border-line-subtle border-dashed">
              <label htmlFor="requestedEmployeeId" className="text-sm font-bold text-content-strong">
                Select Officer
              </label>
              <select required id="requestedEmployeeId" name="requestedEmployeeId" value={selectedRequestedEmployeeId} onChange={(e) => setSelectedRequestedEmployeeId(e.target.value)} disabled={!selectedDepartmentId} className="rounded-xl border border-line-subtle bg-surface p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors disabled:opacity-50">
                <option value="">Choose an officer...</option>
                {options.employees?.filter((e: any) => e.departmentId === selectedDepartmentId && e.role?.code !== 'DEPARTMENT_MANGER').map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.nameEn || e.nameAr || 'Unknown'}{e.phone ? ` (${e.phone})` : ''} - {e.activeTicketsCount ?? 0} active task{e.activeTicketsCount === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-bold text-content-strong">Level of Emergency (Priority)</label>
        <input type="hidden" name="priority" value={selectedPriority} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setSelectedPriority('LOW')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
              selectedPriority === 'LOW' 
                ? 'border-slate-500 bg-slate-50 text-slate-700 font-bold shadow-sm' 
                : 'border-line-subtle bg-surface hover:border-slate-300 text-content-muted'
            }`}
          >
            Low
          </button>
          <button
            type="button"
            onClick={() => setSelectedPriority('NORMAL')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
              selectedPriority === 'NORMAL' 
                ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' 
                : 'border-line-subtle bg-surface hover:border-blue-300 text-content-muted'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setSelectedPriority('HIGH')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
              selectedPriority === 'HIGH' 
                ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-sm' 
                : 'border-line-subtle bg-surface hover:border-orange-300 text-content-muted'
            }`}
          >
            High
          </button>
          <button
            type="button"
            onClick={() => setSelectedPriority('URGENT')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
              selectedPriority === 'URGENT' 
                ? 'border-red-500 bg-red-50 text-red-700 font-bold shadow-sm' 
                : 'border-line-subtle bg-surface hover:border-red-300 text-content-muted'
            }`}
          >
            Urgent
          </button>
        </div>
      </div>

      {/* Flexible Due Date Picker */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line-subtle bg-surface-canvas/50 p-5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold text-content-strong">Timeline / Due Date</label>
          
          <div className="flex items-center gap-1 rounded-lg bg-surface border border-line-subtle p-1">
            <button
              type="button"
              onClick={() => setDateMode('relative')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${dateMode === 'relative' ? 'bg-brand text-white shadow-sm' : 'text-content-muted hover:text-content-strong'}`}
            >
              <Clock className="size-3.5" /> Relative
            </button>
            <button
              type="button"
              onClick={() => setDateMode('specific')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${dateMode === 'specific' ? 'bg-brand text-white shadow-sm' : 'text-content-muted hover:text-content-strong'}`}
            >
              <Calendar className="size-3.5" /> Specific Date
            </button>
          </div>
        </div>

        {dateMode === 'relative' ? (
          <div className="flex flex-col gap-5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-content-muted">Time allowed:</span>
              <span className="rounded-lg bg-brand/10 px-3 py-1 text-sm font-bold text-brand">{TIME_OPTIONS[timeIndex]?.label ?? '1 Day'}</span>
            </div>
            <div className="relative w-full px-2">
              <input 
                type="range" 
                min="0" 
                max={TIME_OPTIONS.length - 1} 
                step="1" 
                value={timeIndex}
                onChange={(e) => setTimeIndex(Number(e.target.value))}
                className="w-full h-2 bg-line-subtle rounded-lg appearance-none cursor-pointer accent-brand"
              />
              <div className="flex justify-between text-[10px] font-semibold text-content-subtle mt-2 px-1">
                <span>{TIME_OPTIONS[0]?.label}</span>
                <span>{TIME_OPTIONS[TIME_OPTIONS.length - 1]?.label}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <input 
              type="date" 
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="w-full rounded-xl border border-line-subtle bg-surface-canvas p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors" 
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-bold text-content-strong">Description</label>
        <textarea required id="description" name="description" rows={5} className="rounded-xl border border-line-subtle bg-surface-canvas p-3.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors" placeholder="Detailed explanation of the task or request..." />
      </div>

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

      <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-line-subtle">
        <button type="button" onClick={() => router.back()} className="rounded-xl px-5 py-2.5 text-sm font-bold text-content-muted hover:bg-surface-raised transition-colors">Cancel</button>
        <button type="submit" disabled={loading} className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-hover hover:shadow disabled:opacity-50 transition-all">
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </div>
    </form>
  );
}
