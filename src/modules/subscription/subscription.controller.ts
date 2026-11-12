import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  SubscriptionCheckoutSchema,
  SubscriptionConfirmSchema,
  SubscriptionChangePlanSchema,
  SubscriptionCancelSchema,
  SubscriptionInvoicesQuerySchema,
  SubscriptionCheckoutDto,
  SubscriptionConfirmDto,
  SubscriptionChangePlanDto,
  SubscriptionCancelDto,
  SubscriptionInvoicesQueryDto,
} from './dto/subscription.dto';
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
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Endpoint('SUBSCRIPTION_GET')
  @Get('/subscription')
  async getSubscription(@CurrentUser() user: CurrentUserPayload) {
    return this.subscriptionService.getSubscription(user.tenantId);
  }

  @Endpoint('SUBSCRIPTION_CHECKOUT')
  @Post('/subscription/checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<SubscriptionCheckoutDto>(SubscriptionCheckoutSchema, body);
    return this.subscriptionService.checkout(user.tenantId, dto);
  }

  @Endpoint('SUBSCRIPTION_CONFIRM')
  @Post('/subscription/confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<SubscriptionConfirmDto>(SubscriptionConfirmSchema, body);
    return this.subscriptionService.confirm(user.tenantId, dto);
  }

  @Endpoint('SUBSCRIPTION_CHANGE_PLAN')
  @Post('/subscription/change-plan')
  @HttpCode(HttpStatus.OK)
  async changePlan(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<SubscriptionChangePlanDto>(SubscriptionChangePlanSchema, body);
    return this.subscriptionService.changePlan(user.tenantId, dto);
  }

  @Endpoint('SUBSCRIPTION_CANCEL')
  @Post('/subscription/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<SubscriptionCancelDto>(SubscriptionCancelSchema, body || {});
    return this.subscriptionService.cancel(user.tenantId, dto);
  }

  @Endpoint('SUBSCRIPTION_INVOICES')
  @Get('/subscription/invoices')
  async getInvoices(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<SubscriptionInvoicesQueryDto>(SubscriptionInvoicesQuerySchema, query);
    return this.subscriptionService.getInvoices(user.tenantId, queryDto);
  }
}

