import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/http-kernel.js';
import {
  buildComplaintWhere,
  calculateDelta,
  parseDateRange,
  type AgingBucket,
  type ComplaintsAnalyticsFilter,
  type ComplaintsAnalyticsResponse,
  type NameCount,
} from './reports.complaints.js';
import {
  TERMINAL_COMPLAINT_STATUSES,
  buildComplaintTimeline,
  fetchComplaintsOfficersPerformance,
  fetchComplaintsRecords,
} from './reports.complaints.query.js';

@Injectable()
export class ReportsComplaintsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(filter: ComplaintsAnalyticsFilter): Promise<ComplaintsAnalyticsResponse> {
    const { dateFrom, dateTo, prevDateFrom, prevDateTo } = parseDateRange(filter.dateFrom, filter.dateTo);
    const baseWhere = buildComplaintWhere(filter);

    const hasExplicitDate = Boolean(filter.dateFrom || filter.dateTo);
    const currCreatedWhere = hasExplicitDate ? buildComplaintWhere(filter, { from: dateFrom, to: dateTo }) : baseWhere;
    const prevCreatedWhere = buildComplaintWhere(filter, { from: prevDateFrom, to: prevDateTo });

    const openWhere: Prisma.ComplaintWhereInput = {
      ...baseWhere,
      status: { notIn: TERMINAL_COMPLAINT_STATUSES },
    };

    const currResolvedWhere: Prisma.ComplaintWhereInput = hasExplicitDate
      ? { ...baseWhere, resolvedAt: { gte: dateFrom, lte: dateTo } }
      : { ...baseWhere, resolvedAt: { not: null } };
    const prevResolvedWhere: Prisma.ComplaintWhereInput = {
      ...baseWhere,
      resolvedAt: { gte: prevDateFrom, lte: prevDateTo },
    };
    const currClosedWhere: Prisma.ComplaintWhereInput = hasExplicitDate
      ? { ...baseWhere, closedAt: { gte: dateFrom, lte: dateTo } }
      : { ...baseWhere, closedAt: { not: null } };
    const prevClosedWhere: Prisma.ComplaintWhereInput = {
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
      resolved,
      prevResolved,
      closed,
      prevClosed,
      overdue,
      atRisk,
      resolvedRows,
      prevResolvedRows,
      openComplaints,
    ] = await Promise.all([
      this.prisma.complaint.count({ where: currCreatedWhere }),
      this.prisma.complaint.count({ where: prevCreatedWhere }),
      this.prisma.complaint.count({ where: openWhere }),
      this.prisma.complaint.count({ where: { ...openWhere, ownerId: null } }),
      this.prisma.complaint.count({ where: { ...openWhere, ownerId: { not: null } } }),
      this.prisma.complaint.count({ where: currResolvedWhere }),
      this.prisma.complaint.count({ where: prevResolvedWhere }),
      this.prisma.complaint.count({ where: currClosedWhere }),
      this.prisma.complaint.count({ where: prevClosedWhere }),
      this.prisma.complaint.count({
        where: {
          ...openWhere,
          OR: [{ slaEvents: { some: { type: 'BREACH' } } }],
        },
      }),
      this.prisma.complaint.count({
        where: {
          ...openWhere,
          slaEvents: { some: { type: 'WARNING' } },
        },
      }),
      this.prisma.complaint.findMany({
        where: currResolvedWhere,
        select: { id: true, createdAt: true, resolvedAt: true, slaEvents: { select: { type: true } } },
      }),
      this.prisma.complaint.findMany({
        where: prevResolvedWhere,
        select: { id: true, createdAt: true, resolvedAt: true, slaEvents: { select: { type: true } } },
      }),
      this.prisma.complaint.findMany({
        where: openWhere,
        select: { id: true, createdAt: true },
      }),
    ]);

    const calcTatHours = (rows: { createdAt: Date; resolvedAt: Date | null }[]) => {
      const valid = rows.filter((r) => r.resolvedAt && r.createdAt);
      if (!valid.length) return 0;
      const totalHours = valid.reduce((sum, r) => sum + (r.resolvedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60), 0);
      return Math.round((totalHours / valid.length) * 10) / 10;
    };
    const avgResolutionHours = calcTatHours(resolvedRows);
    const prevAvgTatHours = calcTatHours(prevResolvedRows);

