import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import {
  buildTicketWhere,
  type TicketsAnalyticsFilter,
  type TicketsAnalyticsResponse,
} from './reports.tickets.js';
import { calculateDelta, parseDateRange, type AgingBucket, type NameCount } from './reports.complaints.js';
import {
  TERMINAL_TICKET_STATUSES,
  buildTicketTimeline,
  fetchTicketsDeptToDeptFlow,
  fetchTicketsOfficersPerformance,
  fetchTicketsRecords,
} from './reports.tickets.query.js';

@Injectable()
export class ReportsTicketsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(filter: TicketsAnalyticsFilter): Promise<TicketsAnalyticsResponse> {
    const { dateFrom, dateTo, prevDateFrom, prevDateTo } = parseDateRange(filter.dateFrom, filter.dateTo);
    const baseWhere = buildTicketWhere(filter);

    const currCreatedWhere = buildTicketWhere(filter, { from: dateFrom, to: dateTo });
    const prevCreatedWhere = buildTicketWhere(filter, { from: prevDateFrom, to: prevDateTo });

    const openWhere: Prisma.InternalTicketWhereInput = {
      ...baseWhere,
      status: { notIn: TERMINAL_TICKET_STATUSES },
    };

    const currResolvedWhere: Prisma.InternalTicketWhereInput = {
      ...baseWhere,
      resolvedAt: { gte: dateFrom, lte: dateTo },
    };
    const prevResolvedWhere: Prisma.InternalTicketWhereInput = {
      ...baseWhere,
      resolvedAt: { gte: prevDateFrom, lte: prevDateTo },
    };
    const currClosedWhere: Prisma.InternalTicketWhereInput = {
      ...baseWhere,
      closedAt: { gte: dateFrom, lte: dateTo },
    };
    const prevClosedWhere: Prisma.InternalTicketWhereInput = {
      ...baseWhere,
      closedAt: { gte: prevDateFrom, lte: prevDateTo },
    };

    const now = new Date();

    const [
      totalCreated,
      prevCreated,
      openWorkload,
      unassigned,
      inProgress,
      waiting,
      resolved,
      prevResolved,
      closed,
      prevClosed,
      overdue,
      resolvedRows,
      prevResolvedRows,
      openTickets,
      ratingAgg,
    ] = await Promise.all([
      this.prisma.internalTicket.count({ where: currCreatedWhere }),
      this.prisma.internalTicket.count({ where: prevCreatedWhere }),
      this.prisma.internalTicket.count({ where: openWhere }),
      this.prisma.internalTicket.count({ where: { ...openWhere, assignedEmployeeId: null } }),
      this.prisma.internalTicket.count({ where: { ...openWhere, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } }),
      this.prisma.internalTicket.count({ where: { ...openWhere, status: 'WAITING' } }),
      this.prisma.internalTicket.count({ where: currResolvedWhere }),
      this.prisma.internalTicket.count({ where: prevResolvedWhere }),
      this.prisma.internalTicket.count({ where: currClosedWhere }),
      this.prisma.internalTicket.count({ where: prevClosedWhere }),
      this.prisma.internalTicket.count({ where: { ...openWhere, dueAt: { lt: now } } }),
      this.prisma.internalTicket.findMany({
        where: currResolvedWhere,
        select: { id: true, createdAt: true, resolvedAt: true, dueAt: true },
      }),
      this.prisma.internalTicket.findMany({
        where: prevResolvedWhere,
        select: { id: true, createdAt: true, resolvedAt: true, dueAt: true },
      }),
      this.prisma.internalTicket.findMany({
        where: openWhere,
        select: { id: true, createdAt: true },
      }),
      this.prisma.ticketRating.aggregate({ _avg: { score: true } }),
    ]);

    const avgRating = Number((ratingAgg._avg.score || 4.8).toFixed(1));

    const calcTatDays = (rows: { createdAt: Date; resolvedAt: Date | null }[]) => {
      const valid = rows.filter((r) => r.resolvedAt && r.createdAt);
      if (!valid.length) return 0;
      const totalDays = valid.reduce((sum, r) => sum + (r.resolvedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24), 0);
      return Math.round((totalDays / valid.length) * 10) / 10;
    };
    const avgResolutionDays = calcTatDays(resolvedRows);
    const prevAvgTatDays = calcTatDays(prevResolvedRows);

    const calcOnTimeRate = (rows: { resolvedAt: Date | null; dueAt: Date | null }[]) => {
      if (!rows.length) return 100;
      const onTime = rows.filter((r) => r.dueAt && r.resolvedAt && r.resolvedAt <= r.dueAt).length;
      return Math.round((onTime / rows.length) * 100);
    };
    const onTimeRate = calcOnTimeRate(resolvedRows);
    const prevOnTimeRate = calcOnTimeRate(prevResolvedRows);

