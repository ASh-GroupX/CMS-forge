import { Controller, Get, HttpStatus, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ComplaintSeverity, RoleCode } from '@prisma/client';
import { BranchScoped, RbacGuard, Roles, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import { AppException } from '../../core/http-kernel.js';
import { ReportsService } from './reports.service.js';
import type { DashboardSummary, FilteredReportRow, ReportExportFormat, ReportsKpiSummary } from './reports.service.js';

type ExportResponse = { setHeader(name: string, value: string): void };

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async dashboard(@Query('branchId') branchId: string | undefined, @Req() request: AuthenticatedRequest): Promise<{ summary: DashboardSummary }> {
    return { summary: await this.reportsService.dashboardSummary({ role: requestRole(request), branchId: scopedBranchId(branchId, request) }) };
  }

  @Get('kpis')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async kpis(@Query('branchId') branchId: string | undefined, @Req() request: AuthenticatedRequest): Promise<{ kpis: ReportsKpiSummary }> {
    return { kpis: await this.reportsService.kpiSummary({ role: requestRole(request), branchId: scopedBranchId(branchId, request) }) };
  }

  @Get()
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async filteredReport(@Query() query: Record<string, string | undefined>, @Req() request: AuthenticatedRequest): Promise<{ items: FilteredReportRow[] }> {
    return {
      items: await this.reportsService.filteredReport({
        role: requestRole(request),
        branchId: scopedBranchId(undefined, request),
        filterBranchId: optionalText(query.branchId),
        categoryId: optionalText(query.categoryId),
        ownerId: optionalText(query.ownerId),
        severity: optionalSeverity(query.severity),
        dateFrom: optionalText(query.dateFrom),
        dateTo: optionalText(query.dateTo),
      }),
    };
  }

  @Get('export')
  @UseGuards(SessionAuthGuard, RbacGuard)
  @Roles(RoleCode.CR_MANAGER, RoleCode.BRANCH_MANAGER, RoleCode.ADMIN)
  @BranchScoped()
  async exportReport(@Query() query: Record<string, string | undefined>, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: ExportResponse): Promise<string> {
    const exportFile = await this.reportsService.exportReport({ ...reportInput(query, request), format: exportFormat(query.format) }, auditContext(request));
    response.setHeader('content-type', exportFile.contentType);
    response.setHeader('content-disposition', `attachment; filename="${exportFile.fileName}"`);
    response.setHeader('x-report-row-count', String(exportFile.rowCount));
    response.setHeader('x-report-row-limit', String(exportFile.rowLimit));
    return exportFile.body;
  }
}

function reportInput(query: Record<string, string | undefined>, request: AuthenticatedRequest) {
  return {
    role: requestRole(request),
    branchId: scopedBranchId(undefined, request),
    filterBranchId: optionalText(query.branchId),
    categoryId: optionalText(query.categoryId),
    ownerId: optionalText(query.ownerId),
    severity: optionalSeverity(query.severity),
    dateFrom: optionalText(query.dateFrom),
    dateTo: optionalText(query.dateTo),
  };
}

function auditContext(request: AuthenticatedRequest) {
  return {
    actorId: request.principal?.userId ?? null,
    branchId: request.principal?.branchId ?? null,
    correlationId: request.correlationId ?? headerValue(request.headers['x-correlation-id']),
    ipAddress: headerValue(request.headers['x-forwarded-for'])?.split(',')[0]?.trim() ?? request.socket?.remoteAddress ?? null,
    userAgent: headerValue(request.headers['user-agent']),
  };
}

function requestRole(request: AuthenticatedRequest): RoleCode {
  return request.principal?.roleCode as RoleCode;
}

function scopedBranchId(queryBranchId: string | undefined, request: AuthenticatedRequest): string | null {
  if (request.principal?.roleCode === RoleCode.ADMIN) {
    return optionalText(queryBranchId);
  }
  return request.principal?.branchId ?? null;
}

function optionalText(value: string | undefined): string | null {
  return value?.trim() || null;
}

function optionalSeverity(value: string | undefined): ComplaintSeverity | null {
  if (!value?.trim()) {
    return null;
  }
  if (Object.values(ComplaintSeverity).includes(value as ComplaintSeverity)) {
    return value as ComplaintSeverity;
  }
  throw new AppException('VALIDATION_FAILED', 'Invalid report query', HttpStatus.BAD_REQUEST, [
    { field: 'severity', code: 'INVALID', message: 'severity is invalid.' },
  ]);
}

function exportFormat(value: string | undefined): ReportExportFormat {
  if (value === 'csv' || value === 'excel') {
    return value;
  }
  throw new AppException('VALIDATION_FAILED', 'Invalid report query', HttpStatus.BAD_REQUEST, [
    { field: 'format', code: 'INVALID', message: 'format must be csv or excel.' },
  ]);
}

function headerValue(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}
