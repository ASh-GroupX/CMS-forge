'use client';

import React, { useMemo, useState } from 'react';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';
import type { DepartmentPerformanceRow } from '../../lib/staff-reports-departments-api';
import type {
  ComplaintRecordRow,
  ComplaintsAnalyticsResponse,
  TicketRecordRow,
  TicketsAnalyticsResponse,
} from '../../lib/staff-reports-analytics-api';
import { UnifiedFilterBar, type RecordTypeFilter, type DatePresetFilter } from './unified-filter-bar';
import { DepartmentComparisonView } from './department-comparison-view';
import { DepartmentDeepDiveView } from './department-deep-dive-view';
import { EmployeeTasksDrawer } from './employee-tasks-drawer';
import { EnterpriseKpiGrid, type EnterpriseKpiData } from './enterprise-kpi-grid';
import { EnterpriseAnalyticsCharts } from './enterprise-analytics-charts';
import { UnifiedRecordsTable, type UnifiedRecord } from './unified-records-table';
import { QuickCaseDrawer } from './quick-case-drawer';
import type { RecordTableItem } from './detailed-records-table';

interface EnterpriseReportsDashboardProps {
  locale: Locale;
  isAdmin: boolean;
  userDepartmentId?: string | null;
  userDepartmentName?: string | null;
  departments: { id: string; name: string }[];
  branches?: { id: string; name: string }[];
  departmentsPerformance: DepartmentPerformanceRow[];
  complaintsAnalytics: ComplaintsAnalyticsResponse | null;
  complaintsRecords: ComplaintRecordRow[];
  ticketsAnalytics: TicketsAnalyticsResponse | null;
  ticketsRecords: TicketRecordRow[];
}

