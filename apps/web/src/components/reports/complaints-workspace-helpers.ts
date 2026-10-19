import type { ComplaintsAnalyticsResponse, ComplaintRecordRow } from '../../lib/staff-reports-analytics-api';
import type { ReportKpiCardItem } from './kpi-overview-cards';
import type { OfficerRowItem } from './officer-performance-table';
import type { RecordTableItem } from './detailed-records-table';
import type { ReportsAnalyticsDictionary } from '../../i18n/staff-reports-analytics';
import type { Locale } from '../../i18n/staff-shell';

export function buildComplaintsKpiCards(
  kpis: ComplaintsAnalyticsResponse['kpis'] | undefined,
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
      id: 'inProgress',
      title: t.kpis.inProgress,
      value: kpis.inProgress,
      tooltip: t.kpis.inProgressTooltip,
      icon: 'user',
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
      id: 'atRisk',
      title: t.kpis.atRisk,
      value: kpis.atRisk,
      tooltip: t.kpis.atRiskTooltip,
      deltaInverse: true,
      icon: 'flame',
    },
    {
      id: 'avgTat',
      title: t.kpis.avgResolutionHours,
      value: kpis.avgResolutionHours,
      unit: t.officerTable.hours,
      tooltip: t.kpis.avgResolutionHoursTooltip,
      delta: kpis.deltas.avgResolutionHours,
      deltaInverse: true,
      icon: 'clock',
    },
    {
      id: 'slaCompliance',
      title: t.kpis.slaComplianceRate,
      value: `${kpis.slaComplianceRate}%`,
      tooltip: t.kpis.slaComplianceRateTooltip,
      delta: kpis.deltas.slaComplianceRate,
      icon: 'percent',
    },
  ];
}

export function buildComplaintsOfficerRows(
  officers: ComplaintsAnalyticsResponse['officers'] | undefined,
  locale: Locale,
): OfficerRowItem[] {
  return (officers || []).map((o) => ({
    id: o.officerId,
    name: locale === 'ar' ? o.nameAr : o.nameEn,
    role: o.role,
    activeWorkload: o.activeWorkload,
    newAssignments: o.newAssignments,
    resolved: o.resolved,
    closed: o.closed,
    overdue: o.overdue,
    complianceRate: o.slaComplianceRate,
    avgTat: o.avgResolutionHours,
    tatUnit: 'hours',
    oldestActiveDays: o.oldestActiveDays,
  }));
}

export function buildComplaintsRecordItems(items: ComplaintRecordRow[]): RecordTableItem[] {
  return items.map((r) => ({
    id: r.id,
    referenceNumber: r.referenceNumber,
    titleOrSubject: r.subject,
    status: r.status,
    severityOrPriority: r.severity,
    customerOrRequester: r.customerName,
    ownerName: r.ownerName,
    departmentName: r.departmentName,
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt,
    isOverdue: r.isOverdue,
    linkHref: `/complaints/${r.id}`,
  }));
}
