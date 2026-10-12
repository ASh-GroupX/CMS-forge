import assert from 'node:assert/strict';
import test from 'node:test';
import type { AuditRecordInput, AuditService } from '../../src/core/audit.service.ts';
import { AppException } from '../../src/core/http-kernel.ts';
import { ComplaintTemplatesController } from '../../src/modules/complaints/complaint-templates.controller.ts';
import { ComplaintTemplatesService } from '../../src/modules/complaints/complaint-templates.service.ts';
import type { AuthenticatedRequest } from '../../src/core/auth.guard.ts';

function createMockRepo(seedTemplates: any[] = []) {
  const store = new Map<string, any>(seedTemplates.map((t) => [t.id, { ...t }]));

  const client = {
    departmentComplaintTemplate: {
      findMany: async ({ where }: any) => {
        return Array.from(store.values()).filter(
          (t) => !where?.departmentId || t.departmentId === where.departmentId
        );
      },
      findUnique: async ({ where }: any) => {
        return store.get(where.id) ?? null;
      },
      create: async ({ data }: any) => {
        const id = `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const record = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.set(id, record);
        return record;
      },
      update: async ({ where, data }: any) => {
        const existing = store.get(where.id);
        if (!existing) return null;
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: any) => {
        const existing = store.get(where.id);
        if (!existing) return null;
        store.delete(where.id);
        return existing;
      },
    },
  };

  const complaintsRepo = {
    transaction: async (fn: (c: typeof client) => any) => fn(client),
  } as any;

  return { complaintsRepo, store };
}

function createMockAudit() {
  const logs: AuditRecordInput[] = [];
  const auditService = {
    record: async (input: AuditRecordInput) => {
      logs.push(input);
    },
  } as unknown as AuditService;
  return { auditService, logs };
}

test('ComplaintTemplatesService: list returns templates for department', async () => {
  const initial = [
    {
      id: 'tmpl_1',
      departmentId: 'dept_sales',
      name: 'Sales Inquiry Form',
      description: 'Custom fields for sales',
      isActive: true,
      schema: [{ id: 'car_model', label: 'Car Model', type: 'text', required: true }],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'tmpl_2',
      departmentId: 'dept_service',
      name: 'Service Intake Form',
      description: null,
      isActive: true,
      schema: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const { complaintsRepo } = createMockRepo(initial);
  const { auditService } = createMockAudit();
  const service = new ComplaintTemplatesService(complaintsRepo, auditService);

  const salesTemplates = await service.list('dept_sales');
  assert.equal(salesTemplates.length, 1);
  assert.equal(salesTemplates[0]?.id, 'tmpl_1');
  assert.equal(salesTemplates[0]?.name, 'Sales Inquiry Form');

  const emptyTemplates = await service.list('dept_unknown');
  assert.equal(emptyTemplates.length, 0);
});

test('ComplaintTemplatesService: create adds template and writes audit log', async () => {
  const { complaintsRepo, store } = createMockRepo();
  const { auditService, logs } = createMockAudit();
  const service = new ComplaintTemplatesService(complaintsRepo, auditService);

  const created = await service.create('dept_sales', 'usr_admin', {
    name: 'New Test Template',
    description: 'Testing template description',
    isActive: true,
    schema: [
      { id: 'mileage', label: 'Mileage', type: 'number', required: true },
    ],
  });

  assert.ok(created.id);
  assert.equal(created.name, 'New Test Template');
  assert.equal(created.departmentId, 'dept_sales');
  assert.equal(store.size, 1);

  assert.equal(logs.length, 1);
  assert.equal(logs[0]?.eventType, 'CONFIG');
  assert.equal(logs[0]?.action, 'complaint_template_created');
  assert.equal(logs[0]?.actorId, 'usr_admin');
  assert.equal(logs[0]?.targetId, created.id);
});

test('ComplaintTemplatesService: update modifies template and records audit log', async () => {
  const initial = [
    {
      id: 'tmpl_1',
      departmentId: 'dept_sales',
      name: 'Old Name',
      description: 'Old Description',
      isActive: true,
      schema: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const { complaintsRepo, store } = createMockRepo(initial);
  const { auditService, logs } = createMockAudit();
  const service = new ComplaintTemplatesService(complaintsRepo, auditService);

  const updated = await service.update('tmpl_1', 'usr_admin', {
    name: 'Updated Name',
    isActive: false,
  });

  assert.equal(updated.name, 'Updated Name');
  assert.equal(updated.isActive, false);
  assert.equal(store.get('tmpl_1')?.name, 'Updated Name');

  assert.equal(logs.length, 1);
  assert.equal(logs[0]?.action, 'complaint_template_updated');
  assert.equal(logs[0]?.actorId, 'usr_admin');
});

test('ComplaintTemplatesService: update non-existent template throws 404', async () => {
  const { complaintsRepo } = createMockRepo();
  const { auditService } = createMockAudit();
  const service = new ComplaintTemplatesService(complaintsRepo, auditService);

  await assert.rejects(
    async () => service.update('tmpl_non_existent', 'usr_admin', { name: 'Any' }),
    (err: any) => err instanceof AppException && err.code === 'NOT_FOUND'
  );
});

test('ComplaintTemplatesService: delete removes template and records audit log', async () => {
  const initial = [
    {
      id: 'tmpl_del',
      departmentId: 'dept_sales',
      name: 'Delete Me',
      description: null,
      isActive: true,
      schema: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const { complaintsRepo, store } = createMockRepo(initial);
  const { auditService, logs } = createMockAudit();
  const service = new ComplaintTemplatesService(complaintsRepo, auditService);

  const res = await service.delete('tmpl_del', 'usr_admin');
  assert.deepEqual(res, { ok: true });
  assert.equal(store.size, 0);

  assert.equal(logs.length, 1);
  assert.equal(logs[0]?.action, 'complaint_template_deleted');
  assert.equal(logs[0]?.actorId, 'usr_admin');
  assert.equal(logs[0]?.targetId, 'tmpl_del');
});

test('ComplaintTemplatesService: delete non-existent template throws 404', async () => {
  const { complaintsRepo } = createMockRepo();
  const { auditService } = createMockAudit();
  const service = new ComplaintTemplatesService(complaintsRepo, auditService);

  await assert.rejects(
    async () => service.delete('tmpl_ghost', 'usr_admin'),
    (err: any) => err instanceof AppException && err.code === 'NOT_FOUND'
  );
});

test('ComplaintTemplatesController: endpoints pass principal userId as actorId', async () => {
  const { complaintsRepo } = createMockRepo();
  const { auditService, logs } = createMockAudit();
  const service = new ComplaintTemplatesService(complaintsRepo, auditService);
  const controller = new ComplaintTemplatesController(service);

  const fakeReq: AuthenticatedRequest = {
    principal: {
      sessionId: 'ses_1',
      userId: 'usr_staff_42',
      email: 'staff@example.com',
      nameEn: 'Staff User',
      nameAr: 'موظف',
      roleCode: 'ADMIN',
      branchId: null,
    },
    headers: {},
  };

  const created = await controller.create('dept_sales', fakeReq, {
    name: 'Controller Template',
    schema: [
      { id: 'problem_code', label: 'Code', type: 'text', required: false },
    ],
  });

  assert.ok(created.id);
  assert.equal(logs[0]?.actorId, 'usr_staff_42');

  await controller.update(created.id, fakeReq, {
    name: 'Renamed via Controller',
  });
  assert.equal(logs[1]?.actorId, 'usr_staff_42');

  const delResult = await controller.delete(created.id, fakeReq);
  assert.deepEqual(delResult, { ok: true });
  assert.equal(logs[2]?.actorId, 'usr_staff_42');
});
