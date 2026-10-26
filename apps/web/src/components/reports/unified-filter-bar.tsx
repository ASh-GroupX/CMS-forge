'use client';

import React from 'react';
import { Calendar, Filter, RotateCcw, Search, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

export type RecordTypeFilter = 'all' | 'complaints' | 'tickets';
export type DatePresetFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

export interface UnifiedFilterBarProps {
  locale: Locale;
  recordType: RecordTypeFilter;
  onRecordTypeChange: (type: RecordTypeFilter) => void;
  selectedDeptId: string | null;
  onDeptChange: (deptId: string | null) => void;
  selectedBranchId: string | null;
  onBranchChange: (branchId: string | null) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  datePreset: DatePresetFilter;
  onDatePresetChange: (preset: DatePresetFilter) => void;
  dateFrom: string;
  dateTo: string;
  onCustomDateChange: (from: string, to: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onClearAll: () => void;
  departments: { id: string; name: string }[];
  branches?: { id: string; name: string }[];
  isAdmin: boolean;
  onExportCsv?: () => void;
}

export function UnifiedFilterBar({
  locale,
  recordType,
  onRecordTypeChange,
  selectedDeptId,
  onDeptChange,
  selectedBranchId,
  onBranchChange,
  selectedStatus,
  onStatusChange,
  datePreset,
  onDatePresetChange,
  dateFrom,
  dateTo,
  onCustomDateChange,
  search,
  onSearchChange,
  onClearAll,
  departments,
  branches = [],
  isAdmin,
  onExportCsv,
}: UnifiedFilterBarProps) {
  const t = reportsAnalyticsI18n[locale];
  const fb = t.filterBar;

  const activeFiltersCount =
    (recordType !== 'all' ? 1 : 0) +
    (selectedDeptId ? 1 : 0) +
    (selectedBranchId ? 1 : 0) +
    (selectedStatus ? 1 : 0) +
    (datePreset !== 'all' ? 1 : 0) +
    (search.trim() ? 1 : 0);

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-4 w-full min-w-0 max-w-full">
      {/* Top Row: Primary Segment Filter (All / CRM / Tickets) + Live Search + Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full min-w-0">
        {/* Record Type Segment Control */}
        <div className="inline-flex rounded-xl border bg-muted/60 p-1 text-xs font-semibold self-start sm:self-auto max-w-full overflow-x-auto">
          <button
            type="button"
            onClick={() => onRecordTypeChange('all')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              recordType === 'all'
                ? 'bg-background text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {fb.allTypes}
          </button>
          <button
            type="button"
            onClick={() => onRecordTypeChange('complaints')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              recordType === 'complaints'
                ? 'bg-background text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {fb.crmOnly}
          </button>
          <button
            type="button"
            onClick={() => onRecordTypeChange('tickets')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              recordType === 'tickets'
                ? 'bg-background text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {fb.internalOnly}
          </button>
        </div>

        {/* Search & Export Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-72 flex-1 sm:flex-initial">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={fb.searchPlaceholder}
              aria-label={fb.searchPlaceholder}
              className="h-9 ps-9 text-xs"
            />
          </div>

          {onExportCsv && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t.controls.exportCsv}</span>
            </Button>
          )}

          {activeFiltersCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{fb.clearAll}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Second Row: Deep Filters (Period, Department, Branch, Status) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t text-xs">
        {/* Date Preset Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-3xs font-bold uppercase text-muted-foreground tracking-wider">
            {fb.dateRange}
          </label>
          <select
            value={datePreset}
            onChange={(e) => onDatePresetChange(e.target.value as DatePresetFilter)}
            aria-label={fb.dateRange}
            className="h-9 rounded-lg border bg-background px-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="all">{fb.allTime}</option>
            <option value="today">{fb.today}</option>
            <option value="week">{fb.thisWeek}</option>
            <option value="month">{fb.thisMonth}</option>
            <option value="custom">{fb.customRange}</option>
          </select>
        </div>

        {/* Department Selector */}
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <label className="text-3xs font-bold uppercase text-muted-foreground tracking-wider">
              {fb.department}
            </label>
            <select
              value={selectedDeptId ?? ''}
              onChange={(e) => onDeptChange(e.target.value || null)}
              aria-label={fb.department}
              className="h-9 rounded-lg border bg-background px-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
            >
              <option value="">{fb.allDepartments}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Branch Selector */}
        {isAdmin && branches.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-3xs font-bold uppercase text-muted-foreground tracking-wider">
              {fb.branch}
            </label>
            <select
              value={selectedBranchId ?? ''}
              onChange={(e) => onBranchChange(e.target.value || null)}
              aria-label={fb.branch}
              className="h-9 rounded-lg border bg-background px-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
            >
              <option value="">{fb.allBranches}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-3xs font-bold uppercase text-muted-foreground tracking-wider">
            {fb.status}
          </label>
          <select
            value={selectedStatus ?? ''}
            onChange={(e) => onStatusChange(e.target.value || null)}
            aria-label={fb.status}
            className="h-9 rounded-lg border bg-background px-2.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="">{fb.allStatuses}</option>
            <option value="OPEN">{fb.openStatus}</option>
            <option value="IN_PROGRESS">{fb.inProgressStatus}</option>
            <option value="WAITING">{fb.waitingStatus}</option>
            <option value="RESOLVED">{fb.resolvedStatus}</option>
            <option value="OVERDUE">{fb.overdueStatus}</option>
          </select>
        </div>

        {/* Active Filters Summary Badge */}
        <div className="flex flex-col justify-end">
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-muted/40 border text-3xs font-semibold text-muted-foreground">
            <Filter className="h-3 w-3 text-primary" />
            <span>{fb.activeFiltersLabel}:</span>
            <Badge variant="secondary" className="h-5 px-1.5 font-bold text-3xs">
              {activeFiltersCount}
            </Badge>
          </div>
        </div>
      </div>

      {/* Optional Custom Date Range Inputs */}
      {datePreset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
          <span className="text-muted-foreground text-3xs font-semibold">{fb.customRange}:</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onCustomDateChange(e.target.value, dateTo)}
            aria-label="Start date"
            className="h-8 w-36 text-xs"
          />
          <span className="text-muted-foreground text-xs">→</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onCustomDateChange(dateFrom, e.target.value)}
            aria-label="End date"
            className="h-8 w-36 text-xs"
          />
        </div>
      )}
    </div>
  );
}
