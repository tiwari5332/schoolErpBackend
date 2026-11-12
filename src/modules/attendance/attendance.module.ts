import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, Clock, IdGenerator],
  exports: [AttendanceService],
})
export class AttendanceModule {}

