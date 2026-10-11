import React from 'react';
import type { Locale } from '../../i18n/staff-shell';
import { complaintDetailText } from '../../i18n/staff-complaint-detail';
import { staffShellText } from '../../i18n/staff-shell';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';
import type { ComplaintTimelineItem } from '../../lib/staff-complaint-timeline-api';
import type { AssignableStaff } from '../../lib/staff-assignable-staff-api';
import type { StaffAssignmentOptions } from '../../lib/staff-assignment-options-api';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import { StateBlock } from '../shared/ui-primitives';
import { ContextRail } from './context-rail';
import { UnifiedTimeline } from './unified-timeline';
import { QuickActionsRail } from './quick-actions-rail';
import { ComplaintNoteForm } from './complaint-note-form';
import { WorkingNotesList } from './working-notes';
import { ArrowLeft, FileText, History } from 'lucide-react';

export type ComplaintDetailState = 'loading' | 'empty' | 'error' | 'denied' | 'notFound' | 'ready';

export function ComplaintWorkspace({
  assignmentOptions,
  detail,
  locale,
  options,
  staff,
  state,
  timeline,
}: {
  assignmentOptions?: StaffAssignmentOptions | null | undefined;
  detail?: StaffComplaintDetailView | undefined;
  locale: Locale;
  options?: ComplaintFormOptions | null | undefined;
  staff?: AssignableStaff[] | null | undefined;
  state: ComplaintDetailState;
  timeline?: ComplaintTimelineItem[] | undefined;
}) {
  const shell = staffShellText[locale];
  const t = complaintDetailText[locale];

  if (state !== 'ready' || !detail) {
    return (
      <section aria-label={t.title} className="flex h-full flex-col bg-surface" dir={shell.dir}>
        <div className="p-8">
          <StateBlock message={state === 'error' || state === 'denied' ? t.states.error : t.states.loading} tone={state === 'error' ? 'error' : 'neutral'} />
        </div>
      </section>
    );
  }

  const activityTimeline = timeline?.filter(t => t.type !== 'COMMENT' && t.type !== 'ATTACHMENT') ?? [];

  return (
    <section aria-label={t.title} className="flex h-full flex-col overflow-hidden bg-surface-sunken" dir={shell.dir}>
      {/* ── Header ── */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-line-subtle bg-surface px-6">
        <a href={`/complaints?locale=${locale}`} className="flex items-center gap-2 text-sm font-medium text-content-muted hover:text-brand transition-colors">
          <ArrowLeft className="size-4" />
          {t.values.backToBoard || 'Back'}
        </a>
        <div className="h-4 w-px bg-line-subtle" />
        <h1 className="truncate text-base font-bold text-content-strong">
          {detail.subject}
        </h1>
        <span className="rounded-md bg-surface-raised px-2 py-0.5 text-xs font-semibold text-content-muted">
          {detail.reference}
        </span>
      </header>

      {/* ── Action Tracking Banner ── */}
      {detail.status !== 'CLOSED' && detail.status !== 'RESOLVED' && detail.status !== 'INVALID' && (
        <div className="bg-brand/10 border-b border-brand/20 px-6 py-2 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-brand-strong">
              {locale === 'ar' ? 'الإجراء المطلوب التالي:' : 'Pending Action:'}
            </span>
            <span className="text-sm text-brand-strong">
              {detail.nextAction || (locale === 'ar' ? 'قيد الانتظار' : 'Pending')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-brand-strong">
            {detail.assignedDepartmentName && (
              <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded">
                <span className="opacity-75">{locale === 'ar' ? 'القسم المسؤول:' : 'Department:'}</span>
                {locale === 'ar' ? detail.assignedDepartmentNameAr || detail.assignedDepartmentName : detail.assignedDepartmentName}
              </span>
            )}
            <span className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded">
              <span className="opacity-75">{locale === 'ar' ? 'الموظف:' : 'Officer:'}</span>
              {detail.assignee || (locale === 'ar' ? 'غير معين (في انتظار التعيين)' : 'Unassigned')}
            </span>
          </div>
        </div>
      )}

      {/* ── Workspace ── */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mx-auto grid h-[calc(100vh-14rem)] min-h-[600px] max-w-7xl grid-cols-1 gap-6 md:grid-cols-[1fr_2fr]">
          
          {/* Left: Working Notes */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-sm">
            <div className="border-b border-line-subtle bg-surface-canvas/50 px-4 py-3">
              <h3 className="flex items-center gap-2 font-semibold text-content-strong">
                <FileText className="size-4 text-brand" />
                {locale === 'ar' ? 'ملاحظات العمل' : 'Working Notes'}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto bg-surface/30 p-4">
              <WorkingNotesList timeline={timeline ?? []} complaintId={detail.id} />
            </div>
            <div className="border-t border-line-subtle bg-surface-canvas p-3">
              <ComplaintNoteForm complaintId={detail.id} locale={locale} />
            </div>
          </div>

          {/* Right: Details & Activity Log */}
          <div className="flex flex-col gap-6 overflow-y-auto pr-2">
            
            {/* Context & Actions Header */}
            <div className="rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm">
              <div className="mb-4">
                <QuickActionsRail
                  assignmentOptions={assignmentOptions}
                  detail={detail}
                  locale={locale}
                  options={options}
                  staff={staff}
                  t={t}
                />
              </div>
              <ContextRail detail={detail} locale={locale} t={t} />
            </div>
            
            {/* Activity Log */}
            <div className="shrink-0 overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-sm">
              <div className="border-b border-line-subtle bg-surface-canvas/50 px-4 py-3">
                <h3 className="flex items-center gap-2 font-semibold text-content-strong">
                  <History className="size-4 text-brand" />
                  {locale === 'ar' ? 'سجل النشاط' : 'Activity Log'}
                </h3>
              </div>
              <div className="p-4 bg-surface-sunken">
                <UnifiedTimeline detail={detail} locale={locale} t={t} timeline={activityTimeline} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
