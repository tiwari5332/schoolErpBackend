import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  PeriodsPutSchema,
  TimetableByClassQuerySchema,
  TimetableByTeacherQuerySchema,
  TimetableEntryUpsertSchema,
  TimetableSubstituteSchema,
  TimetableFreeTeachersQuerySchema,
  PeriodsPutDto,
  TimetableByClassQueryDto,
  TimetableByTeacherQueryDto,
  TimetableEntryUpsertDto,
  TimetableSubstituteDto,
  TimetableFreeTeachersQueryDto,
} from './dto/timetable.dto';
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
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Endpoint('PERIODS_GET')
  @Get('/timetable/periods')
  async getPeriods(@CurrentUser() user: CurrentUserPayload) {
    return this.timetableService.getPeriods(user.tenantId);
  }

  @Endpoint('PERIODS_PUT')
  @Put('/timetable/periods')
  @HttpCode(HttpStatus.OK)
  async replacePeriods(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<PeriodsPutDto>(PeriodsPutSchema, body);
    return this.timetableService.replacePeriods(user.tenantId, dto);
  }

  @Endpoint('TIMETABLE_BY_CLASS')
  @Get('/timetable/class')
  async getTimetableByClass(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<TimetableByClassQueryDto>(TimetableByClassQuerySchema, query);
    return this.timetableService.getTimetableByClass(user.tenantId, queryDto);
  }

  @Endpoint('TIMETABLE_BY_TEACHER')
  @Get('/timetable/teacher')
  async getTimetableByTeacher(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<TimetableByTeacherQueryDto>(TimetableByTeacherQuerySchema, query);
    return this.timetableService.getTimetableByTeacher(user.tenantId, user.userId, queryDto);
  }

  @Endpoint('TIMETABLE_ENTRY_UPSERT')
  @Put('/timetable/entries')
  @HttpCode(HttpStatus.OK)
  async upsertEntry(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<TimetableEntryUpsertDto>(TimetableEntryUpsertSchema, body);
    return this.timetableService.upsertEntry(user.tenantId, dto);
  }

  @Endpoint('TIMETABLE_ENTRY_DELETE')
  @Delete('/timetable/entries/:entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEntry(
    @CurrentUser() user: CurrentUserPayload,
    @Param('entryId') entryId: string,
  ) {
    await this.timetableService.deleteEntry(user.tenantId, entryId);
  }

  @Endpoint('TIMETABLE_SUBSTITUTE')
  @Post('/timetable/substitutions')
  @HttpCode(HttpStatus.CREATED)
  async assignSubstitute(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<TimetableSubstituteDto>(TimetableSubstituteSchema, body);
    return this.timetableService.assignSubstitute(user.tenantId, dto);
  }

  @Endpoint('TIMETABLE_FREE_TEACHERS')
  @Get('/timetable/free-teachers')
  async getFreeTeachers(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<TimetableFreeTeachersQueryDto>(TimetableFreeTeachersQuerySchema, query);
    return this.timetableService.getFreeTeachers(user.tenantId, queryDto);
  }
}

