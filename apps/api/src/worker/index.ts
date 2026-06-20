import 'reflect-metadata';
import { Logger, Module, type INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Worker } from 'bullmq';
import { AttachmentsModule } from '../modules/attachments/attachments.module.js';
import { NotificationsModule } from '../modules/notifications/notifications.module.js';
import { SlaModule } from '../modules/sla/sla.module.js';
import { redisConnectionFromUrl, workerQueueNames, type WorkerJobPayload } from './queue.js';

@Module({
  imports: [SlaModule, NotificationsModule, AttachmentsModule],
})
class WorkerModule {}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Worker');
  const app = await NestFactory.createApplicationContext(WorkerModule);
  const connection = redisConnectionFromUrl();
  const workers = workerQueueNames.map(
    (queueName) =>
      new Worker<WorkerJobPayload>(
        queueName,
        async (job) => {
          logger.log(`test job received queue=${queueName} name=${job.name} id=${job.id}`);
          return { ok: true };
        },
        { connection },
      ),
  );

  for (const worker of workers) {
    worker.on('ready', () => logger.log(`queue connected queue=${worker.name}`));
    worker.on('error', (error) => logger.error(`queue error queue=${worker.name}: ${error.message}`, error.stack));
  }

  const shutdown = () => close(app, workers, logger);
  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());

  await Promise.all(workers.map((worker) => worker.waitUntilReady()));
  logger.log(`worker ready queues=${workerQueueNames.join(',')}`);
}

async function close(
  app: INestApplicationContext,
  workers: Worker<WorkerJobPayload>[],
  logger: Logger,
): Promise<void> {
  await Promise.all(workers.map((worker) => worker.close()));
  await app.close();
  logger.log('worker stopped');
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  new Logger('Worker').error(`worker failed: ${message}`, stack);
  process.exitCode = 1;
});
