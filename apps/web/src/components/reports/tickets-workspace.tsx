'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ReportHeader } from './report-header';
import { ReportFilters, type ReportFilterOption } from './report-filters';
import { KpiOverviewCards } from './kpi-overview-cards';
import { VisualAnalytics } from './visual-analytics';
import { OfficerPerformanceTable } from './officer-performance-table';
import { DetailedRecordsTable, type RecordTableItem } from './detailed-records-table';
import { QuickCaseDrawer } from './quick-case-drawer';
import { SavedViewsModal } from './saved-views-modal';
import {
  fetchTicketsAnalytics,
  fetchTicketsRecords,
  type TicketsAnalyticsFilter,
  type TicketsAnalyticsResponse,
  type TicketRecordRow,
} from '../../lib/staff-reports-analytics-api';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';
import {
  buildTicketsKpiCards,
  buildTicketsOfficerRows,
  buildTicketsRecordItems,
} from './tickets-workspace-helpers';

interface TicketsWorkspaceProps {
  locale: Locale;
  initialDepartments?: ReportFilterOption[];
}

export function TicketsWorkspace({
  locale,
  initialDepartments = [],
}: TicketsWorkspaceProps) {
  const t = reportsAnalyticsI18n[locale];

  // Filters State
  const [period, setPeriod] = useState('this_month');
  const [dateDimension, setDateDimension] = useState<'createdAt' | 'dueAt' | 'resolvedAt' | 'closedAt'>('createdAt');
  const [search, setSearch] = useState('');
  const [targetDepartmentId, setTargetDepartmentId] = useState('');
  const [creatingDepartmentId, setCreatingDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Analytics & Records Data
  const [analytics, setAnalytics] = useState<TicketsAnalyticsResponse | null>(null);
  const [records, setRecords] = useState<{ total: number; items: TicketRecordRow[] }>({ total: 0, items: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals & Drawers
  const [isSavedViewsOpen, setIsSavedViewsOpen] = useState(false);
  const [inspectRecord, setInspectRecord] = useState<RecordTableItem | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const filter: TicketsAnalyticsFilter = {
      targetDepartmentId: targetDepartmentId || null,
      creatingDepartmentId: creatingDepartmentId || null,
      assignedEmployeeId: employeeId || null,
      status: status || null,
      priority: priority || null,
      dateDimension,
      search: search || null,
    };

    const [analyticsRes, recordsRes] = await Promise.all([
      fetchTicketsAnalytics(filter),
      fetchTicketsRecords(filter, pageSize, (page - 1) * pageSize),
    ]);

    if (analyticsRes) setAnalytics(analyticsRes);
    if (recordsRes) setRecords(recordsRes);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [targetDepartmentId, creatingDepartmentId, employeeId, status, priority, dateDimension, search, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleResetFilters = () => {
    setTargetDepartmentId('');
    setCreatingDepartmentId('');
    setEmployeeId('');
    setStatus('');
    setPriority('');
    setSearch('');
    setPeriod('this_month');
    setDateDimension('createdAt');
    setPage(1);
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const params = new URLSearchParams({
      type: 'internal_tickets',
      format,
      ...(targetDepartmentId ? { departmentId: targetDepartmentId } : {}),
      ...(employeeId ? { ownerId: employeeId } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { severity: priority } : {}),
    });
    window.open(`/api/reports/export-advanced?${params.toString()}`, '_blank');
  };

  const officerRows = buildTicketsOfficerRows(analytics?.officers, locale);
  const officerOptions: ReportFilterOption[] = (analytics?.officers || []).map((o) => ({
    id: o.employeeId,
    name: locale === 'ar' ? o.nameAr : o.nameEn,
  }));
  const recordItems = buildTicketsRecordItems(records.items);
  const kpiCards = buildTicketsKpiCards(analytics?.kpis, t);

  return (
    <div className="space-y-6 pb-12">
      <ReportHeader
        locale={locale}
        title={t.tickets.title}
        subtitle={t.tickets.subtitle}
        period={period}
        onPeriodChange={setPeriod}
        dateDimension={dateDimension}
        onDateDimensionChange={(d) => setDateDimension(d as any)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onExport={handleExport}
        onOpenSavedViews={() => setIsSavedViewsOpen(true)}
        onResetFilters={handleResetFilters}
      />

      <ReportFilters
        locale={locale}
        search={search}
        onSearchChange={setSearch}
        departmentId={targetDepartmentId}
        onDepartmentChange={(id) => {
          setTargetDepartmentId(id);
          setEmployeeId('');
          setPage(1);
        }}
        departments={initialDepartments}
        secondaryDepartmentId={creatingDepartmentId}
        onSecondaryDepartmentChange={(id) => {
          setCreatingDepartmentId(id);
          setPage(1);
        }}
        secondaryDepartmentLabel={locale === 'ar' ? 'القسم الطالب' : 'Requesting Dept'}
        officerId={employeeId}
        onOfficerChange={(id) => {
          setEmployeeId(id);
          setPage(1);
        }}
        officers={officerOptions}
        status={status}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        statuses={[
          { key: 'NEW', label: 'New' },
          { key: 'ASSIGNED', label: 'Assigned' },
          { key: 'IN_PROGRESS', label: 'In Progress' },
          { key: 'WAITING', label: 'Waiting / Pending' },
          { key: 'RESOLVED', label: 'Resolved' },
          { key: 'CLOSED', label: 'Closed' },
        ]}
        severityOrPriority={priority}
        onSeverityOrPriorityChange={(p) => {
          setPriority(p);
          setPage(1);
        }}
        severityOrPriorityOptions={[
          { key: 'URGENT', label: 'Urgent' },
          { key: 'HIGH', label: 'High' },
          { key: 'NORMAL', label: 'Normal' },
          { key: 'LOW', label: 'Low' },
        ]}
        onClearFilters={handleResetFilters}
      />

      <KpiOverviewCards
        locale={locale}
        cards={kpiCards}
        onCardClick={(id) => {
          if (id === 'overdue') setStatus('');
        }}
      />

      <VisualAnalytics
        locale={locale}
        timeline={analytics?.timeline || []}
        statusBreakdown={analytics?.statusBreakdown || []}
        waitingReasons={analytics?.waitingReasons || []}
        agingBuckets={analytics?.agingBuckets || []}
      />

      <OfficerPerformanceTable
        locale={locale}
        officers={officerRows}
        selectedOfficerId={employeeId}
        onSelectOfficer={(id) => {
          setEmployeeId(id);
          setPage(1);
        }}
        isTickets
      />

      <DetailedRecordsTable
        locale={locale}
        records={recordItems}
        total={records.total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onQuickInspect={setInspectRecord}
        isLoading={isLoading}
      />

      <QuickCaseDrawer
        locale={locale}
        record={inspectRecord}
        isOpen={Boolean(inspectRecord)}
        onClose={() => setInspectRecord(null)}
      />

      <SavedViewsModal
        locale={locale}
        isOpen={isSavedViewsOpen}
        onClose={() => setIsSavedViewsOpen(false)}
        storageKey="internal_tickets"
        currentConfig={{
          filters: { targetDepartmentId, creatingDepartmentId, employeeId, status, priority, search },
          period,
          dateDimension,
        }}
        onApplyView={(v) => {
          setTargetDepartmentId(v.filters.targetDepartmentId || '');
          setCreatingDepartmentId(v.filters.creatingDepartmentId || '');
          setEmployeeId(v.filters.employeeId || '');
          setStatus(v.filters.status || '');
          setPriority(v.filters.priority || '');
          setSearch(v.filters.search || '');
          setPeriod(v.period || 'this_month');
          setDateDimension((v.dateDimension as any) || 'createdAt');
          setPage(1);
        }}
      />
    </div>
  );
}
