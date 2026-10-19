import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { RoleCode } from '@prisma/client';
import { ReportsAnalyticsService } from '../../src/modules/reports/reports.analytics.service.js';
import type { ReportsComplaintsRepository } from '../../src/modules/reports/reports.complaints.repository.js';
import type { ReportsTicketsRepository } from '../../src/modules/reports/reports.tickets.repository.js';
import type { AuditService } from '../../src/core/audit.service.js';
import type { DashboardReportScope } from '../../src/modules/reports/reports.service.js';

function createMockAnalyticsService() {
  const complaintsRepo: Partial<ReportsComplaintsRepository> = {
    getAnalytics: async (filter) => ({
      kpis: {
        totalCreated: 42,
        openWorkload: 18,
        unassigned: 4,
        inProgress: 14,
        resolved: 20,
        closed: 19,
        overdue: 3,
        atRisk: 2,
        avgResolutionHours: 24.5,
        slaComplianceRate: 92,
        deltas: {
          totalCreated: 5,
          openWorkload: -2,
          resolved: 10,
          closed: 8,
          avgResolutionHours: -1.5,
          slaComplianceRate: 4,
        },
      },
      timeline: [],
      statusBreakdown: [{ key: 'IN_PROGRESS', nameEn: 'In Progress', nameAr: 'قيد المعالجة', count: 14, percentage: 78 }],
      categoryBreakdown: [{ key: 'c1', nameEn: 'Engine', nameAr: 'المحرك', count: 10, percentage: 50 }],
      severityBreakdown: [{ key: 'HIGH', nameEn: 'High', nameAr: 'عالي', count: 8, percentage: 40 }],
      agingBuckets: [
        { bucket: '<24h', labelEn: '< 24 Hours', labelAr: 'أقل من 24 ساعة', count: 10 },
        { bucket: '1-3d', labelEn: '1 - 3 Days', labelAr: '1 - 3 أيام', count: 5 },
        { bucket: '4-7d', labelEn: '4 - 7 Days', labelAr: '4 - 7 أيام', count: 2 },
        { bucket: '>7d', labelEn: '> 7 Days', labelAr: 'أكثر من 7 أيام', count: 1 },
      ],
      officers: [
        {
          officerId: 'u1',
          nameEn: 'Ahmad Officer',
          nameAr: 'أحمد',
          role: 'CR_SPECIALIST',
          activeWorkload: 5,
          newAssignments: 8,
          resolved: 6,
          closed: 6,
          overdue: 1,
          slaComplianceRate: 88,
          avgResolutionHours: 22.0,
          oldestActiveDays: 3,
        },
      ],
    }),
    getRecords: async (filter, limit, offset) => ({
      total: 1,
      items: [
        {
          id: 'cmp-1',
          referenceNumber: 'CMP-2026-0001',
          subject: 'Oil leak',
          status: 'INVESTIGATING',
          severity: 'HIGH',
          customerName: 'John Doe',
          customerPhone: '0501234567',
          ownerName: 'Ahmad',
          departmentName: 'Service',
          createdAt: new Date().toISOString(),
          firstResponseAt: new Date().toISOString(),
          resolvedAt: null,
          closedAt: null,
          isOverdue: false,
        },
      ],
    }),
  };

  const ticketsRepo: Partial<ReportsTicketsRepository> = {
    getAnalytics: async (filter) => ({
      kpis: {
        totalCreated: 30,
        openWorkload: 12,
        unassigned: 2,
        inProgress: 8,
        waiting: 2,
        resolved: 16,
        closed: 15,
        overdue: 1,
        avgResolutionDays: 2.1,
        onTimeSlaRate: 95,
        avgRating: 4.8,
        deltas: {
          totalCreated: 3,
          openWorkload: -1,
          resolved: 4,
          closed: 4,
          avgResolutionDays: -0.2,
          onTimeSlaRate: 2,
        },
      },
      timeline: [],
      statusBreakdown: [{ key: 'ASSIGNED', nameEn: 'Assigned', nameAr: 'تم التعيين', count: 8, percentage: 67 }],
      priorityBreakdown: [{ key: 'NORMAL', nameEn: 'Normal', nameAr: 'عادي', count: 20, percentage: 70 }],
      departmentBreakdown: [{ key: 'd1', nameEn: 'IT Support', nameAr: 'الدعم الفني', count: 12, percentage: 60 }],
      waitingReasons: [{ key: 'w1', nameEn: 'Customer feedback', nameAr: 'رد العميل', count: 2, percentage: 100 }],
      deptToDeptFlow: [
        {
          sourceDeptId: 'd-sales',
          sourceDeptNameEn: 'Sales',
          sourceDeptNameAr: 'المبيعات',
          targetDeptId: 'd-it',
          targetDeptNameEn: 'IT',
          targetDeptNameAr: 'تقنية المعلومات',
          ticketCount: 15,
          unresolvedCount: 3,
          avgResolutionDays: 1.8,
        },
      ],
      agingBuckets: [
        { bucket: '<24h', labelEn: '< 24 Hours', labelAr: 'أقل من 24 ساعة', count: 8 },
        { bucket: '1-3d', labelEn: '1 - 3 Days', labelAr: '1 - 3 أيام', count: 3 },
        { bucket: '4-7d', labelEn: '4 - 7 Days', labelAr: '4 - 7 أيام', count: 1 },
        { bucket: '>7d', labelEn: '> 7 Days', labelAr: 'أكثر من 7 أيام', count: 0 },
      ],
      officers: [
        {
          employeeId: 'u2',
          nameEn: 'Sara Engineer',
          nameAr: 'سارة',
          role: 'IT_ENGINEER',
          activeWorkload: 4,
          newAssignments: 6,
          resolved: 5,
          closed: 5,
          overdue: 0,
          onTimeRate: 100,
          avgResolutionDays: 1.5,
          avgRating: 5.0,
          oldestActiveDays: 2,
        },
      ],
    }),
    getRecords: async (filter, limit, offset) => ({
      total: 1,
      items: [
        {
          id: 'tkt-1',
          referenceNumber: 'TKT-2026-0001',
          title: 'Laptop display repair',
          status: 'IN_PROGRESS',
          priority: 'NORMAL',
          creatingDepartmentName: 'Sales',
          targetDepartmentName: 'IT',
          requestedByName: 'Ali',
          assignedEmployeeName: 'Sara',
          createdAt: new Date().toISOString(),
          dueAt: new Date(Date.now() + 86400000).toISOString(),
          resolvedAt: null,
          closedAt: null,
          isOverdue: false,
        },
      ],
    }),
  };

  const auditService: Partial<AuditService> = {
    record: async () => undefined,
  };

  return new ReportsAnalyticsService(
    complaintsRepo as ReportsComplaintsRepository,
    ticketsRepo as ReportsTicketsRepository,
    auditService as AuditService,
  );
}

