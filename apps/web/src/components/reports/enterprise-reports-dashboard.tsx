'use client';

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
import { UnifiedRecordsTable } from './unified-records-table';
import { QuickCaseDrawer } from './quick-case-drawer';
import type { RecordTableItem } from './detailed-records-table';
import {
  filterComplaintsList,
  filterTicketsList,
  computeCombinedKpis,
} from './enterprise-reports-filters';

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
  const [recordType, setRecordType] = useState<RecordTypeFilter>('all');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePresetFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  // Modals / Drawers State
  const [deepDiveDeptId, setDeepDiveDeptId] = useState<string | null>(null);
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
    setDeepDiveDeptId(null);
  };

  const filterOpts = useMemo(() => ({
    recordType, selectedDeptId, selectedStatus, datePreset, dateFrom, dateTo, search, departments,
  }), [recordType, selectedDeptId, selectedStatus, datePreset, dateFrom, dateTo, search, departments]);

  const filteredDepartments = useMemo(() => {
    return departmentsPerformance.filter((d) => {
      if (selectedBranchId && d.branchId !== selectedBranchId) return false;
      if (selectedDeptId && d.departmentId !== selectedDeptId) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!d.nameEn.toLowerCase().includes(q) && !d.nameAr.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [departmentsPerformance, selectedBranchId, selectedDeptId, search]);

  const deepDiveDept = useMemo(() => {
    if (!deepDiveDeptId) return null;
    return departmentsPerformance.find((d) => d.departmentId === deepDiveDeptId) ?? null;
  }, [departmentsPerformance, deepDiveDeptId]);

  const filteredComplaints = useMemo(
    () => filterComplaintsList(complaintsRecords, filterOpts),
    [complaintsRecords, filterOpts],
  );

  const filteredTickets = useMemo(
    () => filterTicketsList(ticketsRecords, filterOpts),
    [ticketsRecords, filterOpts],
  );

  const combinedKpis = useMemo(
    () => computeCombinedKpis(filteredComplaints, filteredTickets, ticketsAnalytics),
    [filteredComplaints, filteredTickets, ticketsAnalytics],
  );

  const handleInspect = (task: { id: string; refNumber: string; title: string; type: 'ticket' | 'complaint' }) => {
    if (task.type === 'ticket') {
      const tk = ticketsRecords.find((r) => r.id === task.id || r.referenceNumber === task.refNumber);
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
      const c = complaintsRecords.find((r) => r.id === task.id || r.referenceNumber === task.refNumber);
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

  const handleExportCsv = () => {
    const type = recordType === 'complaints' ? 'complaints' : recordType === 'tickets' ? 'internal_tickets' : 'departments';
    const deptParam = selectedDeptId ? `&departmentId=${selectedDeptId}` : '';
    window.location.href = `/api/reports/export-advanced?format=csv&type=${type}${deptParam}`;
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
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

      {deepDiveDept ? (
        <DepartmentDeepDiveView
          locale={locale}
          department={deepDiveDept}
          allTickets={ticketsRecords}
          allComplaints={complaintsRecords}
          officers={ticketsAnalytics?.officers ?? []}
          onBackToComparison={() => setDeepDiveDeptId(null)}
          onSelectEmployee={(id, name) => setSelectedEmployee({ id, name })}
          onInspectTask={handleInspect}
        />
      ) : (
        <div className="space-y-6">
          <DepartmentComparisonView
            locale={locale}
            departments={filteredDepartments}
            selectedDeptId={selectedDeptId}
            onSelectDepartment={setDeepDiveDeptId}
            onExportCsv={handleExportCsv}
          />

          <EnterpriseKpiGrid
            locale={locale}
            kpis={combinedKpis}
            activeFilterKey={selectedStatus}
            onFilterClick={(key) => setSelectedStatus(selectedStatus === key ? null : key)}
          />

          <EnterpriseAnalyticsCharts
            locale={locale}
            timeline={ticketsAnalytics?.timeline ?? []}
            statusBreakdown={ticketsAnalytics?.statusBreakdown ?? []}
            agingBuckets={ticketsAnalytics?.agingBuckets ?? []}
            ticketsCount={filteredTickets.length}
            complaintsCount={filteredComplaints.length}
          />

          <UnifiedRecordsTable
            locale={locale}
            complaints={filteredComplaints}
            tickets={filteredTickets}
            activeTypeFilter={recordType === 'complaints' ? 'complaint' : recordType === 'tickets' ? 'ticket' : 'all'}
            onInspect={(rec) => handleInspect({ id: rec.id, refNumber: rec.referenceNumber, title: rec.title, type: rec.type })}
          />
        </div>
      )}

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