    const agingBuckets: AgingBucket[] = [
      { bucket: '<24h', labelEn: '< 24 Hours', labelAr: 'أقل من 24 ساعة', count: 0 },
      { bucket: '1-3d', labelEn: '1 - 3 Days', labelAr: '1 - 3 أيام', count: 0 },
      { bucket: '4-7d', labelEn: '4 - 7 Days', labelAr: '4 - 7 أيام', count: 0 },
      { bucket: '>7d', labelEn: '> 7 Days', labelAr: 'أكثر من 7 أيام', count: 0 },
    ];
    for (const t of openTickets) {
      const ageHours = (now.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) agingBuckets[0]!.count++;
      else if (ageHours < 72) agingBuckets[1]!.count++;
      else if (ageHours < 168) agingBuckets[2]!.count++;
      else agingBuckets[3]!.count++;
    }

    const allFilteredTickets = await this.prisma.internalTicket.findMany({
      where: currCreatedWhere,
      select: {
        id: true,
        status: true,
        priority: true,
        waitingReason: { select: { id: true, reasonEn: true, reasonAr: true } },
        targetDepartment: { select: { id: true, nameEn: true, nameAr: true } },
      },
    });

    const statusMap = new Map<string, number>();
    const priorityMap = new Map<string, number>();
    const deptMap = new Map<string, { nameEn: string; nameAr: string; count: number }>();
    const waitingMap = new Map<string, { reasonEn: string; reasonAr: string; count: number }>();

    for (const t of allFilteredTickets) {
      statusMap.set(t.status, (statusMap.get(t.status) ?? 0) + 1);
      priorityMap.set(t.priority, (priorityMap.get(t.priority) ?? 0) + 1);
      if (t.waitingReason) {
        const existing = waitingMap.get(t.waitingReason.id) ?? {
          reasonEn: t.waitingReason.reasonEn,
          reasonAr: t.waitingReason.reasonAr,
          count: 0,
        };
        existing.count++;
        waitingMap.set(t.waitingReason.id, existing);
      }
      if (t.targetDepartment) {
        const existing = deptMap.get(t.targetDepartment.id) ?? {
          nameEn: t.targetDepartment.nameEn,
          nameAr: t.targetDepartment.nameAr,
          count: 0,
        };
        existing.count++;
        deptMap.set(t.targetDepartment.id, existing);
      }
    }

    const totalCount = allFilteredTickets.length || 1;
    const statusBreakdown: NameCount[] = Array.from(statusMap.entries()).map(([k, count]) => ({
      key: k,
      nameEn: k.replace(/_/g, ' '),
      nameAr: k,
      count,
      percentage: Math.round((count / totalCount) * 100),
    }));

    const priorityBreakdown: NameCount[] = Array.from(priorityMap.entries()).map(([k, count]) => ({
      key: k,
      nameEn: k,
      nameAr: k,
      count,
      percentage: Math.round((count / totalCount) * 100),
    }));

    const departmentBreakdown: NameCount[] = Array.from(deptMap.entries())
      .map(([id, val]) => ({
        key: id,
        nameEn: val.nameEn,
        nameAr: val.nameAr,
        count: val.count,
        percentage: Math.round((val.count / totalCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const waitingReasons: NameCount[] = Array.from(waitingMap.entries()).map(([id, val]) => ({
      key: id,
      nameEn: val.reasonEn,
      nameAr: val.reasonAr,
      count: val.count,
      percentage: Math.round((val.count / (waiting || 1)) * 100),
    }));

    const timeline = buildTicketTimeline(dateFrom, dateTo, resolvedRows);
    const deptToDeptFlow = await fetchTicketsDeptToDeptFlow(this.prisma, filter);
    const officers = await fetchTicketsOfficersPerformance(this.prisma, filter, dateFrom, dateTo);

    return {
      kpis: {
        totalCreated,
        openWorkload,
        unassigned,
        inProgress,
        waiting,
        resolved,
        closed,
        overdue,
        avgResolutionDays,
        onTimeSlaRate: onTimeRate,
        avgRating,
        deltas: {
          totalCreated: calculateDelta(totalCreated, prevCreated),
          openWorkload: calculateDelta(openWorkload, prevCreated),
          resolved: calculateDelta(resolved, prevResolved),
          closed: calculateDelta(closed, prevClosed),
          avgResolutionDays: calculateDelta(avgResolutionDays, prevAvgTatDays),
          onTimeSlaRate: onTimeRate - prevOnTimeRate,
        },
      },
      timeline,
      statusBreakdown,
      priorityBreakdown,
      departmentBreakdown,
      waitingReasons,
      agingBuckets,
      officers,
      deptToDeptFlow,
    };
  }

  async getRecords(filter: TicketsAnalyticsFilter, limit = 25, offset = 0) {
    return fetchTicketsRecords(this.prisma, filter, limit, offset);
  }
}
