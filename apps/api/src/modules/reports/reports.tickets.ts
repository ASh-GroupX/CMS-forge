import type { InternalTicketPriority, InternalTicketStatus, Prisma } from '@prisma/client';

export type TicketsAnalyticsFilter = {
  branchId?: string | null;
  targetDepartmentId?: string | null;
  creatingDepartmentId?: string | null;
  assignedEmployeeId?: string | null;
  categoryId?: string | null;
  priority?: InternalTicketPriority | null;
  status?: InternalTicketStatus | null;
  dateDimension?: 'createdAt' | 'dueAt' | 'resolvedAt' | 'closedAt' | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
};

export type TicketsKpiSummary = {
  totalCreated: number;
  openWorkload: number;
  unassigned: number;
  inProgress: number;
  waiting: number;
  resolved: number;
  closed: number;
  overdue: number;
  avgResolutionDays: number;
  onTimeSlaRate: number;
  avgRating: number;
  deltas: {
    totalCreated: number;
    openWorkload: number;
    resolved: number;
    closed: number;
    avgResolutionDays: number;
    onTimeSlaRate: number;
  };
};

export type TicketChartPoint = {
  date: string;
  labelEn: string;
  labelAr: string;
  created: number;
  resolved: number;
};

export type DeptToDeptFlow = {
  sourceDeptId: string;
  sourceDeptNameEn: string;
  sourceDeptNameAr: string;
  targetDeptId: string;
  targetDeptNameEn: string;
  targetDeptNameAr: string;
  ticketCount: number;
  unresolvedCount: number;
  avgResolutionDays: number;
};

export type OfficerTicketPerformance = {
  employeeId: string;
  nameEn: string;
  nameAr: string;
  departmentId: string | null;
  departmentNameEn: string | null;
  departmentNameAr: string | null;
  role: string;
  activeWorkload: number;
  newAssignments: number;
  resolved: number;
  closed: number;
  overdue: number;
  onTimeRate: number;
  avgResolutionDays: number;
  avgRating: number;
  oldestActiveDays: number;
};

export type TicketsAnalyticsResponse = {
  kpis: TicketsKpiSummary;
  timeline: TicketChartPoint[];
  statusBreakdown: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  priorityBreakdown: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  departmentBreakdown: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  waitingReasons: { key: string; nameEn: string; nameAr: string; count: number; percentage: number }[];
  deptToDeptFlow: DeptToDeptFlow[];
  agingBuckets: { bucket: '<24h' | '1-3d' | '4-7d' | '>7d'; labelEn: string; labelAr: string; count: number }[];
  officers: OfficerTicketPerformance[];
};

export function buildTicketWhere(filter: TicketsAnalyticsFilter, dateOverride?: { from: Date; to: Date }): Prisma.InternalTicketWhereInput {
  const dimension = filter.dateDimension ?? 'createdAt';
  const where: Prisma.InternalTicketWhereInput = {};

  if (filter.targetDepartmentId) where.targetDepartmentId = filter.targetDepartmentId;
  if (filter.creatingDepartmentId) where.requestedBy = { departmentId: filter.creatingDepartmentId };
  if (filter.assignedEmployeeId) where.assignedEmployeeId = filter.assignedEmployeeId;
  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.priority) where.priority = filter.priority;
  if (filter.status) where.status = filter.status;

  if (filter.branchId) {
    where.OR = [
      { targetDepartment: { branchId: filter.branchId } },
      { requestedBy: { branchId: filter.branchId } },
    ];
  }

  if (dateOverride) {
    where[dimension] = { gte: dateOverride.from, lte: dateOverride.to };
  } else if (filter.dateFrom || filter.dateTo) {
    const parseFrom = (val: string) => (val.length === 10 ? new Date(`${val}T00:00:00.000Z`) : new Date(val));
    const parseTo = (val: string) => (val.length === 10 ? new Date(`${val}T23:59:59.999Z`) : new Date(val));
    const from = filter.dateFrom ? parseFrom(filter.dateFrom) : undefined;
    const to = filter.dateTo ? parseTo(filter.dateTo) : undefined;
    if (from || to) {
      where[dimension] = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }
  }

  if (filter.search?.trim()) {
    const q = filter.search.trim();
    where.AND = [
      {
        OR: [
          { referenceNumber: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { requestedBy: { nameEn: { contains: q, mode: 'insensitive' } } },
          { requestedBy: { nameAr: { contains: q, mode: 'insensitive' } } },
          { assignedEmployee: { nameEn: { contains: q, mode: 'insensitive' } } },
          { assignedEmployee: { nameAr: { contains: q, mode: 'insensitive' } } },
        ],
      },
    ];
  }

  return where;
}
