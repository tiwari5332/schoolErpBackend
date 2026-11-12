import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { env } from '../../config/env.config';

export type QueueName =
  | 'outbox-relay'
  | 'notifications'
  | 'imports'
  | 'exports'
  | 'pdf'
  | 'fee-lines'
  | 'reminders'
  | 'rollups';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<QueueName, Queue>();

  getQueue(name: QueueName): Queue {
    let queue = this.queues.get(name);
    if (!queue) {
      queue = new Queue(name, {
        connection: {
          url: env.REDIS_URL,
          retryStrategy: () => null,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: 1000,
        },
      });
      queue.on('error', (err) => {
        this.logger.warn(`Queue '${name}' notice: ${err.message}`);
      });
      this.queues.set(name, queue);
    }
    return queue;
  }

  async addJob<T>(queueName: QueueName, jobName: string, data: T, opts?: any) {
    try {
      const q = this.getQueue(queueName);
      return await q.add(jobName, data, opts);
    } catch (err: any) {
      this.logger.warn(`Failed to enqueue job '${jobName}' on queue '${queueName}': ${err.message}`);
      return null;
    }
  }

  async onModuleDestroy() {
    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      this.logger.log(`Closed queue: ${name}`);
    }
  }
}

