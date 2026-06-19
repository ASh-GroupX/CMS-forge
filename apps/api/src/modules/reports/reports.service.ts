import { Injectable } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus, RoleCode, SlaStage, WorkingCalendarMode } from '@prisma/client';
import { AuditService } from '../../core/audit.service.js';
import { ComplaintsService } from '../complaints/complaints.service.js';
import type { ComplaintReportRow } from '../complaints/complaints.service.js';
import { SlaService } from '../sla/sla.service.js';
import { SurveysService } from '../surveys/surveys.service.js';
import { ReportsRepository } from './reports.repository.js';

export type DashboardReportScope = {
  role: RoleCode;
  branchId?: string | null;
  now?: Date | string;
};

export type DashboardSummary = {
  openComplaints: number;
  overdueComplaints: number;
  slaWarningComplaints: number;
  closedComplaints: number;
  averageTatHours: number;
};

export type FilteredReportInput = DashboardReportScope & {
  dateFrom?: Date | string | null;
  dateTo?: Date | string | null;
  filterBranchId?: string | null;
  categoryId?: string | null;
  severity?: ComplaintSeverity | null;
  ownerId?: string | null;
};

export type FilteredReportRow = ComplaintReportRow;
export type ReportExportFormat = 'csv' | 'excel';
export type ReportExportAudit = { actorId?: string | null; branchId?: string | null; correlationId?: string | null; ipAddress?: string | null; userAgent?: string | null };
export type ReportExportResult = { fileName: string; contentType: string; body: string; rowCount: number; rowLimit: number };

type DashboardComplaint = {
  branchId: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  createdAt: string;
  updatedAt: string;
};

const CLOSED_STATUSES = new Set<ComplaintStatus>([ComplaintStatus.CLOSED, ComplaintStatus.REJECTED]);
const SLA_WARNING_PERCENT = 80;
const HOUR_MS = 60 * 60 * 1000;
const NO_BRANCH_SCOPE = '__no_branch_scope__';
export const MAX_REPORT_EXPORT_ROWS = 1000;

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly complaintsService: ComplaintsService,
    private readonly slaService: SlaService,
    private readonly surveysService: SurveysService,
    private readonly auditService?: AuditService,
  ) {}

  async dashboardSummary(scope: DashboardReportScope): Promise<DashboardSummary> {
    const branchId = scopedBranchId(scope);
    const complaints = await this.complaintsService.listQueue({ branchId });
    const now = dateValue(scope.now ?? new Date());

    let overdueComplaints = 0;
    let slaWarningComplaints = 0;
    const closedTatHours: number[] = [];

    for (const complaint of branchFilter(complaints, branchId)) {
      if (complaint.status === ComplaintStatus.CLOSED) {
        closedTatHours.push(tatHours(complaint));
      }
      if (CLOSED_STATUSES.has(complaint.status)) {
        continue;
      }

      const deadline = this.slaService.calculateDeadline({
        severity: complaint.severity,
        stage: SlaStage.RESOLUTION,
        durationMinutes: this.slaService.defaultDurationMinutes(complaint.severity),
        warningPercent: SLA_WARNING_PERCENT,
        branchTimezone: 'UTC',
        workingCalendarMode: WorkingCalendarMode.ALWAYS_ON,
        enteredAt: complaint.createdAt,
      });

      if (new Date(deadline.dueAt).getTime() <= now.getTime()) {
        overdueComplaints += 1;
      } else if (new Date(deadline.warningAt).getTime() <= now.getTime()) {
        slaWarningComplaints += 1;
      }
    }

    const scopedComplaints = branchFilter(complaints, branchId);
    return {
      openComplaints: scopedComplaints.filter((complaint) => !CLOSED_STATUSES.has(complaint.status)).length,
      overdueComplaints,
      slaWarningComplaints,
      closedComplaints: scopedComplaints.filter((complaint) => complaint.status === ComplaintStatus.CLOSED).length,
      averageTatHours: average(closedTatHours),
    };
  }

  async filteredReport(input: FilteredReportInput): Promise<FilteredReportRow[]> {
    const branchId = effectiveBranchId(input);
    const rows = await this.complaintsService.listForReports({
      branchId,
      dateFrom: input.dateFrom ?? null,
      dateTo: input.dateTo ?? null,
      categoryId: input.categoryId ?? null,
      severity: input.severity ?? null,
      ownerId: input.ownerId ?? null,
    });
    return branchFilter(rows, branchId);
  }

  async exportReport(input: FilteredReportInput & { format: ReportExportFormat; rowLimit?: number }, audit: ReportExportAudit = {}): Promise<ReportExportResult> {
    const rowLimit = input.rowLimit ?? MAX_REPORT_EXPORT_ROWS;
    const rows = (await this.filteredReport(input)).slice(0, rowLimit);
    await this.auditService?.record({
      eventType: 'REPORT',
      action: 'report_exported',
      actorId: audit.actorId ?? null,
      branchId: audit.branchId ?? null,
      targetType: 'report',
      targetId: 'operational_reports',
      correlationId: audit.correlationId ?? null,
      ipAddress: audit.ipAddress ?? null,
      userAgent: audit.userAgent ?? null,
      metadata: { format: input.format, rowCount: rows.length, rowLimit },
    });
    return serializeExport(input.format, rows, rowLimit);
  }
}

function scopedBranchId(scope: DashboardReportScope): string | null {
  if (scope.role === RoleCode.ADMIN) {
    return scope.branchId ?? null;
  }
  return scope.branchId ?? NO_BRANCH_SCOPE;
}

function effectiveBranchId(input: FilteredReportInput): string | null {
  if (input.role === RoleCode.ADMIN) {
    return input.filterBranchId ?? input.branchId ?? null;
  }
  const scoped = scopedBranchId(input);
  if (input.filterBranchId && input.filterBranchId !== scoped) {
    return NO_BRANCH_SCOPE;
  }
  return scoped;
}

function branchFilter<T extends { branchId: string }>(complaints: T[], branchId: string | null): T[] {
  return branchId ? complaints.filter((complaint) => complaint.branchId === branchId) : complaints;
}

function tatHours(complaint: Pick<DashboardComplaint, 'createdAt' | 'updatedAt'>): number {
  return Math.max(0, (new Date(complaint.updatedAt).getTime() - new Date(complaint.createdAt).getTime()) / HOUR_MS);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function dateValue(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function serializeExport(format: ReportExportFormat, rows: FilteredReportRow[], rowLimit: number): ReportExportResult {
  const separator = format === 'csv' ? ',' : '\t';
  const body = [exportHeaders, ...rows.map(exportRow)].map((row) => row.map((cell) => quoteCell(cell, separator)).join(separator)).join('\n');
  return {
    fileName: format === 'csv' ? 'reports.csv' : 'reports.xls',
    contentType: format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.ms-excel; charset=utf-8',
    body: `${body}\n`,
    rowCount: rows.length,
    rowLimit,
  };
}

const exportHeaders = ['referenceNumber', 'branchId', 'categoryId', 'status', 'severity', 'subject', 'ownerId', 'createdAt', 'updatedAt'];

function exportRow(row: FilteredReportRow): Array<string | null> {
  return [row.referenceNumber, row.branchId, row.categoryId, row.status, row.severity, row.subject, row.ownerId, row.createdAt, row.updatedAt];
}

function quoteCell(value: string | null, separator: string): string {
  const text = value ?? '';
  return /["\n\r]/.test(text) || text.includes(separator) ? `"${text.replaceAll('"', '""')}"` : text;
}
