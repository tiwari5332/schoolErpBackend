import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [StaffController],
  providers: [StaffService, Clock, IdGenerator],
  exports: [StaffService],
})
export class StaffModule {}
