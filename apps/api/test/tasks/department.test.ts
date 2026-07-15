import assert from 'node:assert/strict';
import test from 'node:test';
import 'reflect-metadata';
import { RoleCode, TaskConfidentialityLevel, TaskLinkEntityType, TaskStatus, TaskVisibility } from '@prisma/client';
import type { AuditService } from '../../src/core/audit.service.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { assertCanManage, assertCanView } from '../../src/modules/tasks/tasks.access.ts';
import type { TasksBoardRepository } from '../../src/modules/tasks/tasks.board.repository.ts';
import type { TaskRecord, TasksRepository, UpdateTaskStatusData } from '../../src/modules/tasks/tasks.repository.ts';
import type { TaskActor } from '../../src/modules/tasks/tasks.service.ts';
import { updateTaskForActor } from '../../src/modules/tasks/tasks.update.ts';

// B3 — task department assignment (docs/CMSS_REVAMP_PLAN.md).
// Trust boundary: the actor's departmentId comes from the server session; a
// department member gains view/act only on NORMAL tasks assigned to that exact
// department. One allowed + one denied case per rule, per .forge/policy.md.

const deptMember: TaskActor = { userId: 'user_dept_member', roleCode: RoleCode.CR_OFFICER, branchId: 'branch_b', departmentId: 'dept_service' };

test('a department member may view and act on a NORMAL task assigned to their department', () => {
  const task = taskRecord({ assignedDepartmentId: 'dept_service' });

  assert.doesNotThrow(() => assertCanView(task, deptMember));
  assert.doesNotThrow(() => assertCanManage(task, deptMember));
});

test('a member of a different department is denied (view and act)', () => {
  const task = taskRecord({ assignedDepartmentId: 'dept_service' });
  const outsider: TaskActor = { ...deptMember, userId: 'user_other_dept', departmentId: 'dept_sales' };

  assert.throws(() => assertCanView(task, outsider), forbidden);
  assert.throws(() => assertCanManage(task, outsider), forbidden);
});

test('department access never applies to confidential tasks or unassigned tasks', () => {
  const confidential = taskRecord({ assignedDepartmentId: 'dept_service', confidentialityLevel: TaskConfidentialityLevel.CONFIDENTIAL });
  const unassigned = taskRecord({ assignedDepartmentId: null });

  assert.throws(() => assertCanView(confidential, deptMember), forbidden);
  assert.throws(() => assertCanView(unassigned, deptMember), forbidden);
});

test('assigning a task to an active department writes the update and audits the change in one transaction', async () => {
  const harness = buildHarness({ current: taskRecord({ ownerId: deptMember.userId }), activeDepartments: ['dept_service'] });

  await updateTaskForActor(harness.tasksRepository, harness.auditService, undefined, harness.boardRepository, { taskId: 'task_1', assignedDepartmentId: 'dept_service' }, deptMember, { actorId: deptMember.userId });

  assert.equal(harness.calls.updates[0]?.data.assignedDepartmentId, 'dept_service');
  assert.equal(harness.calls.updates[0]?.client, harness.client); // same transaction client
  assert.equal(harness.calls.audit[0]?.input.action, 'task_updated');
  assert.deepEqual(
    { from: harness.calls.audit[0]?.input.metadata?.fromDepartmentId, to: harness.calls.audit[0]?.input.metadata?.toDepartmentId },
    { from: null, to: 'dept_service' },
  );
  assert.equal(harness.calls.audit[0]?.client, harness.client);
});

test('assigning an unknown or inactive department is a 400 field error with no writes', async () => {
  const harness = buildHarness({ current: taskRecord({ ownerId: deptMember.userId }), activeDepartments: [] });

  await assert.rejects(
    updateTaskForActor(harness.tasksRepository, harness.auditService, undefined, harness.boardRepository, { taskId: 'task_1', assignedDepartmentId: 'dept_ghost' }, deptMember, { actorId: deptMember.userId }),
    (error: unknown) => error instanceof AppException && error.code === 'VALIDATION_FAILED' && error.fieldErrors[0]?.field === 'assignedDepartmentId',
  );
  assert.equal(harness.calls.updates.length, 0);
  assert.equal(harness.calls.audit.length, 0);
});

