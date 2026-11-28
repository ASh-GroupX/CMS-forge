'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchComplaintsAnalytics,
  fetchTicketsAnalytics,
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


export function useEnterpriseReportData(criteria: EnterpriseReportCriteria, initial: InitialData) {
  const [reload, setReload] = useState(0);
  const [departments, setDepartments] = useState(initial.departments);
  const [complaintsAnalytics, setComplaintsAnalytics] = useState(initial.complaintsAnalytics);
  const [complaintsTotal, setComplaintsTotal] = useState(initial.complaintsAnalytics?.kpis.totalCreated ?? 0);
  const [ticketsAnalytics, setTicketsAnalytics] = useState(initial.ticketsAnalytics);
  const [ticketsTotal, setTicketsTotal] = useState(initial.ticketsAnalytics?.kpis.totalCreated ?? 0);
  const [state, setState] = useState<'ready' | 'loading' | 'error'>('ready');

  const query = useMemo(() => buildReportQuery(criteria), [criteria]);
  const queryKey = JSON.stringify(query);


  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState('loading');
      try {
        const includeComplaints = criteria.recordType !== 'tickets';
        const includeTickets = criteria.recordType !== 'complaints';
        const [nextDepartments, nextComplaintAnalytics, nextTicketAnalytics] = await Promise.all([
          fetchDepartmentPerformance(query.department, undefined, undefined, { signal: controller.signal }),
          includeComplaints ? fetchComplaintsAnalytics(query.complaints, undefined, undefined, { signal: controller.signal }) : Promise.resolve(null),
          includeTickets ? fetchTicketsAnalytics(query.tickets, undefined, undefined, { signal: controller.signal }) : Promise.resolve(null),
        ]);
        if (controller.signal.aborted) return;
        if (!nextDepartments || (includeComplaints && !nextComplaintAnalytics)
          || (includeTickets && !nextTicketAnalytics)) throw new Error('Report loading failed');
        setDepartments(nextDepartments ?? []);
        setComplaintsAnalytics(nextComplaintAnalytics);
        setComplaintsTotal(nextComplaintAnalytics?.kpis.totalCreated ?? 0);
        setTicketsAnalytics(nextTicketAnalytics);
        setTicketsTotal(nextTicketAnalytics?.kpis.totalCreated ?? 0);
        setState('ready');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setState('error');
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [criteria.recordType, queryKey, reload]);

  return {
    retry: () => setReload(value => value + 1),
    state,
    departments,
    complaintsAnalytics,
    complaintsTotal,
    ticketsAnalytics,
    ticketsTotal,
  };
}

export function buildReportQuery(criteria: EnterpriseReportCriteria) {
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
    department: { branchId: criteria.branchId, departmentId: criteria.departmentId, dateFrom: dates.from, dateTo: dates.to, search: criteria.search.trim() || null, status: pseudoView ? null : normalizedStatus, view: pseudoView },
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
