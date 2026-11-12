import { Module } from '@nestjs/common';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [CommunicationController],
  providers: [CommunicationService, Clock, IdGenerator],
  exports: [CommunicationService],
})
export class CommunicationModule {}

