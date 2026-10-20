import type { ComplaintSeverity, ComplaintStatus, Prisma } from '@prisma/client';

export type ComplaintsAnalyticsFilter = {
  branchId?: string | null;
  departmentId?: string | null;
  ownerId?: string | null;
  categoryId?: string | null;
  type?: string | null;
  severity?: ComplaintSeverity | null;
  status?: ComplaintStatus | null;
  dateDimension?: 'createdAt' | 'firstResponseAt' | 'resolvedAt' | 'closedAt' | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
};

export type ComplaintsKpiSummary = {
  totalCreated: number;
  openWorkload: number;
  unassigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  overdue: number;
  atRisk: number;
  avgResolutionHours: number;
  slaComplianceRate: number;
  deltas: {
    totalCreated: number;
    openWorkload: number;
    resolved: number;
    closed: number;
    avgResolutionHours: number;
    slaComplianceRate: number;
  };
};

export type ComplaintChartPoint = {
  date: string;
  labelEn: string;
  labelAr: string;
  created: number;
  resolved: number;
};

export type NameCount = {
  key: string;
  nameEn: string;
  nameAr: string;
  count: number;
  percentage: number;
};

export type AgingBucket = {
  bucket: '<24h' | '1-3d' | '4-7d' | '>7d';
  labelEn: string;
  labelAr: string;
  count: number;
};

export type OfficerComplaintPerformance = {
  officerId: string;
  nameEn: string;
  nameAr: string;
  role: string;
  activeWorkload: number;
  newAssignments: number;
  resolved: number;
  closed: number;
  overdue: number;
  slaComplianceRate: number;
  avgResolutionHours: number;
  oldestActiveDays: number;
};

export type ComplaintsAnalyticsResponse = {
  kpis: ComplaintsKpiSummary;
  timeline: ComplaintChartPoint[];
  statusBreakdown: NameCount[];
  categoryBreakdown: NameCount[];
  severityBreakdown: NameCount[];
  agingBuckets: AgingBucket[];
  officers: OfficerComplaintPerformance[];
};

export function parseDateRange(dateFromStr?: string | null, dateToStr?: string | null) {
  const now = new Date();
  const dateTo = dateToStr
    ? dateToStr.length === 10
      ? new Date(`${dateToStr}T23:59:59.999Z`)
      : new Date(dateToStr)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const dateFrom = dateFromStr
    ? dateFromStr.length === 10
      ? new Date(`${dateFromStr}T00:00:00.000Z`)
      : new Date(dateFromStr)
    : new Date(dateTo.getTime() - 29 * 24 * 60 * 60 * 1000);
  if (!dateFromStr) dateFrom.setHours(0, 0, 0, 0);

  const durationMs = Math.max(24 * 60 * 60 * 1000, dateTo.getTime() - dateFrom.getTime());
  const prevDateTo = new Date(dateFrom.getTime() - 1);
  const prevDateFrom = new Date(prevDateTo.getTime() - durationMs);

  return { dateFrom, dateTo, prevDateFrom, prevDateTo };
}

export function buildComplaintWhere(filter: ComplaintsAnalyticsFilter, dateOverride?: { from: Date; to: Date }): Prisma.ComplaintWhereInput {
  const dimension = filter.dateDimension ?? 'createdAt';
  const where: Prisma.ComplaintWhereInput = {};

  if (filter.branchId) where.branchId = filter.branchId;
  if (filter.departmentId) where.departmentId = filter.departmentId;
  if (filter.ownerId) where.ownerId = filter.ownerId;
  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.type) where.type = filter.type as any;
  if (filter.severity) where.severity = filter.severity;
  if (filter.status) where.status = filter.status;

  if (dateOverride) {
    where[dimension] = { gte: dateOverride.from, lte: dateOverride.to };
  } else if (filter.dateFrom || filter.dateTo) {
    const { dateFrom, dateTo } = parseDateRange(filter.dateFrom, filter.dateTo);
    where[dimension] = { gte: dateFrom, lte: dateTo };
  }

  if (filter.search?.trim()) {
    const q = filter.search.trim();
    where.OR = [
      { referenceNumber: { contains: q, mode: 'insensitive' } },
      { subject: { contains: q, mode: 'insensitive' } },
      { customer: { nameEn: { contains: q, mode: 'insensitive' } } },
      { customer: { nameAr: { contains: q, mode: 'insensitive' } } },
      { owner: { nameEn: { contains: q, mode: 'insensitive' } } },
      { owner: { nameAr: { contains: q, mode: 'insensitive' } } },
    ];
  }

  return where;
}

export function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
