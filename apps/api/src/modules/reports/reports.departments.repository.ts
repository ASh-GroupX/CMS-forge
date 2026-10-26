import { Injectable } from '@nestjs/common';
import { ComplaintStatus, InternalTicketStatus, RoleCode } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import { parseDateRange } from './reports.complaints.js';
import type { DashboardReportScope } from './reports.service.js';

export type DepartmentPerformanceFilter = {
  branchId?: string | null;
  departmentId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export type DepartmentPerformanceRow = {
  departmentId: string;
  nameEn: string;
  nameAr: string;
  code: string;
  branchId: string | null;
  branchNameEn: string | null;
  branchNameAr: string | null;
  employeeCount: number;
  ticketsCreated: number;
  ticketsTargeted: number;
  ticketsOpen: number;
  ticketsInProgress: number;
  ticketsWaiting: number;
  ticketsUnassigned: number;
  ticketsResolved: number;
  ticketsOverdue: number;
  ticketsAvgTatDays: number;
  ticketsOnTimeRate: number;
  complaintsTotal: number;
  complaintsOpen: number;
  complaintsResolved: number;
  complaintsOverdue: number;
  complaintsAvgHours: number;
  complaintsSlaRate: number;
  uniqueCustomers: number;
  combinedVolume: number;
  combinedOpen: number;
  combinedResolved: number;
  combinedOverdue: number;
  overallCompletionRate: number;
};

const TERMINAL_TICKETS: InternalTicketStatus[] = [
  InternalTicketStatus.RESOLVED,
  InternalTicketStatus.CLOSED,
  InternalTicketStatus.REJECTED,
];

const TERMINAL_COMPLAINTS: ComplaintStatus[] = [
  ComplaintStatus.RESOLVED,
  ComplaintStatus.COMPLETED,
  ComplaintStatus.CLOSED,
  ComplaintStatus.REJECTED,
];

@Injectable()
export class ReportsDepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPerformance(
    filter: DepartmentPerformanceFilter,
    scope: DashboardReportScope,
  ): Promise<DepartmentPerformanceRow[]> {
    const effectiveDepartmentId =
      scope.role === RoleCode.ADMIN
        ? (filter.departmentId ?? null)
        : (scope.departmentId ?? null);

    const effectiveBranchId =
      scope.role === RoleCode.ADMIN
        ? (filter.branchId ?? scope.branchId ?? null)
        : (scope.branchId ?? null);

    const departments = await this.prisma.department.findMany({
      where: {
        isActive: true,
        ...(effectiveDepartmentId ? { id: effectiveDepartmentId } : {}),
        ...(effectiveBranchId ? { branchId: effectiveBranchId } : {}),
      },
      include: {
        branch: { select: { id: true, nameEn: true, nameAr: true } },
        users: { where: { isActive: true }, select: { id: true } },
      },
      orderBy: { nameEn: 'asc' },
    });

    if (departments.length === 0) {
      return [];
    }

    const { dateFrom, dateTo } = parseDateRange(filter.dateFrom, filter.dateTo);
    const now = new Date();
    const deptIds = departments.map((d) => d.id);

    const [tickets, sentTickets, complaints] = await Promise.all([
      this.prisma.internalTicket.findMany({
        where: {
          targetDepartmentId: { in: deptIds },
          OR: [
            { createdAt: { gte: dateFrom, lte: dateTo } },
            { status: { notIn: TERMINAL_TICKETS } },
            { resolvedAt: { gte: dateFrom, lte: dateTo } },
          ],
        },
        select: {
          id: true,
          targetDepartmentId: true,
          status: true,
          assignedEmployeeId: true,
          createdAt: true,
          dueAt: true,
          resolvedAt: true,
        },
      }),
      this.prisma.internalTicket.findMany({
        where: {
          requestedBy: { departmentId: { in: deptIds } },
          createdAt: { gte: dateFrom, lte: dateTo },
        },
        select: {
          id: true,
          requestedBy: { select: { departmentId: true } },
        },
      }),
      this.prisma.complaint.findMany({
        where: {
          departmentId: { in: deptIds },
          OR: [
            { createdAt: { gte: dateFrom, lte: dateTo } },
            { status: { notIn: TERMINAL_COMPLAINTS } },
            { resolvedAt: { gte: dateFrom, lte: dateTo } },
          ],
        },
        select: {
          id: true,
          departmentId: true,
          status: true,
          createdAt: true,
          resolvedAt: true,
          firstResponseAt: true,
          customerId: true,
        },
      }),
    ]);

    return departments.map((dept) => {
      const deptTickets = tickets.filter((t) => t.targetDepartmentId === dept.id);
      const deptSent = sentTickets.filter((t) => t.requestedBy?.departmentId === dept.id);
      const deptComplaints = complaints.filter((c) => c.departmentId === dept.id);
      const uniqueCustomers = new Set(deptComplaints.map((c) => c.customerId || c.id)).size;

      const createdTickets = deptTickets.filter(
        (t) => t.createdAt >= dateFrom && t.createdAt <= dateTo,
      );
      const openTickets = deptTickets.filter((t) => !TERMINAL_TICKETS.includes(t.status));
      const inProgressTickets = openTickets.filter((t) =>
        t.status === InternalTicketStatus.ASSIGNED || t.status === InternalTicketStatus.IN_PROGRESS,
      );
      const waitingTickets = openTickets.filter(
        (t) => t.status === InternalTicketStatus.WAITING,
      );
      const unassignedTickets = openTickets.filter((t) => !t.assignedEmployeeId);
      const resolvedTickets = deptTickets.filter(
        (t) =>
          (t.status === InternalTicketStatus.RESOLVED || t.status === InternalTicketStatus.CLOSED) &&
          t.resolvedAt &&
          t.resolvedAt >= dateFrom &&
          t.resolvedAt <= dateTo,
      );
      const overdueTickets = openTickets.filter((t) => t.dueAt && t.dueAt < now);

      let ticketsTatTotalDays = 0;
      let ticketsOnTimeCount = 0;
      for (const t of resolvedTickets) {
        if (t.resolvedAt && t.createdAt) {
          ticketsTatTotalDays +=
            (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        }
        if (!t.dueAt || (t.resolvedAt && t.resolvedAt <= t.dueAt)) {
          ticketsOnTimeCount++;
        }
      }
      const ticketsAvgTatDays =
        resolvedTickets.length > 0
          ? Number((ticketsTatTotalDays / resolvedTickets.length).toFixed(1))
          : 0;
      const ticketsOnTimeRate =
        resolvedTickets.length > 0
          ? Math.round((ticketsOnTimeCount / resolvedTickets.length) * 100)
          : 100;

      const createdComplaints = deptComplaints.filter(
        (c) => c.createdAt >= dateFrom && c.createdAt <= dateTo,
      );
      const openComplaints = deptComplaints.filter(
        (c) => !TERMINAL_COMPLAINTS.includes(c.status),
      );
      const resolvedComplaints = deptComplaints.filter(
        (c) =>
          (c.status === ComplaintStatus.RESOLVED ||
            c.status === ComplaintStatus.COMPLETED ||
            c.status === ComplaintStatus.CLOSED) &&
          c.resolvedAt &&
          c.resolvedAt >= dateFrom &&
          c.resolvedAt <= dateTo,
      );
      const overdueComplaints = openComplaints.filter(
        (c) => (now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60) > 48,
      );

      let complaintsTatTotalHours = 0;
      let complaintsSlaCount = 0;
      for (const c of resolvedComplaints) {
        if (c.resolvedAt && c.createdAt) {
          const hours = (c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
          complaintsTatTotalHours += hours;
          if (hours <= 48) {
            complaintsSlaCount++;
          }
        }
      }
      const complaintsAvgHours =
        resolvedComplaints.length > 0
          ? Number((complaintsTatTotalHours / resolvedComplaints.length).toFixed(1))
          : 0;
      const complaintsSlaRate =
        resolvedComplaints.length > 0
          ? Math.round((complaintsSlaCount / resolvedComplaints.length) * 100)
          : 100;

      const combinedVolume = createdTickets.length + createdComplaints.length;
      const combinedOpen = openTickets.length + openComplaints.length;
      const combinedResolved = resolvedTickets.length + resolvedComplaints.length;
      const combinedOverdue = overdueTickets.length + overdueComplaints.length;
      const overallCompletionRate =
        combinedVolume > 0
          ? Math.min(100, Math.round((combinedResolved / combinedVolume) * 100))
          : combinedResolved > 0
          ? 100
          : 100;

      return {
        departmentId: dept.id,
        nameEn: dept.nameEn,
        nameAr: dept.nameAr,
        code: dept.code,
        branchId: dept.branchId,
        branchNameEn: dept.branch?.nameEn ?? null,
        branchNameAr: dept.branch?.nameAr ?? null,
        employeeCount: dept.users.length,
        ticketsCreated: deptSent.length,
        ticketsTargeted: createdTickets.length,
        ticketsOpen: openTickets.length,
        ticketsInProgress: inProgressTickets.length,
        ticketsWaiting: waitingTickets.length,
        ticketsUnassigned: unassignedTickets.length,
        ticketsResolved: resolvedTickets.length,
        ticketsOverdue: overdueTickets.length,
        ticketsAvgTatDays,
        ticketsOnTimeRate,
        complaintsTotal: createdComplaints.length,
        complaintsOpen: openComplaints.length,
        complaintsResolved: resolvedComplaints.length,
        complaintsOverdue: overdueComplaints.length,
        complaintsAvgHours,
        complaintsSlaRate,
        uniqueCustomers,
        combinedVolume,
        combinedOpen,
        combinedResolved,
        combinedOverdue,
        overallCompletionRate,
      };
    });
  }
}
