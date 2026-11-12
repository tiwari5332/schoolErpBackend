import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  ReportDataRunSchema,
  ReportExportJobSchema,
  ReportDataRunDto,
  ReportExportJobDto,
} from './dto/reports.dto';
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
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Endpoint('REPORTS_CATALOG')
  @Get('/reports')
  async getCatalog(@CurrentUser() user: CurrentUserPayload) {
    return this.reportsService.getCatalog(user.tenantId);
  }

  @Endpoint('REPORT_DATA')
  @Post('/reports/:reportKey/data')
  @HttpCode(HttpStatus.OK)
  async runReport(
    @CurrentUser() user: CurrentUserPayload,
    @Param('reportKey') reportKey: string,
    @Body() body: unknown,
  ) {
    const dto = validate<ReportDataRunDto>(ReportDataRunSchema, body);
    return this.reportsService.runReport(user.tenantId, reportKey, dto);
  }

  @Endpoint('REPORT_EXPORT_JOB')
  @Post('/reports/:reportKey/export')
  @HttpCode(HttpStatus.ACCEPTED)
  async createExportJob(
    @CurrentUser() user: CurrentUserPayload,
    @Param('reportKey') reportKey: string,
    @Body() body: unknown,
  ) {
    const dto = validate<ReportExportJobDto>(ReportExportJobSchema, body);
    return this.reportsService.createExportJob(user.tenantId, reportKey, dto);
  }

  @Endpoint('REPORT_EXPORT_STATUS')
  @Get('/reports/jobs/:jobId')
  async getExportStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId') jobId: string,
  ) {
    return this.reportsService.getExportStatus(user.tenantId, jobId);
  }
}

