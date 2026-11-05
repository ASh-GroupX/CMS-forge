'use client';
import { useStaffUiState } from '../../lib/use-staff-ui-state';
import React, { useMemo, useState } from 'react';
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
import { EnterpriseKpiGrid } from './enterprise-kpi-grid';
import { EnterpriseAnalyticsCharts } from './enterprise-analytics-charts';
import { ReportStatusBoard } from './report-status-board';
import { QuickCaseDrawer } from './quick-case-drawer';
import { EnterpriseScopeHeader } from './enterprise-scope-header';
import { resolveDates, useEnterpriseReportData } from './use-enterprise-report-data';
import type { RecordTableItem } from './detailed-records-table';
import { computeCombinedKpis } from './enterprise-reports-filters';
interface EnterpriseReportsDashboardProps {
  locale: Locale;
  isAdmin: boolean;
  userDepartmentId?: string | null;
  userDepartmentName?: string | null;
  departments: { id: string; name: string; nameEn?: string; nameAr?: string }[];
  branches?: { id: string; name: string; nameEn?: string; nameAr?: string }[];
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
  // Filters State
  const [recordType, setRecordType] = useStaffUiState<RecordTypeFilter>("recordType", 'all');
  const [selectedDeptId, setSelectedDeptId] = useStaffUiState<string | null>("selectedDeptId", null);
  const [selectedBranchId, setSelectedBranchId] = useStaffUiState<string | null>("selectedBranchId", null);
  const [selectedStatus, setSelectedStatus] = useStaffUiState<string | null>("selectedStatus", null);
  const [datePreset, setDatePreset] = useStaffUiState<DatePresetFilter>("datePreset", 'all');
  const [dateFrom, setDateFrom] = useStaffUiState("dateFrom", '');
  const [dateTo, setDateTo] = useStaffUiState("dateTo", '');
  const [search, setSearch] = useStaffUiState("search", '');
  // Modals / Drawers State
  const [deepDiveDeptId, setDeepDiveDeptId] = useStaffUiState<string | null>("deepDiveDeptId", null);
  const [inspectRecord, setInspectRecord] = useState<RecordTableItem | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const criteria = useMemo(() => ({
    recordType,
    departmentId: selectedDeptId,
    branchId: selectedBranchId,
    status: selectedStatus,
    datePreset,
    dateFrom,
    dateTo,
    search,
  }), [recordType, selectedDeptId, selectedBranchId, selectedStatus, datePreset, dateFrom, dateTo, search]);
  const reportData = useEnterpriseReportData(criteria, {
    departments: departmentsPerformance,
    complaintsAnalytics,
    complaintsRecords,
    ticketsAnalytics,
    ticketsRecords,
  });

