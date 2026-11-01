import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Locale } from '../../i18n/staff-shell';
import type { StaffComplaintDetailView } from '../../lib/staff-detail-api';

export function ResolutionVerdictBanner({
  detail,
  locale,
}: {
  detail: StaffComplaintDetailView;
  locale: Locale;
}) {
  const isFinished = detail.status === 'CLOSED' || detail.status === 'RESOLVED' || detail.status === 'COMPLETED';
  if (!isFinished) return null;

  const isArabic = locale === 'ar';

  return (
    <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
          <CheckCircle2 className="size-3.5" />
          {detail.status === 'RESOLVED'
            ? (isArabic ? 'تم حل الشكوى' : 'Complaint Resolved')
            : detail.status === 'COMPLETED'
            ? (isArabic ? 'شكوى مكتملة' : 'Complaint Completed')
            : (isArabic ? 'شكوى مغلقة' : 'Complaint Closed')}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-content-muted">
            {isArabic ? 'حكم التبرير:' : 'Justification:'}
          </span>
          {detail.isJustified !== null && detail.isJustified !== undefined ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                detail.isJustified
                  ? 'bg-status-success-bg text-status-success border-status-success-border'
                  : 'bg-status-error-bg text-status-error border-status-error-border'
              }`}
            >
              {detail.isJustified
                ? (isArabic ? '✅ شكوى مبررة' : '✅ Justified')
                : (isArabic ? '❌ شكوى غير مبررة' : '❌ Unjustified')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-status-warning-bg text-status-warning border border-status-warning-border px-2.5 py-0.5 text-xs font-semibold">
              {isArabic ? '⚠️ غير مسجل' : '⚠️ Unrated'}
            </span>
          )}
        </div>
        {detail.satisfactionStatus && (
          <div className="flex items-center gap-1.5 border-s border-line-subtle ps-3">
            <span className="text-xs font-semibold text-content-muted">
              {isArabic ? 'رضا العميل:' : 'Customer Satisfaction:'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold text-content-strong border border-line-subtle">
              {detail.satisfactionStatus === 'SATISFIED' && (isArabic ? '😊 راضٍ' : '😊 Satisfied')}
              {detail.satisfactionStatus === 'NEUTRAL' && (isArabic ? '😐 محايد' : '😐 Neutral')}
              {detail.satisfactionStatus === 'UNSATISFIED' && (isArabic ? '😞 غير راضٍ' : '😞 Unsatisfied')}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-content-muted">
        {detail.updatedAt && (
          <span>{isArabic ? 'تاريخ التحديث:' : 'Updated:'} {new Date(detail.updatedAt).toLocaleDateString(isArabic ? 'ar-JO' : 'en-US')}</span>
        )}
      </div>
    </div>
  );
}
