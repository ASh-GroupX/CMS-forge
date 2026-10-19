'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Download, RefreshCw, Bookmark, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

interface ReportHeaderProps {
  locale: Locale;
  title: string;
  subtitle: string;
  period: string;
  onPeriodChange: (period: string) => void;
  dateDimension: string;
  onDateDimensionChange: (dim: string) => void;
  customFrom?: string;
  onCustomFromChange?: (val: string) => void;
  customTo?: string;
  onCustomToChange?: (val: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onExport: (format: 'csv' | 'excel') => void;
  onOpenSavedViews: () => void;
  onResetFilters: () => void;
  backHref?: string;
  backLabel?: string;
}

export function ReportHeader({
  locale,
  title,
  subtitle,
  period,
  onPeriodChange,
  dateDimension,
  onDateDimensionChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  onRefresh,
  isRefreshing,
  onExport,
  onOpenSavedViews,
  onResetFilters,
  backHref = '/reports',
  backLabel,
}: ReportHeaderProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors"
            >
              <ArrowIcon className="h-4 w-4" />
              <span>{backLabel ?? t.complaints.backToHub}</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        {/* Global Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenSavedViews}
            className="h-9 gap-1.5 font-medium"
          >
            <Bookmark className="h-4 w-4 text-primary" />
            <span>{t.controls.savedViews}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="h-9 gap-1.5"
            title={t.controls.resetFilters}
          >
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{t.controls.resetFilters}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span>{t.controls.refresh}</span>
          </Button>

          <div className="flex items-center rounded-lg border bg-background p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onExport('csv')}
              className="h-8 gap-1 px-2.5 text-xs font-medium hover:bg-muted"
            >
              <Download className="h-3 w-3" />
              <span>CSV</span>
            </Button>
            <div className="h-4 w-[1px] bg-border" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onExport('excel')}
              className="h-8 gap-1 px-2.5 text-xs font-medium hover:bg-muted"
            >
              <Download className="h-3 w-3" />
              <span>Excel</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Date & Period Controls Ribbon */}
      <div className="flex flex-wrap items-center gap-3 border-t pt-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground">{t.controls.period}:</span>
          <select
            value={period}
            onChange={(e) => onPeriodChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            {Object.entries(t.periods).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom ?? ''}
              onChange={(e) => onCustomFromChange?.(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="date"
              value={customTo ?? ''}
              onChange={(e) => onCustomToChange?.(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground">{t.controls.dateDimension}:</span>
          <select
            value={dateDimension}
            onChange={(e) => onDateDimensionChange(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            {Object.entries(t.dateDimensions).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
