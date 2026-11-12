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
import { ExamsService } from './exams.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  ExamsListQuerySchema,
  ExamCreateSchema,
  ExamUpdateSchema,
  ExamMarksGetQuerySchema,
  ExamMarksSaveSchema,
  ExamMarksLockSchema,
  ExamResultsQuerySchema,
  ReportCardGetQuerySchema,
  ReportCardPdfBulkSchema,
  AdmitCardsPdfSchema,
  ExamsListQueryDto,
  ExamCreateDto,
  ExamUpdateDto,
  ExamMarksGetQueryDto,
  ExamMarksSaveDto,
  ExamMarksLockDto,
  ExamResultsQueryDto,
  ReportCardGetQueryDto,
  ReportCardPdfBulkDto,
  AdmitCardsPdfDto,
} from './dto/exams.dto';
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
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Endpoint('EXAMS_LIST')
  @Get('/exams')
  async getExams(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<ExamsListQueryDto>(ExamsListQuerySchema, query);
    return this.examsService.getExams(user.tenantId, queryDto);
  }

  @Endpoint('EXAM_CREATE')
  @Post('/exams')
  @HttpCode(HttpStatus.CREATED)
  async createExam(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<ExamCreateDto>(ExamCreateSchema, body);
    return this.examsService.createExam(user.tenantId, dto);
  }

  @Endpoint('EXAM_GET')
  @Get('/exams/:examId')
  async getExamById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
  ) {
    return this.examsService.getExamById(user.tenantId, examId);
  }

  @Endpoint('EXAM_UPDATE')
  @Put('/exams/:examId')
  async updateExam(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<ExamUpdateDto>(ExamUpdateSchema, body);
    return this.examsService.updateExam(user.tenantId, examId, dto);
  }

  @Endpoint('EXAM_DELETE')
  @Delete('/exams/:examId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExam(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
  ) {
    await this.examsService.deleteExam(user.tenantId, examId);
  }

  @Endpoint('EXAM_MARKS_GET')
  @Get('/exams/:examId/marks')
  async getExamMarks(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
    @Query() query: unknown,
  ) {
    const queryDto = validate<ExamMarksGetQueryDto>(ExamMarksGetQuerySchema, query);
    return this.examsService.getExamMarks(user.tenantId, examId, queryDto);
  }

  @Endpoint('EXAM_MARKS_SAVE')
  @Put('/exams/:examId/marks')
  async saveExamMarks(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<ExamMarksSaveDto>(ExamMarksSaveSchema, body);
    return this.examsService.saveExamMarks(user.tenantId, examId, user.userId, dto);
  }

  @Endpoint('EXAM_MARKS_LOCK')
  @Post('/exams/:examId/marks/lock')
  @HttpCode(HttpStatus.OK)
  async lockExamMarks(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<ExamMarksLockDto>(ExamMarksLockSchema, body);
    return this.examsService.lockExamMarks(user.tenantId, examId, user.userId, dto);
  }

  @Endpoint('EXAM_MARKS_UNLOCK')
  @Post('/exams/:examId/marks/unlock')
  @HttpCode(HttpStatus.OK)
  async unlockExamMarks(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<ExamMarksLockDto>(ExamMarksLockSchema, body);
    return this.examsService.unlockExamMarks(user.tenantId, examId, user.userId, dto);
  }

  @Endpoint('EXAM_MARKS_IMPORT')
  @Post('/exams/:examId/marks/import')
  @HttpCode(HttpStatus.OK)
  async importMarks(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
  ) {
    return this.examsService.importMarks(user.tenantId, examId, user.userId);
  }

  @Endpoint('EXAM_PUBLISH')
  @Post('/exams/:examId/publish')
  @HttpCode(HttpStatus.OK)
  async publishExam(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
  ) {
    return this.examsService.publishExam(user.tenantId, examId, user.userId);
  }

  @Endpoint('EXAM_UNPUBLISH')
  @Post('/exams/:examId/unpublish')
  @HttpCode(HttpStatus.OK)
  async unpublishExam(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
  ) {
    return this.examsService.unpublishExam(user.tenantId, examId, user.userId);
  }

  @Endpoint('EXAM_RESULTS')
  @Get('/exams/:examId/results')
  async getExamResults(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
    @Query() query: unknown,
  ) {
    const queryDto = validate<ExamResultsQueryDto>(ExamResultsQuerySchema, query);
    return this.examsService.getExamResults(user.tenantId, examId, queryDto);
  }

  @Endpoint('REPORT_CARD_GET')
  @Get('/students/:studentId/report-card')
  async getStudentReportCard(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Query() query: unknown,
  ) {
    const queryDto = validate<ReportCardGetQueryDto>(ReportCardGetQuerySchema, query);
    return this.examsService.getStudentReportCard(user.tenantId, studentId, queryDto);
  }

  @Endpoint('REPORT_CARD_PDF_BULK')
  @Post('/exams/:examId/report-cards/pdf')
  @HttpCode(HttpStatus.OK)
  async generateReportCardsPdf(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<ReportCardPdfBulkDto>(ReportCardPdfBulkSchema, body);
    return this.examsService.generateReportCardsPdf(user.tenantId, examId, dto);
  }

  @Endpoint('ADMIT_CARDS_PDF')
  @Post('/exams/:examId/admit-cards/pdf')
  @HttpCode(HttpStatus.OK)
  async generateAdmitCardsPdf(
    @CurrentUser() user: CurrentUserPayload,
    @Param('examId') examId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<AdmitCardsPdfDto>(AdmitCardsPdfSchema, body);
    return this.examsService.generateAdmitCardsPdf(user.tenantId, examId, dto);
  }
}

