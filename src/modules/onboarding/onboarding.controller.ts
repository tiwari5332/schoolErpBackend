import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RegisterTenantSchema, RegisterTenantDto } from './dto/onboarding.dto';
import { DomainError } from '../../common/domain.error';

function validate<T>(schema: any, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.errors.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    throw new DomainError('VALIDATION_ERROR', 'Validation failed', details);
  }
  return result.data as T;
}

@Controller()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Public()
  @Endpoint('PLANS_LIST')
  @Get('/public/plans')
  async getPlans() {
    return this.onboardingService.getPublicPlans();
  }

  @Public()
  @Endpoint('TENANT_REGISTER')
  @Post('/public/schools/register')
  @HttpCode(HttpStatus.CREATED)
  async registerSchool(@Body() body: unknown) {
    const dto = validate<RegisterTenantDto>(RegisterTenantSchema, body);
    return this.onboardingService.registerSchool(dto);
  }

  @Endpoint('ONBOARDING_STATUS')
  @Get('/onboarding/status')
  async getStatus(@CurrentUser() user: CurrentUserPayload) {
    return this.onboardingService.getOnboardingStatus(user.tenantId);
  }

  @Endpoint('ONBOARDING_DISMISS')
  @Post('/onboarding/dismiss')
  @HttpCode(HttpStatus.OK)
  async dismiss(@CurrentUser() user: CurrentUserPayload) {
    return this.onboardingService.dismissOnboarding(user.tenantId);
  }
}

