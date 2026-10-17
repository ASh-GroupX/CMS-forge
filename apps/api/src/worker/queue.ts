import { Queue, type JobsOptions, type RedisOptions } from 'bullmq';

export const workerQueueNames = ['sla', 'notifications', 'attachments-scan'] as const;

export type WorkerQueueName = (typeof workerQueueNames)[number];
export type WorkerJobPayload = Record<string, unknown>;
export type WorkerQueue = Pick<Queue<WorkerJobPayload>, 'add' | 'close'>;
export type WorkerQueueRegistry = Record<WorkerQueueName, WorkerQueue>;
export type WorkerQueueFactory = (name: WorkerQueueName, connection: RedisOptions) => WorkerQueue;

export function redisConnectionFromUrl(redisUrl = process.env.REDIS_URL): RedisOptions {
  if (!redisUrl) {
    throw new Error('REDIS_URL is required');
  }

  const parsed = new URL(redisUrl);
  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use redis:// or rediss://');
  }

  const connection: RedisOptions = {
    host: parsed.hostname,
    port: redisPort(parsed),
    maxRetriesPerRequest: null,
  };

  const db = redisDb(parsed.pathname);
  if (db !== undefined) {
    connection.db = db;
  }
  if (parsed.username) {
    connection.username = decodeURIComponent(parsed.username);
  }
  if (parsed.password) {
    connection.password = decodeURIComponent(parsed.password);
  }
  if (parsed.protocol === 'rediss:') {
    connection.tls = {};
  }

  return connection;
}

export function createQueueRegistry(
  redisUrl = process.env.REDIS_URL,
  makeQueue: WorkerQueueFactory = (name, connection) => new Queue<WorkerJobPayload>(name, { connection }),
): WorkerQueueRegistry {
  const connection = redisConnectionFromUrl(redisUrl);
  return Object.fromEntries(workerQueueNames.map((name) => [name, makeQueue(name, connection)])) as WorkerQueueRegistry;
}

export async function enqueueWorkerJob(
  registry: WorkerQueueRegistry,
  queueName: WorkerQueueName,
  jobName: string,
  payload: WorkerJobPayload = {},
  options?: JobsOptions,
): Promise<unknown> {
  return registry[queueName].add(jobName, payload, options);
}

export async function closeQueueRegistry(registry: WorkerQueueRegistry): Promise<void> {
  await Promise.all(workerQueueNames.map((name) => registry[name].close()));
}

export const attachmentScanJobName = 'attachments.scan';

let standaloneScanQueue: Queue<WorkerJobPayload> | null = null;

export async function enqueueAttachmentScanJob(payload: WorkerJobPayload): Promise<boolean> {
  if (!process.env.REDIS_URL) return false;
  try {
    if (!standaloneScanQueue) {
      const connection: RedisOptions = {
        ...redisConnectionFromUrl(),
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 500,
        retryStrategy: () => null,
      };
      standaloneScanQueue = new Queue<WorkerJobPayload>('attachments-scan', { connection });
      standaloneScanQueue.on('error', () => {});
    }
    await Promise.race([
      standaloneScanQueue.add(attachmentScanJobName, payload),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 800)),
    ]);
    return true;
  } catch {
    return false;
  }
}

function redisPort(url: URL): number {
  const port = url.port ? Number(url.port) : 6379;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('REDIS_URL port must be between 1 and 65535');
  }
  return port;
}

function redisDb(pathname: string): number | undefined {
  const raw = pathname.replace(/^\/+/, '');
  if (!raw) {
    return undefined;
  }

  const db = Number(raw);
  if (!Number.isInteger(db) || db < 0) {
    throw new Error('REDIS_URL database must be a non-negative integer');
  }
  return db;
}
