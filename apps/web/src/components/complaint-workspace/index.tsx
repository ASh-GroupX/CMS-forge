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
import { ArrowLeft, ClipboardCheck, Download, FileText, History, MessageSquareQuote, Paperclip } from 'lucide-react';

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
  const attachments = timeline?.filter(t => t.type === 'ATTACHMENT' && t.related?.id) ?? [];

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
              <span className="flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded">
                <span className="opacity-75">{locale === 'ar' ? 'القسم المسؤول:' : 'Department:'}</span>
                {locale === 'ar' ? detail.assignedDepartmentNameAr || detail.assignedDepartmentName : detail.assignedDepartmentName}
              </span>
            )}
            <span className="flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded">
              <span className="opacity-75">{locale === 'ar' ? 'الموظف المسؤول:' : 'Officer:'}</span>
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
            
            {/* Quick Actions (Status/Workflow Modal) */}
            <div className="rounded-2xl border border-line-subtle bg-surface p-4 shadow-sm">
              <QuickActionsRail
                assignmentOptions={assignmentOptions}
                detail={detail}
                locale={locale}
                options={options}
                staff={staff}
                t={t}
              />
            </div>

            {/* Prominent VOC Card */}
            <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-surface p-5 shadow-sm">
              <div className="absolute start-0 top-0 h-full w-1.5 bg-brand" />
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="size-5 text-brand" />
                  <h2 className="text-base font-bold text-content-strong">
                    {locale === 'ar' ? 'صوت العميل (VOC)' : 'Voice of Customer (VOC)'}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {detail.alternativeCarProvided && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                      🚗 {locale === 'ar' ? 'سيارة بديلة ممنوحة' : 'Alternative Car Provided'}
                    </span>
                  )}
                  {detail.isJustified !== null && detail.isJustified !== undefined && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      detail.isJustified
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                    }`}>
                      {detail.isJustified
                        ? (locale === 'ar' ? '✅ شكوى مبررة' : '✅ Justified')
                        : (locale === 'ar' ? '❌ شكوى غير مبررة' : '❌ Unjustified')}
                    </span>
                  )}
                  {detail.satisfactionStatus && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      detail.satisfactionStatus === 'SATISFIED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        : detail.satisfactionStatus === 'NEUTRAL'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                    }`}>
                      {detail.satisfactionStatus === 'SATISFIED' && (locale === 'ar' ? '😊 راضٍ' : '😊 Satisfied')}
                      {detail.satisfactionStatus === 'NEUTRAL' && (locale === 'ar' ? '😐 محايد' : '😐 Neutral')}
                      {detail.satisfactionStatus === 'UNSATISFIED' && (locale === 'ar' ? '😞 غير راضٍ' : '😞 Unsatisfied')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="rounded-xl border border-line-subtle/50 bg-surface-sunken p-4 text-sm font-medium leading-relaxed text-content-strong whitespace-pre-wrap">
                {detail.description || (locale === 'ar' ? 'لا يوجد نص لوصف الشكوى' : 'No description provided')}
              </div>

              {(detail.rootCauseCategory || detail.salesAdvisorName) && (
                <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line-subtle pt-3 text-xs text-content-muted">
                  {detail.rootCauseCategory && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-content-strong">{locale === 'ar' ? 'السبب الجذري:' : 'Root Cause:'}</span>
                      <span className="rounded bg-surface-raised px-2 py-0.5 font-medium text-brand">{detail.rootCauseCategory}</span>
                    </div>
                  )}
                  {detail.salesAdvisorName && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-content-strong">{locale === 'ar' ? 'مستشار المبيعات:' : 'Sales Advisor:'}</span>
                      <span className="rounded bg-surface-raised px-2 py-0.5 font-medium">{detail.salesAdvisorName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Investigation Findings (if recorded) */}
            {detail.investigationNotes && (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/30 p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-700 dark:text-blue-300">
                    <ClipboardCheck className="size-4" />
                    {locale === 'ar' ? 'نتائج وملاحظات التحقيق' : 'Investigation Findings & Notes'}
                  </div>
                  {detail.investigatedAt && (
                    <span className="text-xs text-blue-600/80 dark:text-blue-400">
                      {new Date(detail.investigatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-content-strong whitespace-pre-wrap">
                  {detail.investigationNotes}
                </p>
              </div>
            )}

            {/* Dedicated Attachments Section */}
            <div className="rounded-2xl border border-line-subtle bg-surface p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="size-4 text-brand" />
                  <h3 className="text-sm font-bold text-content-strong">
                    {locale === 'ar' ? 'المرفقات والملفات' : 'Attachments & Files'}
                  </h3>
                  <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs font-semibold text-content-muted">
                    {attachments.length}
                  </span>
                </div>
              </div>

              {attachments.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-line-subtle bg-surface-sunken p-3 transition-colors hover:border-brand/30"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                          <FileText className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-content-strong" title={att.related?.label || 'File'}>
                            {att.related?.label || 'Attachment'}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-content-muted">
                            {att.metadata?.sizeBytes && (
                              <span>{Math.round(Number(att.metadata.sizeBytes) / 1024)} KB</span>
                            )}
                            <span>•</span>
                            <span>{new Date(att.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <a
                        href={`/api/complaints/${detail.id}/attachments/${att.related?.id}/download?redirect=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line-subtle bg-surface px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-brand hover:text-white"
                        title={locale === 'ar' ? 'تحميل المرفق' : 'Download attachment'}
                      >
                        <Download className="size-3.5" />
                        <span>{locale === 'ar' ? 'تحميل' : 'Download'}</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-center text-xs text-content-muted">
                  {locale === 'ar' ? 'لا توجد مرفقات مرفوعة مع هذه الشكوى.' : 'No attachments uploaded for this complaint.'}
                </p>
              )}
            </div>

            {/* Context Rail (Core Details, Ownership, Customer, Vehicle) */}
            <ContextRail detail={detail} locale={locale} t={t} />
            
            {/* Activity Log */}
            <div className="shrink-0 overflow-hidden rounded-2xl border border-line-subtle bg-surface shadow-sm">
              <div className="border-b border-line-subtle bg-surface-canvas/50 px-4 py-3">
                <h3 className="flex items-center gap-2 font-semibold text-content-strong">
                  <History className="size-4 text-brand" />
                  {locale === 'ar' ? 'سجل النشاط' : 'Activity Log'}
                </h3>
              </div>
              <div className="bg-surface-sunken p-4">
                <UnifiedTimeline detail={detail} locale={locale} t={t} timeline={activityTimeline} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
