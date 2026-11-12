import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  StudentAttendanceGetQuerySchema,
  StudentAttendanceMarkSchema,
  StudentAttendanceSummaryQuerySchema,
  StudentAttendanceMonthlyQuerySchema,
  StaffAttendanceGetQuerySchema,
  StaffAttendanceMarkSchema,
  StaffAttendanceCheckInSchema,
  StaffAttendanceMonthlyQuerySchema,
  StudentAttendanceGetQueryDto,
  StudentAttendanceMarkDto,
  StudentAttendanceSummaryQueryDto,
  StudentAttendanceMonthlyQueryDto,
  StaffAttendanceGetQueryDto,
  StaffAttendanceMarkDto,
  StaffAttendanceCheckInDto,
  StaffAttendanceMonthlyQueryDto,
} from './dto/attendance.dto';
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
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Endpoint('ATT_STUDENT_GET')
  @Get('/attendance/students')
  async getStudentAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<StudentAttendanceGetQueryDto>(StudentAttendanceGetQuerySchema, query);
    return this.attendanceService.getStudentAttendance(user.tenantId, queryDto);
  }

  @Endpoint('ATT_STUDENT_MARK')
  @Post('/attendance/students')
  @HttpCode(HttpStatus.OK)
  async markStudentAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<StudentAttendanceMarkDto>(StudentAttendanceMarkSchema, body);
    return this.attendanceService.markStudentAttendance(user.tenantId, user.userId, dto);
  }

  @Endpoint('ATT_STUDENT_SUMMARY')
  @Get('/attendance/students/summary')
  async getStudentAttendanceSummary(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<StudentAttendanceSummaryQueryDto>(StudentAttendanceSummaryQuerySchema, query);
    return this.attendanceService.getStudentAttendanceSummary(user.tenantId, queryDto);
  }

  @Endpoint('ATT_STUDENT_MONTHLY')
  @Get('/attendance/students/monthly')
  async getStudentMonthlyAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<StudentAttendanceMonthlyQueryDto>(StudentAttendanceMonthlyQuerySchema, query);
    return this.attendanceService.getStudentMonthlyAttendance(user.tenantId, queryDto);
  }

  @Endpoint('ATT_STAFF_GET')
  @Get('/attendance/staff')
  async getStaffAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<StaffAttendanceGetQueryDto>(StaffAttendanceGetQuerySchema, query);
    return this.attendanceService.getStaffAttendance(user.tenantId, queryDto);
  }

  @Endpoint('ATT_STAFF_MARK')
  @Post('/attendance/staff')
  @HttpCode(HttpStatus.OK)
  async markStaffAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<StaffAttendanceMarkDto>(StaffAttendanceMarkSchema, body);
    return this.attendanceService.markStaffAttendance(user.tenantId, user.userId, dto);
  }

  @Endpoint('ATT_STAFF_SELF_CHECKIN')
  @Post('/attendance/staff/check-in')
  @HttpCode(HttpStatus.OK)
  async staffSelfCheckIn(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<StaffAttendanceCheckInDto>(StaffAttendanceCheckInSchema, body);
    return this.attendanceService.staffSelfCheckIn(user.tenantId, user.userId, dto);
  }

  @Endpoint('ATT_STAFF_MONTHLY')
  @Get('/attendance/staff/monthly')
  async getStaffMonthlyAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<StaffAttendanceMonthlyQueryDto>(StaffAttendanceMonthlyQuerySchema, query);
    return this.attendanceService.getStaffMonthlyAttendance(user.tenantId, queryDto);
  }
}

