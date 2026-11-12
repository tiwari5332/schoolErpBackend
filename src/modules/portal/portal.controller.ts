import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  PortalLeaveApplySchema,
  PortalAttendanceQuerySchema,
  PortalLeaveApplyDto,
  PortalAttendanceQueryDto,
} from './dto/portal.dto';
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
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Endpoint('PORTAL_CHILDREN')
  @Get('/portal/children')
  async getChildren(@CurrentUser() user: CurrentUserPayload) {
    return this.portalService.getChildren(user.tenantId, user.userId);
  }

  @Endpoint('PORTAL_OVERVIEW')
  @Get('/portal/children/:studentId/overview')
  async getOverview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
  ) {
    return this.portalService.getOverview(user.tenantId, studentId);
  }

  @Endpoint('PORTAL_ATTENDANCE')
  @Get('/portal/children/:studentId/attendance')
  async getAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Query() query: unknown,
  ) {
    const queryDto = validate<PortalAttendanceQueryDto>(PortalAttendanceQuerySchema, query);
    return this.portalService.getAttendance(user.tenantId, studentId, queryDto);
  }

  @Endpoint('PORTAL_FEES')
  @Get('/portal/children/:studentId/fees')
  async getFees(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
  ) {
    return this.portalService.getFees(user.tenantId, studentId);
  }

  @Endpoint('PORTAL_RESULTS')
  @Get('/portal/children/:studentId/results')
  async getResults(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
  ) {
    return this.portalService.getResults(user.tenantId, studentId);
  }

  @Endpoint('PORTAL_LEAVE_APPLY')
  @Post('/portal/children/:studentId/leave')
  @HttpCode(HttpStatus.CREATED)
  async applyLeave(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<PortalLeaveApplyDto>(PortalLeaveApplySchema, body);
    return this.portalService.applyLeave(user.tenantId, studentId, user.userId, dto);
  }
}

