import type {
  ComplaintRecordRow,
  ComplaintsAnalyticsResponse,
  TicketRecordRow,
  TicketsAnalyticsResponse,
} from '../../lib/staff-reports-analytics-api';
import type { RecordTypeFilter, DatePresetFilter } from './unified-filter-bar';
import type { EnterpriseKpiData } from './enterprise-kpi-grid';

export interface FilterOptions {
  recordType: RecordTypeFilter;
  selectedDeptId: string | null;
  selectedStatus: string | null;
  datePreset: DatePresetFilter;
  dateFrom: string;
  dateTo: string;
  search: string;
  departments: { id: string; name: string; nameEn?: string; nameAr?: string }[];
}

export function isDateInRange(
  dateStr: string,
  datePreset: DatePresetFilter,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (!datePreset || datePreset === 'all') return true;
  const d = new Date(dateStr).getTime();
  const now = Date.now();
  if (datePreset === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return d >= start.getTime();
  }
  if (datePreset === 'week') return d >= now - 7 * 86400000;
  if (datePreset === 'month') return d >= now - 30 * 86400000;
  if (datePreset === 'custom') {
    if (dateFrom && d < new Date(dateFrom).getTime()) return false;
    if (dateTo && d > new Date(dateTo).getTime()) return false;
  }
  return true;
}

export function filterComplaintsList(
  complaints: ComplaintRecordRow[],
  opts: FilterOptions,
): ComplaintRecordRow[] {
  if (opts.recordType === 'tickets') return [];
  const { selectedDeptId, selectedStatus, datePreset, dateFrom, dateTo, search, departments } = opts;

  return complaints.filter((c) => {
    if (selectedDeptId) {
      const dept = departments.find((d) => d.id === selectedDeptId);
      const matchesId = c.departmentId && c.departmentId === selectedDeptId;
      const matchesName = dept && (c.departmentName === dept.name || c.departmentName === dept.nameEn || c.departmentName === dept.nameAr);
      if (!matchesId && !matchesName) return false;
    }
    if (selectedStatus) {
      if (selectedStatus === 'open') {
        if (['RESOLVED', 'CLOSED'].includes(c.status)) return false;
      } else if (selectedStatus === 'resolved') {
        if (!['RESOLVED', 'CLOSED'].includes(c.status)) return false;
      } else if (selectedStatus === 'overdue') {
        if (!c.isOverdue) return false;
      } else if (c.status !== selectedStatus) return false;
    }
    if (!isDateInRange(c.createdAt, datePreset, dateFrom, dateTo)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.referenceNumber.toLowerCase().includes(q) && !c.subject.toLowerCase().includes(q) && !c.departmentName.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });
}

export function filterTicketsList(
  tickets: TicketRecordRow[],
  opts: FilterOptions,
): TicketRecordRow[] {
  if (opts.recordType === 'complaints') return [];
  const { selectedDeptId, selectedStatus, datePreset, dateFrom, dateTo, search, departments } = opts;

  return tickets.filter((tk) => {
    if (selectedDeptId) {
      const dept = departments.find((d) => d.id === selectedDeptId);
      const matchesId =
        (tk.targetDepartmentId && tk.targetDepartmentId === selectedDeptId) ||
        (tk.creatingDepartmentId && tk.creatingDepartmentId === selectedDeptId);
      const matchesName = dept && (
        tk.targetDepartmentName === dept.name || tk.targetDepartmentName === dept.nameEn || tk.targetDepartmentName === dept.nameAr ||
        tk.creatingDepartmentName === dept.name || tk.creatingDepartmentName === dept.nameEn || tk.creatingDepartmentName === dept.nameAr
      );
      if (!matchesId && !matchesName) return false;
    }
    if (selectedStatus) {
      if (selectedStatus === 'open') {
        if (['RESOLVED', 'CLOSED'].includes(tk.status)) return false;
      } else if (selectedStatus === 'resolved') {
        if (!['RESOLVED', 'CLOSED'].includes(tk.status)) return false;
      } else if (selectedStatus === 'overdue') {
        if (!tk.isOverdue) return false;
      } else if (selectedStatus === 'waiting') {
        if (tk.status !== 'WAITING') return false;
      } else if (selectedStatus === 'unassigned') {
        if (tk.assignedEmployeeName && tk.assignedEmployeeName !== 'Unassigned' && tk.assignedEmployeeName !== '—') return false;
      } else if (tk.status !== selectedStatus) return false;
    }
    if (!isDateInRange(tk.createdAt, datePreset, dateFrom, dateTo)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!tk.referenceNumber.toLowerCase().includes(q) && !tk.title.toLowerCase().includes(q) && !tk.targetDepartmentName.toLowerCase().includes(q) && !tk.creatingDepartmentName.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });
}

export function computeCombinedKpis(
  complaintsAnalytics: ComplaintsAnalyticsResponse | null,
  ticketsAnalytics: TicketsAnalyticsResponse | null,
  recordType: RecordTypeFilter,
): EnterpriseKpiData {
  const complaints = recordType === 'tickets' ? null : complaintsAnalytics?.kpis;
  const tickets = recordType === 'complaints' ? null : ticketsAnalytics?.kpis;
  const add = (complaintValue = 0, ticketValue = 0) => complaintValue + ticketValue;

  return {
    totalCreated: add(complaints?.totalCreated, tickets?.totalCreated),
    openWorkload: add(complaints?.openWorkload, tickets?.openWorkload),
    inProgress: add(complaints?.inProgress, tickets?.inProgress),
    waiting: tickets?.waiting ?? 0,
    resolved: add(complaints?.resolved, tickets?.resolved),
    overdue: add(complaints?.overdue, tickets?.overdue),
    unassigned: add(complaints?.unassigned, tickets?.unassigned),
    onTimeRate: tickets?.onTimeSlaRate ?? complaints?.slaComplianceRate ?? 100,
    avgTatDays: tickets?.avgResolutionDays ?? Math.round(((complaints?.avgResolutionHours ?? 0) / 24) * 10) / 10,
    totalCreatedDelta: tickets?.deltas.totalCreated ?? complaints?.deltas.totalCreated ?? 0,
    resolvedDelta: tickets?.deltas.resolved ?? complaints?.deltas.resolved ?? 0,
  };
}
