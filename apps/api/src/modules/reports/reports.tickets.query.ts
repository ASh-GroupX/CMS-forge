import { InternalTicketStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import {
  buildTicketWhere,
  type DeptToDeptFlow,
  type OfficerTicketPerformance,
  type TicketChartPoint,
  type TicketsAnalyticsFilter,
} from './reports.tickets.js';

export const TERMINAL_TICKET_STATUSES: InternalTicketStatus[] = [
  InternalTicketStatus.RESOLVED,
  InternalTicketStatus.CLOSED,
  InternalTicketStatus.REJECTED,
];

export function buildTicketTimeline(
  dateFrom: Date,
  dateTo: Date,
  resolvedRows: { resolvedAt: Date | null }[],
  createdRows: { createdAt: Date }[] = [],
): TicketChartPoint[] {
  const points: TicketChartPoint[] = [];
  const diffDays = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  const step = diffDays > 60 ? 7 : diffDays > 14 ? 2 : 1;

  for (let t = dateFrom.getTime(); t <= dateTo.getTime(); t += step * 24 * 60 * 60 * 1000) {
    const d = new Date(t);
    const dayEnd = new Date(t + step * 24 * 60 * 60 * 1000 - 1);
    const dateStr = d.toISOString().split('T')[0]!;
    const countResolved = resolvedRows.filter((r) => r.resolvedAt && r.resolvedAt.getTime() >= t && r.resolvedAt.getTime() <= dayEnd.getTime()).length;
    const countCreated = createdRows.filter((r) => r.createdAt && r.createdAt.getTime() >= t && r.createdAt.getTime() <= dayEnd.getTime()).length;

    points.push({
      date: dateStr,
      labelEn: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      labelAr: d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
      created: countCreated,
      resolved: countResolved,
    });
  }
  return points;
}

export async function fetchTicketsDeptToDeptFlow(prisma: PrismaService, filter: TicketsAnalyticsFilter): Promise<DeptToDeptFlow[]> {
  const tickets = await prisma.internalTicket.findMany({
    where: filter.branchId ? { targetDepartment: { branchId: filter.branchId } } : {},
    take: 200,
    select: {
      id: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      targetDepartment: { select: { id: true, nameEn: true, nameAr: true } },
      requestedBy: { select: { department: { select: { id: true, nameEn: true, nameAr: true } } } },
    },
  });

  const flowMap = new Map<string, DeptToDeptFlow>();
  for (const t of tickets) {
    const src = t.requestedBy?.department;
    const tgt = t.targetDepartment;
    if (!src || !tgt) continue;
    const key = `${src.id}->${tgt.id}`;
    const existing = flowMap.get(key) ?? {
      sourceDeptId: src.id,
      sourceDeptNameEn: src.nameEn,
      sourceDeptNameAr: src.nameAr,
      targetDeptId: tgt.id,
      targetDeptNameEn: tgt.nameEn,
      targetDeptNameAr: tgt.nameAr,
      ticketCount: 0,
      unresolvedCount: 0,
      avgResolutionDays: 0,
    };
    existing.ticketCount++;
    if (!TERMINAL_TICKET_STATUSES.includes(t.status as InternalTicketStatus)) existing.unresolvedCount++;
    flowMap.set(key, existing);
  }
  return Array.from(flowMap.values()).slice(0, 10);
}

export async function fetchTicketsOfficersPerformance(
  prisma: PrismaService,
  filter: TicketsAnalyticsFilter,
  dateFrom: Date,
  dateTo: Date,
  hasExplicitDate = true,
): Promise<OfficerTicketPerformance[]> {
  const deptId = filter.targetDepartmentId;
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(deptId ? { departmentId: deptId } : {}),
      ...(filter.branchId ? { branchId: filter.branchId } : {}),
    },
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      role: { select: { nameEn: true } },
      assignedInternalTickets: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          dueAt: true,
          resolvedAt: true,
          closedAt: true,
        },
      },
      employeeTicketRatings: { select: { score: true } },
    },
    take: 50,
  });

  const now = new Date();
  return users.map((u) => {
    const tickets = u.assignedInternalTickets;
    const active = tickets.filter((t) => !TERMINAL_TICKET_STATUSES.includes(t.status as InternalTicketStatus));
    const newAssigned = hasExplicitDate
      ? tickets.filter((t) => t.createdAt >= dateFrom && t.createdAt <= dateTo).length
      : tickets.length;
    const res = hasExplicitDate
      ? tickets.filter((t) => t.resolvedAt && t.resolvedAt >= dateFrom && t.resolvedAt <= dateTo)
      : tickets.filter((t) => t.resolvedAt != null);
    const cls = hasExplicitDate
      ? tickets.filter((t) => t.closedAt && t.closedAt >= dateFrom && t.closedAt <= dateTo).length
      : tickets.filter((t) => t.closedAt != null).length;
    const ovd = active.filter((t) => t.dueAt && t.dueAt < now).length;

    const onTime = res.filter((t) => t.dueAt && t.resolvedAt! <= t.dueAt).length;
    const onTimeRate = res.length ? Math.round((onTime / res.length) * 100) : 100;

    let tatDays = 0;
    if (res.length) {
      const sum = res.reduce((acc, t) => acc + (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24), 0);
      tatDays = Math.round((sum / res.length) * 10) / 10;
    }

    const rating = u.employeeTicketRatings.length
      ? Number((u.employeeTicketRatings.reduce((sum, r) => sum + r.score, 0) / u.employeeTicketRatings.length).toFixed(1))
      : 5.0;

    let oldestDays = 0;
    if (active.length) {
      const oldestTime = Math.min(...active.map((t) => t.createdAt.getTime()));
      oldestDays = Math.round((now.getTime() - oldestTime) / (1000 * 60 * 60 * 24));
    }

    return {
      employeeId: u.id,
      nameEn: u.nameEn,
      nameAr: u.nameAr,
      role: u.role.nameEn,
      activeWorkload: active.length,
      newAssignments: newAssigned,
      resolved: res.length,
      closed: cls,
      overdue: ovd,
      onTimeRate,
      avgResolutionDays: tatDays,
      avgRating: rating,
      oldestActiveDays: oldestDays,
    };
  });
}

