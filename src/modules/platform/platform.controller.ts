import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlatformService } from './platform.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { RequireRole } from '../../common/decorators/permissions.decorator';
import {
  PlatformTenantsQuerySchema,
  PlatformTenantStatusSchema,
  PlatformPlanCreateSchema,
  PlatformPlanUpdateSchema,
  PlatformTenantsQueryDto,
  PlatformTenantStatusDto,
  PlatformPlanCreateDto,
  PlatformPlanUpdateDto,
} from './dto/platform.dto';
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
@RequireRole('PLATFORM_OWNER')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Endpoint('PLATFORM_METRICS')
  @Get('/platform/metrics')
  async getMetrics() {
    return this.platformService.getMetrics();
  }

  @Endpoint('PLATFORM_TENANTS_LIST')
  @Get('/platform/tenants')
  async getTenants(@Query() query: unknown) {
    const queryDto = validate<PlatformTenantsQueryDto>(PlatformTenantsQuerySchema, query);
    return this.platformService.getTenants(queryDto);
  }

  @Endpoint('PLATFORM_TENANT_STATUS')
  @Patch('/platform/tenants/:tenantId/status')
  async updateTenantStatus(
    @Param('tenantId') tenantId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<PlatformTenantStatusDto>(PlatformTenantStatusSchema, body);
    return this.platformService.updateTenantStatus(tenantId, dto);
  }

  @Endpoint('PLATFORM_PLAN_CREATE')
  @Post('/platform/plans')
  @HttpCode(HttpStatus.CREATED)
  async createPlan(@Body() body: unknown) {
    const dto = validate<PlatformPlanCreateDto>(PlatformPlanCreateSchema, body);
    return this.platformService.createPlan(dto);
  }

  @Endpoint('PLATFORM_PLAN_UPDATE')
  @Put('/platform/plans/:planId')
  async updatePlan(
    @Param('planId') planId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<PlatformPlanUpdateDto>(PlatformPlanUpdateSchema, body);
    return this.platformService.updatePlan(planId, dto);
  }
}

