'use client';

import React, { useMemo, useState } from 'react';
import { Building2, Layers, LayoutDashboard } from 'lucide-react';
import { Badge } from '../ui/badge';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';
import type { DepartmentPerformanceRow } from '../../lib/staff-reports-departments-api';
import type {
  ComplaintRecordRow,
  ComplaintsAnalyticsResponse,
  TicketRecordRow,
  TicketsAnalyticsResponse,
} from '../../lib/staff-reports-analytics-api';
import { EnterpriseScopeHeader } from './enterprise-scope-header';
import { EnterpriseKpiGrid, type EnterpriseKpiData } from './enterprise-kpi-grid';
import { EnterpriseAnalyticsCharts } from './enterprise-analytics-charts';
import { DepartmentPerformanceTable } from './department-performance-table';
import { UnifiedRecordsTable, type UnifiedRecord } from './unified-records-table';
import { QuickCaseDrawer } from './quick-case-drawer';
import type { RecordTableItem } from './detailed-records-table';

interface EnterpriseReportsDashboardProps {
  locale: Locale;
  isAdmin: boolean;
  userDepartmentId?: string | null;
  userDepartmentName?: string | null;
  departments: { id: string; name: string }[];
  departmentsPerformance: DepartmentPerformanceRow[];
  complaintsAnalytics: ComplaintsAnalyticsResponse | null;
  complaintsRecords: ComplaintRecordRow[];
  ticketsAnalytics: TicketsAnalyticsResponse | null;
  ticketsRecords: TicketRecordRow[];
}

type TabView = 'overview' | 'departments' | 'records';

