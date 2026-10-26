'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, CheckCircle2, History, Inbox, Send, UserCheck, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';
import type { DepartmentPerformanceRow } from '../../lib/staff-reports-departments-api';
import type { TicketRecordRow, ComplaintRecordRow } from '../../lib/staff-reports-analytics-api';
import { DepartmentTaskTable } from './department-task-table';

interface DepartmentDeepDiveViewProps {
  locale: Locale;
  department: DepartmentPerformanceRow;
  allTickets: TicketRecordRow[];
  allComplaints: ComplaintRecordRow[];
  officers: {
    employeeId: string; nameEn: string; nameAr: string; role: string;
    activeWorkload: number; newAssignments: number; resolved: number; closed: number;
    overdue: number; onTimeRate: number; avgResolutionDays: number; avgRating: number;
  }[];
  onBackToComparison: () => void;
  onSelectEmployee: (employeeId: string, employeeName: string) => void;
  onInspectTask: (task: { id: string; refNumber: string; title: string; type: 'ticket' | 'complaint' }) => void;
}

type SubTab = 'inbound' | 'outbound' | 'activity' | 'team';

export function DepartmentDeepDiveView({
  locale,
  department,
  allTickets,
  allComplaints,
  officers,
  onBackToComparison,
  onSelectEmployee,
  onInspectTask,
}: DepartmentDeepDiveViewProps) {
  const t = reportsAnalyticsI18n[locale];
  const dt = t.departmentsTable;
  const isRtl = locale === 'ar';
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('inbound');

  const deptName = isRtl ? department.nameAr : department.nameEn;

  const inboundTickets = useMemo(() => {
    return allTickets.filter(
      (tk) =>
        tk.targetDepartmentName === department.nameEn ||
        tk.targetDepartmentName === department.nameAr,
    );
  }, [allTickets, department]);

  const outboundTickets = useMemo(() => {
    return allTickets.filter(
      (tk) =>
        tk.creatingDepartmentName === department.nameEn ||
        tk.creatingDepartmentName === department.nameAr,
    );
  }, [allTickets, department]);

  return (
    <div className="space-y-4">
      {/* Top Department Banner & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-card shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBackToComparison}
            className="h-9 gap-1.5 text-xs font-semibold"
            aria-label={dt.backToComparison}
          >
            <BackIcon className="h-4 w-4" />
            <span>{dt.backToComparison}</span>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-foreground tracking-tight">{deptName}</h2>
              {department.branchNameEn && (
                <Badge variant="outline" className="text-3xs font-semibold px-2 py-0">
                  {isRtl ? department.branchNameAr : department.branchNameEn}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {department.employeeCount} {dt.employees} • {department.combinedVolume} {dt.combinedVolume}
            </p>
          </div>
        </div>

        {/* Quick KPI badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs">
            <span className="text-3xs text-muted-foreground block uppercase font-bold">{dt.sentTasks}</span>
            <span className="font-extrabold text-primary tabular-nums">{department.ticketsCreated}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs">
            <span className="text-3xs text-muted-foreground block uppercase font-bold">{dt.receivedTasks}</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">{department.ticketsTargeted}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
            <span className="text-3xs text-muted-foreground block uppercase font-bold">{dt.customers}</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">{department.uniqueCustomers ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Inbound Tasks / Outbound Tasks / Team / Activity Audit */}
      <div className="flex items-center gap-1.5 border-b pb-2 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('inbound')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
            activeSubTab === 'inbound'
              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          <span>{dt.inboundTasksTitle} ({inboundTickets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('outbound')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
            activeSubTab === 'outbound'
              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>{dt.outboundTasksTitle} ({outboundTickets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('team')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
            activeSubTab === 'team'
              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>{dt.teamRosterTitle} ({officers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('activity')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
            activeSubTab === 'activity'
              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>{dt.activityAuditTitle}</span>
        </button>
      </div>

      {/* Tab 1: Inbound Tasks */}
      {activeSubTab === 'inbound' && (
        <Card className="p-4 rounded-2xl border bg-card shadow-xs">
          <DepartmentTaskTable
            tasks={inboundTickets}
            emptyText={isRtl ? 'لا توجد مهام واردة لهذا القسم حالياً' : 'No incoming tasks recorded for this department.'}
            isOutbound={false}
            onInspect={onInspectTask}
            whoSentLabel={dt.whoSent}
            targetDeptLabel={dt.targetDept}
            assignedToLabel={dt.assignedTo}
          />
        </Card>
      )}

      {/* Tab 2: Outbound Tasks */}
      {activeSubTab === 'outbound' && (
        <Card className="p-4 rounded-2xl border bg-card shadow-xs">
          <DepartmentTaskTable
            tasks={outboundTickets}
            emptyText={isRtl ? 'لا توجد مهام صادرة من هذا القسم حالياً' : 'No outgoing tasks initiated by this department.'}
            isOutbound={true}
            onInspect={onInspectTask}
            whoSentLabel={dt.whoSent}
            targetDeptLabel={dt.targetDept}
            assignedToLabel={dt.assignedTo}
          />
        </Card>
      )}

      {/* Tab 3: Team & Officers */}
      {activeSubTab === 'team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {officers.map((officer) => {
            const officerName = isRtl ? officer.nameAr : officer.nameEn;
            return (
              <Card key={officer.employeeId} className="p-4 rounded-xl border bg-card flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{officerName}</h4>
                    <span className="text-3xs font-semibold text-muted-foreground">{officer.role.replace(/_/g, ' ')}</span>
                  </div>
                  <Badge variant="outline" className="text-3xs px-2 py-0 font-bold">
                    {officer.activeWorkload} {t.officerTable.activeCases}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y text-center text-3xs">
                  <div>
                    <span className="text-muted-foreground block">{t.officerTable.resolvedCases}</span>
                    <span className="text-xs font-extrabold text-foreground tabular-nums">{officer.resolved}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{t.officerTable.slaRate}</span>
                    <span className="text-xs font-extrabold text-primary tabular-nums">{officer.onTimeRate}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">{t.officerTable.overdueCases}</span>
                    <span className={`text-xs font-extrabold tabular-nums ${officer.overdue > 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {officer.overdue}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectEmployee(officer.employeeId, officerName)}
                  className="w-full text-xs font-semibold gap-1.5 h-8"
                  aria-label={`${dt.openTasksBtn}: ${officerName}`}
                >
                  <UserCheck className="h-3.5 w-3.5 text-primary" />
                  <span>{dt.openTasksBtn}</span>
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 4: Activity Audit Timeline */}
      {activeSubTab === 'activity' && (
        <Card className="p-4 sm:p-5 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">{dt.activityAuditTitle}</h4>
          </div>
          <div className="space-y-2 text-xs">
            {inboundTickets.slice(0, 10).map((tk, idx) => (
              <div key={tk.id || idx} className="flex items-start gap-3 p-2.5 rounded-lg border bg-muted/20">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground truncate">
                      {tk.referenceNumber}: {tk.title}
                    </p>
                    <span className="text-3xs text-muted-foreground whitespace-nowrap">{tk.createdAt.split('T')[0]}</span>
                  </div>
                  <p className="text-3xs text-muted-foreground mt-0.5">
                    {dt.whoSent}: <span className="font-medium text-foreground">{tk.requestedByName}</span> ({tk.creatingDepartmentName}) → {dt.assignedTo}: <span className="font-medium text-foreground">{tk.assignedEmployeeName || 'Unassigned'}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
