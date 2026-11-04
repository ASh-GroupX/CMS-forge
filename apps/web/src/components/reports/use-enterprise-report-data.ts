'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchComplaintsAnalytics,
  fetchComplaintsRecords,
  fetchTicketsAnalytics,
  fetchTicketsRecords,
  type ComplaintRecordRow,
  type ComplaintsAnalyticsResponse,
  type TicketRecordRow,
  type TicketsAnalyticsResponse,
} from '../../lib/staff-reports-analytics-api';
import { fetchDepartmentPerformance, type DepartmentPerformanceRow } from '../../lib/staff-reports-departments-api';
import type { DatePresetFilter, RecordTypeFilter } from './unified-filter-bar';

export type EnterpriseReportCriteria = {
  recordType: RecordTypeFilter;
  departmentId: string | null;
  branchId: string | null;
  status: string | null;
  datePreset: DatePresetFilter;
  dateFrom: string;
  dateTo: string;
  search: string;
};

type InitialData = {
  departments: DepartmentPerformanceRow[];
  complaintsAnalytics: ComplaintsAnalyticsResponse | null;
  complaintsRecords: ComplaintRecordRow[];
  ticketsAnalytics: TicketsAnalyticsResponse | null;
  ticketsRecords: TicketRecordRow[];
};

const PAGE_SIZE = 25;

export function useEnterpriseReportData(criteria: EnterpriseReportCriteria, initial: InitialData) {
  const [page, setPage] = useState(1);
  const [departments, setDepartments] = useState(initial.departments);
  const [complaintsAnalytics, setComplaintsAnalytics] = useState(initial.complaintsAnalytics);
  const [complaintsRecords, setComplaintsRecords] = useState(initial.complaintsRecords);
  const [complaintsTotal, setComplaintsTotal] = useState(initial.complaintsRecords.length);
  const [ticketsAnalytics, setTicketsAnalytics] = useState(initial.ticketsAnalytics);
  const [ticketsRecords, setTicketsRecords] = useState(initial.ticketsRecords);
  const [ticketsTotal, setTicketsTotal] = useState(initial.ticketsRecords.length);
  const [state, setState] = useState<'ready' | 'loading' | 'error'>('ready');

  const query = useMemo(() => buildReportQuery(criteria), [criteria]);
  const queryKey = JSON.stringify(query);

  useEffect(() => setPage(1), [queryKey, criteria.recordType]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState('loading');
      const offset = (page - 1) * PAGE_SIZE;
      try {
        const includeComplaints = criteria.recordType !== 'tickets';
        const includeTickets = criteria.recordType !== 'complaints';
        const [nextDepartments, nextComplaintAnalytics, nextComplaintRecords, nextTicketAnalytics, nextTicketRecords] = await Promise.all([
          fetchDepartmentPerformance(query.department, undefined, undefined, { signal: controller.signal }),
          includeComplaints ? fetchComplaintsAnalytics(query.complaints, undefined, undefined, { signal: controller.signal }) : Promise.resolve(null),
          includeComplaints ? fetchComplaintsRecords(query.complaints, PAGE_SIZE, offset, undefined, undefined, { signal: controller.signal }) : Promise.resolve(null),
          includeTickets ? fetchTicketsAnalytics(query.tickets, undefined, undefined, { signal: controller.signal }) : Promise.resolve(null),
          includeTickets ? fetchTicketsRecords(query.tickets, PAGE_SIZE, offset, undefined, undefined, { signal: controller.signal }) : Promise.resolve(null),
        ]);
        if (controller.signal.aborted) return;
        setDepartments(nextDepartments ?? []);
        setComplaintsAnalytics(nextComplaintAnalytics);
        setComplaintsRecords(nextComplaintRecords?.items ?? []);
        setComplaintsTotal(nextComplaintRecords?.total ?? 0);
        setTicketsAnalytics(nextTicketAnalytics);
        setTicketsRecords(nextTicketRecords?.items ?? []);
        setTicketsTotal(nextTicketRecords?.total ?? 0);
        setState('ready');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setState('error');
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [criteria.recordType, page, queryKey]);

  return {
    page,
    pageSize: PAGE_SIZE,
    setPage,
    state,
    departments,
    complaintsAnalytics,
    complaintsRecords,
    complaintsTotal,
    ticketsAnalytics,
    ticketsRecords,
    ticketsTotal,
  };
}

function buildReportQuery(criteria: EnterpriseReportCriteria) {
  const dates = resolveDates(criteria);
  const normalizedStatus = criteria.status?.toUpperCase() ?? null;
  const pseudoView: 'active' | 'resolved' | 'overdue' | 'unassigned' | null = normalizedStatus === 'OPEN'
    ? 'active'
    : criteria.status === 'resolved'
      ? 'resolved'
      : normalizedStatus === 'OVERDUE' || normalizedStatus === 'UNASSIGNED'
        ? normalizedStatus === 'OVERDUE' ? 'overdue' : 'unassigned'
        : null;
  const complaintStatuses = new Set(['DRAFT', 'SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'REJECTED', 'COMPLETED']);
  const ticketStatuses = new Set(['PENDING_APPROVAL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'REJECTED']);
  const complaintView: typeof pseudoView | 'none' = pseudoView ?? (normalizedStatus && !complaintStatuses.has(normalizedStatus) ? 'none' : null);
  const ticketView: typeof pseudoView | 'none' = pseudoView ?? (normalizedStatus && !ticketStatuses.has(normalizedStatus) ? 'none' : null);
  const shared = { branchId: criteria.branchId, dateFrom: dates.from, dateTo: dates.to, search: criteria.search.trim() || null };
  return {
    complaints: {
      ...shared,
      departmentId: criteria.departmentId,
      status: !pseudoView && normalizedStatus && complaintStatuses.has(normalizedStatus) ? normalizedStatus : null,
      view: complaintView,
    },
    tickets: {
      ...shared,
      targetDepartmentId: criteria.departmentId,
      status: !pseudoView && normalizedStatus && ticketStatuses.has(normalizedStatus) ? normalizedStatus : null,
      view: ticketView,
    },
    department: { branchId: criteria.branchId, departmentId: criteria.departmentId, dateFrom: dates.from, dateTo: dates.to },
  };
}

export function resolveDates(criteria: Pick<EnterpriseReportCriteria, 'datePreset' | 'dateFrom' | 'dateTo'>) {
  if (criteria.datePreset === 'custom') return { from: criteria.dateFrom || null, to: criteria.dateTo || null };
  if (criteria.datePreset === 'all') return { from: null, to: null };
  const to = new Date();
  const from = new Date(to);
  if (criteria.datePreset === 'today') from.setHours(0, 0, 0, 0);
  if (criteria.datePreset === 'week') from.setDate(from.getDate() - 6);
  if (criteria.datePreset === 'month') from.setDate(from.getDate() - 29);
  return { from: isoDate(from), to: isoDate(to) };
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
