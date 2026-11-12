import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [AcademicController],
  providers: [AcademicService, IdGenerator],
  exports: [AcademicService],
})
export class AcademicModule {}

