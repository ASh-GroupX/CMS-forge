'use client';

import React from 'react';
import { Filter, Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

export interface ReportFilterOption {
  id: string;
  name: string;
}

interface ReportFiltersProps {
  locale: Locale;
  search: string;
  onSearchChange: (val: string) => void;
  departmentId: string;
  onDepartmentChange: (id: string) => void;
  departments: ReportFilterOption[];
  officerId: string;
  onOfficerChange: (id: string) => void;
  officers: ReportFilterOption[];
  status: string;
  onStatusChange: (status: string) => void;
  statuses: { key: string; label: string }[];
  severityOrPriority: string;
  onSeverityOrPriorityChange: (val: string) => void;
  severityOrPriorityOptions: { key: string; label: string }[];
  categoryId?: string;
  onCategoryChange?: (id: string) => void;
  categories?: ReportFilterOption[];
  onClearFilters: () => void;
  secondaryDepartmentId?: string;
  onSecondaryDepartmentChange?: (id: string) => void;
  secondaryDepartmentLabel?: string;
}

export function ReportFilters({
  locale,
  search,
  onSearchChange,
  departmentId,
  onDepartmentChange,
  departments,
  officerId,
  onOfficerChange,
  officers,
  status,
  onStatusChange,
  statuses,
  severityOrPriority,
  onSeverityOrPriorityChange,
  severityOrPriorityOptions,
  categoryId,
  onCategoryChange,
  categories = [],
  onClearFilters,
  secondaryDepartmentId,
  onSecondaryDepartmentChange,
  secondaryDepartmentLabel,
}: ReportFiltersProps) {
  const t = reportsAnalyticsI18n[locale];

  const activeFilters = [
    departmentId ? { label: departments.find((d) => d.id === departmentId)?.name || 'Department', clear: () => onDepartmentChange('') } : null,
    secondaryDepartmentId && secondaryDepartmentLabel
      ? { label: `${secondaryDepartmentLabel}: ${departments.find((d) => d.id === secondaryDepartmentId)?.name || ''}`, clear: () => onSecondaryDepartmentChange?.('') }
      : null,
    officerId ? { label: officers.find((o) => o.id === officerId)?.name || 'Officer', clear: () => onOfficerChange('') } : null,
    status ? { label: statuses.find((s) => s.key === status)?.label || status, clear: () => onStatusChange('') } : null,
    severityOrPriority ? { label: severityOrPriorityOptions.find((s) => s.key === severityOrPriority)?.label || severityOrPriority, clear: () => onSeverityOrPriorityChange('') } : null,
    categoryId && categories.length ? { label: categories.find((c) => c.id === categoryId)?.name || 'Category', clear: () => onCategoryChange?.('') } : null,
    search ? { label: `"${search}"`, clear: () => onSearchChange('') } : null,
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.controls.searchPlaceholder}
            className="ps-9 h-9 text-xs"
          />
        </div>

        {/* Dropdown Filters Grid */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department */}
          <select
            value={departmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{locale === 'ar' ? 'جميع الأقسام' : 'All Departments'}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Secondary Department (for Internal Tickets) */}
          {secondaryDepartmentLabel && onSecondaryDepartmentChange && (
            <select
              value={secondaryDepartmentId || ''}
              onChange={(e) => onSecondaryDepartmentChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">{secondaryDepartmentLabel}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {/* Officer */}
          <select
            value={officerId}
            onChange={(e) => onOfficerChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{locale === 'ar' ? 'جميع الموظفين' : 'All Officers'}</option>
            {officers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{locale === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            {statuses.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Severity / Priority */}
          <select
            value={severityOrPriority}
            onChange={(e) => onSeverityOrPriorityChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">{locale === 'ar' ? 'جميع مستويات الأهمية' : 'All Severities'}</option>
            {severityOrPriorityOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Category */}
          {categories.length > 0 && onCategoryChange && (
            <select
              value={categoryId || ''}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">{locale === 'ar' ? 'جميع التصنيفات' : 'All Categories'}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t text-xs">
          <span className="flex items-center gap-1 text-muted-foreground font-medium me-1">
            <Filter className="h-3 w-3" />
            <span>
              {activeFilters.length} {t.controls.activeFiltersCount}:
            </span>
          </span>
          {activeFilters.map((af, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="gap-1 ps-2 pe-1 py-0.5 text-xs font-normal"
            >
              <span>{af.label}</span>
              <button
                type="button"
                onClick={af.clear}
                className="rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {t.controls.clearAll}
          </Button>
        </div>
      )}
    </div>
  );
}
