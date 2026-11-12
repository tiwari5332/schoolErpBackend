import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, IdGenerator],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}

