import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { TokenService } from './token.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    TokenService,
    Clock,
    IdGenerator,
  ],
  exports: [AuthService, TokenService, AuthRepository],
})
export class AuthModule {}

