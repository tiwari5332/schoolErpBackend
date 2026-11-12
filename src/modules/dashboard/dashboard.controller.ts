import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  TrendQuerySchema,
  ApprovalDecisionSchema,
  ApprovalsListQuerySchema,
  GlobalSearchQuerySchema,
  NotificationsQuerySchema,
  TrendQueryDto,
  ApprovalDecisionDto,
  ApprovalsListQueryDto,
  GlobalSearchQueryDto,
  NotificationsQueryDto,
} from './dto/dashboard.dto';
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
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Endpoint('DASH_KPI_STUDENTS')
  @Get('/dashboard/kpis/students')
  async getStudentsKpi(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getStudentsKpi(user.tenantId);
  }

  @Endpoint('DASH_KPI_STAFF')
  @Get('/dashboard/kpis/staff')
  async getStaffKpi(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getStaffKpi(user.tenantId);
  }

  @Endpoint('DASH_KPI_FEES_TODAY')
  @Get('/dashboard/kpis/fees-today')
  async getFeesTodayKpi(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getFeesTodayKpi(user.tenantId);
  }

  @Endpoint('DASH_KPI_ATTENDANCE')
  @Get('/dashboard/kpis/attendance')
  async getAttendanceKpi(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getAttendanceKpi(user.tenantId);
  }

  @Endpoint('DASH_QUICK_ACTIONS')
  @Get('/dashboard/quick-actions')
  async getQuickActions(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getQuickActions(user.tenantId, user.roleKey || 'SUPER_ADMIN');
  }

  @Endpoint('DASH_FEE_TREND')
  @Get('/dashboard/charts/fee-trend')
  async getFeeTrend(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<TrendQueryDto>(TrendQuerySchema, query);
    return this.dashboardService.getFeeTrend(user.tenantId, queryDto);
  }

  @Endpoint('DASH_ATTENDANCE_TREND')
  @Get('/dashboard/charts/attendance-trend')
  async getAttendanceTrend(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<TrendQueryDto>(TrendQuerySchema, query);
    return this.dashboardService.getAttendanceTrend(user.tenantId, queryDto);
  }

  @Endpoint('DASH_PENDING_APPROVALS')
  @Get('/dashboard/pending-approvals')
  async getPendingApprovals(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getPendingApprovals(user.tenantId);
  }

  @Endpoint('APPROVALS_LIST')
  @Get('/approvals')
  async getApprovalsList(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<ApprovalsListQueryDto>(ApprovalsListQuerySchema, query);
    return this.dashboardService.getApprovalsList(user.tenantId, queryDto);
  }

  @Endpoint('APPROVAL_DECIDE')
  @Post('/approvals/:approvalId/decision')
  @HttpCode(HttpStatus.OK)
  async decideApproval(
    @CurrentUser() user: CurrentUserPayload,
    @Param('approvalId') approvalId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<ApprovalDecisionDto>(ApprovalDecisionSchema, body);
    return this.dashboardService.decideApproval(user.tenantId, approvalId, user.userId, dto);
  }

  @Endpoint('GLOBAL_SEARCH')
  @Get('/search')
  async globalSearch(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<GlobalSearchQueryDto>(GlobalSearchQuerySchema, query);
    return this.dashboardService.globalSearch(user.tenantId, queryDto);
  }

  @Endpoint('NOTIFICATIONS_LIST')
  @Get('/notifications')
  async getNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<NotificationsQueryDto>(NotificationsQuerySchema, query);
    return this.dashboardService.getNotifications(user.tenantId, user.userId, queryDto);
  }

  @Endpoint('NOTIFICATION_READ')
  @Patch('/notifications/:notificationId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markNotificationRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('notificationId') notificationId: string,
  ) {
    await this.dashboardService.markNotificationRead(user.tenantId, user.userId, notificationId);
  }

  @Endpoint('NOTIFICATIONS_READ_ALL')
  @Post('/notifications/read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllNotificationsRead(@CurrentUser() user: CurrentUserPayload) {
    await this.dashboardService.markAllNotificationsRead(user.tenantId, user.userId);
  }
}

