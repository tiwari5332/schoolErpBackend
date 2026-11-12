import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, Clock, IdGenerator],
  exports: [SettingsService],
})
export class SettingsModule {}

