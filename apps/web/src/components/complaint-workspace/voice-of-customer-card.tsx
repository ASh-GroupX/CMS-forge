import React from 'react';
import { MessageSquareQuote } from 'lucide-react';
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

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-surface p-5 shadow-sm">
      <div className="absolute start-0 top-0 h-full w-1.5 bg-brand" />

      {/* Header: Title + Badges */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquareQuote className="size-5 text-brand" />
          <h2 className="text-base font-bold text-content-strong">
            {isArabic ? 'صوت العميل (VOC)' : 'Voice of Customer (VOC)'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Pill */}
          {(detail.categoryName || detail.categoryNameAr) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
              📁 {isArabic ? (detail.categoryNameAr || detail.categoryName) : detail.categoryName}
            </span>
          )}
          {/* Channel Pill */}
          {detail.channel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-semibold text-content-muted border border-line-subtle">
              📢 {detail.channel}
            </span>
          )}
          {/* Customer Type */}
          {detail.customerType && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2.5 py-0.5 text-xs font-semibold text-content-muted border border-line-subtle">
              👤 {detail.customerType}
            </span>
          )}
          {detail.alternativeCarProvided && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              🚗 {isArabic ? 'سيارة بديلة ممنوحة' : 'Alternative Car Provided'}
            </span>
          )}
          {detail.isJustified !== null && detail.isJustified !== undefined && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                detail.isJustified
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
              }`}
            >
              {detail.isJustified
                ? (isArabic ? '✅ شكوى مبررة' : '✅ Justified')
                : (isArabic ? '❌ شكوى غير مبررة' : '❌ Unjustified')}
            </span>
          )}
          {detail.satisfactionStatus && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                detail.satisfactionStatus === 'SATISFIED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : detail.satisfactionStatus === 'NEUTRAL'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
              }`}
            >
              {detail.satisfactionStatus === 'SATISFIED' && (isArabic ? '😊 راضٍ' : '😊 Satisfied')}
              {detail.satisfactionStatus === 'NEUTRAL' && (isArabic ? '😐 محايد' : '😐 Neutral')}
              {detail.satisfactionStatus === 'UNSATISFIED' && (isArabic ? '😞 غير راضٍ' : '😞 Unsatisfied')}
            </span>
          )}
        </div>
      </div>

      {/* Description Body */}
      <div className="rounded-xl border border-line-subtle bg-surface-sunken p-4 text-sm font-medium leading-relaxed text-content-strong min-h-[4.5rem]">
        {vocDescription ? (
          <p className="whitespace-pre-wrap">{vocDescription}</p>
        ) : (
          <p className="italic text-content-muted">
            {isArabic ? 'لا يوجد نص لوصف الشكوى مسجل.' : 'No detailed description recorded for this complaint.'}
          </p>
        )}
      </div>

      {/* Dynamic Template Fields (if template was used) */}
      {detail.templateData && typeof detail.templateData === 'object' && Object.keys(detail.templateData).length > 0 && (
        <div className="mt-3 rounded-xl border border-line-subtle bg-surface-raised p-3 text-xs">
          <div className="mb-2 font-semibold text-content-muted">
            {isArabic ? 'حقول النموذج المخصص:' : 'Custom Template Fields:'}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(detail.templateData).map(([key, val]) => (
              <div key={key} className="flex flex-col">
                <span className="font-semibold text-content-muted capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-medium text-content-strong">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer: Root Cause & Sales Advisor */}
      {(detail.rootCauseCategory || detail.salesAdvisorName) && (
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line-subtle pt-3 text-xs text-content-muted">
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
      )}
    </div>
  );
}
