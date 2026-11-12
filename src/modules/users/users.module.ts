import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { IdGenerator } from '../../common/id.generator';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, IdGenerator],
  exports: [UsersService],
})
export class UsersModule {}