test('clearing the assignment with null skips department validation and is audited', async () => {
  const harness = buildHarness({ current: taskRecord({ ownerId: deptMember.userId, assignedDepartmentId: 'dept_service' }), activeDepartments: [] });

  await updateTaskForActor(harness.tasksRepository, harness.auditService, undefined, harness.boardRepository, { taskId: 'task_1', assignedDepartmentId: null }, deptMember, { actorId: deptMember.userId });

  assert.equal(harness.calls.updates[0]?.data.assignedDepartmentId, null);
  assert.deepEqual(
    { from: harness.calls.audit[0]?.input.metadata?.fromDepartmentId, to: harness.calls.audit[0]?.input.metadata?.toDepartmentId },
    { from: 'dept_service', to: null },
  );
});

function forbidden(error: unknown): boolean {
  return error instanceof AppException && (error.code === 'RBAC_FORBIDDEN' || error.code === 'BRANCH_SCOPE_FORBIDDEN');
}

type UpdateCall = { data: UpdateTaskStatusData; client: unknown };
type AuditCall = { input: { action: string; metadata?: Record<string, unknown> }; client: unknown };

function buildHarness(opts: { current: TaskRecord; activeDepartments: string[] }) {
  const client = { tx: true };
  const calls = { updates: [] as UpdateCall[], audit: [] as AuditCall[] };

  const tasksRepository = {
    transaction: async <T>(work: (c: unknown) => Promise<T>) => work(client),
    findById: async () => opts.current,
    updateStatus: async (data: UpdateTaskStatusData, txClient: unknown) => {
      calls.updates.push({ data, client: txClient });
      return { ...opts.current, assignedDepartmentId: data.assignedDepartmentId ?? null };
    },
    createStatusHistory: async () => undefined,
    createComment: async () => ({}) as never,
  } as unknown as TasksRepository;

  const boardRepository = {
    findActiveDepartment: async (id: string) => (opts.activeDepartments.includes(id) ? { id } : null),
  } as unknown as TasksBoardRepository;

  const auditService = {
    record: async (input: AuditCall['input'], txClient: unknown) => {
      calls.audit.push({ input, client: txClient });
    },
  } as unknown as AuditService;

  return { tasksRepository, boardRepository, auditService, calls, client };
}

function taskRecord(overrides: Partial<TaskRecord> = {}): TaskRecord {
  const now = new Date('2026-07-10T08:00:00.000Z');
  return {
    id: 'task_1',
    title: 'Prepare service quote',
    ownerId: 'user_owner',
    assigneeId: 'user_assignee',
    dueAt: new Date('2026-07-16T09:00:00.000Z'),
    status: TaskStatus.OPEN,
    stageId: 'stage_open',
    assignedDepartmentId: null,
    nextActionWhat: 'Call customer',
    nextActionWhoId: 'user_assignee',
    nextActionWhen: new Date('2026-07-15T08:30:00.000Z'),
    isCustomerPromise: false,
    visibility: TaskVisibility.PARTICIPANTS,
    confidentialityLevel: TaskConfidentialityLevel.NORMAL,
    createdAt: now,
    updatedAt: now,
    owner: { nameEn: 'Owner User', branchId: 'branch_a', branch: { nameEn: 'Main Branch', timezone: 'Asia/Riyadh' } },
    assignee: { nameEn: 'Assignee User', branchId: 'branch_a', branch: { nameEn: 'Main Branch', timezone: 'Asia/Riyadh' } },
    nextActionWho: { nameEn: 'Assignee User', branchId: 'branch_a' },
    links: [{ entityType: TaskLinkEntityType.CUSTOMER, entityId: 'customer_1' }],
    participants: [],
    ...overrides,
  };
}
