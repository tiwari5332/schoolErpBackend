import { Module } from '@nestjs/common';
import { BulkController } from './bulk.controller';
import { BulkService } from './bulk.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [BulkController],
  providers: [BulkService, Clock, IdGenerator],
  exports: [BulkService],
})
export class BulkModule {}

