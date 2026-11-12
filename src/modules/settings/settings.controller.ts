import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  SchoolProfileUpdateSchema,
  PreferencesUpdateSchema,
  FileUploadSchema,
  AuditLogsQuerySchema,
  SchoolProfileUpdateDto,
  PreferencesUpdateDto,
  FileUploadDto,
  AuditLogsQueryDto,
} from './dto/settings.dto';
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
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Endpoint('SCHOOL_PROFILE_GET')
  @Get('/settings/school')
  async getSchoolProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.settingsService.getSchoolProfile(user.tenantId);
  }

  @Endpoint('SCHOOL_PROFILE_UPDATE')
  @Put('/settings/school')
  async updateSchoolProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<SchoolProfileUpdateDto>(SchoolProfileUpdateSchema, body);
    return this.settingsService.updateSchoolProfile(user.tenantId, dto);
  }

  @Endpoint('PREFERENCES_GET')
  @Get('/settings/preferences')
  async getPreferences(@CurrentUser() user: CurrentUserPayload) {
    return this.settingsService.getPreferences(user.tenantId);
  }

  @Endpoint('PREFERENCES_UPDATE')
  @Put('/settings/preferences')
  async updatePreferences(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<PreferencesUpdateDto>(PreferencesUpdateSchema, body);
    return this.settingsService.updatePreferences(user.tenantId, dto);
  }

  @Endpoint('FILE_UPLOAD')
  @Post('/files')
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<FileUploadDto>(FileUploadSchema, body);
    return this.settingsService.uploadFile(user.tenantId, user.userId, dto);
  }

  @Endpoint('AUDIT_LOGS')
  @Get('/audit-logs')
  async getAuditLogs(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<AuditLogsQueryDto>(AuditLogsQuerySchema, query);
    return this.settingsService.getAuditLogs(user.tenantId, queryDto);
  }
}

