import { Global, Module } from '@nestjs/common';
import { PrismaService } from './db/prisma.service';
import { RedisService } from './cache/redis.service';
import { QueueService } from './queue/queue.service';
import { StorageService } from './storage/storage.service';
import { Clock } from '../common/clock';
import { IdGenerator } from '../common/id.generator';
import { IdempotencyService } from '../common/idempotency.service';

@Global()
@Module({
  providers: [
    PrismaService,
    RedisService,
    QueueService,
    StorageService,
    Clock,
    IdGenerator,
    IdempotencyService,
  ],
  exports: [
    PrismaService,
    RedisService,
    QueueService,
    StorageService,
    Clock,
    IdGenerator,
    IdempotencyService,
  ],
})
export class InfraModule {}

