import { Module } from '@nestjs/common';
import { FeesController } from './fees.controller';
import { FeesService } from './fees.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [FeesController],
  providers: [FeesService, Clock, IdGenerator],
  exports: [FeesService],
})
export class FeesModule {}

