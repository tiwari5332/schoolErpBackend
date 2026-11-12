import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, Clock, IdGenerator],
  exports: [ReportsService],
})
export class ReportsModule {}

