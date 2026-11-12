import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [RolesController],
  providers: [RolesService, IdGenerator],
  exports: [RolesService],
})
export class RolesModule {}

