'use client';

import React from 'react';
import { Card } from '../ui/card';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

interface VisualAnalyticsProps {
  locale: Locale;
  timeline: { date: string; labelEn: string; labelAr: string; created: number; resolved: number }[];
  statusBreakdown: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  categoryBreakdown?: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  waitingReasons?: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  agingBuckets: { bucket: string; labelEn: string; labelAr: string; count: number }[];
}

export function VisualAnalytics({
  locale,
  timeline,
  statusBreakdown,
  categoryBreakdown,
  waitingReasons,
  agingBuckets,
}: VisualAnalyticsProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';

  const maxVal = Math.max(...timeline.map((p) => Math.max(p.created, p.resolved)), 1);
  const totalAging = agingBuckets.reduce((acc, b) => acc + b.count, 0) || 1;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* 1. Intake vs Resolution Timeline Chart */}
      <Card className="p-4 lg:col-span-2">
        <div className="flex items-center justify-between border-b pb-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t.charts.volumeTrend}</h3>
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'مقارنة وتيرة الاستقبال مقابل إنجاز الحالات' : 'Daily intake velocity compared to completions'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <span className="h-2.5 w-2.5 rounded-xs bg-muted-foreground/40" />
              <span>{t.charts.created}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-primary">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span>{t.charts.resolved}</span>
            </span>
          </div>
        </div>

        {timeline.length === 0 ? (
          <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">
            {t.charts.emptyChart}
          </div>
        ) : (
          <div className="h-48 w-full pt-4">
            <div className="flex h-36 items-end gap-2 border-b border-muted px-2">
              {timeline.map((point, idx) => {
                const createdHeight = Math.round((point.created / maxVal) * 100);
                const resolvedHeight = Math.round((point.resolved / maxVal) * 100);
                const label = isRtl ? point.labelAr : point.labelEn;

                return (
                  <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                    {/* Hover tooltip */}
                    <div className="absolute -top-10 z-10 hidden rounded bg-popover px-2 py-1 text-2xs text-popover-foreground shadow-md border group-hover:block whitespace-nowrap">
                      <div>{label}:</div>
                      <div className="text-muted-foreground">{t.charts.created}: {point.created}</div>
                      <div className="text-primary">{t.charts.resolved}: {point.resolved}</div>
                    </div>

                    {/* Dual visual bars */}
                    <div className="flex w-full items-end justify-center gap-1">
                      <div
                        style={{ height: `${createdHeight}%` }}
                        className="w-full max-w-[12px] rounded-t-sm bg-muted-foreground/40 transition-all group-hover:bg-muted-foreground/60 min-h-[4px]"
                      />
                      <div
                        style={{ height: `${resolvedHeight}%` }}
                        className="w-full max-w-[12px] rounded-t-sm bg-primary/80 transition-all group-hover:bg-primary min-h-[4px]"
                      />
                    </div>
                    <span className="mt-2 text-3xs text-muted-foreground truncate w-full text-center">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* 2. Backlog Aging Distribution */}
      <Card className="p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">{t.charts.backlogAging}</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {locale === 'ar' ? 'تقسيم زمني للأعمال المتراكمة غير المنجزة' : 'Time in queue for open active workload'}
          </p>

          <div className="space-y-3">
            {agingBuckets.map((bucket) => {
              const pct = Math.round((bucket.count / totalAging) * 100);
              const label = isRtl ? bucket.labelAr : bucket.labelEn;
              const isSevere = bucket.bucket === '>7d';
              const isModerate = bucket.bucket === '4-7d';
              const barColor = isSevere
                ? 'bg-destructive'
                : isModerate
                ? 'bg-primary/60'
                : 'bg-primary';

              return (
                <div key={bucket.bucket} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-foreground">{label}</span>
                    <span className="text-muted-foreground">
                      {bucket.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg bg-muted/40 p-2.5 text-2xs text-muted-foreground mt-4 border">
          {locale === 'ar'
            ? 'الحالات التي تتجاوز 4 أيام تتطلب تدخلاً عاجلاً لمنع اختراق اتفاقيات الخدمة.'
            : 'Cases aging beyond 4 days require active managerial escalation to prevent breaches.'}
        </div>
      </Card>

      {/* 3. Status Breakdown */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">{t.charts.statusDistribution}</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {locale === 'ar' ? 'توزيع الحالات عبر مراحل دورة العمل' : 'Distribution across workflow statuses'}
        </p>

        <div className="space-y-2.5">
          {statusBreakdown.slice(0, 5).map((st) => (
            <div key={st.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{isRtl ? st.nameAr : st.nameEn}</span>
                <span className="text-muted-foreground">
                  {st.count} ({st.percentage}%)
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${st.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Secondary Breakdown: Categories or Waiting Reasons */}
      <Card className="p-4 lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {waitingReasons ? t.charts.waitingReasons : t.charts.categoryDistribution}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {waitingReasons
            ? locale === 'ar' ? 'أكثر أسباب التعليق والانتظار شيوعاً في التذاكر' : 'Primary reasons tickets are paused awaiting actions'
            : locale === 'ar' ? 'أعلى فئات وتصنيفات الشكاوى طلباً' : 'Top categories contributing to intake volume'}
        </p>

        {((waitingReasons || categoryBreakdown || []).length === 0) ? (
          <div className="py-6 text-center text-xs text-muted-foreground">{t.charts.emptyChart}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(waitingReasons || categoryBreakdown || []).slice(0, 6).map((item) => (
              <div key={item.key} className="rounded-lg border bg-background/50 p-2.5 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate text-foreground">{isRtl ? item.nameAr : item.nameEn}</span>
                  <span className="text-muted-foreground shrink-0 ms-2 font-mono">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-indigo-500/80 transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
