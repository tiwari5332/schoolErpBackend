import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, Clock, IdGenerator],
  exports: [StudentsService],
})
export class StudentsModule {}

