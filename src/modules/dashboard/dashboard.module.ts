import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, Clock, IdGenerator],
  exports: [DashboardService],
})
export class DashboardModule {}

