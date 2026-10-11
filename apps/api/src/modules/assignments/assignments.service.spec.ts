import assert from 'node:assert/strict';
import test from 'node:test';
import { RoleCode, type Prisma } from '@prisma/client';
import type { AuditService } from '../../core/audit.service.js';
import { AppException } from '../../core/http-kernel.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import { AssignmentsService } from './assignments.service.js';
import { AssignmentsRepository, type AssignmentRecord } from './assignments.repository.js';

const transactionClient = {} as Prisma.TransactionClient;

test('sets user and department assignment with history and audit in the caller transaction', async () => {
  let writeInput: unknown;
  let audited = false;
  const repository = {
    findActiveUser: async () => ({ id: 'user_2', branchId: 'branch_1', departmentId: 'dept_1' }),
    findActiveDepartment: async () => ({ id: 'dept_1', branchId: 'branch_1' }),
    findCurrent: async () => null,
    write: async (input: unknown, client: unknown) => {
      writeInput = { input, client };
      return record({ entityType: 'TASK', entityId: 'task_1', assignedUserId: 'user_2', assignedDepartmentId: 'dept_1' });
    },
  } as unknown as AssignmentsRepository;
  const audit = { record: async (_input: unknown, client: unknown) => { audited = client === transactionClient; } } as AuditService;
  const service = new AssignmentsService(repository, audit);

  const result = await service.setInTransaction(
    { entityType: 'task', entityId: 'task_1', assignedUserId: 'user_2', assignedDepartmentId: 'dept_1', scopeBranchId: 'branch_1' },
    { userId: 'user_1', roleCode: RoleCode.CR_MANAGER, branchId: 'branch_1' },
    { correlationId: 'corr_1' },
    transactionClient,
  );

  assert.equal(result.entityType, 'TASK');
  assert.equal(result.assignedUserId, 'user_2');
  assert.equal(result.assignedDepartmentId, 'dept_1');
  assert.equal(audited, true);
  assert.deepEqual(writeInput, {
    client: transactionClient,
    input: {
      entityType: 'TASK', entityId: 'task_1', assignedUserId: 'user_2', assignedDepartmentId: 'dept_1',
      scopeBranchId: 'branch_1', reason: null, assignedById: 'user_1', action: 'ASSIGNED', correlationId: 'corr_1',
    },
  });
});

test('accepts department-only assignment', async () => {
  const repository = repositoryFor({ user: null, department: { id: 'dept_1', branchId: 'branch_1' } });
  const service = new AssignmentsService(repository, auditStub());
  const result = await service.setInTransaction(
    { entityType: 'CASE', entityId: 'case_1', assignedDepartmentId: 'dept_1', scopeBranchId: 'branch_1' },
    { userId: 'user_1', roleCode: RoleCode.CR_MANAGER, branchId: 'branch_1' }, {}, transactionClient,
  );
  assert.equal(result.assignedUserId, null);
  assert.equal(result.assignedDepartmentId, 'dept_1');
});

test('department options query active database rows and include global departments for branch staff', async () => {
  let departmentQuery: unknown;
  const repository = new AssignmentsRepository({
    user: { findMany: async () => [] },
    department: {
      findMany: async (query: unknown) => {
        departmentQuery = query;
        return [{
          id: 'dept_new',
          nameEn: 'New Team',
          nameAr: 'الفريق الجديد',
          branchId: null,
        }];
      },
    },
  } as never);
  const service = new AssignmentsService(repository, auditStub());

  const result = await service.options({
    userId: 'user_1',
    roleCode: RoleCode.CR_MANAGER,
    branchId: 'branch_1',
  });

  assert.deepEqual(result.departments, [{
    id: 'dept_new',
    nameEn: 'New Team',
    nameAr: 'الفريق الجديد',
    branchId: null,
  }]);
  assert.deepEqual(departmentQuery, {
    where: { isActive: true, OR: [{ branchId: 'branch_1' }, { branchId: null }] },
    orderBy: [{ nameEn: 'asc' }, { code: 'asc' }],
    select: { id: true, nameEn: true, nameAr: true, branchId: true },
  });
});

