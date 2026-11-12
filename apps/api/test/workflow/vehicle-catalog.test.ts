import assert from 'node:assert/strict';
import test from 'node:test';
import { HttpStatus } from '@nestjs/common';
import { ComplaintStatus, ComplaintTransitionAction, ComplaintTransitionRequestSource, RoleCode } from '@prisma/client';
import { AppException } from '../../src/core/http-kernel.js';
import { ComplaintsService } from '../../src/modules/complaints/complaints.service.js';

test('normal submitted complaint checks the active booking make and model before persistence', async () => {
  let writes = 0; const checked: unknown[] = [];
  const repository = { transaction: async () => { writes += 1; throw new Error('Reached persistence'); } };
  const configuration = { assertVehicle: async (brand: string, model: string, required: boolean) => {
    checked.push([brand, model, required]);
    if (brand !== 'Nissan' || model !== 'Patrol') throw new AppException('VALIDATION_FAILED', 'Unknown active booking car.', HttpStatus.BAD_REQUEST, [{ field: 'vehicleModel', code: 'INVALID', message: 'Choose an active booking car.' }]);
  } };
  const service = new ComplaintsService(repository as never, {} as never, undefined, undefined, undefined, undefined, undefined, undefined, undefined, configuration as never);
  const base = { customerName: 'Proof customer', customerPhone: '+962790000000', categoryId: 'category', description: 'Concern', branchId: 'branch', vehicleVin: '1HGCM82633A004352', incidentAt: '2026-11-12', severity: 'MEDIUM', vehicleRelated: true, saveAsDraft: false };
  await assert.rejects(service.createInternal({ ...base, vehicleBrand: 'Toyota', vehicleModel: 'Patrol' } as never), (error: unknown) => error instanceof AppException && error.fieldErrors.some((item) => item.field === 'vehicleModel'));
  assert.equal(writes, 0);
  await assert.rejects(service.createInternal({ ...base, vehicleBrand: 'Nissan', vehicleModel: 'Patrol' } as never), /Reached persistence/);
  assert.deepEqual(checked, [['Toyota', 'Patrol', true], ['Nissan', 'Patrol', true]]);
  assert.equal(writes, 1);
});
test('submitting an old draft rechecks its car against the active booking catalog', async () => {
  let writes = 0;
  const repository = { transaction: async (work: (tx: unknown) => Promise<unknown>) => work({}), findTransitionSubject: async () => ({ id: 'draft', vehicleRelated: true, vehicleId: null, vehicleDataUnavailableReason: null, vehicleMakeSnapshot: 'Nissan', vehicleModelSnapshot: 'Inactive model' }), updateStatus: async () => { writes += 1; throw new Error('Should not update'); } };
  const configuration = { assertVehicle: async (_brand: string, model: string) => { if (model === 'Inactive model') throw new AppException('VALIDATION_FAILED', 'Inactive booking car.', HttpStatus.BAD_REQUEST, [{ field: 'vehicleModel', code: 'INVALID', message: 'Choose an active booking car.' }]); } };
  const service = new ComplaintsService(repository as never, { record: async () => undefined } as never, undefined, undefined, undefined, undefined, undefined, undefined, undefined, configuration as never);
  await assert.rejects(service.applyTransition({ complaintId: 'draft', fromStatus: ComplaintStatus.DRAFT, action: ComplaintTransitionAction.SUBMIT, actorRole: RoleCode.ADMIN, actorId: 'admin', requestSource: ComplaintTransitionRequestSource.STAFF_API } as never), (error: unknown) => error instanceof AppException && error.fieldErrors.some((item) => item.field === 'vehicleModel'));
  assert.equal(writes, 0);
});
