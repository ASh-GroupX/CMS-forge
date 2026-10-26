'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowUpDown, ChevronRight, Download, Users, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';
import type { DepartmentPerformanceRow } from '../../lib/staff-reports-departments-api';

interface DepartmentComparisonViewProps {
  locale: Locale;
  departments: DepartmentPerformanceRow[];
  selectedDeptId: string | null;
  onSelectDepartment: (deptId: string | null) => void;
  onExportCsv?: () => void;
}

type SortField = 'name' | 'sent' | 'received' | 'customers' | 'completion' | 'open';

export function DepartmentComparisonView({
  locale,
  departments,
  selectedDeptId,
  onSelectDepartment,
  onExportCsv,
}: DepartmentComparisonViewProps) {
  const t = reportsAnalyticsI18n[locale];
  const dt = t.departmentsTable;
  const isRtl = locale === 'ar';

  const [sortField, setSortField] = useState<SortField>('sent');
  const [sortAsc, setSortAsc] = useState(false);

  const totalSent = useMemo(() => departments.reduce((acc, d) => acc + d.ticketsCreated, 0), [departments]);
  const totalReceived = useMemo(() => departments.reduce((acc, d) => acc + d.ticketsTargeted, 0), [departments]);
  const totalCustomers = useMemo(() => departments.reduce((acc, d) => acc + (d.uniqueCustomers ?? 0), 0), [departments]);

  const sorted = useMemo(() => {
    const list = [...departments];
    list.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      if (sortField === 'name') {
        av = isRtl ? a.nameAr : a.nameEn;
        bv = isRtl ? b.nameAr : b.nameEn;
        return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      }
      if (sortField === 'sent') { av = a.ticketsCreated; bv = b.ticketsCreated; }
      if (sortField === 'received') { av = a.ticketsTargeted; bv = b.ticketsTargeted; }
      if (sortField === 'customers') { av = a.uniqueCustomers ?? 0; bv = b.uniqueCustomers ?? 0; }
      if (sortField === 'completion') { av = a.overallCompletionRate; bv = b.overallCompletionRate; }
      if (sortField === 'open') { av = a.combinedOpen; bv = b.combinedOpen; }
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [departments, sortField, sortAsc, isRtl]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full">
      {/* Visual Workload Balance Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 rounded-xl border bg-card flex items-center justify-between">
          <div>
            <span className="text-3xs font-bold uppercase tracking-wider text-muted-foreground">{dt.sentTasks}</span>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums mt-0.5">{totalSent}</div>
            <p className="text-3xs text-muted-foreground mt-0.5">{isRtl ? 'إجمالي المهام الصادرة بين الأقسام' : 'Cross-department outbound tasks'}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 rounded-xl border bg-card flex items-center justify-between">
          <div>
            <span className="text-3xs font-bold uppercase tracking-wider text-muted-foreground">{dt.receivedTasks}</span>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums mt-0.5">{totalReceived}</div>
            <p className="text-3xs text-muted-foreground mt-0.5">{isRtl ? 'إجمالي المهام الواردة للمعالجة' : 'Inbound workload assigned for handling'}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 rounded-xl border bg-card flex items-center justify-between">
          <div>
            <span className="text-3xs font-bold uppercase tracking-wider text-muted-foreground">{dt.customers}</span>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums mt-0.5">{totalCustomers}</div>
            <p className="text-3xs text-muted-foreground mt-0.5">{isRtl ? 'إجمالي العملاء المستفيدين من الشكاوى' : 'Unique customer contacts served'}</p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Comparative Department Table */}
      <Card className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs space-y-3 w-full min-w-0 max-w-full overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">{dt.title}</h3>
              <Badge variant="outline" className="text-3xs font-semibold px-2 py-0">
                {departments.length} {isRtl ? 'أقسام' : 'Depts'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{dt.subtitle}</p>
          </div>
          {onExportCsv && (
            <Button type="button" variant="outline" size="sm" onClick={onExportCsv} className="h-8 text-xs gap-1.5 font-semibold">
              <Download className="h-3.5 w-3.5" />
              <span>{dt.filterToDept}</span>
            </Button>
          )}
        </div>

        <div className="relative w-full min-w-0 max-w-full overflow-x-auto rounded-xl border">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b bg-muted/50 font-semibold text-muted-foreground">
                <th className="py-2.5 px-3 text-start cursor-pointer hover:text-foreground" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1"><span>{dt.department}</span><ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort('sent')}>
                  <div className="flex items-center justify-center gap-1"><span>{dt.sentTasks}</span><ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort('received')}>
                  <div className="flex items-center justify-center gap-1"><span>{dt.receivedTasks}</span><ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort('customers')}>
                  <div className="flex items-center justify-center gap-1"><span>{dt.customers}</span><ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort('open')}>
                  <div className="flex items-center justify-center gap-1"><span>{dt.combinedOpen}</span><ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort('completion')}>
                  <div className="flex items-center justify-center gap-1"><span>{dt.completionRate}</span><ArrowUpDown className="h-3 w-3" /></div>
                </th>
                <th className="py-2.5 px-3 text-end"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">{dt.empty}</td>
                </tr>
              ) : (
                sorted.map((dept) => {
                  const name = isRtl ? dept.nameAr : dept.nameEn;
                  const isSelected = selectedDeptId === dept.departmentId;
                  const netDiff = dept.ticketsCreated - dept.ticketsTargeted;
                  return (
                    <tr
                      key={dept.departmentId}
                      className={`border-b transition-colors hover:bg-muted/40 cursor-pointer ${
                        isSelected ? 'bg-primary/5 font-semibold' : ''
                      }`}
                      onClick={() => onSelectDepartment(dept.departmentId)}
                    >
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{name}</span>
                          <span className="text-3xs text-muted-foreground">({dept.employeeCount} {dt.employees})</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center tabular-nums">
                        <span className="inline-flex items-center gap-1 font-bold text-foreground">
                          <ArrowUpRight className="h-3 w-3 text-primary" />
                          {dept.ticketsCreated}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center tabular-nums">
                        <span className="inline-flex items-center gap-1 font-bold text-foreground">
                          <ArrowDownLeft className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          {dept.ticketsTargeted}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center tabular-nums">
                        <Badge variant="outline" className="text-3xs px-1.5 py-0">
                          {dept.uniqueCustomers ?? 0}
                        </Badge>
                      </td>

                      <td className="py-2.5 px-3 text-center tabular-nums">
                        <span className="font-semibold text-foreground">{dept.combinedOpen}</span>
                        {dept.combinedOverdue > 0 && (
                          <span className="text-3xs text-destructive ms-1">({dept.combinedOverdue} {dt.combinedOverdue})</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center tabular-nums">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${dept.overallCompletionRate}%` }} />
                          </div>
                          <span className="text-3xs font-bold">{dept.overallCompletionRate}%</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs font-semibold text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDepartment(dept.departmentId);
                          }}
                          aria-label={`${dt.viewDepartment}: ${name}`}
                        >
                          <span>{dt.viewDepartment}</span>
                          <ChevronRight className="h-3 w-3" />
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
    </div>
  );
}
