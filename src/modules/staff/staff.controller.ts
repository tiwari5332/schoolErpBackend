import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  StaffQuerySchema,
  StaffCreateSchema,
  StaffUpdateSchema,
  StaffStatusSchema,
  LeaveApplySchema,
  LeavesListQuerySchema,
  LeaveDecideSchema,
  StaffQueryDto,
  StaffCreateDto,
  StaffUpdateDto,
  StaffStatusDto,
  LeaveApplyDto,
  LeavesListQueryDto,
  LeaveDecideDto,
} from './dto/staff.dto';
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
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Endpoint('STAFF_LIST')
  @Get('/staff')
  async getStaff(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<StaffQueryDto>(StaffQuerySchema, query);
    return this.staffService.getStaff(user.tenantId, queryDto);
  }

  @Endpoint('STAFF_CREATE')
  @Post('/staff')
  @HttpCode(HttpStatus.CREATED)
  async createStaff(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<StaffCreateDto>(StaffCreateSchema, body);
    return this.staffService.createStaff(user.tenantId, dto);
  }

  @Endpoint('STAFF_GET')
  @Get('/staff/:staffId')
  async getStaffById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('staffId') staffId: string,
  ) {
    return this.staffService.getStaffById(user.tenantId, staffId);
  }

  @Endpoint('STAFF_UPDATE')
  @Put('/staff/:staffId')
  async updateStaff(
    @CurrentUser() user: CurrentUserPayload,
    @Param('staffId') staffId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<StaffUpdateDto>(StaffUpdateSchema, body);
    return this.staffService.updateStaff(user.tenantId, staffId, dto);
  }

  @Endpoint('STAFF_STATUS')
  @Patch('/staff/:staffId/status')
  async updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('staffId') staffId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<StaffStatusDto>(StaffStatusSchema, body);
    return this.staffService.updateStatus(user.tenantId, staffId, dto);
  }

  @Endpoint('STAFF_DELETE')
  @Delete('/staff/:staffId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStaff(
    @CurrentUser() user: CurrentUserPayload,
    @Param('staffId') staffId: string,
  ) {
    await this.staffService.deleteStaff(user.tenantId, staffId);
  }

  @Endpoint('LEAVE_APPLY')
  @Post('/leaves')
  @HttpCode(HttpStatus.CREATED)
  async applyLeave(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<LeaveApplyDto>(LeaveApplySchema, body);
    return this.staffService.applyLeave(user.tenantId, user.userId, dto);
  }

  @Endpoint('LEAVES_LIST')
  @Get('/leaves')
  async getLeaves(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<LeavesListQueryDto>(LeavesListQuerySchema, query);
    return this.staffService.getLeaves(user.tenantId, queryDto);
  }

  @Endpoint('LEAVE_DECIDE')
  @Post('/leaves/:leaveId/decision')
  @HttpCode(HttpStatus.OK)
  async decideLeave(
    @CurrentUser() user: CurrentUserPayload,
    @Param('leaveId') leaveId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<LeaveDecideDto>(LeaveDecideSchema, body);
    return this.staffService.decideLeave(user.tenantId, leaveId, user.userId, dto);
  }

  @Endpoint('LEAVE_CANCEL')
  @Post('/leaves/:leaveId/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelLeave(
    @CurrentUser() user: CurrentUserPayload,
    @Param('leaveId') leaveId: string,
  ) {
    await this.staffService.cancelLeave(user.tenantId, leaveId);
  }
}
