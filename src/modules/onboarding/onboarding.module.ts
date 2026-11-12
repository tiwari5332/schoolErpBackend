import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { AuthModule } from '../auth/auth.module';
import { IdGenerator } from '../../common/id.generator';

@Module({
  imports: [AuthModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, IdGenerator],
  exports: [OnboardingService],
})
export class OnboardingModule {}

