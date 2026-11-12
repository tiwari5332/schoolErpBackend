import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [CalendarController],
  providers: [CalendarService, Clock, IdGenerator],
  exports: [CalendarService],
})
export class CalendarModule {}

