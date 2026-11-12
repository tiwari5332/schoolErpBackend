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
import { BulkService } from './bulk.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  BulkUploadSchema,
  BulkHistoryQuerySchema,
  BulkUploadDto,
  BulkHistoryQueryDto,
} from './dto/bulk.dto';
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
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Endpoint('BULK_TEMPLATE')
  @Get('/bulk/templates/:entity')
  async getTemplate(@Param('entity') entity: string) {
    return this.bulkService.getTemplate(entity);
  }

  @Endpoint('BULK_UPLOAD')
  @Post('/bulk/imports')
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<BulkUploadDto>(BulkUploadSchema, body);
    return this.bulkService.upload(user.tenantId, user.userId, dto);
  }

  @Endpoint('BULK_GET')
  @Get('/bulk/imports/:importId')
  async getImport(
    @CurrentUser() user: CurrentUserPayload,
    @Param('importId') importId: string,
  ) {
    return this.bulkService.getImport(user.tenantId, importId);
  }

  @Endpoint('BULK_ROWS')
  @Get('/bulk/imports/:importId/rows')
  async getRows(
    @CurrentUser() user: CurrentUserPayload,
    @Param('importId') importId: string,
  ) {
    return this.bulkService.getRows(user.tenantId, importId);
  }

  @Endpoint('BULK_COMMIT')
  @Post('/bulk/imports/:importId/commit')
  @HttpCode(HttpStatus.OK)
  async commitImport(
    @CurrentUser() user: CurrentUserPayload,
    @Param('importId') importId: string,
  ) {
    return this.bulkService.commitImport(user.tenantId, importId);
  }

  @Endpoint('BULK_ERROR_REPORT')
  @Get('/bulk/imports/:importId/error-report')
  async getErrorReport(
    @CurrentUser() user: CurrentUserPayload,
    @Param('importId') importId: string,
  ) {
    return this.bulkService.getErrorReport(user.tenantId, importId);
  }

  @Endpoint('BULK_CANCEL')
  @Post('/bulk/imports/:importId/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelImport(
    @CurrentUser() user: CurrentUserPayload,
    @Param('importId') importId: string,
  ) {
    await this.bulkService.cancelImport(user.tenantId, importId);
  }

  @Endpoint('BULK_HISTORY')
  @Get('/bulk/imports')
  async getHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<BulkHistoryQueryDto>(BulkHistoryQuerySchema, query);
    return this.bulkService.getHistory(user.tenantId, queryDto);
  }
}