  const handleClearAll = () => {
    setRecordType('all');
    setSelectedDeptId(null);
    setSelectedBranchId(null);
    setSelectedStatus(null);
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setDeepDiveDeptId(null);
  };
  const filteredDepartments = useMemo(() => {
    return reportData.departments.filter((d) => {
      if (selectedBranchId && d.branchId !== selectedBranchId) return false;
      if (selectedDeptId && d.departmentId !== selectedDeptId) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!d.nameEn.toLowerCase().includes(q) && !d.nameAr.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [reportData.departments, selectedBranchId, selectedDeptId, search]);

  const deepDiveDept = useMemo(() => {
    if (!deepDiveDeptId) return null;
    return reportData.departments.find((d) => d.departmentId === deepDiveDeptId) ?? null;
  }, [reportData.departments, deepDiveDeptId]);
  const combinedKpis = useMemo(
    () => computeCombinedKpis(reportData.complaintsAnalytics, reportData.ticketsAnalytics, recordType),
    [reportData.complaintsAnalytics, reportData.ticketsAnalytics, recordType],
  );

  const handleInspect = (task: { id: string; refNumber: string; title: string; type: 'ticket' | 'complaint' }) => {
    if (task.type === 'ticket') {
      const tk = reportData.ticketsRecords.find((r) => r.id === task.id || r.referenceNumber === task.refNumber);
      setInspectRecord({
        id: task.id,
        referenceNumber: tk?.referenceNumber || task.refNumber,
        titleOrSubject: tk?.title || task.title,
        status: tk?.status || 'OPEN',
        departmentName: tk?.targetDepartmentName || '',
        severityOrPriority: tk?.priority || 'NORMAL',
        customerOrRequester: tk?.requestedByName || 'Requester',
        ownerName: tk?.assignedEmployeeName || 'Unassigned',
        createdAt: tk?.createdAt || new Date().toISOString(),
        resolvedAt: tk?.resolvedAt || null,
        isOverdue: Boolean(tk?.isOverdue),
        linkHref: `/internal-tickets/${task.id}`,
      });
    } else {
      const c = reportData.complaintsRecords.find((r) => r.id === task.id || r.referenceNumber === task.refNumber);
      setInspectRecord({
        id: task.id,
        referenceNumber: c?.referenceNumber || task.refNumber,
        titleOrSubject: c?.subject || task.title,
        status: c?.status || 'NEW',
        departmentName: c?.departmentName || '',
        severityOrPriority: c?.severity || 'NORMAL',
        customerOrRequester: c?.customerName || 'Customer',
        ownerName: c?.ownerName || 'Unassigned',
        createdAt: c?.createdAt || new Date().toISOString(),
        resolvedAt: c?.resolvedAt || null,
        isOverdue: Boolean(c?.isOverdue),
        linkHref: `/complaints/${task.id}`,
      });
    }
  };

  const handleExport = (type: 'complaints' | 'internal_tickets' | 'departments' | 'employees', format: 'csv' | 'excel' = 'csv') => {
    const params = new URLSearchParams({ format, type });
    if (selectedDeptId) params.set('departmentId', selectedDeptId);
    if (selectedBranchId) params.set('branchId', selectedBranchId);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (search.trim()) params.set('search', search.trim());
    window.location.href = `/api/reports/export-advanced?${params.toString()}`;
    setIsExportOpen(false);
  };

  const handleExportCsv = () => handleExport(recordType === 'complaints' ? 'complaints' : recordType === 'tickets' ? 'internal_tickets' : 'departments');

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <EnterpriseScopeHeader
        locale={locale}
        isAdmin={isAdmin}
        userDepartmentName={userDepartmentName}
        departments={departments}
        selectedDeptId={selectedDeptId}
        onSelectDepartment={setSelectedDeptId}
        isExportOpen={isExportOpen}
        setIsExportOpen={setIsExportOpen}
        onTriggerExport={handleExport}
      />

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

      <div className="space-y-6">
        <DepartmentComparisonView
          locale={locale}
          departments={filteredDepartments}
          selectedDeptId={deepDiveDeptId}
          onSelectDepartment={(deptId) => setDeepDiveDeptId((current) => current === deptId ? null : deptId)}
          onExportCsv={handleExportCsv}
        />
        {deepDiveDept && (
          <div id="department-detail-panel" className="rounded-2xl border-2 border-primary/20 bg-primary/[0.02] p-1 shadow-sm">
            <DepartmentDeepDiveView
              locale={locale}
              department={deepDiveDept}
              allTickets={reportData.ticketsRecords}
              allComplaints={reportData.complaintsRecords}
              officers={reportData.ticketsAnalytics?.officers ?? []}
              onBackToComparison={() => setDeepDiveDeptId(null)}
              onSelectEmployee={(id, name) => setSelectedEmployee({ id, name })}
              onInspectTask={handleInspect}
            />
          </div>
        )}
        {!deepDiveDept && (
          <>
          <EnterpriseKpiGrid
            locale={locale}
            kpis={combinedKpis}
            activeFilterKey={selectedStatus}
            onFilterClick={(key) => setSelectedStatus(
              key === 'all' || key === 'sla' || key === 'tat' || selectedStatus === key ? null : key,
            )}
          />

          <EnterpriseAnalyticsCharts
            locale={locale}
            timeline={reportData.ticketsAnalytics?.timeline ?? reportData.complaintsAnalytics?.timeline ?? []}
            statusBreakdown={reportData.ticketsAnalytics?.statusBreakdown ?? reportData.complaintsAnalytics?.statusBreakdown ?? []}
            agingBuckets={reportData.ticketsAnalytics?.agingBuckets ?? reportData.complaintsAnalytics?.agingBuckets ?? []}
            ticketsCount={reportData.ticketsTotal}
            complaintsCount={reportData.complaintsTotal}
          />

          </>
        )}
        <ReportStatusBoard locale={locale} departmentId={selectedDeptId} branchId={selectedBranchId} search={search} type={recordType} departments={departments}
          selectedStatus={selectedStatus} externalDateFrom={resolveDates(criteria).from} externalDateTo={resolveDates(criteria).to} />
      </div>

      <EmployeeTasksDrawer
        locale={locale}
        isOpen={Boolean(selectedEmployee)}
        onClose={() => setSelectedEmployee(null)}
        employeeId={selectedEmployee?.id ?? null}
        employeeName={selectedEmployee?.name ?? null}
        allTickets={reportData.ticketsRecords}
        allComplaints={reportData.complaintsRecords}
        onInspectTask={handleInspect}
      />

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
