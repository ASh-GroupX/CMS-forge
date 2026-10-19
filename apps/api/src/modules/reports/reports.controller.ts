import { Controller, Get, Inject, Optional, Query, Req, Res, UseGuards } from '@nestjs/common';
import { BranchScoped, PermissionGuard, Permissions, RbacGuard, SessionAuthGuard } from '../../core/auth.guard.js';
import type { AuthenticatedRequest } from '../../core/auth.guard.js';
import type { ReportCatalogResponse } from './report-matrix.js';
import { ReportsService } from './reports.service.js';
import type { FilteredReportRow, ReportsKpiSummary, DashboardSummary } from './reports.service.js';
import { ReportsAnalyticsService } from './reports.analytics.service.js';
import {
  auditContext,
  dashboardScope,
  exportFormat,
  optionalSeverity,
  optionalText,
  pageNumber,
  reportInput,
  requestRole,
  scopedBranchId,
} from './reports.helpers.js';

type ExportResponse = { setHeader(name: string, value: string): void };

@Controller('reports')
export class ReportsController {
  private static reportsService: ReportsService;

  constructor(
    @Inject(ReportsService) reportsService: ReportsService,
    @Optional() @Inject(ReportsAnalyticsService) private readonly analyticsService?: ReportsAnalyticsService,
  ) {
    ReportsController.reportsService = reportsService;
  }

  @Get('catalog')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  catalog(): ReportCatalogResponse {
    return ReportsController.reportsService.reportCatalog();
  }

  @Get('dashboard')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  async dashboard(@Query('branchId') branchId: string | undefined, @Req() request: AuthenticatedRequest): Promise<{ summary: DashboardSummary }> {
    return { summary: await ReportsController.reportsService.dashboardSummary({ role: requestRole(request), branchId: scopedBranchId(branchId, request) }) };
  }

  @Get('kpis')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  async kpis(@Query('branchId') branchId: string | undefined, @Req() request: AuthenticatedRequest): Promise<{ kpis: ReportsKpiSummary }> {
    return { kpis: await ReportsController.reportsService.kpiSummary({ role: requestRole(request), branchId: scopedBranchId(branchId, request) }) };
  }

  @Get('premium-dashboard')
  @UseGuards(SessionAuthGuard)
  async premiumDashboard(@Query('branchId') branchId: string | undefined, @Req() request: AuthenticatedRequest) {
    return await ReportsController.reportsService.premiumDashboardSummary({ 
      role: requestRole(request), 
      branchId: scopedBranchId(branchId, request),
      userId: request.principal?.userId ?? null,
      departmentId: request.principal?.departmentId ?? null
    });
  }

  @Get()
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  async filteredReport(@Query() query: Record<string, string | undefined>, @Req() request: AuthenticatedRequest): Promise<{ items: FilteredReportRow[] }> {
    const limit = pageNumber(query.limit, 'limit', 25, 100);
    const offset = pageNumber(query.offset, 'offset', 0);
    return {
      items: await ReportsController.reportsService.filteredReport({
        role: requestRole(request),
        branchId: scopedBranchId(undefined, request),
        filterBranchId: optionalText(query.branchId),
        categoryId: optionalText(query.categoryId),
        departmentId: optionalText(query.departmentId),
        ownerId: optionalText(query.ownerId),
        severity: optionalSeverity(query.severity),
        dateFrom: optionalText(query.dateFrom),
        dateTo: optionalText(query.dateTo),
        limit,
        offset,
      }),
    };
  }

  @Get('export')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_EXPORT')
  @BranchScoped()
  async exportReport(@Query() query: Record<string, string | undefined>, @Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: ExportResponse): Promise<string> {
    const exportFile = await ReportsController.reportsService.exportReport({ ...reportInput(query, request), format: exportFormat(query.format) }, auditContext(request));
    response.setHeader('content-type', exportFile.contentType);
    response.setHeader('content-disposition', `attachment; filename="${exportFile.fileName}"`);
    response.setHeader('x-report-row-count', String(exportFile.rowCount));
    response.setHeader('x-report-row-limit', String(exportFile.rowLimit));
    return exportFile.body;
  }

