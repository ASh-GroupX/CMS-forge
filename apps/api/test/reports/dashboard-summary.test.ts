import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus, ComplaintTransitionAction, RoleCode, SlaEventType, WorkingCalendarMode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { PermissionGuard, RbacGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { ReportsController } from '../../src/modules/reports/reports.controller.ts';
import { ReportsRepository } from '../../src/modules/reports/reports.repository.js';
import { ReportsService } from '../../src/modules/reports/reports.service.js';
import type { DashboardReadRows } from '../../src/modules/reports/reports.repository.js';
import type { ReportsKpiSummary } from '../../src/modules/reports/reports.service.js';
import type { ComplaintsService } from '../../src/modules/complaints/complaints.service.js';
import type { SlaService } from '../../src/modules/sla/sla.service.js';
import type { SurveysService } from '../../src/modules/surveys/surveys.service.js';

const now = '2026-01-05T00:00:00.000Z';
const complaints = [
  complaint('a-overdue', 'branch-a', ComplaintStatus.IN_PROGRESS, ComplaintSeverity.CRITICAL, '2026-01-04T21:00:00.000Z', '2026-01-04T21:00:00.000Z', 'cat-powertrain', 'owner-a', 'dept-service'),
  complaint('a-warning', 'branch-a', ComplaintStatus.SUBMITTED, ComplaintSeverity.MEDIUM, '2026-01-04T04:30:00.000Z', '2026-01-04T04:30:00.000Z', 'cat-service', 'owner-b', 'dept-service'),
  complaint('a-closed', 'branch-a', ComplaintStatus.CLOSED, ComplaintSeverity.LOW, '2026-01-01T00:00:00.000Z', '2026-01-04T12:00:00.000Z', 'cat-service', 'owner-b', 'dept-sales', '2026-01-03T00:00:00.000Z'),
  complaint('b-hidden', 'branch-b', ComplaintStatus.IN_PROGRESS, ComplaintSeverity.CRITICAL, '2026-01-04T20:00:00.000Z', '2026-01-04T20:00:00.000Z', 'cat-powertrain', 'owner-a', 'dept-service'),
];

test('dashboard summary counts branch-scoped allowed data', async () => {
  const service = reportsService();

  assert.deepEqual(await service.dashboardSummary({ role: RoleCode.BRANCH_MANAGER, branchId: 'branch-a', now }), {
    openComplaints: 2,
    overdueComplaints: 1,
    slaWarningComplaints: 1,
    closedComplaints: 1,
    averageTatHours: 48,
  });
});

test('dashboard summary hides complaints outside the scoped branch', async () => {
  const service = reportsService();

  assert.equal((await service.dashboardSummary({ role: RoleCode.BRANCH_MANAGER, branchId: 'branch-a', now })).overdueComplaints, 1);
  assert.equal((await service.dashboardSummary({ role: RoleCode.ADMIN, now })).overdueComplaints, 2);
});

test('filtered report applies date, branch, category, severity, and owner filters', async () => {
  const service = reportsService();

  const rows = await service.filteredReport({
    role: RoleCode.ADMIN,
    filterBranchId: 'branch-a',
    categoryId: 'cat-service',
    severity: ComplaintSeverity.MEDIUM,
    ownerId: 'owner-b',
    dateFrom: '2026-01-04T00:00:00.000Z',
    dateTo: '2026-01-05T00:00:00.000Z',
  });

  assert.deepEqual(rows.map((row) => row.id), ['a-warning']);
});

test('filtered report applies department filter when the report model has department data', async () => {
  const service = reportsService();

  const rows = await service.filteredReport({
    role: RoleCode.ADMIN,
    filterBranchId: 'branch-a',
    departmentId: 'dept-sales',
  });

  assert.deepEqual(rows.map((row) => row.id), ['a-closed']);
});

test('filtered report denies out-of-branch rows for scoped users', async () => {
  const service = reportsService();

  assert.deepEqual(await service.filteredReport({ role: RoleCode.BRANCH_MANAGER, branchId: 'branch-a', filterBranchId: 'branch-b' }), []);
});

test('filtered export denies out-of-branch rows for scoped users', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const service = reportsService({ record: async (input) => auditRecords.push(input) } as AuditService);

  const exported = await service.exportReport({
    role: RoleCode.BRANCH_MANAGER,
    branchId: 'branch-a',
    filterBranchId: 'branch-b',
    format: 'csv',
  });

  assert.equal(exported.rowCount, 0);
  assert.equal(exported.body.split('\n').filter(Boolean).length, 1);
  assert.deepEqual(auditRecords[0]?.metadata, {
    format: 'csv',
    rowCount: 0,
    rowLimit: 1000,
    filters: { filterBranchId: 'branch-b', categoryId: null, departmentId: null, severity: null, ownerId: null, dateFrom: null, dateTo: null },
  });
});

