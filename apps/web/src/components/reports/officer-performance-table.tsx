'use client';

import React, { useState } from 'react';
import { ChevronDown, Columns, Search, UserCheck } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

export interface OfficerRowItem {
  id: string;
  name: string;
  role: string;
  activeWorkload: number;
  newAssignments: number;
  resolved: number;
  closed: number;
  overdue: number;
  complianceRate: number;
  avgTat: number;
  tatUnit: 'hours' | 'days';
  rating?: number;
  oldestActiveDays: number;
}

interface OfficerPerformanceTableProps {
  locale: Locale;
  officers: OfficerRowItem[];
  selectedOfficerId?: string;
  onSelectOfficer: (officerId: string) => void;
  isTickets?: boolean;
}

export function OfficerPerformanceTable({
  locale,
  officers,
  selectedOfficerId,
  onSelectOfficer,
  isTickets,
}: OfficerPerformanceTableProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<keyof OfficerRowItem>('activeWorkload');
  const [sortDesc, setSortDesc] = useState(true);

  // Column visibility settings
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    role: true,
    active: true,
    new: true,
    resolved: true,
    closed: true,
    overdue: true,
    compliance: true,
    tat: true,
    rating: Boolean(isTickets),
    oldest: true,
  });
  const [showColPicker, setShowColPicker] = useState(false);

  const filtered = officers
    .filter((o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.role.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortBy] ?? 0;
      const valB = b[sortBy] ?? 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return sortDesc ? Number(valB) - Number(valA) : Number(valA) - Number(valB);
    });

  const toggleSort = (col: keyof OfficerRowItem) => {
    if (sortBy === col) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(col);
      setSortDesc(true);
    }
  };

  return (
    <Card className="p-4 shadow-sm">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3 mb-3">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>{t.officerTable.title}</span>
          </h3>
          <p className="text-xs text-muted-foreground">{t.officerTable.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative w-48 sm:w-64">
            <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.officerTable.searchOfficer}
              className="ps-8 h-8 text-xs"
            />
          </div>

          {/* Column Picker Trigger */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowColPicker(!showColPicker)}
              className="h-8 gap-1 text-xs"
            >
              <Columns className="h-3.5 w-3.5" />
              <span>{t.officerTable.columnPicker}</span>
            </Button>

            {showColPicker && (
              <div className="absolute end-0 top-10 z-20 w-48 rounded-md border bg-popover p-2 text-xs shadow-md">
                <div className="font-semibold px-2 py-1 border-b mb-1">{t.officerTable.columnPicker}</div>
                {Object.keys(visibleCols).map((k) => (
                  <label key={k} className="flex items-center gap-2 px-2 py-1 hover:bg-muted rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols[k]}
                      onChange={(e) => setVisibleCols({ ...visibleCols, [k]: e.target.checked })}
                      className="rounded border-input"
                    />
                    <span className="capitalize">{k}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-start">
          <thead className="bg-muted/50 border-b text-muted-foreground">
            <tr>
              <th className="py-2.5 px-3 text-start font-medium cursor-pointer" onClick={() => toggleSort('name')}>
                {t.officerTable.officer}
              </th>
              {visibleCols.role && <th className="py-2.5 px-3 text-start font-medium">{t.officerTable.role}</th>}
              {visibleCols.active && (
                <th className="py-2.5 px-3 text-end font-medium cursor-pointer" onClick={() => toggleSort('activeWorkload')}>
                  {t.officerTable.activeCases}
                </th>
              )}
              {visibleCols.new && (
                <th className="py-2.5 px-3 text-end font-medium cursor-pointer" onClick={() => toggleSort('newAssignments')}>
                  {t.officerTable.newCases}
                </th>
              )}
              {visibleCols.resolved && (
                <th className="py-2.5 px-3 text-end font-medium cursor-pointer" onClick={() => toggleSort('resolved')}>
                  {t.officerTable.resolvedCases}
                </th>
              )}
              {visibleCols.closed && (
                <th className="py-2.5 px-3 text-end font-medium cursor-pointer" onClick={() => toggleSort('closed')}>
                  {t.officerTable.closedCases}
                </th>
              )}
              {visibleCols.overdue && (
                <th className="py-2.5 px-3 text-end font-medium cursor-pointer" onClick={() => toggleSort('overdue')}>
                  {t.officerTable.overdueCases}
                </th>
              )}
              {visibleCols.compliance && (
                <th className="py-2.5 px-3 text-end font-medium cursor-pointer" onClick={() => toggleSort('complianceRate')}>
                  {t.officerTable.slaRate}
                </th>
              )}
              {visibleCols.tat && (
                <th className="py-2.5 px-3 text-end font-medium cursor-pointer" onClick={() => toggleSort('avgTat')}>
                  {t.officerTable.avgTat}
                </th>
              )}
              {visibleCols.rating && (
                <th className="py-2.5 px-3 text-end font-medium cursor-pointer" onClick={() => toggleSort('rating' as any)}>
                  {t.officerTable.rating}
                </th>
              )}
              {visibleCols.oldest && (
                <th className="py-2.5 px-3 text-end font-medium cursor-pointer" onClick={() => toggleSort('oldestActiveDays')}>
                  {t.officerTable.oldestCase}
                </th>
              )}
              <th className="py-2.5 px-3 text-center font-medium">{t.officerTable.viewDrilldown}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-6 text-center text-muted-foreground">
                  {t.officerTable.empty}
                </td>
              </tr>
            ) : (
              filtered.map((officer) => {
                const isSelected = selectedOfficerId === officer.id;
                const isOverdueHeavy = officer.overdue > 0;

                return (
                  <tr
                    key={officer.id}
                    className={`hover:bg-muted/40 transition-colors ${
                      isSelected ? 'bg-primary/5 font-medium' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[150px]">{officer.name}</span>
                        {isSelected && <Badge variant="secondary" className="text-3xs px-1 py-0">Active</Badge>}
                      </div>
                    </td>
                    {visibleCols.role && <td className="py-2.5 px-3 text-muted-foreground">{officer.role}</td>}
                    {visibleCols.active && (
                      <td className="py-2.5 px-3 text-end font-semibold">{officer.activeWorkload}</td>
                    )}
                    {visibleCols.new && <td className="py-2.5 px-3 text-end text-muted-foreground">{officer.newAssignments}</td>}
                    {visibleCols.resolved && (
                      <td className="py-2.5 px-3 text-end text-primary font-medium">
                        {officer.resolved}
                      </td>
                    )}
                    {visibleCols.closed && <td className="py-2.5 px-3 text-end text-muted-foreground">{officer.closed}</td>}
                    {visibleCols.overdue && (
                      <td className="py-2.5 px-3 text-end">
                        {isOverdueHeavy ? (
                          <span className="inline-flex rounded-full bg-destructive/15 text-destructive px-1.5 py-0.5 text-2xs font-semibold">
                            {officer.overdue}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    )}
                    {visibleCols.compliance && (
                      <td className="py-2.5 px-3 text-end">
                        <span className={officer.complianceRate >= 90 ? 'text-primary font-medium' : 'text-muted-foreground font-medium'}>
                          {officer.complianceRate}%
                        </span>
                      </td>
                    )}
                    {visibleCols.tat && (
                      <td className="py-2.5 px-3 text-end text-muted-foreground">
                        {officer.avgTat} {officer.tatUnit === 'hours' ? t.officerTable.hours : t.officerTable.days}
                      </td>
                    )}
                    {visibleCols.rating && (
                      <td className="py-2.5 px-3 text-end text-yellow-600 dark:text-yellow-400 font-medium">
                        ★ {officer.rating ?? '5.0'}
                      </td>
                    )}
                    {visibleCols.oldest && (
                      <td className="py-2.5 px-3 text-end text-muted-foreground">
                        {officer.oldestActiveDays > 0 ? `${officer.oldestActiveDays} ${t.officerTable.days}` : '—'}
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-center">
                      <Button
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onSelectOfficer(isSelected ? '' : officer.id)}
                        className="h-7 px-2 text-2xs"
                      >
                        {isSelected ? 'Clear' : t.officerTable.viewDrilldown}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
