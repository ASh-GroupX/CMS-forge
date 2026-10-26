'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

interface EnterpriseAnalyticsChartsProps {
  locale: Locale;
  timeline: { date: string; labelEn: string; labelAr: string; created: number; resolved: number }[];
  statusBreakdown: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  agingBuckets: { bucket: string; labelEn: string; labelAr: string; count: number }[];
  ticketsCount: number;
  complaintsCount: number;
}

export function EnterpriseAnalyticsCharts({
  locale,
  timeline,
  statusBreakdown,
  agingBuckets,
  ticketsCount,
  complaintsCount,
}: EnterpriseAnalyticsChartsProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';

  const maxVal = Math.max(...timeline.map((p) => Math.max(p.created, p.resolved)), 1);
  const totalAging = agingBuckets.reduce((acc, b) => acc + b.count, 0) || 1;
  const totalItems = ticketsCount + complaintsCount || 1;
  const ticketsPct = Math.round((ticketsCount / totalItems) * 100);
  const complaintsPct = 100 - ticketsPct;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* 1. Velocity Chart (2 cols) */}
      <Card className="p-5 lg:col-span-2 border bg-card shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-foreground">{t.charts.volumeTrend}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRtl ? 'حجم الوارد اليومي مقابل وتيرة الإنجاز' : 'Work volume intake vs resolution velocity'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-xs bg-muted-foreground/50" />
                <span>{t.charts.created}</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-primary">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span>{t.charts.resolved}</span>
              </span>
            </div>
          </div>

          {timeline.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
              {t.charts.emptyChart}
            </div>
          ) : (
            <div className="h-52 w-full pt-4">
              <div className="flex h-40 items-end gap-1.5 sm:gap-2.5 border-b border-muted px-1 sm:px-2">
                {timeline.map((point) => {
                  const createdHeight = Math.max(4, Math.round((point.created / maxVal) * 100));
                  const resolvedHeight = Math.max(4, Math.round((point.resolved / maxVal) * 100));
                  return (
                    <div key={point.date} className="group relative flex flex-1 flex-col items-center justify-end h-full">
                      <div className="flex w-full items-end justify-center gap-0.5 sm:gap-1 h-full">
                        <div
                          style={{ height: `${createdHeight}%` }}
                          className="w-1.5 sm:w-3 rounded-t-xs bg-muted-foreground/30 transition-all group-hover:bg-muted-foreground/60"
                        />
                        <div
                          style={{ height: `${resolvedHeight}%` }}
                          className="w-1.5 sm:w-3 rounded-t-xs bg-primary transition-all group-hover:brightness-110"
                        />
                      </div>
                      <span className="absolute -bottom-6 text-3xs text-muted-foreground truncate w-full text-center">
                        {isRtl ? point.labelAr : point.labelEn}
                      </span>
                      {/* Tooltip on Hover */}
                      <div className="pointer-events-none absolute -top-10 z-20 hidden rounded-md bg-popover px-2 py-1 text-3xs font-medium text-popover-foreground shadow-md group-hover:block border">
                        <div>{isRtl ? point.labelAr : point.labelEn}</div>
                        <div className="flex gap-2">
                          <span>{t.charts.created}: {point.created}</span>
                          <span className="text-primary font-bold">{t.charts.resolved}: {point.resolved}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Workload Split Footer */}
        <div className="pt-4 border-t mt-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{isRtl ? 'توزيع عبء العمل:' : 'Workload Split:'}</span>
            <span className="font-semibold">{ticketsCount} {isRtl ? 'تذكرة' : 'Tickets'} ({ticketsPct}%)</span>
            <span>•</span>
            <span className="font-semibold">{complaintsCount} {isRtl ? 'شكوى' : 'Complaints'} ({complaintsPct}%)</span>
          </div>
          <div className="w-36 h-2 bg-muted rounded-full overflow-hidden flex">
            <div className="bg-indigo-500 h-full" style={{ width: `${ticketsPct}%` }} title="Tickets" />
            <div className="bg-blue-500 h-full" style={{ width: `${complaintsPct}%` }} title="Complaints" />
          </div>
        </div>
      </Card>

      {/* 2. Status & Backlog Aging (1 col) */}
      <Card className="p-5 border bg-card shadow-xs flex flex-col justify-between space-y-4">
        {/* Status Distribution */}
        <div>
          <h3 className="text-sm font-bold text-foreground border-b pb-2 mb-3">
            {t.charts.statusDistribution}
          </h3>
          <div className="space-y-2">
            {statusBreakdown.slice(0, 5).map((st) => (
              <div key={st.key} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground truncate font-medium">
                    {isRtl ? st.nameAr : st.nameEn}
                  </span>
                  <span className="font-semibold text-foreground">
                    {st.count} <span className="text-muted-foreground font-normal">({st.percentage}%)</span>
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, st.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backlog Aging */}
        <div className="pt-4 border-t">
          <h4 className="text-xs font-bold text-foreground mb-2.5">
            {t.charts.backlogAging}
          </h4>
          <div className="grid grid-cols-4 gap-1.5">
            {agingBuckets.map((bucket) => {
              const pct = Math.round((bucket.count / totalAging) * 100);
              const isUrgent = bucket.bucket === '>7d' && bucket.count > 0;
              return (
                <div
                  key={bucket.bucket}
                  className={`rounded-lg p-2 text-center border ${
                    isUrgent
                      ? 'border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20'
                      : 'bg-muted/30 border-muted'
                  }`}
                >
                  <p className="text-3xs font-semibold text-muted-foreground truncate">
                    {isRtl ? bucket.labelAr : bucket.labelEn}
                  </p>
                  <p className={`text-sm font-bold mt-0.5 ${isUrgent ? 'text-rose-600' : 'text-foreground'}`}>
                    {bucket.count}
                  </p>
                  <p className="text-3xs text-muted-foreground">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