test('rejects an out-of-branch target from the server-session scope', async () => {
  const repository = repositoryFor({ user: { id: 'user_2', branchId: 'branch_2', departmentId: null }, department: null });
  const service = new AssignmentsService(repository, auditStub());
  await assert.rejects(
    service.setInTransaction(
      { entityType: 'TASK', entityId: 'task_1', assignedUserId: 'user_2', scopeBranchId: 'branch_1' },
      { userId: 'user_1', roleCode: RoleCode.CR_MANAGER, branchId: 'branch_1' }, {}, transactionClient,
    ),
    (error: unknown) => error instanceof AppException && error.code === 'BRANCH_SCOPE_FORBIDDEN',
  );
});

test('rejects an empty assignment', async () => {
  const service = new AssignmentsService(repositoryFor({ user: null, department: null }), auditStub());
  await assert.rejects(
    service.setInTransaction(
      { entityType: 'TASK', entityId: 'task_1', scopeBranchId: 'branch_1' },
      { userId: 'user_1', roleCode: RoleCode.CR_MANAGER, branchId: 'branch_1' }, {}, transactionClient,
    ),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED',
  );
});

test('queues immediate in-app and email notifications for the user and department members after commit', async () => {
  const queued: Array<Record<string, unknown>> = [];
  const repository = {
    findCurrent: async () => record({
      entityType: 'DEAL', entityId: 'deal_1', assignedUserId: 'user_2', assignedDepartmentId: 'dept_1', version: 3,
    }),
    recipientUsers: async () => [
      { id: 'user_2', email: 'user2@example.test', nameEn: 'User Two', nameAr: 'المستخدم الثاني' },
      { id: 'user_3', email: 'user3@example.test', nameEn: 'User Three', nameAr: 'المستخدم الثالث' },
    ],
  } as unknown as AssignmentsRepository;
  const notifications = {
    queueInternal: async (input: Record<string, unknown>) => { queued.push(input); return {}; },
  } as unknown as NotificationsService;
  const service = new AssignmentsService(repository, auditStub(), notifications);

  await service.notifyAfterCommit('deal', 'deal_1', { href: '/deals/deal_1', title: 'Vehicle delivery' });

  assert.equal(queued.length, 4);
  assert.deepEqual(queued.map((item) => [item.recipientUserId, item.channel ?? 'IN_APP']), [
    ['user_2', 'IN_APP'], ['user_2', 'EMAIL'], ['user_3', 'IN_APP'], ['user_3', 'EMAIL'],
  ]);
  assert.ok(queued.every((item) => item.templateCode === 'assignment.updated'));
});

function repositoryFor(targets: { user: { id: string; branchId: string | null; departmentId: string | null } | null; department: { id: string; branchId: string | null } | null }): AssignmentsRepository {
  return {
    findActiveUser: async () => targets.user,
    findActiveDepartment: async () => targets.department,
    findCurrent: async () => null,
    write: async (input: { entityType: string; entityId: string; assignedUserId: string | null; assignedDepartmentId: string | null; scopeBranchId: string | null; assignedById: string }) => record(input),
  } as unknown as AssignmentsRepository;
}

function auditStub(): AuditService {
  return { record: async () => undefined } as unknown as AuditService;
}

function record(overrides: Partial<AssignmentRecord> = {}): AssignmentRecord {
  return {
    id: 'assignment_1', entityType: 'CASE', entityId: 'case_1', assignedUserId: null,
    assignedDepartmentId: null, scopeBranchId: 'branch_1', assignedById: 'user_1', version: 1,
    createdAt: new Date('2026-07-18T10:00:00.000Z'), updatedAt: new Date('2026-07-18T10:00:00.000Z'),
    assignedUser: null, assignedDepartment: null, ...overrides,
  };
}
