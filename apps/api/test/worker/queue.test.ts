import assert from 'node:assert/strict';
import test from 'node:test';
import {
  closeQueueRegistry,
  createQueueRegistry,
  enqueueWorkerJob,
  redisConnectionFromUrl,
  workerQueueNames,
  type WorkerQueue,
  type WorkerQueueName,
} from '../../src/worker/queue.ts';

test('worker queue registry creates known queues from REDIS_URL', () => {
  const created: Array<{ name: WorkerQueueName; host?: string; port?: number; db?: number }> = [];

  const registry = createQueueRegistry('redis://user:pass@redis:6380/2', (name, connection) => {
    created.push({ name, host: connection.host, port: connection.port, db: connection.db });
    return fakeQueue();
  });

  assert.deepEqual(Object.keys(registry), [...workerQueueNames]);
  assert.deepEqual(created, [
    { name: 'sla', host: 'redis', port: 6380, db: 2 },
    { name: 'notifications', host: 'redis', port: 6380, db: 2 },
    { name: 'attachments-scan', host: 'redis', port: 6380, db: 2 },
  ]);
});

test('enqueue helper sends a named job to the selected queue', async () => {
  const adds: unknown[] = [];
  const registry = createQueueRegistry('redis://redis:6379', (name) =>
    fakeQueue((jobName, payload, options) => adds.push({ queue: name, jobName, payload, options })),
  );

  await enqueueWorkerJob(registry, 'notifications', 'worker.smoke', { ok: true }, { jobId: 'smoke_1' });

  assert.deepEqual(adds, [
    { queue: 'notifications', jobName: 'worker.smoke', payload: { ok: true }, options: { jobId: 'smoke_1' } },
  ]);
});

test('queue registry closes all queues', async () => {
  const closed: WorkerQueueName[] = [];
  const registry = createQueueRegistry('redis://redis:6379', (name) =>
    fakeQueue(undefined, () => {
      closed.push(name);
    }),
  );

  await closeQueueRegistry(registry);

  assert.deepEqual(closed, [...workerQueueNames]);
});

test('redis URL parser rejects missing or non-redis URLs', () => {
  assert.throws(() => redisConnectionFromUrl(''), /REDIS_URL is required/);
  assert.throws(() => redisConnectionFromUrl('http://redis:6379'), /redis:\/\/ or rediss:\/\//);
});

function fakeQueue(
  add?: (name: string, payload: Record<string, unknown>, options?: unknown) => void,
  close?: () => void,
): WorkerQueue {
  return {
    add: async (name, payload, options) => {
      add?.(name, payload, options);
      return { id: 'job_1' } as never;
    },
    close: async () => {
      close?.();
    },
  };
}