export function EnterpriseReportsDashboard({
  locale,
  isAdmin,
  userDepartmentId,
  userDepartmentName,
  departments,
  departmentsPerformance,
  complaintsAnalytics,
  complaintsRecords,
  ticketsAnalytics,
  ticketsRecords,
}: EnterpriseReportsDashboardProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';

  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);
  const [inspectRecord, setInspectRecord] = useState<RecordTableItem | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const filteredDepartments = useMemo(() => {
    if (!selectedDeptId) return departmentsPerformance;
    return departmentsPerformance.filter((d) => d.departmentId === selectedDeptId);
  }, [departmentsPerformance, selectedDeptId]);

  const combinedKpis = useMemo<EnterpriseKpiData>(() => {
    const cKpis = complaintsAnalytics?.kpis;
    const tKpis = ticketsAnalytics?.kpis;

    const totalCreated = (cKpis?.totalCreated ?? 0) + (tKpis?.totalCreated ?? 0);
    const openWorkload = (cKpis?.openWorkload ?? 0) + (tKpis?.openWorkload ?? 0);
    const inProgress = (cKpis?.inProgress ?? 0) + (tKpis?.inProgress ?? 0);
    const waiting = tKpis?.waiting ?? 0;
    const resolved = (cKpis?.resolved ?? 0) + (tKpis?.resolved ?? 0);
    const overdue = (cKpis?.overdue ?? 0) + (tKpis?.overdue ?? 0);
    const unassigned = (cKpis?.unassigned ?? 0) + (tKpis?.unassigned ?? 0);

    const onTimeRate = Math.round(
      ((cKpis?.slaComplianceRate ?? 100) + (tKpis?.onTimeSlaRate ?? 100)) / 2,
    );
    const avgTatDays = Number(
      (((cKpis?.avgResolutionHours ?? 0) / 24 + (tKpis?.avgResolutionDays ?? 0)) / 2).toFixed(1),
    );

    return {
      totalCreated,
      openWorkload,
      inProgress,
      waiting,
      resolved,
      overdue,
      unassigned,
      onTimeRate,
      avgTatDays,
      totalCreatedDelta: tKpis?.deltas?.totalCreated ?? 0,
      resolvedDelta: tKpis?.deltas?.resolved ?? 0,
    };
  }, [complaintsAnalytics, ticketsAnalytics]);

  const combinedTimeline = useMemo(() => {
    const map = new Map<string, { labelEn: string; labelAr: string; created: number; resolved: number }>();
    for (const p of ticketsAnalytics?.timeline ?? []) {
      map.set(p.date, { labelEn: p.labelEn, labelAr: p.labelAr, created: p.created, resolved: p.resolved });
    }
    for (const p of complaintsAnalytics?.timeline ?? []) {
      const existing = map.get(p.date) ?? { labelEn: p.labelEn, labelAr: p.labelAr, created: 0, resolved: 0 };
      existing.created += p.created;
      existing.resolved += p.resolved;
      map.set(p.date, existing);
    }
    return Array.from(map.entries()).map(([date, val]) => ({ date, ...val }));
  }, [complaintsAnalytics, ticketsAnalytics]);

  const combinedStatusBreakdown = useMemo(() => {
    const map = new Map<string, { nameEn: string; nameAr: string; count: number }>();
    for (const st of ticketsAnalytics?.statusBreakdown ?? []) {
      map.set(st.key, { nameEn: st.nameEn, nameAr: st.nameAr, count: st.count });
    }
    for (const st of complaintsAnalytics?.statusBreakdown ?? []) {
      const existing = map.get(st.key) ?? { nameEn: st.nameEn, nameAr: st.nameAr, count: 0 };
      existing.count += st.count;
      map.set(st.key, existing);
    }
    const total = Array.from(map.values()).reduce((sum, v) => sum + v.count, 0) || 1;
    return Array.from(map.entries()).map(([key, val]) => ({
      key,
      nameEn: val.nameEn,
      nameAr: val.nameAr,
      count: val.count,
      percentage: Math.round((val.count / total) * 100),
    })).sort((a, b) => b.count - a.count);
  }, [complaintsAnalytics, ticketsAnalytics]);

  const triggerExport = (
    type: 'complaints' | 'internal_tickets' | 'departments' | 'employees',
    format: 'csv' | 'excel',
  ) => {
    setIsExportOpen(false);
    const params = new URLSearchParams({ type, format });
    if (selectedDeptId) params.set('departmentId', selectedDeptId);
    window.location.href = `/api/reports/export-advanced?${params.toString()}`;
  };

  const handleInspect = (r: UnifiedRecord) => {
    setInspectRecord({
      id: r.id,
      referenceNumber: r.referenceNumber,
      titleOrSubject: r.title,
      status: r.status,
      severityOrPriority: r.priority,
      customerOrRequester: r.personName,
      ownerName: r.ownerName,
      departmentName: r.departmentName,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      isOverdue: r.isOverdue,
      linkHref: r.type === 'ticket' ? `/internal-tickets/${r.id}` : `/complaints/${r.id}`,
    });
  };

  return (
    <div className="w-full space-y-6">
      <EnterpriseScopeHeader
        locale={locale}
        isAdmin={isAdmin}
        userDepartmentName={userDepartmentName}
        departments={departments}
        selectedDeptId={selectedDeptId}
        onSelectDepartment={(id) => setSelectedDeptId(id)}
        isExportOpen={isExportOpen}
        setIsExportOpen={setIsExportOpen}
        onTriggerExport={triggerExport}
      />

      <div className="flex border-b text-xs font-semibold gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>{isRtl ? 'نظرة تنفيذية شاملة' : 'Executive Overview'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
            activeTab === 'departments'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>{t.departmentsTable.title}</span>
          <Badge variant="outline" className="text-3xs">{filteredDepartments.length}</Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('records')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all ${
            activeTab === 'records'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>{t.recordsTable.title}</span>
          <Badge variant="outline" className="text-3xs">{complaintsRecords.length + ticketsRecords.length}</Badge>
        </button>
      </div>

      <EnterpriseKpiGrid
        locale={locale}
        kpis={combinedKpis}
        activeFilterKey={activeKpiFilter}
        onFilterClick={(key) => {
          setActiveKpiFilter(activeKpiFilter === key ? null : key);
          setActiveTab('records');
        }}
      />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <EnterpriseAnalyticsCharts
            locale={locale}
            timeline={combinedTimeline}
            statusBreakdown={combinedStatusBreakdown}
            agingBuckets={ticketsAnalytics?.agingBuckets ?? []}
            ticketsCount={ticketsAnalytics?.kpis?.totalCreated ?? 0}
            complaintsCount={complaintsAnalytics?.kpis?.totalCreated ?? 0}
          />

          <DepartmentPerformanceTable
            locale={locale}
            departments={filteredDepartments}
            selectedDepartmentId={selectedDeptId}
            isAdmin={isAdmin}
            onSelectDepartment={(id) => setSelectedDeptId(id)}
            onExportCsv={() => triggerExport('departments', 'csv')}
          />
        </div>
      )}

      {activeTab === 'departments' && (
        <DepartmentPerformanceTable
          locale={locale}
          departments={filteredDepartments}
          selectedDepartmentId={selectedDeptId}
          isAdmin={isAdmin}
          onSelectDepartment={(id) => setSelectedDeptId(id)}
          onExportCsv={() => triggerExport('departments', 'csv')}
        />
      )}

      {activeTab === 'records' && (
        <UnifiedRecordsTable
          locale={locale}
          complaints={complaintsRecords}
          tickets={ticketsRecords}
          onInspect={handleInspect}
        />
      )}

      <QuickCaseDrawer
        locale={locale}
        record={inspectRecord}
        isOpen={Boolean(inspectRecord)}
        onClose={() => setInspectRecord(null)}
      />
    </div>
  );
}