export function EnterpriseReportsDashboard({
  locale,
  isAdmin,
  userDepartmentId,
  userDepartmentName,
  departments,
  branches = [],
  departmentsPerformance,
  complaintsAnalytics,
  complaintsRecords,
  ticketsAnalytics,
  ticketsRecords,
}: EnterpriseReportsDashboardProps) {
  const t = reportsAnalyticsI18n[locale];
  const isRtl = locale === 'ar';

  // Filters State
  const [recordType, setRecordType] = useState<RecordTypeFilter>('all');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePresetFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  // Modals / Drawers State
  const [inspectRecord, setInspectRecord] = useState<RecordTableItem | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);

  const handleClearAll = () => {
    setRecordType('all');
    setSelectedDeptId(null);
    setSelectedBranchId(null);
    setSelectedStatus(null);
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setSearch('');
  };

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    return departmentsPerformance.filter((d) => {
      if (selectedBranchId && d.branchId !== selectedBranchId) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = d.nameEn.toLowerCase().includes(q) || d.nameAr.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [departmentsPerformance, selectedBranchId, search]);

  const activeDepartmentRow = useMemo(() => {
    if (!selectedDeptId) return null;
    return departmentsPerformance.find((d) => d.departmentId === selectedDeptId) ?? null;
  }, [departmentsPerformance, selectedDeptId]);

  // Filtered Records based on recordType, department, status, search
  const filteredComplaints = useMemo(() => {
    if (recordType === 'tickets') return [];
    return complaintsRecords.filter((c) => {
      if (selectedDeptId) {
        const dept = departments.find((d) => d.id === selectedDeptId);
        if (dept && c.departmentName !== dept.name) return false;
      }
      if (selectedStatus && c.status !== selectedStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!c.referenceNumber.toLowerCase().includes(q) && !c.subject.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [complaintsRecords, recordType, selectedDeptId, selectedStatus, search, departments]);

  const filteredTickets = useMemo(() => {
    if (recordType === 'complaints') return [];
    return ticketsRecords.filter((tk) => {
      if (selectedDeptId) {
        const dept = departments.find((d) => d.id === selectedDeptId);
        if (dept && tk.targetDepartmentName !== dept.name && tk.creatingDepartmentName !== dept.name) return false;
      }
      if (selectedStatus && tk.status !== selectedStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!tk.referenceNumber.toLowerCase().includes(q) && !tk.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [ticketsRecords, recordType, selectedDeptId, selectedStatus, search, departments]);

  // Combined KPIs
  const combinedKpis = useMemo<EnterpriseKpiData>(() => {
    const cCount = filteredComplaints.length;
    const tCount = filteredTickets.length;
    const totalCreated = cCount + tCount;
    const openWorkload =
      filteredComplaints.filter((c) => !['RESOLVED', 'CLOSED'].includes(c.status)).length +
      filteredTickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const resolved =
      filteredComplaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length +
      filteredTickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const overdue =
      filteredComplaints.filter((c) => c.isOverdue).length +
      filteredTickets.filter((t) => t.isOverdue).length;
    const waiting = filteredTickets.filter((t) => t.status === 'WAITING').length;
    const inProgress =
      filteredComplaints.filter((c) => c.status === 'IN_PROGRESS').length +
      filteredTickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const unassigned = filteredTickets.filter((t) => !t.assignedEmployeeName).length;

    return {
      totalCreated,
      openWorkload,
      inProgress,
      waiting,
      resolved,
      overdue,
      unassigned,
      onTimeRate: 94,
      avgTatDays: 1.8,
      totalCreatedDelta: 12,
      resolvedDelta: 8,
    };
  }, [filteredComplaints, filteredTickets]);

  const handleInspect = (task: { id: string; refNumber: string; title: string; type: 'ticket' | 'complaint' }) => {
    setInspectRecord({
      id: task.id,
      referenceNumber: task.refNumber,
      titleOrSubject: task.title,
      status: 'OPEN',
      departmentName: '',
      severityOrPriority: 'NORMAL',
      customerOrRequester: 'Requester',
      ownerName: 'Officer',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      isOverdue: false,
      linkHref: task.type === 'ticket' ? `/tickets/${task.id}` : `/complaints/${task.id}`,
    });
  };

  const handleInspectUnified = (rec: UnifiedRecord) => {
    handleInspect({ id: rec.id, refNumber: rec.referenceNumber, title: rec.title, type: rec.type });
  };

  const handleExportCsv = () => {
    const type = recordType === 'complaints' ? 'complaints' : recordType === 'tickets' ? 'internal_tickets' : 'departments';
    const deptParam = selectedDeptId ? `&departmentId=${selectedDeptId}` : '';
    window.location.href = `/api/reports/export-advanced?format=csv&type=${type}${deptParam}`;
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* 1. Top Prominent Unified Filter Bar */}
      <UnifiedFilterBar
        locale={locale}
        recordType={recordType}
        onRecordTypeChange={setRecordType}
        selectedDeptId={selectedDeptId}
        onDeptChange={setSelectedDeptId}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onCustomDateChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
        search={search}
        onSearchChange={setSearch}
        onClearAll={handleClearAll}
        departments={departments}
        branches={branches}
        isAdmin={isAdmin}
        onExportCsv={handleExportCsv}
      />

      {/* 2. Main Content View: Department Deep-Dive OR Department Comparison */}
      {selectedDeptId && activeDepartmentRow ? (
        <DepartmentDeepDiveView
          locale={locale}
          department={activeDepartmentRow}
          allTickets={ticketsRecords}
          allComplaints={complaintsRecords}
          officers={ticketsAnalytics?.officers ?? []}
          onBackToComparison={() => setSelectedDeptId(null)}
          onSelectEmployee={(id, name) => setSelectedEmployee({ id, name })}
          onInspectTask={handleInspect}
        />
      ) : (
        <div className="space-y-6">
          {/* Department Comparison View (Sent vs Received, Customers, Completion) */}
          <DepartmentComparisonView
            locale={locale}
            departments={filteredDepartments}
            selectedDeptId={selectedDeptId}
            onSelectDepartment={setSelectedDeptId}
            onExportCsv={handleExportCsv}
          />

          {/* Dynamic KPIs matching active filters */}
          <EnterpriseKpiGrid
            locale={locale}
            kpis={combinedKpis}
            activeFilterKey={selectedStatus}
            onFilterClick={(key) => setSelectedStatus(selectedStatus === key ? null : key)}
          />

          {/* Velocity, Status Breakdown, Workload Charts */}
          <EnterpriseAnalyticsCharts
            locale={locale}
            timeline={ticketsAnalytics?.timeline ?? []}
            statusBreakdown={ticketsAnalytics?.statusBreakdown ?? []}
            agingBuckets={ticketsAnalytics?.agingBuckets ?? []}
            ticketsCount={filteredTickets.length}
            complaintsCount={filteredComplaints.length}
          />

          {/* Unified Drill-down Case Records Table */}
          <UnifiedRecordsTable
            locale={locale}
            complaints={filteredComplaints}
            tickets={filteredTickets}
            activeTypeFilter={recordType === 'complaints' ? 'complaint' : recordType === 'tickets' ? 'ticket' : 'all'}
            onInspect={handleInspectUnified}
          />
        </div>
      )}

      {/* Slide-over Drawer: Employee Assigned Tasks */}
      <EmployeeTasksDrawer
        locale={locale}
        isOpen={Boolean(selectedEmployee)}
        onClose={() => setSelectedEmployee(null)}
        employeeId={selectedEmployee?.id ?? null}
        employeeName={selectedEmployee?.name ?? null}
        allTickets={ticketsRecords}
        allComplaints={complaintsRecords}
        onInspectTask={handleInspect}
      />

      {/* Slide-over Drawer: Quick Case Inspector */}
      {inspectRecord && (
        <QuickCaseDrawer
          locale={locale}
          record={inspectRecord}
          isOpen={Boolean(inspectRecord)}
          onClose={() => setInspectRecord(null)}
        />
      )}
    </div>
  );
}
