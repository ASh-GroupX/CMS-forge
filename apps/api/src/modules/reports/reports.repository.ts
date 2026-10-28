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

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const bFilter = branchId ? { branchId } : {};
    const deptFilter = departmentId ? { departmentId } : branchId ? { branchId } : {};

    // ── Admin Data ──
    const totalEmployees = await this.prisma.user.count({ where: bFilter });

    const [
      activeInternalTickets,
      activeComplaints,
      resolvedInternalToday,
      resolvedComplaintsToday,
      resolvedInternalYesterday,
      resolvedComplaintsYesterday,
      ticketRatingAgg
    ] = await Promise.all([
      this.prisma.internalTicket.count({
        where: {
          status: { notIn: ['CLOSED', 'RESOLVED', 'REJECTED'] },
          ...(branchId ? { targetDepartment: { branchId } } : {})
        }
      }),
      this.prisma.complaint.count({
        where: {
          status: { notIn: ['CLOSED', 'RESOLVED', 'REJECTED'] },
          ...(branchId ? { branchId } : {})
        }
      }),
      this.prisma.internalTicket.count({
        where: {
          resolvedAt: { gte: today },
          ...(branchId ? { targetDepartment: { branchId } } : {})
        }
      }),
      this.prisma.complaint.count({
        where: {
          closedAt: { gte: today },
          ...(branchId ? { branchId } : {})
        }
      }),
      this.prisma.internalTicket.count({
        where: {
          resolvedAt: { gte: yesterday, lt: today },
          ...(branchId ? { targetDepartment: { branchId } } : {})
        }
      }),
      this.prisma.complaint.count({
        where: {
          closedAt: { gte: yesterday, lt: today },
          ...(branchId ? { branchId } : {})
        }
      }),
      this.prisma.ticketRating.aggregate({ _avg: { score: true } })
    ]);

    const totalActiveTickets = activeInternalTickets + activeComplaints;
    const totalResolvedToday = resolvedInternalToday + resolvedComplaintsToday;
    const resolvedYesterday = resolvedInternalYesterday + resolvedComplaintsYesterday;

    const avgSystemRating = Number((ticketRatingAgg._avg.score || 5).toFixed(1));

    const resolvedTrendVal = resolvedYesterday === 0
      ? (totalResolvedToday > 0 ? `+100%` : `0%`)
      : `${Math.round(((totalResolvedToday - resolvedYesterday) / resolvedYesterday) * 100)}%`;
    const resolvedTrendSigned = resolvedTrendVal.startsWith('-') || resolvedTrendVal.startsWith('+') ? resolvedTrendVal : `+${resolvedTrendVal}`;

    const trends = {
      employees: `${totalEmployees}`,
      employeesPositive: true,
      activeTickets: totalActiveTickets > 0 ? `${totalActiveTickets}` : `0`,
      activeTicketsPositive: totalActiveTickets === 0,
      resolvedToday: resolvedTrendSigned,
      resolvedTodayPositive: totalResolvedToday >= resolvedYesterday,
      rating: `${avgSystemRating}`,
      ratingPositive: avgSystemRating >= 4.0,
    };

    // ── 7-Day System Tracking (Plot Data) ──
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [recentInternalTickets, recentComplaints] = await Promise.all([
      this.prisma.internalTicket.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          ...(branchId ? { targetDepartment: { branchId } } : {})
        },
        select: { createdAt: true, resolvedAt: true, closedAt: true, status: true }
      }),
      this.prisma.complaint.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          ...(branchId ? { branchId } : {})
        },
        select: { createdAt: true, closedAt: true, status: true }
      })
    ]);

    const systemTracking: Array<{
      name: string;
      nameAr: string;
      date: string;
      active: number;
      resolved: number;
      avgTime: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOfWeek = d.getDay();
      const name = dayNamesEn[dayOfWeek] ?? 'Day';
      const nameAr = dayNamesAr[dayOfWeek] ?? 'يوم';
      const dateStr = d.toISOString().split('T')[0] ?? '';

      const activeInternal = recentInternalTickets.filter((t) => t.createdAt >= dayStart && t.createdAt <= dayEnd).length;
      const activeCmp = recentComplaints.filter((c) => c.createdAt >= dayStart && c.createdAt <= dayEnd).length;
      const dayActive = activeInternal + activeCmp;

      const resolvedInternal = recentInternalTickets.filter((t) => {
        const res = t.resolvedAt || t.closedAt;
        return res && res >= dayStart && res <= dayEnd;
      });
      const resolvedCmp = recentComplaints.filter((c) => c.closedAt && c.closedAt >= dayStart && c.closedAt <= dayEnd);
      const dayResolved = resolvedInternal.length + resolvedCmp.length;

      let dayTimeMs = 0;
      let countWithTime = 0;
      for (const t of resolvedInternal) {
        const res = t.resolvedAt || t.closedAt;
        if (res && t.createdAt) {
          dayTimeMs += (res.getTime() - t.createdAt.getTime());
          countWithTime++;
        }
      }
      for (const c of resolvedCmp) {
        if (c.closedAt && c.createdAt) {
          dayTimeMs += (c.closedAt.getTime() - c.createdAt.getTime());
          countWithTime++;
        }
      }
      const avgTime = countWithTime > 0
        ? Number((dayTimeMs / (countWithTime * 1000 * 60 * 60 * 24)).toFixed(1))
        : 0;

      systemTracking.push({
        name,
        nameAr,
        date: dateStr,
        active: dayActive,
        resolved: dayResolved,
        avgTime
      });
    }

    // ── Manager Data (Team Performance) ──
    const employees = await this.prisma.user.findMany({
      where: deptFilter,
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
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
        nameAr: emp.nameAr,
        role: emp.role.nameEn,
        rating: Number(rating.toFixed(1)),
        active,
        done,
        onTimeRate
      };
    });

    const [receivedInternal, receivedComplaints, sentInternal] = await Promise.all([
      this.prisma.internalTicket.count({
        where: branchId ? { targetDepartment: { branchId } } : {}
      }),
      this.prisma.complaint.count({
        where: branchId ? { branchId } : {}
      }),
      this.prisma.internalTicket.count({
        where: branchId ? { requestedBy: { branchId } } : {}
      })
    ]);

    const receivedTickets = receivedInternal + receivedComplaints;
    const sentTickets = sentInternal;

    // ── Officer Data ──
    let activeTasks = 0;
    let sentTasks = 0;
    let receivedTasks = 0;
    let onTimeTasks = 0;
    let overdueTasks = 0;
    let pendingTasks = 0;

    if (userId) {
      const [userActiveTickets, userSentTickets, userReceivedTickets, userComplaints] = await Promise.all([
        this.prisma.internalTicket.count({ where: { assignedEmployeeId: userId, status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
        this.prisma.internalTicket.count({ where: { requestedById: userId } }),
        this.prisma.internalTicket.count({ where: { assignedEmployeeId: userId } }),
        this.prisma.complaint.count({ where: { ownerId: userId, status: { notIn: ['CLOSED', 'RESOLVED', 'REJECTED'] } } })
      ]);

      activeTasks = userActiveTickets + userComplaints;
      sentTasks = userSentTickets;
      receivedTasks = userReceivedTickets + userComplaints;

      const tickets = await this.prisma.internalTicket.findMany({
        where: { assignedEmployeeId: userId },
        select: { status: true, dueAt: true, resolvedAt: true, closedAt: true }
      });
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
    const avgCompletion = avgCompletionDays !== "0.0" ? `${avgCompletionDays}d` : "0d";
    const performanceKpi = employees.length > 0 ? `${Math.round(totalOnTimeRate / employees.length)}%` : "100%";

    // ── CRM Complaint Analytics ──
    const complaintWhere: Prisma.ComplaintWhereInput = branchId ? { branchId } : {};

    const [
      totalCrmComplaints,
      inProgressCrmComplaints,
      resolvedCrmComplaints,
      closedCrmComplaints,
      reopenedCrmComplaints,
      alternativeCarCount,
      justifiedCount,
      unjustifiedCount,
      satisfiedCount,
      neutralCount,
      unsatisfiedCount,
      crmComplaintsWithDetails,
    ] = await Promise.all([
      this.prisma.complaint.count({ where: complaintWhere }),
      this.prisma.complaint.count({ where: { ...complaintWhere, status: { in: ['SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'IN_PROGRESS'] } } }),
      this.prisma.complaint.count({ where: { ...complaintWhere, status: 'RESOLVED' } }),
      this.prisma.complaint.count({ where: { ...complaintWhere, status: 'CLOSED' } }),
      this.prisma.complaint.count({ where: { ...complaintWhere, status: 'REOPENED' } }),
      this.prisma.complaint.count({ where: { ...complaintWhere, alternativeCarProvided: true } }),
      this.prisma.complaint.count({ where: { ...complaintWhere, isJustified: true } }),
      this.prisma.complaint.count({ where: { ...complaintWhere, isJustified: false } }),
      this.prisma.complaint.count({ where: { ...complaintWhere, satisfactionStatus: 'SATISFIED' } }),
      this.prisma.complaint.count({ where: { ...complaintWhere, satisfactionStatus: 'NEUTRAL' } }),
      this.prisma.complaint.count({ where: { ...complaintWhere, satisfactionStatus: 'UNSATISFIED' } }),
      this.prisma.complaint.findMany({
        where: complaintWhere,
        take: 200,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          rootCauseCategory: true,
          salesAdvisorName: true,
          department: { select: { id: true, nameEn: true, nameAr: true } },
          owner: { select: { id: true, nameEn: true, nameAr: true } },
        }
      })
    ]);

    const rootCauseCounts: Record<string, number> = {};
    const deptWorkloadMap: Record<string, { id: string; nameEn: string; nameAr: string; active: number; resolved: number }> = {};
    const officerWorkloadMap: Record<string, { id: string; nameEn: string; nameAr: string; active: number; resolved: number }> = {};

    for (const c of crmComplaintsWithDetails) {
      if (c.rootCauseCategory) {
        rootCauseCounts[c.rootCauseCategory] = (rootCauseCounts[c.rootCauseCategory] ?? 0) + 1;
      }
      const isActive = ['SUBMITTED', 'MANAGER_REVIEW', 'BRANCH_REVIEW', 'IN_PROGRESS'].includes(c.status);
      const isResolved = ['RESOLVED', 'CLOSED'].includes(c.status);

      if (c.department?.nameEn) {
        const key = c.department.nameEn;
        if (!deptWorkloadMap[key]) {
          deptWorkloadMap[key] = { id: c.department.id, nameEn: c.department.nameEn, nameAr: c.department.nameAr, active: 0, resolved: 0 };
        }
        if (isActive) deptWorkloadMap[key].active++;
        if (isResolved) deptWorkloadMap[key].resolved++;
      }

      if (c.owner?.nameEn) {
        const key = c.owner.nameEn;
        if (!officerWorkloadMap[key]) {
          officerWorkloadMap[key] = { id: c.owner.id, nameEn: c.owner.nameEn, nameAr: c.owner.nameAr, active: 0, resolved: 0 };
        }
        if (isActive) officerWorkloadMap[key].active++;
        if (isResolved) officerWorkloadMap[key].resolved++;
      }
    }

    const rootCausesBreakdown = Object.entries(rootCauseCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const departmentWorkload = Object.values(deptWorkloadMap);
    const officerWorkload = Object.values(officerWorkloadMap);

    const crm = {
      total: totalCrmComplaints,
      inProgress: inProgressCrmComplaints,
      resolved: resolvedCrmComplaints,
      closed: closedCrmComplaints,
      escalated: reopenedCrmComplaints,
      alternativeCarCount,
      justifiedCount,
      unjustifiedCount,
      satisfaction: {
        satisfied: satisfiedCount,
        neutral: neutralCount,
        unsatisfied: unsatisfiedCount,
      },
      rootCausesBreakdown,
      departmentWorkload,
      officerWorkload,
    };

    return {
      admin: { totalEmployees, totalActiveTickets, totalResolvedToday, avgSystemRating, trends, systemTracking },
      manager: { teamPerformance, receivedTickets, sentTickets, avgCompletion, performanceKpi },
      officer: { activeTasks, sentTasks, receivedTasks, onTime: onTimeTasks, overdue: overdueTasks, pending: pendingTasks },
      crm
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
