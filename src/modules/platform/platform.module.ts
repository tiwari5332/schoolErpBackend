import { Module } from '@nestjs/common';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [PlatformController],
  providers: [PlatformService, IdGenerator],
  exports: [PlatformService],
})
export class PlatformModule {}

