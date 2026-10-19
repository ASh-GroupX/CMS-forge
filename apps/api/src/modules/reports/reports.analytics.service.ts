import { Injectable } from '@nestjs/common';
import { RoleCode } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import { ReportsComplaintsRepository } from './reports.complaints.repository.js';
import { ReportsTicketsRepository } from './reports.tickets.repository.js';
import type { ComplaintsAnalyticsFilter } from './reports.complaints.js';
import type { TicketsAnalyticsFilter } from './reports.tickets.js';
import type { DashboardReportScope, ReportExportAudit, ReportExportFormat, ReportExportResult } from './reports.service.js';

@Injectable()
export class ReportsAnalyticsService {
  constructor(
    private readonly complaintsRepo: ReportsComplaintsRepository,
    private readonly ticketsRepo: ReportsTicketsRepository,
    private readonly auditService?: AuditService,
  ) {}

  async complaintsAnalytics(filter: ComplaintsAnalyticsFilter, scope: DashboardReportScope) {
    const effectiveFilter: ComplaintsAnalyticsFilter = {
      ...filter,
      branchId: (scope.role === RoleCode.ADMIN ? (filter.branchId ?? scope.branchId) : scope.branchId) ?? null,
      departmentId: (filter.departmentId ?? (scope.role !== RoleCode.ADMIN && scope.role !== RoleCode.CR_MANAGER ? scope.departmentId : null)) ?? null,
    };
    return this.complaintsRepo.getAnalytics(effectiveFilter);
  }

  async complaintsRecords(filter: ComplaintsAnalyticsFilter, scope: DashboardReportScope, limit = 25, offset = 0) {
    const effectiveFilter: ComplaintsAnalyticsFilter = {
      ...filter,
      branchId: (scope.role === RoleCode.ADMIN ? (filter.branchId ?? scope.branchId) : scope.branchId) ?? null,
      departmentId: (filter.departmentId ?? (scope.role !== RoleCode.ADMIN && scope.role !== RoleCode.CR_MANAGER ? scope.departmentId : null)) ?? null,
    };
    return this.complaintsRepo.getRecords(effectiveFilter, limit, offset);
  }

  async ticketsAnalytics(filter: TicketsAnalyticsFilter, scope: DashboardReportScope) {
    const effectiveFilter: TicketsAnalyticsFilter = {
      ...filter,
      branchId: (scope.role === RoleCode.ADMIN ? (filter.branchId ?? scope.branchId) : scope.branchId) ?? null,
      targetDepartmentId: (filter.targetDepartmentId ?? (scope.role !== RoleCode.ADMIN && scope.role !== RoleCode.CR_MANAGER ? scope.departmentId : null)) ?? null,
    };
    return this.ticketsRepo.getAnalytics(effectiveFilter);
  }

  async ticketsRecords(filter: TicketsAnalyticsFilter, scope: DashboardReportScope, limit = 25, offset = 0) {
    const effectiveFilter: TicketsAnalyticsFilter = {
      ...filter,
      branchId: (scope.role === RoleCode.ADMIN ? (filter.branchId ?? scope.branchId) : scope.branchId) ?? null,
      targetDepartmentId: (filter.targetDepartmentId ?? (scope.role !== RoleCode.ADMIN && scope.role !== RoleCode.CR_MANAGER ? scope.departmentId : null)) ?? null,
    };
    return this.ticketsRepo.getRecords(effectiveFilter, limit, offset);
  }

  async exportAdvanced(
    type: 'complaints' | 'internal_tickets',
    filter: any,
    format: ReportExportFormat,
    scope: DashboardReportScope,
    audit: ReportExportAudit = {},
  ): Promise<ReportExportResult> {
    const separator = format === 'csv' ? ',' : '\t';
    let headers: string[] = [];
    let rows: Array<string | null>[] = [];

    if (type === 'complaints') {
      const records = await this.complaintsRecords(filter, scope, 1000, 0);
      headers = ['Reference', 'Subject', 'Status', 'Severity', 'Customer', 'Phone', 'Department', 'Owner', 'Created At', 'Resolved At', 'Closed At'];
      rows = records.items.map((r) => [
        r.referenceNumber,
        r.subject,
        r.status,
        r.severity,
        r.customerName,
        r.customerPhone,
        r.departmentName,
        r.ownerName,
        r.createdAt,
        r.resolvedAt,
        r.closedAt,
      ]);
    } else {
      const records = await this.ticketsRecords(filter, scope, 1000, 0);
      headers = ['Reference', 'Title', 'Status', 'Priority', 'Creating Department', 'Handling Department', 'Requested By', 'Assigned To', 'Created At', 'Due At', 'Resolved At'];
      rows = records.items.map((r) => [
        r.referenceNumber,
        r.title,
        r.status,
        r.priority,
        r.creatingDepartmentName,
        r.targetDepartmentName,
        r.requestedByName,
        r.assignedEmployeeName,
        r.createdAt,
        r.dueAt,
        r.resolvedAt,
      ]);
    }

    await this.auditService?.record({
      eventType: 'REPORT',
      action: 'report_exported',
      actorId: audit.actorId ?? null,
      branchId: audit.branchId ?? null,
      targetType: 'report',
      targetId: type,
      correlationId: audit.correlationId ?? null,
      ipAddress: audit.ipAddress ?? null,
      userAgent: audit.userAgent ?? null,
      metadata: { type, format, rowCount: rows.length, filter },
    });

    const body = [headers, ...rows]
      .map((row) => row.map((cell) => quoteCell(cell, separator)).join(separator))
      .join('\n');

    return {
      fileName: `${type}-report.${format === 'csv' ? 'csv' : 'xls'}`,
      contentType: format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.ms-excel; charset=utf-8',
      body: `${body}\n`,
      rowCount: rows.length,
      rowLimit: 1000,
    };
  }
}

function quoteCell(value: string | null, separator: string): string {
  const text = value ?? '';
  return /["\n\r]/.test(text) || text.includes(separator) ? `"${text.replaceAll('"', '""')}"` : text;
}