    const calcCompliance = (rows: { slaEvents: { type: string }[] }[]) => {
      if (!rows.length) return 100;
      const compliant = rows.filter((r) => !r.slaEvents.some((e) => e.type === 'BREACH')).length;
      return Math.round((compliant / rows.length) * 100);
    };
    const slaComplianceRate = calcCompliance(resolvedRows);
    const prevSlaCompliance = calcCompliance(prevResolvedRows);

    const agingBuckets: AgingBucket[] = [
      { bucket: '<24h', labelEn: '< 24 Hours', labelAr: 'أقل من 24 ساعة', count: 0 },
      { bucket: '1-3d', labelEn: '1 - 3 Days', labelAr: '1 - 3 أيام', count: 0 },
      { bucket: '4-7d', labelEn: '4 - 7 Days', labelAr: '4 - 7 أيام', count: 0 },
      { bucket: '>7d', labelEn: '> 7 Days', labelAr: 'أكثر من 7 أيام', count: 0 },
    ];
    for (const c of openComplaints) {
      const ageHours = (now.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) agingBuckets[0]!.count++;
      else if (ageHours < 72) agingBuckets[1]!.count++;
      else if (ageHours < 168) agingBuckets[2]!.count++;
      else agingBuckets[3]!.count++;
    }

    const allFilteredComplaints = await this.prisma.complaint.findMany({
      where: currCreatedWhere,
      select: {
        id: true,
        status: true,
        severity: true,
        category: { select: { id: true, nameEn: true, nameAr: true } },
      },
    });

    const statusMap = new Map<string, number>();
    const categoryMap = new Map<string, { nameEn: string; nameAr: string; count: number }>();
    const severityMap = new Map<string, number>();

    for (const c of allFilteredComplaints) {
      statusMap.set(c.status, (statusMap.get(c.status) ?? 0) + 1);
      severityMap.set(c.severity, (severityMap.get(c.severity) ?? 0) + 1);
      if (c.category) {
        const existing = categoryMap.get(c.category.id) ?? { nameEn: c.category.nameEn, nameAr: c.category.nameAr, count: 0 };
        existing.count++;
        categoryMap.set(c.category.id, existing);
      }
    }

    const totalCount = allFilteredComplaints.length || 1;
    const statusBreakdown: NameCount[] = Array.from(statusMap.entries()).map(([k, count]) => ({
      key: k,
      nameEn: k.replace(/_/g, ' '),
      nameAr: k,
      count,
      percentage: Math.round((count / totalCount) * 100),
    }));

    const categoryBreakdown: NameCount[] = Array.from(categoryMap.entries())
      .map(([id, val]) => ({
        key: id,
        nameEn: val.nameEn,
        nameAr: val.nameAr,
        count: val.count,
        percentage: Math.round((val.count / totalCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const severityBreakdown: NameCount[] = Array.from(severityMap.entries()).map(([k, count]) => ({
      key: k,
      nameEn: k,
      nameAr: k,
      count,
      percentage: Math.round((count / totalCount) * 100),
    }));

    const timeline = buildComplaintTimeline(dateFrom, dateTo, resolvedRows);
    const officers = await fetchComplaintsOfficersPerformance(this.prisma, filter, dateFrom, dateTo, hasExplicitDate);

    return {
      kpis: {
        totalCreated,
        openWorkload,
        unassigned,
        inProgress,
        resolved,
        closed,
        overdue,
        atRisk,
        avgResolutionHours,
        slaComplianceRate,
        deltas: {
          totalCreated: calculateDelta(totalCreated, prevCreated),
          openWorkload: calculateDelta(openWorkload, prevCreated),
          resolved: calculateDelta(resolved, prevResolved),
          closed: calculateDelta(closed, prevClosed),
          avgResolutionHours: calculateDelta(avgResolutionHours, prevAvgTatHours),
          slaComplianceRate: slaComplianceRate - prevSlaCompliance,
        },
      },
      timeline,
      statusBreakdown,
      categoryBreakdown,
      severityBreakdown,
      agingBuckets,
      officers,
    };
  }

  async getRecords(filter: ComplaintsAnalyticsFilter, limit = 25, offset = 0) {
    return fetchComplaintsRecords(this.prisma, filter, limit, offset);
  }
}
