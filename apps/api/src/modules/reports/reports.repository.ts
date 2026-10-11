import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { ComplaintSeverity, ComplaintStatus } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import type { ComplaintCaseKpiRow, ComplaintCaseSlaEvent, ComplaintCaseStatusEvent, TaskKpiRow, TaskKpiStatusEvent } from './reports.kpi.js';

export type DashboardReadRow = {
  id: string;
  branchId: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  statusHistory: ComplaintCaseStatusEvent[];
  slaEvents: ComplaintCaseSlaEvent[];
};

export type TaskKpiReadRows = {
  tasks: TaskKpiRow[];
  events: TaskKpiStatusEvent[];
};

export type ComplaintCaseKpiReadRows = {
  records: ComplaintCaseKpiRow[];
  statusEvents: ComplaintCaseStatusEvent[];
  slaEvents: ComplaintCaseSlaEvent[];
};

@Injectable()
export class ReportsRepository {
  constructor(@Inject(PrismaService) private readonly prisma?: PrismaService) {}

  async listTaskKpiRows(branchId: string | null): Promise<TaskKpiReadRows> {
    if (!this.prisma) throw new Error('ReportsRepository requires PrismaService for task KPI reads');
    const rows = await this.prisma.task.findMany({
      where: taskKpiWhere(branchId),
      select: taskKpiSelect,
    });
    return {
      tasks: rows.map(({ statusHistory: _statusHistory, ...task }) => task),
      events: rows.flatMap((task) => task.statusHistory),
    };
  }

  async listDashboardRows(branchId: string | null): Promise<DashboardReadRow[]> {
    if (!this.prisma) throw new Error('ReportsRepository requires PrismaService for dashboard reads');
    const rows = await this.prisma.complaint.findMany({
      where: branchWhere(branchId),
      select: dashboardSelect,
    });
    return rows.map((complaint) => ({
      ...complaint,
      statusHistory: complaint.statusHistory.map((event) => ({ recordId: event.complaintId, toStatus: event.toStatus, action: event.action, createdAt: event.createdAt })),
      slaEvents: complaint.slaEvents.map((event) => ({ recordId: event.complaintId, type: event.type, occurredAt: event.occurredAt })),
    }));
  }

  async listComplaintCaseKpiRows(branchId: string | null): Promise<ComplaintCaseKpiReadRows> {
    if (!this.prisma) throw new Error('ReportsRepository requires PrismaService for complaint/case KPI reads');
    const [complaints, cases] = await Promise.all([
      this.prisma.complaint.findMany({ where: branchWhere(branchId), select: complaintCaseKpiSelect }),
      this.prisma.case.findMany({ where: branchWhere(branchId), select: caseKpiSelect }),
    ]);
    return {
      records: [
        ...complaints.map((complaint) => ({ id: complaint.id, createdAt: complaint.createdAt, closedAt: complaint.closedAt, status: complaint.status, hasSlaObligation: true })),
        ...cases.map((item) => ({ ...item, hasSlaObligation: false })),
      ],
      statusEvents: complaints.flatMap((complaint) => complaint.statusHistory.map((event) => ({ recordId: event.complaintId, toStatus: event.toStatus, action: event.action, createdAt: event.createdAt }))),
      slaEvents: complaints.flatMap((complaint) => complaint.slaEvents.map((event) => ({ recordId: event.complaintId, type: event.type, occurredAt: event.occurredAt }))),
    };
  }

