import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import type { Locale } from '../../i18n/staff-shell';
import { reportDetailText } from '../../i18n/report-detail-workspace';
import { reportsAnalyticsI18n } from '../../i18n/staff-reports-analytics';
import { resolveDates, type EnterpriseReportCriteria } from './use-enterprise-report-data';

export function ReportActiveFilters({ locale, criteria, departments, branches, onClear }: {
  locale: Locale; criteria: EnterpriseReportCriteria; departments: { id: string; name: string }[];
  branches: { id: string; name: string }[]; onClear: () => void;
}) {
  const copy = reportDetailText[locale];
  const text = reportsAnalyticsI18n[locale];
  const dates = resolveDates(criteria);
  const status = criteria.status;
  const semantic: Record<string, string> = { open: copy.open, overdue: copy.overdue, unassigned: text.kpis.unassigned, resolved: copy.resolved };
  const statusLabel = status ? semantic[status.toLowerCase()] ?? text.statusBoard.statuses[status.toUpperCase() as keyof typeof text.statusBoard.statuses] ?? status : '';
  return <section aria-label={copy.scope} className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
    <span className="text-xs font-semibold">{copy.scope}</span>
    <Badge variant="secondary">{criteria.recordType === 'all' ? copy.all : criteria.recordType === 'tickets' ? copy.tickets : copy.complaints}</Badge>
    {criteria.departmentId && <Badge variant="outline">{copy.receiving} · {departments.find(item => item.id === criteria.departmentId)?.name ?? criteria.departmentId}</Badge>}
    {criteria.branchId && <Badge variant="outline">{copy.branch} · {branches.find(item => item.id === criteria.branchId)?.name ?? criteria.branchId}</Badge>}
    {status && <Badge variant="outline">{copy.status} · {statusLabel}</Badge>}
    <Badge variant="outline">{copy.period} · {dates.from || dates.to ? `${dates.from ?? '…'} – ${dates.to ?? '…'}` : copy.allTime}</Badge>
    {criteria.search && <Badge variant="outline">{copy.search} · {criteria.search}</Badge>}
    <Button variant="ghost" size="sm" className="ms-auto" onClick={onClear}>{copy.clear}</Button>
  </section>;
}
