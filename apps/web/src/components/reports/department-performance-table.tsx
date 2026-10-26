import React, { useMemo, useState } from 'react';
import { ArrowUpDown, Building2, CheckCircle2, ChevronRight, Download, Filter, Search, Users, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';
import type { DepartmentPerformanceRow } from '../../lib/staff-reports-departments-api';

interface DepartmentPerformanceTableProps {
  locale: Locale;
  departments: DepartmentPerformanceRow[];
  selectedDepartmentId?: string | null;
  isAdmin: boolean;
  onSelectDepartment?: (deptId: string | null) => void;
  onExportCsv?: () => void;
}

type SortField = 'name' | 'volume' | 'open' | 'resolved' | 'overdue' | 'rate' | 'tat';

export function DepartmentPerformanceTable({
  locale,
  departments,
  selectedDepartmentId,
  isAdmin,
  onSelectDepartment,
  onExportCsv,
}: DepartmentPerformanceTableProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let result = departments.filter((d) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        d.nameEn.toLowerCase().includes(q) ||
        d.nameAr.includes(q) ||
        d.code.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;
      if (sortField === 'name') {
        valA = isRtl ? a.nameAr : a.nameEn;
        valB = isRtl ? b.nameAr : b.nameEn;
        return sortAsc ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
      }
      if (sortField === 'volume') { valA = a.combinedVolume; valB = b.combinedVolume; }
      else if (sortField === 'open') { valA = a.combinedOpen; valB = b.combinedOpen; }
      else if (sortField === 'resolved') { valA = a.combinedResolved; valB = b.combinedResolved; }
      else if (sortField === 'overdue') { valA = a.combinedOverdue; valB = b.combinedOverdue; }
      else if (sortField === 'rate') { valA = a.overallCompletionRate; valB = b.overallCompletionRate; }
      else if (sortField === 'tat') { valA = a.ticketsAvgTatDays; valB = b.ticketsAvgTatDays; }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [departments, search, sortField, sortAsc, isRtl]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  return (
    <Card className="p-5 border bg-card shadow-xs space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">{t.departmentsTable.title}</h3>
            <Badge variant="outline" className="text-2xs font-semibold">
              {departments.length} {isRtl ? 'أقسام' : 'Departments'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{t.departmentsTable.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.departmentsTable.search}
              className="h-9 ps-8 text-xs"
            />
          </div>
          {onExportCsv && (
            <Button variant="outline" size="sm" onClick={onExportCsv} className="h-9 text-xs gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span>{t.controls.exportCsv}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b bg-muted/50 font-semibold text-muted-foreground">
              <th className="py-2.5 px-3 text-start cursor-pointer hover:text-foreground" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1.5">
                  <span>{t.departmentsTable.department}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort('volume')}>
                <div className="flex items-center justify-center gap-1">
                  <span>{t.departmentsTable.combinedVolume}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort('open')}>
                <div className="flex items-center justify-center gap-1">
                  <span>{t.departmentsTable.combinedOpen}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort('resolved')}>
                <div className="flex items-center justify-center gap-1">
                  <span>{t.departmentsTable.combinedResolved}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort('overdue')}>
                <div className="flex items-center justify-center gap-1">
                  <span>{t.departmentsTable.combinedOverdue}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort('rate')}>
                <div className="flex items-center justify-center gap-1">
                  <span>{t.departmentsTable.completionRate}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleSort('tat')}>
                <div className="flex items-center justify-center gap-1">
                  <span>{t.departmentsTable.tat}</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              {isAdmin && onSelectDepartment && (
                <th className="py-2.5 px-3 text-end">{isRtl ? 'الإجراء' : 'Action'}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  {t.departmentsTable.empty}
                </td>
              </tr>
            ) : (
              filtered.map((dept) => {
                const isSelected = selectedDepartmentId === dept.departmentId;
                const deptName = isRtl ? dept.nameAr : dept.nameEn;
                const branchName = isRtl ? (dept.branchNameAr ?? 'المركز الرئيسي') : (dept.branchNameEn ?? 'Main');
                return (
                  <tr
                    key={dept.departmentId}
                    className={`hover:bg-muted/40 transition-colors ${isSelected ? 'bg-primary/5 font-medium' : ''}`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-foreground font-bold text-2xs">
                          {dept.code.slice(0, 3)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{deptName}</p>
                          <p className="text-2xs text-muted-foreground flex items-center gap-1.5">
                            <span>{branchName}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{dept.employeeCount}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-semibold text-foreground">
                      <div>{dept.combinedVolume}</div>
                      <div className="text-2xs text-muted-foreground font-normal">
                        {dept.ticketsCreated} {isRtl ? 'تذاكر' : 'tkt'} / {dept.complaintsTotal} {isRtl ? 'شكاوى' : 'cmp'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-muted text-foreground">
                        {dept.combinedOpen}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary/10 text-primary">
                        {dept.combinedResolved}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {dept.combinedOverdue > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-destructive/15 text-destructive animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          {dept.combinedOverdue}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-2xs">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`text-xs font-bold ${
                          dept.overallCompletionRate >= 85 ? 'text-primary' :
                          dept.overallCompletionRate >= 70 ? 'text-muted-foreground' :
                          'text-destructive'
                        }`}>
                          {dept.overallCompletionRate}%
                        </span>
                        <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              dept.overallCompletionRate >= 85 ? 'bg-primary' :
                              dept.overallCompletionRate >= 70 ? 'bg-muted-foreground' :
                              'bg-destructive'
                            }`}
                            style={{ width: `${Math.min(100, dept.overallCompletionRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-medium text-foreground">
                      {dept.ticketsAvgTatDays > 0 ? `${dept.ticketsAvgTatDays}d` : `${dept.complaintsAvgHours}h`}
                    </td>

                    {isAdmin && onSelectDepartment && (
                      <td className="py-3 px-3 text-end">
                        <Button
                          variant={isSelected ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => onSelectDepartment(isSelected ? null : dept.departmentId)}
                          className="h-7 text-2xs px-2"
                        >
                          {isSelected ? (isRtl ? 'إلغاء التصفية' : 'Selected') : (isRtl ? 'تصفية' : 'Filter')}
                        </Button>
                      </td>
                    )}
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
