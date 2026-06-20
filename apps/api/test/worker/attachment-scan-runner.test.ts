import assert from 'node:assert/strict';
import test from 'node:test';
import { AttachmentsService } from '../../src/modules/attachments/attachments.service.ts';
import { attachmentScanJobName, processWorkerJob } from '../../src/worker/index.ts';

test('worker transitions attachment scan jobs to CLEAN through the public service', async () => {
  const calls: unknown[] = [];
  const logs: string[] = [];
  const result = await processWorkerJob('attachments-scan', {
    id: 'job_1',
    name: attachmentScanJobName,
    data: {
      attachmentId: 'att_1',
      toStatus: 'CLEAN',
      branchId: 'branch_1',
      correlationId: 'corr_1',
      userAgent: 'worker:attachments-scan',
    },
  }, fakeApp({
    transitionScanStatus: async (input) => {
      calls.push(input);
      return attachmentResult(input.attachmentId, input.toStatus);
    },
  }), fakeLogger(logs));

  assert.deepEqual(calls, [{
    attachmentId: 'att_1',
    toStatus: 'CLEAN',
    actorId: null,
    branchId: 'branch_1',
    correlationId: 'corr_1',
    ipAddress: null,
    userAgent: 'worker:attachments-scan',
  }]);
  assert.deepEqual(result, { attachmentId: 'att_1', scanStatus: 'CLEAN' });
  assert.match(logs[0] ?? '', /attachment scan job received name=attachments\.scan id=job_1/);
  assert.doesNotMatch(logs[0] ?? '', /storageKey|fileName/);
});

test('worker transitions attachment scan jobs to REJECTED through the public service', async () => {
  const calls: unknown[] = [];
  const result = await processWorkerJob('attachments-scan', {
    id: 'job_2',
    name: attachmentScanJobName,
    data: {
      attachmentId: 'att_2',
      toStatus: 'REJECTED',
      actorId: 'user_1',
      correlationId: 'corr_2',
      ipAddress: '127.0.0.1',
    },
  }, fakeApp({
    transitionScanStatus: async (input) => {
      calls.push(input);
      return attachmentResult(input.attachmentId, input.toStatus);
    },
  }), fakeLogger([]));

  assert.deepEqual(calls, [{
    attachmentId: 'att_2',
    toStatus: 'REJECTED',
    actorId: 'user_1',
    branchId: null,
    correlationId: 'corr_2',
    ipAddress: '127.0.0.1',
    userAgent: null,
  }]);
  assert.deepEqual(result, { attachmentId: 'att_2', scanStatus: 'REJECTED' });
});

test('worker rejects invalid attachment scan payloads', async () => {
  let called = false;

  await assert.rejects(processWorkerJob('attachments-scan', {
    id: 'job_3',
    name: attachmentScanJobName,
    data: { attachmentId: 'att_3', toStatus: 'PENDING', correlationId: 'corr_3' },
  }, fakeApp({
    transitionScanStatus: async () => {
      called = true;
      return attachmentResult('att_3', 'CLEAN');
    },
  }), fakeLogger([])), /Attachment scan job payload toStatus/);

  await assert.rejects(processWorkerJob('attachments-scan', {
    id: 'job_4',
    name: attachmentScanJobName,
    data: { attachmentId: 'att_4', toStatus: 'CLEAN' },
  }, fakeApp({
    transitionScanStatus: async () => {
      called = true;
      return attachmentResult('att_4', 'CLEAN');
    },
  }), fakeLogger([])), /correlationId is required/);

  assert.equal(called, false);
});

test('worker leaves unknown attachment-scan jobs as noops', async () => {
  let serviceRead = false;
  const result = await processWorkerJob('attachments-scan', { id: 'job_5', name: 'worker.smoke', data: { ok: true } }, {
    get: () => {
      serviceRead = true;
      throw new Error('should not read service for noop jobs');
    },
  }, fakeLogger([]));

  assert.deepEqual(result, { ok: true });
  assert.equal(serviceRead, false);
});

function fakeApp(service: Partial<Pick<AttachmentsService, 'transitionScanStatus'>>) {
  return {
    get: (token: unknown) => {
      assert.equal(token, AttachmentsService);
      return service as AttachmentsService;
    },
  };
}

function fakeLogger(logs: string[]) {
  return {
    log: (message: string) => {
      logs.push(message);
    },
  };
}

function attachmentResult(id: string, scanStatus: 'CLEAN' | 'REJECTED') {
  return {
    id,
    complaintId: 'cmp_1',
    storageKey: 'attachments/private-key',
    fileName: 'private-name.pdf',
    contentType: 'application/pdf',
    sizeBytes: 123,
    scanStatus,
    customerVisible: false,
  };
}
