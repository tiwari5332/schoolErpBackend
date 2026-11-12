import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [ExamsController],
  providers: [ExamsService, Clock, IdGenerator],
  exports: [ExamsService],
})
export class ExamsModule {}

