'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, History, Inbox, Layers, Send, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';
import type { DepartmentPerformanceRow } from '../../lib/staff-reports-departments-api';
import type { TicketRecordRow, ComplaintRecordRow } from '../../lib/staff-reports-analytics-api';
import { DepartmentTaskTable } from './department-task-table';
import { DepartmentOfficerGrid, type DepartmentOfficerData } from './department-officer-grid';

interface DepartmentDeepDiveViewProps {
  locale: Locale;
  department: DepartmentPerformanceRow;
  allTickets: TicketRecordRow[];
  allComplaints: ComplaintRecordRow[];
  officers: DepartmentOfficerData[];
  onBackToComparison: () => void;
  onSelectEmployee: (employeeId: string, employeeName: string) => void;
  onInspectTask: (task: { id: string; refNumber: string; title: string; type: 'ticket' | 'complaint' }) => void;
}

type SubTab = 'all' | 'inbound' | 'outbound' | 'team' | 'activity';

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

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('all');

  const deptName = isRtl ? department.nameAr : department.nameEn;

  const inboundTickets = useMemo(() => {
    return allTickets.filter(
      (tk) =>
        (tk.targetDepartmentId && tk.targetDepartmentId === department.departmentId) ||
        tk.targetDepartmentName === department.nameEn ||
        tk.targetDepartmentName === department.nameAr,
    );
  }, [allTickets, department]);

  const outboundTickets = useMemo(() => {
    return allTickets.filter(
      (tk) =>
        (tk.creatingDepartmentId && tk.creatingDepartmentId === department.departmentId) ||
        tk.creatingDepartmentName === department.nameEn ||
        tk.creatingDepartmentName === department.nameAr,
    );
  }, [allTickets, department]);

  const allDeptTasks = useMemo(() => {
    const map = new Map<string, TicketRecordRow>();
    for (const tk of outboundTickets) map.set(tk.id, tk);
    for (const tk of inboundTickets) map.set(tk.id, tk);
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [outboundTickets, inboundTickets]);

  const deptOfficers = useMemo(() => {
    return officers.filter((o) => {
      if (o.departmentId && department.departmentId) {
        return o.departmentId === department.departmentId;
      }
      return (
        o.departmentNameEn === department.nameEn ||
        o.departmentNameAr === department.nameAr ||
        o.departmentNameEn === department.nameAr ||
        o.departmentNameAr === department.nameEn
      );
    });
  }, [officers, department]);

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
              {deptOfficers.length} {dt.employees} • {department.combinedVolume} {dt.combinedVolume}
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
          <div className="px-3 py-1.5 rounded-xl bg-muted border text-xs">
            <span className="text-3xs text-muted-foreground block uppercase font-bold">{dt.customers}</span>
            <span className="font-extrabold text-foreground tabular-nums">{department.uniqueCustomers ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: All Tasks / Inbound Tasks / Outbound Tasks / Team / Activity Audit */}
      <div className="flex items-center gap-1.5 border-b pb-2 text-xs font-semibold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('all')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
            activeSubTab === 'all'
              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>{dt.allTasksTitle} ({allDeptTasks.length})</span>
        </button>

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
          <span>{dt.teamRosterTitle} ({deptOfficers.length})</span>
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

      {/* Task Tables: All, Inbound, or Outbound */}
      {activeSubTab !== 'team' && activeSubTab !== 'activity' && (
        <Card className="p-4 rounded-2xl border bg-card shadow-xs">
          <DepartmentTaskTable
            tasks={activeSubTab === 'all' ? allDeptTasks : activeSubTab === 'inbound' ? inboundTickets : outboundTickets}
            emptyText={
              activeSubTab === 'all'
                ? (isRtl ? 'لا توجد مهام مسجلة لهذا القسم حالياً' : 'No tasks recorded for this department.')
                : activeSubTab === 'inbound'
                ? (isRtl ? 'لا توجد مهام واردة لهذا القسم حالياً' : 'No incoming tasks recorded for this department.')
                : (isRtl ? 'لا توجد مهام صادرة من هذا القسم حالياً' : 'No outgoing tasks initiated by this department.')
            }
            mode={activeSubTab}
            currentDeptId={department.departmentId}
            currentDeptName={deptName}
            onInspect={onInspectTask}
            whoSentLabel={dt.whoSent}
            targetDeptLabel={dt.targetDept}
            assignedToLabel={dt.assignedTo}
            flowLabel={dt.flowCol}
            inboundBadgeLabel={dt.inboundBadge}
            outboundBadgeLabel={dt.outboundBadge}
          />
        </Card>
      )}

      {/* Tab 3: Department Officers Only */}
      {activeSubTab === 'team' && (
        <DepartmentOfficerGrid
          locale={locale}
          officers={deptOfficers}
          onSelectEmployee={onSelectEmployee}
        />
      )}

      {/* Tab 4: Activity Audit Timeline */}
      {activeSubTab === 'activity' && (
        <Card className="p-4 sm:p-5 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">{dt.activityAuditTitle}</h4>
          </div>
          <div className="space-y-2 text-xs">
            {allDeptTasks.slice(0, 15).map((tk, idx) => (
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
                    {dt.whoSent}: <span className="font-medium text-foreground">{tk.requestedByName}</span> ({tk.creatingDepartmentName}) → {dt.assignedTo}: <span className="font-medium text-foreground">{tk.assignedEmployeeName || 'Unassigned'}</span> ({tk.targetDepartmentName})
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
