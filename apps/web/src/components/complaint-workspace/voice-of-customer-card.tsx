import React from 'react';
import { Calendar, MessageSquareQuote, Phone, Quote, User } from 'lucide-react';
import type { Locale } from '../../i18n/staff-shell';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';

export function VoiceOfCustomerCard({
  detail,
  locale,
}: {
  detail: StaffComplaintDetailView;
  locale: Locale;
}) {
  const isArabic = locale === 'ar';
  const vocDescription = (detail.description || detail.descriptionAr || '').trim();
  const primaryNarrative = vocDescription || detail.subject || '';

  return (
    <div className="shrink-0 relative overflow-hidden rounded-2xl border-2 border-brand/40 bg-surface p-6 shadow-md min-h-[14rem]">
      {/* Top Gradient Accent */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand via-brand-strong to-brand" />

      {/* Header: Title + Subtitle + Context Badges */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand shadow-inner">
            <MessageSquareQuote className="size-6 text-brand" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-content-strong">
              {isArabic ? 'صوت العميل (VOC)' : 'Voice of Customer (VOC)'}
            </h2>
            <p className="text-xs text-content-muted">
              {isArabic ? 'النص الأصلي وإفادة العميل وتفاصيل الاستقبال' : 'Original customer statement and intake record'}
            </p>
          </div>
        </div>

        {/* Status & Classification Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {(detail.categoryName || detail.categoryNameAr) && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand border border-brand/20">
              📁 {isArabic ? (detail.categoryNameAr || detail.categoryName) : detail.categoryName}
            </span>
          )}
          {detail.channel && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1 text-xs font-semibold text-content-muted border border-line-subtle">
              📢 {detail.channel}
            </span>
          )}
          {detail.customerType && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1 text-xs font-semibold text-content-muted border border-line-subtle">
              👤 {detail.customerType}
            </span>
          )}
          {detail.alternativeCarProvided && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-status-warning-bg text-status-warning border border-status-warning-border px-3 py-1 text-xs font-semibold">
              🚗 {isArabic ? 'سيارة بديلة ممنوحة' : 'Alternative Car Provided'}
            </span>
          )}
          {detail.isJustified !== null && detail.isJustified !== undefined && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                detail.isJustified
                  ? 'bg-status-success-bg text-status-success border-status-success-border'
                  : 'bg-status-error-bg text-status-error border-status-error-border'
              }`}
            >
              {detail.isJustified
                ? (isArabic ? '✅ شكوى مبررة' : '✅ Justified')
                : (isArabic ? '❌ شكوى غير مبررة' : '❌ Unjustified')}
            </span>
          )}
          {detail.satisfactionStatus && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                detail.satisfactionStatus === 'SATISFIED'
                  ? 'bg-status-success-bg text-status-success border-status-success-border'
                  : detail.satisfactionStatus === 'NEUTRAL'
                  ? 'bg-status-info-bg text-status-info border-status-info-border'
                  : 'bg-status-error-bg text-status-error border-status-error-border'
              }`}
            >
              {detail.satisfactionStatus === 'SATISFIED' && (isArabic ? '😊 راضٍ' : '😊 Satisfied')}
              {detail.satisfactionStatus === 'NEUTRAL' && (isArabic ? '😐 محايد' : '😐 Neutral')}
              {detail.satisfactionStatus === 'UNSATISFIED' && (isArabic ? '😞 غير راضٍ' : '😞 Unsatisfied')}
            </span>
          )}
        </div>
      </div>

      {/* Prominent Subject Headline */}
      {detail.subject && (
        <div className="mb-4 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-wider text-brand">
            {isArabic ? 'موضوع الشكوى' : 'Complaint Subject'}
          </div>
          <div className="text-base font-bold text-content-strong mt-0.5">
            {detail.subject}
          </div>
        </div>
      )}

      {/* Narrative Quote Statement Body */}
      <div className="rounded-xl border border-line-subtle bg-surface-sunken p-5 text-content-strong shadow-inner min-h-[5.5rem]">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
          <Quote className="size-4" />
          <span>{isArabic ? 'إفادة العميل / الوصف المسجل' : 'Customer Statement / Narrative'}</span>
        </div>
        {primaryNarrative ? (
          <div>
            <p className="whitespace-pre-wrap text-base font-medium leading-relaxed">
              {primaryNarrative}
            </p>
            {!vocDescription && detail.subject && (
              <p className="mt-2 text-xs italic text-content-muted">
                {isArabic ? '(تم تسجيل الموضوع كبيان أولي لصوت العميل)' : '(Subject displayed as initial customer voice record)'}
              </p>
            )}
          </div>
        ) : (
          <p className="italic text-content-muted text-sm">
            {isArabic ? 'لا يوجد نص لوصف الشكوى مسجل.' : 'No detailed description recorded for this complaint.'}
          </p>
        )}
      </div>

      {/* Dynamic Template Fields (if template was used) */}
      {detail.templateData && typeof detail.templateData === 'object' && Object.keys(detail.templateData).length > 0 && (
        <div className="mt-4 rounded-xl border border-line-subtle bg-surface-raised p-4 text-xs">
          <div className="mb-2.5 font-bold uppercase tracking-wider text-content-muted">
            {isArabic ? 'حقول النموذج المخصص:' : 'Custom Template Fields:'}
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {Object.entries(detail.templateData).map(([key, val]) => (
              <div key={key} className="rounded-lg border border-line-subtle/50 bg-surface p-2.5 flex flex-col">
                <span className="font-semibold text-content-muted capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-medium text-content-strong mt-0.5">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Metadata: Incident Time, Customer, Root Cause, Sales Advisor */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line-subtle/60 pt-3 text-xs text-content-muted">
        <div className="flex flex-wrap items-center gap-4">
          {detail.customer?.name && (
            <div className="flex items-center gap-1.5">
              <User className="size-3.5 text-brand" />
              <span className="font-medium text-content-strong">{detail.customer.name}</span>
            </div>
          )}
          {detail.customer?.phone && (
            <div className="flex items-center gap-1.5" dir="ltr">
              <Phone className="size-3.5 text-brand" />
              <span className="font-medium">{detail.customer.phone}</span>
            </div>
          )}
          {detail.updatedAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-brand" />
              <span>{new Date(detail.updatedAt).toLocaleDateString([], { dateStyle: 'medium' })}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {detail.rootCauseCategory && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-content-strong">{isArabic ? 'السبب الجذري:' : 'Root Cause:'}</span>
              <span className="rounded bg-surface-raised px-2 py-0.5 font-medium text-brand">{detail.rootCauseCategory}</span>
            </div>
          )}
          {detail.salesAdvisorName && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-content-strong">{isArabic ? 'مستشار المبيعات:' : 'Sales Advisor:'}</span>
              <span className="rounded bg-surface-raised px-2 py-0.5 font-medium">{detail.salesAdvisorName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

