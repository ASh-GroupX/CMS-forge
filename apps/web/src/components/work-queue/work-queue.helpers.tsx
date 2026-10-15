import React from 'react';
import { StatusBadge as SharedStatusBadge, type PrimitiveTone } from '../shared/ui-primitives';
import { complaintStatusLabel, severityLabel, slaStateLabel } from '../../i18n/domain-labels';
import { staffShellText, type Locale } from '../../i18n/staff-shell';
import { modernUiText } from '../../i18n/staff-modern-ui';
import { formatDisplayDate, formatDisplayNumber } from '../../lib/locale-format';
import type { ComplaintFormOptions } from '../../lib/staff-complaint-form-options-api';
import type { ComplaintQueueItem, ComplaintSeverity, ComplaintStatus } from '../../lib/staff-complaints-api';
import type { StaffQueueQuery } from '../../lib/staff-queue-api';

export type FilterOption = { label: string; value: string };
export const STATUS_OPTIONS: ComplaintStatus[] = ['DRAFT', 'SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'COMPLETED', 'CLOSED', 'REOPENED', 'REJECTED'];
export const SEVERITY_OPTIONS: ComplaintSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export function filterOptions(
  rows: ComplaintQueueItem[],
  t: typeof staffShellText[Locale]['workQueue'],
  query: StaffQueueQuery,
  options: ComplaintFormOptions | null | undefined,
  locale: Locale,
): Record<'status' | 'branch' | 'department' | 'severity' | 'sla', FilterOption[]> {
  const branches = new Map<string, string>();
  for (const branch of options?.branches ?? []) branches.set(branch.id, locale === 'ar' ? branch.nameAr : branch.nameEn);
  for (const row of rows) if (!branches.has(row.branchId)) branches.set(row.branchId, row.branchName ?? row.branchId);
  if (query.branchId && !branches.has(query.branchId)) branches.set(query.branchId, query.branchId);

  const departments = new Map<string, string>();
  for (const dept of options?.departments ?? []) departments.set(dept.id, locale === 'ar' ? dept.nameAr : dept.nameEn);
  for (const row of rows) {
    if (row.assignedDepartmentId && !departments.has(row.assignedDepartmentId)) {
      departments.set(row.assignedDepartmentId, (locale === 'ar' ? row.assignedDepartmentNameAr : row.assignedDepartmentName) ?? row.assignedDepartmentId);
    }
  }
  if (query.departmentId && !departments.has(query.departmentId)) departments.set(query.departmentId, query.departmentId);

  return {
    status: STATUS_OPTIONS.map((status) => ({ label: complaintStatusLabel(locale, status), value: status })),
    branch: [...branches].map(([value, label]) => ({ label, value })),
    department: [...departments].map(([value, label]) => ({ label, value })),
    severity: SEVERITY_OPTIONS.map((severity) => ({ label: severityLabel(locale, severity), value: severity })),
    sla: ['ON_TRACK', 'WARNING', 'BREACHED', 'CLOSED'].map((value) => ({ label: slaStateLabel(locale, value), value })),
  };
}

export function filterValue(key: 'branch' | 'department' | 'severity' | 'sla' | 'status', query: StaffQueueQuery): string {
  if (key === 'branch') return query.branchId ?? 'all';
  if (key === 'department') return query.departmentId ?? 'all';
  if (key === 'severity') return query.severity ?? 'all';
  if (key === 'status') return query.status ?? 'all';
  return query.sla ?? 'all';
}

export function pageHref(locale: Locale, query: StaffQueueQuery, page: number): string {
  const params = new URLSearchParams({ locale, page: String(page) });
  append(params, 'branchId', query.branchId);
  append(params, 'departmentId', query.departmentId);
  append(params, 'direction', query.direction);
  append(params, 'search', query.search);
  append(params, 'severity', query.severity);
  append(params, 'sla', query.sla);
  append(params, 'status', query.status);
  append(params, 'ownerScope', query.ownerScope);
  return `/complaints?${params.toString()}`;
}

export function quickFilterHref(locale: Locale, key: 'ownerScope' | 'sla' | 'direction', value: string, currentQuery?: StaffQueueQuery): string {
  const params = new URLSearchParams({ locale });
  if (currentQuery?.[key as keyof StaffQueueQuery] !== value) {
    params.set(key, value);
  }
  return `/complaints?${params.toString()}`;
}

export function activeFilterLabels(
  query: StaffQueueQuery,
  filters: Record<'status' | 'branch' | 'department' | 'severity' | 'sla', FilterOption[]>,
  quick: typeof modernUiText[Locale]['queue'],
  locale: Locale,
): string[] {
  const labels = [
    query.direction === 'RECEIVED' ? (locale === 'ar' ? 'الواردة' : 'Received') : query.direction === 'SENT' ? (locale === 'ar' ? 'الصادرة' : 'Sent') : null,
    query.ownerScope === 'ME' ? quick.mine : query.ownerScope === 'UNASSIGNED' ? quick.unassigned : null,
    query.status ? filters.status.find((item) => item.value === query.status)?.label : null,
    query.branchId ? filters.branch.find((item) => item.value === query.branchId)?.label : null,
    query.departmentId ? filters.department.find((item) => item.value === query.departmentId)?.label : null,
    query.severity ? filters.severity.find((item) => item.value === query.severity)?.label : null,
    query.sla ? filters.sla.find((item) => item.value === query.sla)?.label : null,
    query.search,
  ];
  return labels.filter((value): value is string => Boolean(value));
}

export function caseHref(locale: Locale, id: string): string {
  const params = new URLSearchParams({ locale });
  return `/complaints/${encodeURIComponent(id)}?${params.toString()}`;
}

export function formatDate(value: string, locale: Locale): string {
  return formatDisplayDate(value, locale);
}

export function formatAge(value: string, locale: Locale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(days) + (locale === 'ar' ? ' يوم' : 'd');
}

export function append(params: URLSearchParams, key: string, value: string | null | undefined): void {
  if (value?.trim()) params.set(key, value.trim());
}

export const STATUS_TONE: Partial<Record<ComplaintStatus, PrimitiveTone>> = {
  SUBMITTED: 'info',
  IN_PROGRESS: 'brand',
  MANAGER_REVIEW: 'warning',
  BRANCH_REVIEW: 'warning',
  REOPENED: 'info',
  RESOLVED: 'success',
  COMPLETED: 'brand',
  CLOSED: 'neutral',
  REJECTED: 'danger',
};

export const SEVERITY_TONE: Record<ComplaintSeverity, PrimitiveTone> = {
  CRITICAL: 'danger',
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'neutral',
};

export function StatusBadge({ locale, status }: { locale: Locale; status: ComplaintStatus }) {
  return <SharedStatusBadge tone={STATUS_TONE[status] ?? 'neutral'}>{complaintStatusLabel(locale, status)}</SharedStatusBadge>;
}

export function SeverityBadge({ locale, severity }: { locale: Locale; severity: ComplaintSeverity }) {
  return <SharedStatusBadge tone={SEVERITY_TONE[severity]}>{severityLabel(locale, severity)}</SharedStatusBadge>;
}

export function SlaBadge({ locale, row }: { locale: Locale; row: ComplaintQueueItem }) {
  const detail = row.slaPercentElapsed === null || row.slaPercentElapsed === undefined ? '' : ` ${formatDisplayNumber(row.slaPercentElapsed, locale)}%`;
  return <SharedStatusBadge tone={SLA_TONE[row.slaState]}>{slaStateLabel(locale, row.slaState)}{detail}</SharedStatusBadge>;
}

export const SLA_TONE: Record<ComplaintQueueItem['slaState'], PrimitiveTone> = {
  ON_TRACK: 'success',
  WARNING: 'warning',
  BREACHED: 'danger',
  CLOSED: 'neutral',
};
