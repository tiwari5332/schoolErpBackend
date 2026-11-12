import { Module } from '@nestjs/common';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [TimetableController],
  providers: [TimetableService, Clock, IdGenerator],
  exports: [TimetableService],
})
export class TimetableModule {}