  async getPremiumDashboardData(branchId: string | null, departmentId: string | null, userId: string | null) {
    if (!this.prisma) throw new Error('ReportsRepository requires PrismaService for premium dashboard');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bFilter = branchId ? { branchId } : {};
    const deptFilter = departmentId ? { departmentId } : branchId ? { branchId } : {};

    // ── Admin Data ──
    const totalEmployees = await this.prisma.user.count({ where: bFilter });
    const totalActiveTickets = await this.prisma.internalTicket.count({
      where: { status: { notIn: ['CLOSED', 'RESOLVED'] } }
    });
    const totalResolvedToday = await this.prisma.internalTicket.count({
      where: { resolvedAt: { gte: today } }
    });
    const avgSysRatingAgg = await this.prisma.ticketRating.aggregate({ _avg: { score: true } });
    const avgSystemRating = Number((avgSysRatingAgg._avg.score || 5).toFixed(1));

    // ── Manager Data (Team Performance) ──
    const employees = await this.prisma.user.findMany({
      where: deptFilter,
      select: {
        id: true,
        nameEn: true,
        role: { select: { nameEn: true } },
        assignedInternalTickets: { select: { status: true, dueAt: true, resolvedAt: true, createdAt: true } },
        employeeTicketRatings: { select: { score: true } },
      },
    });

    let totalCompletionTimeMs = 0;
    let completedTicketsCount = 0;
    let totalOnTimeRate = 0;

    const teamPerformance = employees.map(emp => {
      const tickets = emp.assignedInternalTickets;
      const active = tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
      const done = tickets.filter(t => t.status === 'CLOSED' || t.status === 'RESOLVED').length;
      
      const doneWithDue = tickets.filter(t => (t.status === 'CLOSED' || t.status === 'RESOLVED') && t.dueAt);
      const onTime = doneWithDue.filter(t => t.resolvedAt && t.dueAt && t.resolvedAt <= t.dueAt).length;
      const onTimeRate = doneWithDue.length ? Math.round((onTime / doneWithDue.length) * 100) : 100;

      totalOnTimeRate += onTimeRate;

      tickets.filter(t => t.resolvedAt && t.createdAt).forEach(t => {
        totalCompletionTimeMs += (t.resolvedAt!.getTime() - t.createdAt!.getTime());
        completedTicketsCount++;
      });

      const rating = emp.employeeTicketRatings.length 
        ? emp.employeeTicketRatings.reduce((sum, r) => sum + r.score, 0) / emp.employeeTicketRatings.length
        : 5.0;

      return {
        id: emp.id,
        name: emp.nameEn,
        role: emp.role.nameEn,
        rating: Number(rating.toFixed(1)),
        active,
        done,
        onTimeRate
      };
    });

    const receivedTickets = await this.prisma.internalTicket.count({
       where: { targetDepartment: { branchId } }
    });

    const sentTickets = await this.prisma.internalTicket.count({
       where: { requestedBy: { branchId } }
    });

    // ── Officer Data ──
    let activeTasks = 0;
    let sentTasks = 0;
    let receivedTasks = 0;
    let onTimeTasks = 0;
    let overdueTasks = 0;
    let pendingTasks = 0;

    if (userId) {
      activeTasks = await this.prisma.internalTicket.count({ where: { assignedEmployeeId: userId, status: { notIn: ['CLOSED', 'RESOLVED'] } } });
      sentTasks = await this.prisma.internalTicket.count({ where: { requestedById: userId } });
      receivedTasks = await this.prisma.internalTicket.count({ where: { assignedEmployeeId: userId } });
      const tickets = await this.prisma.internalTicket.findMany({ where: { assignedEmployeeId: userId }, select: { status: true, dueAt: true, resolvedAt: true, closedAt: true } });
      const now = new Date();
      tickets.forEach(t => {
        if (!['CLOSED', 'RESOLVED'].includes(t.status)) {
           if (t.dueAt && t.dueAt < now) overdueTasks++;
           else pendingTasks++;
        } else {
           const completionDate = t.resolvedAt || t.closedAt || now;
           if (t.dueAt && completionDate > t.dueAt) overdueTasks++; // it was overdue when completed
           else onTimeTasks++;
        }
      });
    }

    const avgCompletionMs = completedTicketsCount > 0 ? totalCompletionTimeMs / completedTicketsCount : 0;
    const avgCompletionDays = (avgCompletionMs / (1000 * 60 * 60 * 24)).toFixed(1);
    const avgCompletion = avgCompletionDays !== "0.0" ? `${avgCompletionDays}d` : "N/A";
    const performanceKpi = employees.length > 0 ? `${Math.round(totalOnTimeRate / employees.length)}%` : "N/A";

    return {
      admin: { totalEmployees, totalActiveTickets, totalResolvedToday, avgSystemRating },
      manager: { teamPerformance, receivedTickets, sentTickets, avgCompletion, performanceKpi },
      officer: { activeTasks, sentTasks, receivedTasks, onTime: onTimeTasks, overdue: overdueTasks, pending: pendingTasks }
    };
  }
}

const taskKpiSelect = {
  id: true,
  dueAt: true,
  status: true,
  isCustomerPromise: true,
  statusHistory: { select: { taskId: true, toStatus: true, createdAt: true } },
} satisfies Prisma.TaskSelect;

function taskKpiWhere(branchId: string | null): Prisma.TaskWhereInput {
  return branchId
    ? { OR: [{ owner: { branchId } }, { assignee: { branchId } }, { nextActionWho: { branchId } }] }
    : {};
}

const complaintCaseKpiSelect = {
  id: true,
  createdAt: true,
  closedAt: true,
  status: true,
  statusHistory: { select: { complaintId: true, toStatus: true, action: true, createdAt: true } },
  slaEvents: { select: { complaintId: true, type: true, occurredAt: true } },
} satisfies Prisma.ComplaintSelect;

const caseKpiSelect = {
  id: true,
  createdAt: true,
} satisfies Prisma.CaseSelect;

function branchWhere(branchId: string | null): { branchId?: string } {
  return branchId ? { branchId } : {};
}

const dashboardSelect = {
  id: true,
  branchId: true,
  status: true,
  severity: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
  statusHistory: { select: { complaintId: true, toStatus: true, action: true, createdAt: true } },
  slaEvents: { select: { complaintId: true, type: true, occurredAt: true } },
} satisfies Prisma.ComplaintSelect;