test('reports route derives role and branch scope from the request principal', async () => {
  const calls: unknown[] = [];
  const controller = new ReportsController({
    dashboardSummary: async (input: unknown) => {
      calls.push(input);
      return { openComplaints: 1, overdueComplaints: 0, slaWarningComplaints: 0, closedComplaints: 0, averageTatHours: 0 };
    },
  } as ReportsService);

  assert.deepEqual(await controller.dashboard('branch-b', request(branchManager, '/reports/dashboard?branchId=branch-b')), {
    summary: { openComplaints: 1, overdueComplaints: 0, slaWarningComplaints: 0, closedComplaints: 0, averageTatHours: 0 },
  });
  assert.deepEqual(calls[0], { role: RoleCode.BRANCH_MANAGER, branchId: 'branch-a' });
});

test('reports KPI route derives scope from the principal and returns aggregate values only', async () => {
  const calls: unknown[] = [];
  const controller = new ReportsController({
    kpiSummary: async (input: unknown) => {
      calls.push(input);
      return kpiSummary;
    },
  } as ReportsService);

  const result = await controller.kpis('branch-b', request(branchManager, '/reports/kpis?branchId=branch-b'));

  assert.deepEqual(calls[0], { role: RoleCode.BRANCH_MANAGER, branchId: 'branch-a' });
  assert.deepEqual(result, { kpis: kpiSummary });
  assert.equal('closedCountLeaderboard' in result.kpis, false);
});

test('report catalog reconciles RPT-001 through RPT-017 with signed deferrals', () => {
  const catalog = reportsService().reportCatalog();
  const expectedIds = Array.from({ length: 17 }, (_value, index) => `RPT-${String(index + 1).padStart(3, '0')}`);

  assert.deepEqual(catalog.items.map((item) => item.id), expectedIds);
  assert.deepEqual(catalog.summary, { total: 17, delivered: 4, deferred: 13, signoffRequired: 13 });
  for (const item of catalog.items) {
    assert.ok(item.requiredFilters.length > 0);
    assert.ok(item.requiredOutputs.length > 0);
    if (item.status === 'DELIVERED') {
      assert.equal(item.signoffRequired, false);
      assert.deepEqual(item.deferred, []);
    } else {
      assert.equal(item.signoffRequired, true);
      assert.ok(item.deferred.length > 0);
    }
  }
  assert.equal(catalog.items.find((item) => item.id === 'RPT-015')?.status, 'DEFERRED');
  assert.equal(catalog.items.find((item) => item.id === 'RPT-017')?.status, 'DELIVERED');
  const catalogJson = JSON.stringify(catalog).toLowerCase();
  for (const forbidden of ['password', 'otp', 'sessiontoken', 'credential', 'secret', 'storagekey', 'publicurl', 'customerphone', 'customeremail']) {
    assert.equal(catalogJson.includes(forbidden), false);
  }
});

test('reports catalog route returns the public matrix from the guarded report service', () => {
  const catalog = reportsService().reportCatalog();
  const controller = new ReportsController({ reportCatalog: () => catalog } as ReportsService);

  assert.deepEqual(controller.catalog(), catalog);
});

