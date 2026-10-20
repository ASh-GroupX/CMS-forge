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
  fetchComplaintsAnalytics,
  fetchComplaintsRecords,
  type ComplaintsAnalyticsFilter,
  type ComplaintsAnalyticsResponse,
  type ComplaintRecordRow,
} from '../../lib/staff-reports-analytics-api';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';
import { complaintStatusLabel, severityLabel } from '../../i18n/domain-labels';
import {
  buildComplaintsKpiCards,
  buildComplaintsOfficerRows,
  buildComplaintsRecordItems,
} from './complaints-workspace-helpers';
import { periodToDateRange } from './report-date-helpers';

interface ComplaintsWorkspaceProps {
  locale: Locale;
  initialDepartments?: ReportFilterOption[];
  initialCategories?: ReportFilterOption[];
  initialOfficers?: ReportFilterOption[];
  initialAnalytics?: ComplaintsAnalyticsResponse | null;
  initialRecords?: { total: number; items: ComplaintRecordRow[] } | null;
}

const COMPLAINT_STATUS_KEYS = ['SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'COMPLETED', 'CLOSED', 'REOPENED', 'REJECTED'];
const SEVERITY_KEYS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function ComplaintsWorkspace({
  locale,
  initialDepartments = [],
  initialCategories = [],
  initialOfficers = [],
  initialAnalytics = null,
  initialRecords = null,
}: ComplaintsWorkspaceProps) {
  const t = reportsAnalyticsI18n[locale];

  // Filters State
  const [period, setPeriod] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [dateDimension, setDateDimension] = useState<'createdAt' | 'resolvedAt' | 'closedAt'>('createdAt');
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Analytics & Records Data
  const [analytics, setAnalytics] = useState<ComplaintsAnalyticsResponse | null>(initialAnalytics);
  const [records, setRecords] = useState<{ total: number; items: ComplaintRecordRow[] }>(
    initialRecords ?? { total: 0, items: [] },
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals & Drawers
  const [isSavedViewsOpen, setIsSavedViewsOpen] = useState(false);
  const [inspectRecord, setInspectRecord] = useState<RecordTableItem | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const { dateFrom: computedFrom, dateTo: computedTo } = periodToDateRange(period, customFrom, customTo);
    const filter: ComplaintsAnalyticsFilter = {
      departmentId: departmentId || null,
      ownerId: officerId || null,
      status: status || null,
      severity: severity || null,
      categoryId: categoryId || null,
      dateDimension,
      dateFrom: computedFrom,
      dateTo: computedTo,
      search: search || null,
    };

    const [analyticsRes, recordsRes] = await Promise.all([
      fetchComplaintsAnalytics(filter),
      fetchComplaintsRecords(filter, pageSize, (page - 1) * pageSize),
    ]);

    if (analyticsRes) setAnalytics(analyticsRes);
    if (recordsRes) setRecords(recordsRes);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [departmentId, officerId, status, severity, categoryId, dateDimension, period, customFrom, customTo, search, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleResetFilters = () => {
    setDepartmentId('');
    setOfficerId('');
    setStatus('');
    setSeverity('');
    setCategoryId('');
    setSearch('');
    setPeriod('all');
    setCustomFrom('');
    setCustomTo('');
    setDateDimension('createdAt');
    setPage(1);
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const { dateFrom: computedFrom, dateTo: computedTo } = periodToDateRange(period, customFrom, customTo);
    const params = new URLSearchParams({
      type: 'complaints',
      reportType: 'complaints',
      format,
      ...(departmentId ? { departmentId } : {}),
      ...(officerId ? { ownerId: officerId } : {}),
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(search ? { search } : {}),
      ...(computedFrom ? { dateFrom: computedFrom } : {}),
      ...(computedTo ? { dateTo: computedTo } : {}),
    });
    const link = document.createElement('a');
    link.href = `/api/reports/export-advanced?${params.toString()}`;
    link.download = `complaints-report-${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const officerRows = buildComplaintsOfficerRows(analytics?.officers, locale);
  const officerOptions: ReportFilterOption[] =
    analytics?.officers && analytics.officers.length > 0
      ? analytics.officers.map((o) => ({
          id: o.officerId,
          name: locale === 'ar' ? o.nameAr : o.nameEn,
        }))
      : initialOfficers;
  const recordItems = buildComplaintsRecordItems(records.items);
  const kpiCards = buildComplaintsKpiCards(analytics?.kpis, t);

  return (
    <div className="space-y-6 pb-12">
      <ReportHeader
        locale={locale}
        title={t.complaints.title}
        subtitle={t.complaints.subtitle}
        period={period}
        onPeriodChange={setPeriod}
        customFrom={customFrom}
        onCustomFromChange={setCustomFrom}
        customTo={customTo}
        onCustomToChange={setCustomTo}
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
        departmentId={departmentId}
        onDepartmentChange={(id) => {
          setDepartmentId(id);
          setOfficerId('');
          setPage(1);
        }}
        departments={initialDepartments}
        officerId={officerId}
        onOfficerChange={(id) => {
          setOfficerId(id);
          setPage(1);
        }}
        officers={officerOptions}
        status={status}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        statuses={COMPLAINT_STATUS_KEYS.map((k) => ({ key: k, label: complaintStatusLabel(locale, k) }))}
        severityOrPriority={severity}
        onSeverityOrPriorityChange={(sev) => {
          setSeverity(sev);
          setPage(1);
        }}
        severityOrPriorityOptions={SEVERITY_KEYS.map((k) => ({ key: k, label: severityLabel(locale, k) }))}
        categoryId={categoryId}
        onCategoryChange={(c) => {
          setCategoryId(c);
          setPage(1);
        }}
        categories={initialCategories}
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
        categoryBreakdown={analytics?.categoryBreakdown || []}
        agingBuckets={analytics?.agingBuckets || []}
      />

      <OfficerPerformanceTable
        locale={locale}
        officers={officerRows}
        selectedOfficerId={officerId}
        onSelectOfficer={(id) => {
          setOfficerId(id);
          setPage(1);
        }}
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
        storageKey="complaints"
        currentConfig={{
          filters: { departmentId, officerId, status, severity, categoryId, search },
          period,
          dateDimension,
        }}
        onApplyView={(v) => {
          setDepartmentId(v.filters.departmentId || '');
          setOfficerId(v.filters.officerId || '');
          setStatus(v.filters.status || '');
          setSeverity(v.filters.severity || '');
          setCategoryId(v.filters.categoryId || '');
          setSearch(v.filters.search || '');
          setPeriod(v.period || 'this_month');
          setDateDimension((v.dateDimension as any) || 'createdAt');
          setPage(1);
        }}
      />
    </div>
  );
}
