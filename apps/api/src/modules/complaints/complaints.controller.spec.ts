import assert from 'node:assert/strict';
import test from 'node:test';
import { ComplaintsController } from './complaints.controller.js';
import { ComplaintFormOptionsService } from './complaint-form-options.service.js';
import { ComplaintRelationsRepository } from './complaint-relations.repository.js';
import { ComplaintRelationsService } from './complaint-relations.service.js';
import { ComplaintsBoardRepository } from './complaints.board.repository.js';
import { ComplaintsBoardService } from './complaints.board.service.js';
import { ComplaintsRepository } from './complaints.repository.js';
import { ComplaintsService } from './complaints.service.js';
import { reportWhere } from './complaints.report-query.js';

test('complaints controller can be constructed', () => {
  const complaints = new ComplaintsService(new ComplaintsRepository({} as never), { record: async () => undefined } as never);
  assert.ok(new ComplaintsController(
    complaints,
    new ComplaintFormOptionsService({} as never),
    new ComplaintRelationsService(new ComplaintRelationsRepository({} as never), { record: async () => undefined } as never),
    new ComplaintsBoardService(new ComplaintsBoardRepository({} as never), complaints),
  ));
});

test('dashboard drill-down filters are validated and retain server-session branch scope', async () => {
  let received: any;
  const service = { search: async (filter: any) => { received = filter; return []; } };
  const controller = new ComplaintsController(service as any, {} as any, {} as any, {} as any);
  const request = { principal: { userId: 'user-1', roleCode: 'CR_OFFICER', branchId: 'branch-session', departmentId: 'dept-1', permissions: ['COMPLAINT_VIEW_BRANCH'] } } as any;

  await controller.search({ branchId: 'branch-client', isJustified: 'false', satisfactionStatus: 'UNSATISFIED' }, request);

  assert.equal(received.branchId, 'branch-session');
  assert.equal(received.isJustified, false);
  assert.equal(received.satisfactionStatus, 'UNSATISFIED');
  assert.deepEqual(reportWhere(received).isJustified, false);
  assert.deepEqual(reportWhere(received).satisfactionStatus, 'UNSATISFIED');
});

test('dashboard drill-down rejects invalid satisfaction filters', async () => {
  const controller = new ComplaintsController({ search: async () => [] } as any, {} as any, {} as any, {} as any);
  const request = { principal: { userId: 'user-1', roleCode: 'ADMIN', branchId: null, departmentId: null, permissions: ['COMPLAINT_VIEW_ALL'] } } as any;
  await assert.rejects(() => controller.search({ satisfactionStatus: 'HAPPY' }, request), (error: any) => error?.code === 'VALIDATION_FAILED');
});
