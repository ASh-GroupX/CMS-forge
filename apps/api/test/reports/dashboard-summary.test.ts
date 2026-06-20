import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import 'reflect-metadata';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { ComplaintSeverity, ComplaintStatus, RoleCode, WorkingCalendarMode } from '@prisma/client';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { RbacGuard } from '../../src/core/auth.guard.ts';
import type { AuthenticatedRequest, StaffPrincipal } from '../../src/core/auth.guard.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { ReportsController } from '../../src/modules/reports/reports.controller.ts';
import { ReportsRepository } from '../../src/modules/reports/reports.repository.js';
import { ReportsService } from '../../src/modules/reports/reports.service.js';
import type { ReportsKpiSummary } from '../../src/modules/reports/reports.service.js';
import type { ComplaintsService } from '../../src/modules/complaints/complaints.service.js';
import type { SlaService } from '../../src/modules/sla/sla.service.js';
import type { SurveysService } from '../../src/modules/surveys/surveys.service.js';

const now = '2026-01-05T00:00:00.000Z';
const complaints = [
  complaint('a-overdue', 'branch-a', ComplaintStatus.IN_PROGRESS, ComplaintSeverity.CRITICAL, '2026-01-04T21:00:00.000Z', '2026-01-04T21:00:00.000Z', 'cat-powertrain', 'owner-a'),
  complaint('a-warning', 'branch-a', ComplaintStatus.SUBMITTED, ComplaintSeverity.MEDIUM, '2026-01-04T04:30:00.000Z', '2026-01-04T04:30:00.000Z', 'cat-service', 'owner-b'),
  complaint('a-closed', 'branch-a', ComplaintStatus.CLOSED, ComplaintSeverity.LOW, '2026-01-01T00:00:00.000Z', '2026-01-03T00:00:00.000Z', 'cat-service', 'owner-b'),
  complaint('b-hidden', 'branch-b', ComplaintStatus.IN_PROGRESS, ComplaintSeverity.CRITICAL, '2026-01-04T20:00:00.000Z', '2026-01-04T20:00:00.000Z', 'cat-powertrain', 'owner-a'),
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

test('filtered report denies out-of-branch rows for scoped users', async () => {
  const service = reportsService();

  assert.deepEqual(await service.filteredReport({ role: RoleCode.BRANCH_MANAGER, branchId: 'branch-a', filterBranchId: 'branch-b' }), []);
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

test('reports KPI route allows manager and admin roles', async () => {
  const guard = new RbacGuard(new Reflector(), { record: async () => undefined } as AuditService);

  assert.equal(await guard.canActivate(context(request(branchManager, '/reports/kpis'), ReportsController.prototype.kpis)), true);
  assert.equal(await guard.canActivate(context(request(admin, '/reports/kpis'), ReportsController.prototype.kpis)), true);
});

test('reports KPI route denies ordinary employees', async () => {
  const guard = new RbacGuard(new Reflector(), { record: async () => undefined } as AuditService);

  await assert.rejects(
    guard.canActivate(context(request(employee, '/reports/kpis'), ReportsController.prototype.kpis)),
    (error: unknown) => error instanceof AppException && error.code === 'RBAC_FORBIDDEN',
  );
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
  assert.deepEqual(auditRecords[0]?.metadata, { format: 'csv', rowCount: 1, rowLimit: 1 });
});

function reportsService(auditService?: AuditService): ReportsService {
  const complaintsService = {
    async listQueue({ branchId }: { branchId?: string | null } = {}) {
      return branchId ? complaints.filter((item) => item.branchId === branchId) : complaints;
    },
    async listForReports(filter: {
      branchId?: string | null;
      dateFrom?: Date | string | null;
      dateTo?: Date | string | null;
      categoryId?: string | null;
      severity?: ComplaintSeverity | null;
      ownerId?: string | null;
    } = {}) {
      return complaints.filter((item) => {
        const createdAt = new Date(item.createdAt).getTime();
        return (!filter.branchId || item.branchId === filter.branchId)
          && (!filter.categoryId || item.categoryId === filter.categoryId)
          && (!filter.severity || item.severity === filter.severity)
          && (!filter.ownerId || item.ownerId === filter.ownerId)
          && (!filter.dateFrom || createdAt >= new Date(filter.dateFrom).getTime())
          && (!filter.dateTo || createdAt <= new Date(filter.dateTo).getTime());
      });
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

  return new ReportsService(new ReportsRepository(), complaintsService, slaService, {} as SurveysService, auditService);
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
) {
  return {
    id,
    referenceNumber: id,
    branchId,
    status,
    severity,
    categoryId,
    subject: id,
    ownerId,
    createdAt,
    updatedAt,
  };
}

const branchManager: StaffPrincipal = {
  sessionId: 'ses_reports',
  userId: 'usr_branch',
  email: 'branch@cms-auto.test',
  nameEn: 'Branch Manager',
  nameAr: 'Branch Manager',
  roleCode: RoleCode.BRANCH_MANAGER,
  branchId: 'branch-a',
};

const admin: StaffPrincipal = { ...branchManager, userId: 'usr_admin', roleCode: RoleCode.ADMIN, branchId: null };
const employee: StaffPrincipal = { ...branchManager, userId: 'usr_employee', roleCode: RoleCode.CR_OFFICER };

const kpiSummary = {
  onTimeCompletionPercent: 100,
  activeOverdueCount: 1,
  averageDelayHours: 0,
  customerPromiseKeptPercent: 100,
  reopenedCount: 0,
  escalationCount: 0,
  averageFirstResponseHours: 1,
  averageResolutionHours: 2,
} satisfies ReportsKpiSummary;

function request(principal: StaffPrincipal, url: string): AuthenticatedRequest {
  return {
    principal,
    url,
    correlationId: 'req_reports',
    headers: { 'x-forwarded-for': '203.0.113.77, 10.0.0.1', 'user-agent': 'node:test' },
    socket: { remoteAddress: '198.51.100.77' },
  };
}

function context(
  req: AuthenticatedRequest,
  handler: typeof ReportsController.prototype.dashboard | typeof ReportsController.prototype.kpis | typeof ReportsController.prototype.filteredReport,
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => handler,
    getClass: () => ReportsController,
  } as ExecutionContext;
}