export async function fetchTicketsRecords(
  prisma: PrismaService,
  filter: TicketsAnalyticsFilter,
  limit = 25,
  offset = 0,
) {
  const where = buildTicketWhere(filter);
  const [total, rows] = await Promise.all([
    prisma.internalTicket.count({ where }),
    prisma.internalTicket.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        referenceNumber: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        dueAt: true,
        resolvedAt: true,
        closedAt: true,
        requestedBy: { select: { nameEn: true, nameAr: true, department: { select: { nameEn: true, nameAr: true } } } },
        targetDepartment: { select: { nameEn: true, nameAr: true } },
        assignedEmployee: { select: { nameEn: true, nameAr: true } },
      },
    }),
  ]);

  const now = new Date();
  const items = rows.map((r) => {
    const isOverdue = !TERMINAL_TICKET_STATUSES.includes(r.status as InternalTicketStatus) && Boolean(r.dueAt && r.dueAt < now);
    return {
      id: r.id,
      referenceNumber: r.referenceNumber,
      title: r.title,
      status: r.status,
      priority: r.priority,
      creatingDepartmentName: r.requestedBy?.department?.nameEn || r.requestedBy?.department?.nameAr || '-',
      targetDepartmentName: r.targetDepartment?.nameEn || r.targetDepartment?.nameAr || '-',
      requestedByName: r.requestedBy?.nameEn || r.requestedBy?.nameAr || '-',
      assignedEmployeeName: r.assignedEmployee?.nameEn || r.assignedEmployee?.nameAr || 'Unassigned',
      createdAt: r.createdAt.toISOString(),
      dueAt: r.dueAt?.toISOString() || null,
      resolvedAt: r.resolvedAt?.toISOString() || null,
      closedAt: r.closedAt?.toISOString() || null,
      isOverdue,
    };
  });

  return { total, items };
}