  @Get('complaints-analytics')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  async complaintsAnalytics(@Query() query: Record<string, string | undefined>, @Req() request: AuthenticatedRequest) {
    return this.analyticsService?.complaintsAnalytics(
      {
        branchId: optionalText(query.branchId),
        departmentId: optionalText(query.departmentId),
        ownerId: optionalText(query.ownerId),
        categoryId: optionalText(query.categoryId),
        type: optionalText(query.type),
        severity: optionalSeverity(query.severity),
        status: optionalText(query.status) as any,
        dateDimension: optionalText(query.dateDimension) as any,
        dateFrom: optionalText(query.dateFrom),
        dateTo: optionalText(query.dateTo),
        search: optionalText(query.search),
      },
      dashboardScope(request, query.branchId),
    );
  }

  @Get('complaints-records')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  async complaintsRecords(@Query() query: Record<string, string | undefined>, @Req() request: AuthenticatedRequest) {
    const limit = pageNumber(query.limit, 'limit', 25, 100);
    const offset = pageNumber(query.offset, 'offset', 0);
    return this.analyticsService?.complaintsRecords(
      {
        branchId: optionalText(query.branchId),
        departmentId: optionalText(query.departmentId),
        ownerId: optionalText(query.ownerId),
        categoryId: optionalText(query.categoryId),
        type: optionalText(query.type),
        severity: optionalSeverity(query.severity),
        status: optionalText(query.status) as any,
        dateDimension: optionalText(query.dateDimension) as any,
        dateFrom: optionalText(query.dateFrom),
        dateTo: optionalText(query.dateTo),
        search: optionalText(query.search),
      },
      dashboardScope(request, query.branchId),
      limit,
      offset,
    );
  }

  @Get('tickets-analytics')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  async ticketsAnalytics(@Query() query: Record<string, string | undefined>, @Req() request: AuthenticatedRequest) {
    return this.analyticsService?.ticketsAnalytics(
      {
        branchId: optionalText(query.branchId),
        targetDepartmentId: optionalText(query.targetDepartmentId),
        creatingDepartmentId: optionalText(query.creatingDepartmentId),
        assignedEmployeeId: optionalText(query.assignedEmployeeId),
        categoryId: optionalText(query.categoryId),
        priority: optionalText(query.priority) as any,
        status: optionalText(query.status) as any,
        dateDimension: optionalText(query.dateDimension) as any,
        dateFrom: optionalText(query.dateFrom),
        dateTo: optionalText(query.dateTo),
        search: optionalText(query.search),
      },
      dashboardScope(request, query.branchId),
    );
  }

  @Get('tickets-records')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_VIEW')
  @BranchScoped()
  async ticketsRecords(@Query() query: Record<string, string | undefined>, @Req() request: AuthenticatedRequest) {
    const limit = pageNumber(query.limit, 'limit', 25, 100);
    const offset = pageNumber(query.offset, 'offset', 0);
    return this.analyticsService?.ticketsRecords(
      {
        branchId: optionalText(query.branchId),
        targetDepartmentId: optionalText(query.targetDepartmentId),
        creatingDepartmentId: optionalText(query.creatingDepartmentId),
        assignedEmployeeId: optionalText(query.assignedEmployeeId),
        categoryId: optionalText(query.categoryId),
        priority: optionalText(query.priority) as any,
        status: optionalText(query.status) as any,
        dateDimension: optionalText(query.dateDimension) as any,
        dateFrom: optionalText(query.dateFrom),
        dateTo: optionalText(query.dateTo),
        search: optionalText(query.search),
      },
      dashboardScope(request, query.branchId),
      limit,
      offset,
    );
  }

  @Get('export-advanced')
  @UseGuards(SessionAuthGuard, PermissionGuard, RbacGuard)
  @Permissions('REPORT_EXPORT')
  @BranchScoped()
  async exportAdvanced(
    @Query() query: Record<string, string | undefined>,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: ExportResponse,
  ): Promise<string> {
    const type = query.reportType === 'internal_tickets' ? 'internal_tickets' : 'complaints';
    const format = exportFormat(query.format);
    const exportFile = (await this.analyticsService?.exportAdvanced(
      type,
      query,
      format,
      dashboardScope(request, query.branchId),
      auditContext(request),
    )) ?? { fileName: 'report.csv', contentType: 'text/csv', body: '', rowCount: 0, rowLimit: 1000 };

    response.setHeader('content-type', exportFile.contentType);
    response.setHeader('content-disposition', `attachment; filename="${exportFile.fileName}"`);
    response.setHeader('x-report-row-count', String(exportFile.rowCount));
    return exportFile.body;
  }
}
