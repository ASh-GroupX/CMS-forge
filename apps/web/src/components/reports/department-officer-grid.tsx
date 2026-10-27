'use client';

import React from 'react';
import { Award, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

export interface DepartmentOfficerData {
  employeeId: string;
  nameEn: string;
  nameAr: string;
  departmentId?: string | null;
  departmentNameEn?: string | null;
  departmentNameAr?: string | null;
  role: string;
  activeWorkload: number;
  newAssignments: number;
  resolved: number;
  closed: number;
  overdue: number;
  onTimeRate: number;
  avgResolutionDays: number;
  avgRating: number;
}

interface DepartmentOfficerGridProps {
  locale: Locale;
  officers: DepartmentOfficerData[];
  onSelectEmployee: (employeeId: string, employeeName: string) => void;
}

export function DepartmentOfficerGrid({
  locale,
  officers,
  onSelectEmployee,
}: DepartmentOfficerGridProps) {
  const t = reportsAnalyticsI18n[locale];
  const dt = t.departmentsTable;
  const isRtl = locale === 'ar';

  if (officers.length === 0) {
    return (
      <Card className="p-8 text-center rounded-2xl border bg-card">
        <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-xs font-semibold text-muted-foreground">{t.officerTable.empty}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
      {officers.map((officer) => {
        const officerName = isRtl ? officer.nameAr : officer.nameEn;
        return (
          <Card
            key={officer.employeeId}
            className="p-4 flex flex-col justify-between rounded-xl border bg-card shadow-2xs hover:shadow-xs transition-shadow space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate" title={officerName}>
                    {officerName}
                  </p>
                  <p className="text-3xs font-medium text-muted-foreground uppercase tracking-wider mt-0.5 truncate">
                    {officer.role}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-3xs font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded-md">
                  <Award className="h-3 w-3" />
                  <span>{officer.avgRating.toFixed(1)}</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t text-center text-3xs">
                <div>
                  <span className="text-muted-foreground block truncate">{t.officerTable.activeCases}</span>
                  <span className="text-xs font-extrabold text-foreground tabular-nums">{officer.activeWorkload}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block truncate">{t.officerTable.resolvedCases}</span>
                  <span className="text-xs font-extrabold text-foreground tabular-nums">{officer.resolved}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block truncate">{t.officerTable.slaRate}</span>
                  <span className="text-xs font-extrabold text-primary tabular-nums">{officer.onTimeRate}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground block truncate">{t.officerTable.overdueCases}</span>
                  <span className={`text-xs font-extrabold tabular-nums ${officer.overdue > 0 ? 'text-destructive font-black' : 'text-foreground'}`}>
                    {officer.overdue}
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectEmployee(officer.employeeId, officerName)}
              className="w-full text-xs font-semibold gap-1.5 h-8 mt-1"
              aria-label={`${dt.openTasksBtn}: ${officerName}`}
            >
              <UserCheck className="h-3.5 w-3.5 text-primary" />
              <span>{dt.openTasksBtn}</span>
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
