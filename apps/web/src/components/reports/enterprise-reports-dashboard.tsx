'use client';
import { useReportUrl } from './use-report-url';
import { DepartmentWorkspace } from './department-workspace';
import { ReportActiveFilters } from './report-active-filters';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { reportWorkspaceText } from '../../i18n/report-workspace';
import { useStaffUiState } from '../../lib/use-staff-ui-state';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Locale } from '../../i18n/staff-shell';
import type { DepartmentPerformanceRow } from '../../lib/staff-reports-departments-api';
import type {
  ComplaintRecordRow,
  ComplaintsAnalyticsResponse,
  TicketRecordRow,
  TicketsAnalyticsResponse,
} from '../../lib/staff-reports-analytics-api';
import { UnifiedFilterBar, type RecordTypeFilter, type DatePresetFilter } from './unified-filter-bar';
import { EnterpriseKpiGrid } from './enterprise-kpi-grid';
import { EnterpriseAnalyticsCharts } from './enterprise-analytics-charts';
import { ReportStatusBoard } from './report-status-board';
import { EnterpriseScopeHeader } from './enterprise-scope-header';
import { buildReportQuery, resolveDates, useEnterpriseReportData } from './use-enterprise-report-data';
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
  const copy = reportWorkspaceText[locale];
  const [officerId, setOfficerId] = useStaffUiState<string | null>('reportOfficer', null);
  const [view, setView] = useStaffUiState('reportView', 'overview');
  const resultsRef = useRef<HTMLElement>(null);
  const [resultTitle, setResultTitle] = useStaffUiState('reportResultTitle', copy.views.records);
  useEffect(() => {
    if (view === 'records') {
      const frame = requestAnimationFrame(() => {
        resultsRef.current?.focus({ preventScroll: true });
        resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [view, resultTitle]);
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
  const [isExportOpen, setIsExportOpen] = useState(false);
  const officerFilter = useMemo(() => officerId ? { ownerId: officerId, assignedEmployeeId: officerId } : undefined, [officerId]);
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
  useReportUrl({ ...criteria, view, officerId }, restored => {
    if (restored.recordType) setRecordType(restored.recordType);
    if (restored.view) setView(restored.view);
    if ('officerId' in restored) setOfficerId(restored.officerId ?? null);
    if (restored.datePreset) setDatePreset(restored.datePreset);
    if ('departmentId' in restored) setSelectedDeptId(restored.departmentId ?? null);
    if ('branchId' in restored) setSelectedBranchId(restored.branchId ?? null);
    if ('status' in restored) setSelectedStatus(restored.status ?? null);
    if ('search' in restored) setSearch(restored.search ?? '');
    if ('dateFrom' in restored) setDateFrom(restored.dateFrom ?? '');
    if ('dateTo' in restored) setDateTo(restored.dateTo ?? '');
  });
  const reportData = useEnterpriseReportData(criteria, {
    departments: departmentsPerformance,
    complaintsAnalytics,
    complaintsRecords,
    ticketsAnalytics,
    ticketsRecords,
  });

  const handleClearAll = () => {
    setOfficerId(null);
    setRecordType('all');
    setSelectedDeptId(null);
    setSelectedBranchId(null);
    setSelectedStatus(null);
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setResultTitle(copy.views.records);
  };
  const filteredDepartments = useMemo(() => {
    return reportData.departments.filter((d) => {
      if (selectedBranchId && d.branchId !== selectedBranchId) return false;
      if (selectedDeptId && d.departmentId !== selectedDeptId) return false;
      return true;
    });
  }, [reportData.departments, selectedBranchId, selectedDeptId, search]);

  const combinedKpis = useMemo(
    () => computeCombinedKpis(reportData.complaintsAnalytics, reportData.ticketsAnalytics, recordType),
    [reportData.complaintsAnalytics, reportData.ticketsAnalytics, recordType],
  );

  const handleExport = (type: 'complaints' | 'internal_tickets' | 'departments' | 'employees', format: 'csv' | 'excel' = 'csv') => {
    const params = new URLSearchParams({ format, type });
    if (officerId) params.set(type === 'internal_tickets' ? 'assignedEmployeeId' : 'ownerId', officerId);
    if (selectedDeptId) params.set('departmentId', selectedDeptId);
    if (selectedBranchId) params.set('branchId', selectedBranchId);
    const query = buildReportQuery(criteria);
    const filter = type === 'internal_tickets' ? query.tickets : type === 'complaints' ? query.complaints : query.department;
    Object.entries(filter).forEach(([key, value]) => { if (value) params.set(key, value); });
    window.location.href = `/api/reports/export-advanced?${params.toString()}`;
    setIsExportOpen(false);
  };

  const handleExportCsv = () => recordType === 'all' ? setIsExportOpen(true) : handleExport(recordType === 'complaints' ? 'complaints' : 'internal_tickets');

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      <EnterpriseScopeHeader
        locale={locale}
        isAdmin={isAdmin}
        userDepartmentName={userDepartmentName}
        departments={departments}
        selectedDeptId={selectedDeptId}
        onSelectDepartment={value => { setSelectedDeptId(value); setOfficerId(null); setResultTitle(copy.views.records); }}
        isExportOpen={isExportOpen}
        setIsExportOpen={setIsExportOpen}
        onTriggerExport={handleExport}
      />

      <UnifiedFilterBar
        locale={locale}
        recordType={recordType}
        onRecordTypeChange={value => { setRecordType(value); setOfficerId(null); setResultTitle(copy.views.records); }}
        selectedDeptId={selectedDeptId}
        onDeptChange={value => { setSelectedDeptId(value); setOfficerId(null); setResultTitle(copy.views.records); }}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        selectedStatus={selectedStatus}
        onStatusChange={(value) => { setSelectedStatus(value); setResultTitle(copy.views.records); }}
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

      <ReportActiveFilters locale={locale} criteria={criteria} departments={departments} branches={branches} onClear={handleClearAll} />
      <p className="text-sm text-muted-foreground">{copy.periodNote}</p>
      {reportData.state === 'loading' && <p role="status">{copy.loading}</p>}
      {reportData.state === 'error' && <div role="alert" className="flex items-center gap-3 text-destructive">
        {copy.failed}<Button variant="outline" onClick={reportData.retry}>{copy.retry}</Button>
      </div>}
      <Tabs value={view} onValueChange={setView} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className="h-auto flex flex-wrap justify-start gap-1" aria-label={copy.navigation}>
          {Object.entries(copy.views).map(([key, label]) => <TabsTrigger key={key} value={key}>{label}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="departments" className="space-y-6">
        <DepartmentWorkspace locale={locale} departments={filteredDepartments} criteria={criteria}
          complaints={reportData.complaintsAnalytics} tickets={reportData.ticketsAnalytics} />
        </TabsContent>
        <TabsContent value="overview" className="space-y-6">
          <EnterpriseKpiGrid
            locale={locale}
            kpis={combinedKpis}
            showRates={recordType !== 'all'}
            activeFilterKey={selectedStatus}
            onFilterClick={(key, title) => {
              setOfficerId(null);
              setSelectedStatus(key === 'all' ? null : key);
              setResultTitle(title);
              setView('records');
            }}
          />

        </TabsContent>
        <TabsContent value="trends" className="space-y-6">
          {[
            { key: 'complaints', title: copy.complaints, data: reportData.complaintsAnalytics, complaints: reportData.complaintsTotal, tickets: 0 },
            { key: 'tickets', title: copy.tickets, data: reportData.ticketsAnalytics, complaints: 0, tickets: reportData.ticketsTotal },
          ].filter(item => item.data).map(item => (
            <section key={item.key} className="space-y-3">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <EnterpriseAnalyticsCharts locale={locale} timeline={item.data!.timeline ?? []}
                statusBreakdown={item.data!.statusBreakdown ?? []} agingBuckets={item.data!.agingBuckets ?? []}
                ticketsCount={item.tickets} complaintsCount={item.complaints} />
            </section>
          ))}
        </TabsContent>
        <TabsContent value="records">
        <section ref={resultsRef} tabIndex={-1} aria-label={resultTitle} className="space-y-4 scroll-mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <h2 className="text-xl font-semibold">{resultTitle}</h2>
          {officerId && <Button variant="outline" onClick={() => setOfficerId(null)}>{copy.clearOfficer}</Button>}
          <ReportStatusBoard showBoardFilters={false} locale={locale} departmentId={selectedDeptId} branchId={selectedBranchId} search={search} type={recordType} departments={departments}
          {...(officerFilter ? { filterExtras: officerFilter } : {})}
          selectedStatus={selectedStatus} externalDateFrom={resolveDates(criteria).from} externalDateTo={resolveDates(criteria).to} />
        </section>
        </TabsContent>
      </Tabs>


    </div>
  );
}
