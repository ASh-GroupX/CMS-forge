import assert from 'node:assert/strict';
import test from 'node:test';
import { SlaService } from '../../src/modules/sla/sla.service.ts';
import { processWorkerJob, scheduleSlaJobs, slaBreachJobName, slaWarningJobName } from '../../src/worker/index.ts';

test('worker dispatches SLA warning jobs through the public service', async () => {
  const calls: string[] = [];
  const logs: string[] = [];
  const app = fakeApp({
    runWarningJob: async () => {
      calls.push('warning');
      return { scanned: 1, created: 1, skipped: 0, warningIdempotencyKeys: ['warn_1'] };
    },
  });

  const result = await processWorkerJob('sla', { id: 'job_1', name: slaWarningJobName }, app, fakeLogger(logs));

  assert.deepEqual(calls, ['warning']);
  assert.deepEqual(result, { scanned: 1, created: 1, skipped: 0, warningIdempotencyKeys: ['warn_1'] });
  assert.match(logs[0] ?? '', /sla job received name=sla\.warning id=job_1/);
});

test('worker dispatches SLA breach jobs through the public service', async () => {
  const calls: string[] = [];
  const app = fakeApp({
    runBreachJob: async () => {
      calls.push('breach');
      return { scanned: 1, created: 1, skipped: 0, breachIdempotencyKeys: ['breach_1'] };
    },
  });

  const result = await processWorkerJob('sla', { id: 'job_2', name: slaBreachJobName }, app, fakeLogger([]));

  assert.deepEqual(calls, ['breach']);
  assert.deepEqual(result, { scanned: 1, created: 1, skipped: 0, breachIdempotencyKeys: ['breach_1'] });
});

test('worker leaves non-SLA queues as noops', async () => {
  let serviceRead = false;
  const result = await processWorkerJob('notifications', { id: 'job_3', name: 'worker.smoke' }, {
    get: () => {
      serviceRead = true;
      throw new Error('should not read service for noop queues');
    },
  }, fakeLogger([]));

  assert.deepEqual(result, { ok: true });
  assert.equal(serviceRead, false);
});

test('worker schedules SLA warning and breach jobs on an interval', async () => {
  const scheduled: unknown[] = [];

  await scheduleSlaJobs({
    upsertJobScheduler: async (id, repeat, template) => {
      scheduled.push({ id, repeat, template });
      return {} as never;
    },
    close: async () => undefined,
  }, 5_000);

  assert.deepEqual(scheduled, [
    { id: slaWarningJobName, repeat: { every: 5_000 }, template: { name: slaWarningJobName, data: {} } },
    { id: slaBreachJobName, repeat: { every: 5_000 }, template: { name: slaBreachJobName, data: {} } },
  ]);
  await assert.rejects(scheduleSlaJobs({} as never, 999), /SLA_JOB_INTERVAL_MS/);
});

function fakeApp(service: Partial<Pick<SlaService, 'runWarningJob' | 'runBreachJob'>>) {
  return {
    get: (token: unknown) => {
      assert.equal(token, SlaService);
      return service as SlaService;
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
