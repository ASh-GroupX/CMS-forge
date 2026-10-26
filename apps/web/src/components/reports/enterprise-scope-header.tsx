'use client';

import React from 'react';
import { Building2, ChevronDown, Download, Globe2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

interface EnterpriseScopeHeaderProps {
  locale: Locale;
  isAdmin: boolean;
  userDepartmentName?: string | null | undefined;
  departments: { id: string; name: string }[];
  selectedDeptId: string | null;
  onSelectDepartment: (deptId: string | null) => void;
  isExportOpen: boolean;
  setIsExportOpen: (open: boolean) => void;
  onTriggerExport: (
    type: 'complaints' | 'internal_tickets' | 'departments' | 'employees',
    format: 'csv' | 'excel',
  ) => void;
}

export function EnterpriseScopeHeader({
  locale,
  isAdmin,
  userDepartmentName,
  departments,
  selectedDeptId,
  onSelectDepartment,
  isExportOpen,
  setIsExportOpen,
  onTriggerExport,
}: EnterpriseScopeHeaderProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';

  return (
    <div className="rounded-2xl border bg-gradient-to-r from-card via-card to-muted/40 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold gap-1.5 px-3 py-1">
              <Globe2 className="h-3.5 w-3.5" />
              <span>{isRtl ? 'ذكاء العمليات المؤسسي (نطاق الإدارة العامة)' : 'Organization-Wide Intelligence (Admin Scope)'}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs font-bold gap-1.5 px-3 py-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>{userDepartmentName ?? (isRtl ? 'القسم المختص' : 'Authorized Department')} — {isRtl ? 'ذكاء العمليات' : 'Operational Intelligence'}</span>
            </Badge>
          )}
          <span className="text-2xs text-muted-foreground hidden sm:inline">
            Asia/Amman (UTC+3)
          </span>
        </div>
        <h2 className="text-xl font-extrabold text-foreground tracking-tight mt-1.5">
          {isRtl ? 'لوحة قيادة العمليات وإدارة الأداء' : 'Enterprise Operations & Intelligence Dashboard'}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isAdmin && (
          <select
            value={selectedDeptId ?? ''}
            onChange={(e) => onSelectDepartment(e.target.value || null)}
            className="h-9 rounded-lg border bg-background px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="">{t.departmentsTable.allDepartments}</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t.controls.export}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>

          {isExportOpen && (
            <div className="absolute end-0 top-10 z-30 w-56 rounded-xl border bg-popover p-1.5 shadow-lg text-xs space-y-1">
              <p className="px-2 py-1 text-3xs font-bold text-muted-foreground uppercase">{isRtl ? 'تصدير السجلات' : 'Export Records'}</p>
              <button type="button" onClick={() => onTriggerExport('internal_tickets', 'csv')} className="w-full text-start px-2 py-1.5 rounded-md hover:bg-muted font-medium">
                {isRtl ? 'تذاكر العمليات (CSV)' : 'Internal Tickets (CSV)'}
              </button>
              <button type="button" onClick={() => onTriggerExport('complaints', 'csv')} className="w-full text-start px-2 py-1.5 rounded-md hover:bg-muted font-medium">
                {isRtl ? 'شكاوى CRM (CSV)' : 'CRM Complaints (CSV)'}
              </button>
              <div className="border-t my-1" />
              <p className="px-2 py-1 text-3xs font-bold text-muted-foreground uppercase">{isRtl ? 'تصدير التقارير الإدارية' : 'Management Reports'}</p>
              <button type="button" onClick={() => onTriggerExport('departments', 'csv')} className="w-full text-start px-2 py-1.5 rounded-md hover:bg-muted font-medium">
                {isRtl ? 'أداء الأقسام (CSV)' : 'Department Performance (CSV)'}
              </button>
              <button type="button" onClick={() => onTriggerExport('employees', 'csv')} className="w-full text-start px-2 py-1.5 rounded-md hover:bg-muted font-medium">
                {isRtl ? 'أداء الموظفين (CSV)' : 'Employee Performance (CSV)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