test('reports export route keeps controller binding and preserves filters', async () => {
  const calls: unknown[] = [];
  const headers: Record<string, string> = {};
  new ReportsController({
    exportReport: async (input: unknown) => {
      calls.push(input);
      return {
        fileName: 'reports.csv',
        contentType: 'text/csv; charset=utf-8',
        body: 'referenceNumber\nCMP-1\n',
        rowCount: 1,
        rowLimit: 1000,
      };
    },
  } as ReportsService);

  const handler = ReportsController.prototype.exportReport;
  const body = await handler(
    { format: 'csv', branchId: 'branch-a', categoryId: 'cat-service', ownerId: 'owner-b' },
    request(branchManager, '/reports/export?format=csv&branchId=branch-a&categoryId=cat-service&ownerId=owner-b'),
    { setHeader: (name, value) => { headers[name] = value; } },
  );

  assert.equal(body, 'referenceNumber\nCMP-1\n');
  assert.equal(headers['content-type'], 'text/csv; charset=utf-8');
  assert.equal(headers['content-disposition'], 'attachment; filename="reports.csv"');
  assert.equal(headers['x-report-row-count'], '1');
  assert.deepEqual(calls[0], {
    role: RoleCode.BRANCH_MANAGER,
    branchId: 'branch-a',
    filterBranchId: 'branch-a',
    categoryId: 'cat-service',
    departmentId: null,
    ownerId: 'owner-b',
    severity: null,
    dateFrom: null,
    dateTo: null,
    format: 'csv',
  });
});

test('filtered report rows match the public ReportRow contract exactly', async () => {
  const [row] = await reportsService().filteredReport({ role: RoleCode.ADMIN, filterBranchId: 'branch-a' });

  assert.deepEqual(Object.keys(row!).sort(), ['branchId', 'categoryId', 'createdAt', 'id', 'ownerId', 'referenceNumber', 'severity', 'status', 'subject', 'updatedAt']);
  const rowJson = JSON.stringify(row).toLowerCase();
  for (const forbidden of ['branchname', 'ownername', 'customerphone', 'customeremail', 'vin', 'plate', 'dms', 'audit', 'provider', 'portal', 'secret', 'token', 'credential']) {
    assert.equal(rowJson.includes(forbidden), false);
  }
});

test('management read-only report rows stay scoped and contain no sensitive fields', async () => {
  const calls: unknown[] = [];
  const service = reportsService(undefined, calls);

  const [row] = await service.filteredReport({ role: RoleCode.MGMT_READONLY, branchId: 'branch-a', filterBranchId: 'branch-a' });

  assert.deepEqual(calls[0], {
    branchId: 'branch-a',
    dateFrom: null,
    dateTo: null,
    categoryId: null,
    departmentId: null,
    severity: null,
    ownerId: null,
    role: RoleCode.MGMT_READONLY,
  });
  assert.deepEqual(Object.keys(row!).sort(), ['branchId', 'categoryId', 'createdAt', 'id', 'ownerId', 'referenceNumber', 'severity', 'status', 'subject', 'updatedAt']);
  for (const forbidden of ['customerPhone', 'customerEmail', 'vin', 'plate', 'compensation', 'fileName']) {
    assert.equal(JSON.stringify(row).includes(forbidden), false);
  }
});

test('report export audit metadata uses only the allowlisted filter snapshot', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const service = reportsService({ record: async (input) => auditRecords.push(input) } as AuditService);

  await service.exportReport({
    role: RoleCode.ADMIN,
    filterBranchId: 'branch-a',
    categoryId: 'cat-service',
    departmentId: 'dept-service',
    severity: ComplaintSeverity.MEDIUM,
    ownerId: 'owner-b',
    dateFrom: '2026-01-04T00:00:00.000Z',
    dateTo: '2026-01-05T00:00:00.000Z',
    format: 'csv',
  });

  assert.deepEqual(auditRecords[0]?.metadata, {
    format: 'csv',
    rowCount: 1,
    rowLimit: 1000,
    filters: {
      filterBranchId: 'branch-a',
      categoryId: 'cat-service',
      departmentId: 'dept-service',
      severity: ComplaintSeverity.MEDIUM,
      ownerId: 'owner-b',
      dateFrom: '2026-01-04T00:00:00.000Z',
      dateTo: '2026-01-05T00:00:00.000Z',
    },
  });
  const auditJson = JSON.stringify(auditRecords).toLowerCase();
  for (const forbidden of ['password', 'otp', 'token', 'credential', 'secret', 'rawurl', 'body']) {
    assert.equal(auditJson.includes(forbidden), false);
  }
});

