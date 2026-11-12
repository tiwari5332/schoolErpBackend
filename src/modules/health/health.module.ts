import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { RedisService } from '../../infra/cache/redis.service';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}

