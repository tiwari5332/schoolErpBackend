import { Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { env } from './config/env.config';

const logger = new Logger('WorkerProcess');

async function startWorker() {
  logger.log('🚀 Starting EduTrio Background Worker Process...');

  // Outbox Relay Worker
  const outboxWorker = new Worker(
    'outbox-relay',
    async (job: Job) => {
      logger.log(`Processing outbox event: [${job.id}] ${job.name}`);
      // Process outbox events (notifications, SMS, email, derived stats)
      return { processed: true };
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 10,
    },
  );

  // Notifications Worker
  const notificationWorker = new Worker(
    'notifications',
    async (job: Job) => {
      logger.log(`Dispatching notification: [${job.id}] ${job.name}`);
      return { sent: true };
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 5,
    },
  );

  // Bulk Import Worker
  const importWorker = new Worker(
    'imports',
    async (job: Job) => {
      logger.log(`Processing bulk import job: [${job.id}] ${job.name}`);
      return { completed: true };
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 2,
    },
  );

  // Report Export Worker
  const exportWorker = new Worker(
    'exports',
    async (job: Job) => {
      logger.log(`Generating report export: [${job.id}] ${job.name}`);
      return { exported: true };
    },
    {
      connection: { url: env.REDIS_URL },
      concurrency: 2,
    },
  );

  logger.log('✅ All BullMQ background workers initialized and listening for jobs.');

  // Handle graceful shutdown
  const shutdown = async () => {
    logger.log('Shutting down background workers gracefully...');
    await Promise.all([
      outboxWorker.close(),
      notificationWorker.close(),
      importWorker.close(),
      exportWorker.close(),
    ]);
    logger.log('Worker process stopped.');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startWorker();