test('report routes use permission guard and keep branch scope guard', () => {
  for (const handler of ['catalog', 'dashboard', 'kpis', 'filteredReport'] as Array<keyof ReportsController>) {
    assert.deepEqual(guardNames(handler), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard']);
  }
  assert.deepEqual(guardNames('exportReport'), ['SessionAuthGuard', 'PermissionGuard', 'RbacGuard']);
});

test('report view permission allows dashboard, kpis, and list, and denies missing permission safely', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new PermissionGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  for (const handler of [ReportsController.prototype.catalog, ReportsController.prototype.dashboard, ReportsController.prototype.kpis, ReportsController.prototype.filteredReport]) {
    assert.equal(await guard.canActivate(context(request(branchManager, '/reports'), handler)), true);
  }

  await assert.rejects(
    guard.canActivate(context(request({ ...employee, permissions: [] }, '/reports?password=leaked&sessionToken=leaked'), ReportsController.prototype.filteredReport)),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assertSafePermissionAudit(auditRecords, 'REPORT_VIEW');
});

test('report export permission allows export and denies missing permission safely', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new PermissionGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  assert.equal(await guard.canActivate(context(request(branchManager, '/reports/export'), ReportsController.prototype.exportReport)), true);
  await assert.rejects(
    guard.canActivate(context(request({ ...branchManager, roleCode: RoleCode.MGMT_READONLY, permissions: ['REPORT_VIEW'] }, '/reports/export'), ReportsController.prototype.exportReport)),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  await assert.rejects(
    guard.canActivate(context(request({ ...branchManager, permissions: [] }, '/reports/export?password=leaked&sessionToken=leaked'), ReportsController.prototype.exportReport)),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
  assertSafePermissionAudit(auditRecords, 'REPORT_EXPORT');
});

test('management read-only principal with REPORT_VIEW is not blocked by old role metadata', async () => {
  const permissionGuard = new PermissionGuard(new Reflector(), { record: async () => undefined } as AuditService);
  const branchGuard = new RbacGuard(new Reflector(), { record: async () => undefined } as AuditService);
  const req = request({ ...branchManager, roleCode: RoleCode.MGMT_READONLY, permissions: ['REPORT_VIEW'] }, '/reports/kpis');

  assert.equal(await permissionGuard.canActivate(context(req, ReportsController.prototype.kpis)), true);
  assert.equal(await branchGuard.canActivate(context(req, ReportsController.prototype.kpis)), true);
});

test('reports route branch-scope denial is audited by the RBAC guard', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  await assert.rejects(
    guard.canActivate(context(request(branchManager, '/reports?branchId=branch-b'), ReportsController.prototype.filteredReport)),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.action, 'branch_scope_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata, { deniedBranchId: 'branch-b' });
});

test('reports KPI route cross-branch request is denied and audited', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const guard = new RbacGuard(new Reflector(), { record: async (input) => auditRecords.push(input) } as AuditService);

  await assert.rejects(
    guard.canActivate(context(request(branchManager, '/reports/kpis?branchId=branch-b'), ReportsController.prototype.kpis)),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );
  assert.equal(auditRecords[0]?.action, 'branch_scope_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata, { deniedBranchId: 'branch-b' });
});

test('reports catalog OpenAPI documents the delivery matrix response', () => {
  const openapi = JSON.parse(readFileSync('packages/contracts/openapi.json', 'utf8'));

  assert.ok(openapi.paths['/reports/catalog']?.get);
  assert.equal(openapi.paths['/reports/catalog'].get.operationId, 'reportsCatalog');
  assert.ok(openapi.components.schemas.ReportCatalogResponse);
  assert.ok(JSON.stringify(openapi.components.schemas.ReportCatalogItem).includes('signoffRequired'));
});

test('reports KPI OpenAPI documents aggregate-only response', () => {
  const openapi = JSON.parse(readFileSync('packages/contracts/openapi.json', 'utf8'));

  assert.ok(openapi.paths['/reports/kpis']?.get);
  assert.equal(JSON.stringify(openapi.components.schemas.ReportKpiResponse).includes('closedCount'), false);
  assert.equal(JSON.stringify(openapi.components.schemas.ReportKpiSummary).includes('leaderboard'), false);
});

test('report export is row-limited and writes REPORT audit', async () => {
  const auditRecords: AuditRecordInput[] = [];
  const service = reportsService({ record: async (input) => auditRecords.push(input) } as AuditService);

  const exported = await service.exportReport(
    { role: RoleCode.ADMIN, format: 'csv', rowLimit: 1 },
    { actorId: 'usr_admin', branchId: 'branch-a', correlationId: 'req_export' },
  );

  assert.equal(exported.rowCount, 1);
  assert.equal(exported.rowLimit, 1);
  assert.equal(exported.fileName, 'reports.csv');
  assert.equal(exported.body.split('\n').filter(Boolean).length, 2);
  assert.equal(auditRecords[0]?.eventType, 'REPORT');
  assert.equal(auditRecords[0]?.action, 'report_exported');
  assert.deepEqual(auditRecords[0]?.metadata, {
    format: 'csv',
    rowCount: 1,
    rowLimit: 1,
    filters: { filterBranchId: null, categoryId: null, departmentId: null, severity: null, ownerId: null, dateFrom: null, dateTo: null },
  });
});

function reportsService(auditService?: AuditService, complaintCalls: unknown[] = []): ReportsService {
  const complaintsService = {
    async listQueue({ branchId }: { branchId?: string | null } = {}) {
      return branchId ? complaints.filter((item) => item.branchId === branchId) : complaints;
    },
    async listForReports(filter: {
      branchId?: string | null;
      dateFrom?: Date | string | null;
      dateTo?: Date | string | null;
      categoryId?: string | null;
      departmentId?: string | null;
      severity?: ComplaintSeverity | null;
      ownerId?: string | null;
      role?: RoleCode | null;
    } = {}) {
      complaintCalls.push(filter);
      return complaints.filter((item) => {
        const createdAt = new Date(item.createdAt).getTime();
        return (!filter.branchId || item.branchId === filter.branchId)
          && (!filter.categoryId || item.categoryId === filter.categoryId)
          && (!filter.departmentId || item.departmentId === filter.departmentId)
          && (!filter.severity || item.severity === filter.severity)
          && (!filter.ownerId || item.ownerId === filter.ownerId)
          && (!filter.dateFrom || createdAt >= new Date(filter.dateFrom).getTime())
          && (!filter.dateTo || createdAt <= new Date(filter.dateTo).getTime());
      }).map(reportRow);
    },
  } as ComplaintsService;

  const slaService = {
    defaultDurationMinutes(severity: ComplaintSeverity) {
      return severity === ComplaintSeverity.CRITICAL ? 120 : 1440;
    },
    calculateDeadline(input: { durationMinutes?: number; warningPercent?: number; enteredAt?: Date | string; workingCalendarMode?: WorkingCalendarMode }) {
      assert.equal(input.workingCalendarMode, WorkingCalendarMode.ALWAYS_ON);
      const enteredAt = new Date(input.enteredAt ?? now).getTime();
      const durationMs = Number(input.durationMinutes) * 60_000;
      const warningMs = Math.round((durationMs * Number(input.warningPercent)) / 100);
      return {
        policyId: null,
        severity: ComplaintSeverity.MEDIUM,
        stage: 'RESOLUTION',
        branchTimezone: 'UTC',
        enteredAt: new Date(enteredAt).toISOString(),
        warningAt: new Date(enteredAt + warningMs).toISOString(),
        dueAt: new Date(enteredAt + durationMs).toISOString(),
      };
    },
  } as SlaService;

  const repository = {
    async listDashboardRows(branchId: string | null): Promise<DashboardReadRows> {
      return complaints.filter((item) => !branchId || item.branchId === branchId).map((item) => ({
        id: item.id,
        branchId: item.branchId,
        status: item.status,
        severity: item.severity,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        closedAt: item.closedAt ? new Date(item.closedAt) : null,
        statusHistory: item.closedAt ? [statusEvent(item.id, ComplaintStatus.CLOSED, ComplaintTransitionAction.CLOSE, item.closedAt)] : [],
        slaEvents: item.id === 'a-overdue' ? [slaEvent(item.id, SlaEventType.BREACH, '2026-01-04T23:30:00.000Z')] : [],
      }));
    },
  } as ReportsRepository;

  return new ReportsService(repository, complaintsService, slaService, {} as SurveysService, auditService);
}

function complaint(
  id: string,
  branchId: string,
  status: ComplaintStatus,
  severity: ComplaintSeverity,
  createdAt: string,
  updatedAt = createdAt,
  categoryId = 'cat-service',
  ownerId: string | null = null,
  departmentId: string | null = null,
  closedAt: string | null = null,
) {
  return {
    id,
    referenceNumber: id,
    branchId,
    status,
    severity,
    categoryId,
    departmentId,
    subject: id,
    ownerId,
    createdAt,
    updatedAt,
    closedAt,
  };
}

function reportRow(item: ReturnType<typeof complaint>) {
  return {
    id: item.id,
    referenceNumber: item.referenceNumber,
    branchId: item.branchId,
    categoryId: item.categoryId,
    status: item.status,
    severity: item.severity,
    subject: item.subject,
    ownerId: item.ownerId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function statusEvent(recordId: string, toStatus: ComplaintStatus, action: ComplaintTransitionAction | null, createdAt: string) {
  return { recordId, toStatus, action, createdAt: new Date(createdAt) };
}

function slaEvent(recordId: string, type: SlaEventType, occurredAt: string) {
  return { recordId, type, occurredAt: new Date(occurredAt) };
}

const branchManager: StaffPrincipal = {
  sessionId: 'ses_reports',
  userId: 'usr_branch',
  email: 'branch@cms-auto.test',
  nameEn: 'Branch Manager',
  nameAr: 'Branch Manager',
  roleCode: RoleCode.BRANCH_MANAGER,
  permissions: ['REPORT_VIEW', 'REPORT_EXPORT'],
  branchId: 'branch-a',
};

const admin: StaffPrincipal = { ...branchManager, userId: 'usr_admin', roleCode: RoleCode.ADMIN, branchId: null };
const employee: StaffPrincipal = { ...branchManager, userId: 'usr_employee', roleCode: RoleCode.CR_OFFICER, permissions: [] };

const kpiSummary = {
  onTimeCompletionPercent: 100,
  activeOverdueCount: 1,
  averageDelayHours: 0,
  customerPromiseKeptPercent: 100,
  reopenedCount: 0,
  reopenRate: 0,
  escalationCount: 0,
  slaBreachRate: 0,
  medianTatHours: 0,
  agingBuckets: { zeroToOneDays: 0, twoToThreeDays: 0, fourToSevenDays: 0, overSevenDays: 0 },
  averageFirstResponseHours: 1,
  averageResolutionHours: 2,
} satisfies ReportsKpiSummary;

function request(principal: StaffPrincipal, url: string): AuthenticatedRequest {
  return {
    principal,
    method: 'GET',
    url,
    correlationId: 'req_reports',
    headers: { 'x-forwarded-for': '203.0.113.77, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.77' },
  };
}

function context(
  req: AuthenticatedRequest,
  handler: typeof ReportsController.prototype.catalog | typeof ReportsController.prototype.dashboard | typeof ReportsController.prototype.kpis | typeof ReportsController.prototype.filteredReport | typeof ReportsController.prototype.exportReport,
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => handler,
    getClass: () => ReportsController,
  } as ExecutionContext;
}

function guardNames(handler: keyof ReportsController): string[] {
  return (Reflect.getMetadata(GUARDS_METADATA, ReportsController.prototype[handler]) as Array<{ name: string }>).map(({ name }) => name);
}

function assertSafePermissionAudit(auditRecords: AuditRecordInput[], permission: string): void {
  assert.equal(auditRecords[0]?.eventType, 'SECURITY');
  assert.equal(auditRecords[0]?.action, 'permission_forbidden');
  assert.deepEqual(auditRecords[0]?.metadata?.requiredPermissions, [permission]);
  const auditJson = JSON.stringify(auditRecords).toLowerCase();
  for (const forbidden of ['password', 'otp', 'token', 'reset token', 'session token', 'hash', 'secret', 'credential', 'provider']) {
    assert.equal(auditJson.includes(forbidden), false);
  }
}