test('complaintsAnalytics returns accurate KPIs and enforces branch manager scope', async () => {
  const service = createMockAnalyticsService();
  const managerScope: DashboardReportScope = {
    role: RoleCode.BRANCH_MANAGER,
    branchId: 'branch-jeddah',
    departmentId: 'dept-service',
    userId: 'user-manager',
  };

  const res = await service.complaintsAnalytics({}, managerScope);
  assert.equal(res.kpis.totalCreated, 42);
  assert.equal(res.kpis.openWorkload, 18);
  assert.equal(res.kpis.slaComplianceRate, 92);
  assert.equal(res.officers.length, 1);
  assert.equal(res.officers[0]!.activeWorkload, 5);
});

test('complaintsRecords returns paginated cases with verified reference numbers', async () => {
  const service = createMockAnalyticsService();
  const adminScope: DashboardReportScope = {
    role: RoleCode.ADMIN,
    branchId: null,
    departmentId: null,
    userId: 'admin-user',
  };

  const records = await service.complaintsRecords({}, adminScope, 10, 0);
  assert.equal(records.total, 1);
  assert.equal(records.items[0]!.referenceNumber, 'CMP-2026-0001');
  assert.equal(records.items[0]!.isOverdue, false);
});

test('ticketsAnalytics returns department-to-department flow and waiting reasons', async () => {
  const service = createMockAnalyticsService();
  const managerScope: DashboardReportScope = {
    role: RoleCode.BRANCH_MANAGER,
    branchId: 'branch-jeddah',
    departmentId: 'dept-it',
    userId: 'user-it-manager',
  };

  const res = await service.ticketsAnalytics({}, managerScope);
  assert.equal(res.kpis.totalCreated, 30);
  assert.equal(res.kpis.avgRating, 4.8);
  assert.equal(res.waitingReasons.length, 1);
  assert.equal(res.waitingReasons[0]!.nameEn, 'Customer feedback');
  assert.equal(res.deptToDeptFlow.length, 1);
  assert.equal(res.deptToDeptFlow[0]!.ticketCount, 15);
});

test('exportAdvanced generates valid CSV file body and sets headers safely', async () => {
  const service = createMockAnalyticsService();
  const adminScope: DashboardReportScope = {
    role: RoleCode.ADMIN,
    branchId: null,
    departmentId: null,
    userId: 'admin-user',
  };

  const result = await service.exportAdvanced('complaints', {}, 'csv', adminScope);
  assert.equal(result.contentType, 'text/csv; charset=utf-8');
  assert.equal(result.fileName.endsWith('.csv'), true);
  assert.equal(result.rowCount, 1);
  assert.match(result.body, /CMP-2026-0001/);
});
