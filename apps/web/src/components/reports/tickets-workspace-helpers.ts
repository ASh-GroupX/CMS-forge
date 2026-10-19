import type { TicketsAnalyticsResponse, TicketRecordRow } from '../../lib/staff-reports-analytics-api';
import type { ReportKpiCardItem } from './kpi-overview-cards';
import type { OfficerRowItem } from './officer-performance-table';
import type { RecordTableItem } from './detailed-records-table';
import type { ReportsAnalyticsDictionary } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

export function buildTicketsKpiCards(
  kpis: TicketsAnalyticsResponse['kpis'] | undefined,
  t: ReportsAnalyticsDictionary,
): ReportKpiCardItem[] {
  if (!kpis) return [];
  return [
    {
      id: 'totalCreated',
      title: t.kpis.totalCreated,
      value: kpis.totalCreated,
      tooltip: t.kpis.totalCreatedTooltip,
      delta: kpis.deltas.totalCreated,
      icon: 'file',
    },
    {
      id: 'openWorkload',
      title: t.kpis.openWorkload,
      value: kpis.openWorkload,
      tooltip: t.kpis.openWorkloadTooltip,
      delta: kpis.deltas.openWorkload,
      deltaInverse: true,
      icon: 'clock',
    },
    {
      id: 'unassigned',
      title: t.kpis.unassigned,
      value: kpis.unassigned,
      tooltip: t.kpis.unassignedTooltip,
      deltaInverse: true,
      icon: 'hourglass',
    },
    {
      id: 'waiting',
      title: t.kpis.waiting,
      value: kpis.waiting,
      tooltip: t.kpis.waitingTooltip,
      deltaInverse: true,
      icon: 'flame',
    },
    {
      id: 'resolved',
      title: t.kpis.resolved,
      value: kpis.resolved,
      tooltip: t.kpis.resolvedTooltip,
      delta: kpis.deltas.resolved,
      icon: 'check',
    },
    {
      id: 'overdue',
      title: t.kpis.overdue,
      value: kpis.overdue,
      tooltip: t.kpis.overdueTooltip,
      deltaInverse: true,
      icon: 'warning',
    },
    {
      id: 'avgTat',
      title: t.kpis.avgResolutionDays,
      value: kpis.avgResolutionDays,
      unit: t.officerTable.days,
      tooltip: t.kpis.avgResolutionDaysTooltip,
      delta: kpis.deltas.avgResolutionDays,
      deltaInverse: true,
      icon: 'clock',
    },
    {
      id: 'onTimeRate',
      title: t.kpis.onTimeRate,
      value: `${kpis.onTimeSlaRate}%`,
      tooltip: t.kpis.onTimeRateTooltip,
      delta: kpis.deltas.onTimeSlaRate,
      icon: 'percent',
    },
    {
      id: 'avgRating',
      title: t.kpis.avgRating,
      value: `★ ${kpis.avgRating}`,
      tooltip: t.kpis.avgRatingTooltip,
      icon: 'star',
    },
  ];
}

export function buildTicketsOfficerRows(
  officers: TicketsAnalyticsResponse['officers'] | undefined,
  locale: Locale,
): OfficerRowItem[] {
  return (officers || []).map((o) => ({
    id: o.employeeId,
    name: locale === 'ar' ? o.nameAr : o.nameEn,
    role: o.role,
    activeWorkload: o.activeWorkload,
    newAssignments: o.newAssignments,
    resolved: o.resolved,
    closed: o.closed,
    overdue: o.overdue,
    complianceRate: o.onTimeRate,
    avgTat: o.avgResolutionDays,
    tatUnit: 'days',
    rating: o.avgRating,
    oldestActiveDays: o.oldestActiveDays,
  }));
}

export function buildTicketsRecordItems(items: TicketRecordRow[]): RecordTableItem[] {
  return items.map((r) => ({
    id: r.id,
    referenceNumber: r.referenceNumber,
    titleOrSubject: r.title,
    status: r.status,
    severityOrPriority: r.priority,
    customerOrRequester: `${r.requestedByName} (${r.creatingDepartmentName})`,
    ownerName: r.assignedEmployeeName,
    departmentName: r.targetDepartmentName,
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt,
    isOverdue: r.isOverdue,
    linkHref: `/internal-tickets/${r.id}`,
  }));
}
