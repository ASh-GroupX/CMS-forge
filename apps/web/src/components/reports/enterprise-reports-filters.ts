import type {
  ComplaintRecordRow,
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
  filteredComplaints: ComplaintRecordRow[],
  filteredTickets: TicketRecordRow[],
  ticketsAnalytics: TicketsAnalyticsResponse | null,
): EnterpriseKpiData {
  const totalCreated = filteredComplaints.length + filteredTickets.length;
  const openWorkload =
    filteredComplaints.filter((c) => !['RESOLVED', 'CLOSED'].includes(c.status)).length +
    filteredTickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length;
  const resolved =
    filteredComplaints.filter((c) => ['RESOLVED', 'CLOSED'].includes(c.status)).length +
    filteredTickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length;
  const overdue = filteredComplaints.filter((c) => c.isOverdue).length + filteredTickets.filter((t) => t.isOverdue).length;
  const waiting = filteredTickets.filter((t) => t.status === 'WAITING').length;
  const inProgress =
    filteredComplaints.filter((c) => c.status === 'IN_PROGRESS').length +
    filteredTickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const unassigned = filteredTickets.filter(
    (t) => !t.assignedEmployeeName || t.assignedEmployeeName === 'Unassigned' || t.assignedEmployeeName === '—',
  ).length;

  const resTickets = filteredTickets.filter((t) => t.resolvedAt);
  const onTimeTickets = resTickets.filter((t) => t.dueAt && new Date(t.resolvedAt!) <= new Date(t.dueAt));
  const onTimeRate = resTickets.length > 0 ? Math.round((onTimeTickets.length / resTickets.length) * 100) : (ticketsAnalytics?.kpis.onTimeSlaRate ?? 100);

  let avgTatDays = ticketsAnalytics?.kpis.avgResolutionDays ?? 0;
  if (resTickets.length > 0) {
    const sum = resTickets.reduce((acc, t) => acc + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / 86400000, 0);
    avgTatDays = Math.round((sum / resTickets.length) * 10) / 10;
  }

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
    totalCreatedDelta: ticketsAnalytics?.kpis.deltas.totalCreated ?? 0,
    resolvedDelta: ticketsAnalytics?.kpis.deltas.resolved ?? 0,
  };
}
