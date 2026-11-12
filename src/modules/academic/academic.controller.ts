import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AcademicService } from './academic.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  SessionCreateSchema,
  SessionRolloverSchema,
  ClassCreateSchema,
  ClassUpdateSchema,
  SubjectCreateSchema,
  SubjectUpdateSchema,
  ClassSubjectsAssignSchema,
  GradeScaleUpsertSchema,
  SessionCreateDto,
  SessionRolloverDto,
  ClassCreateDto,
  ClassUpdateDto,
  SubjectCreateDto,
  SubjectUpdateDto,
  ClassSubjectsAssignDto,
  GradeScaleUpsertDto,
} from './dto/academic.dto';
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
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  // ----------------------------------------------------
  // SESSIONS
  // ----------------------------------------------------

  @Endpoint('SESSIONS_LIST')
  @Get('/academic/sessions')
  async getSessions(@CurrentUser() user: CurrentUserPayload) {
    return this.academicService.getSessions(user.tenantId);
  }

  @Endpoint('SESSION_CREATE')
  @Post('/academic/sessions')
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<SessionCreateDto>(SessionCreateSchema, body);
    return this.academicService.createSession(user.tenantId, dto);
  }

  @Endpoint('SESSION_ACTIVATE')
  @Post('/academic/sessions/:sessionId/activate')
  @HttpCode(HttpStatus.OK)
  async activateSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.academicService.activateSession(user.tenantId, sessionId);
  }

  @Endpoint('SESSION_ROLLOVER')
  @Post('/academic/sessions/:sessionId/rollover')
  @HttpCode(HttpStatus.OK)
  async rolloverSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sessionId') sessionId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<SessionRolloverDto>(SessionRolloverSchema, body);
    return this.academicService.rolloverSession(user.tenantId, sessionId, dto);
  }

  @Endpoint('SESSION_LOCK')
  @Post('/academic/sessions/:sessionId/lock')
  @HttpCode(HttpStatus.OK)
  async lockSession(
    @CurrentUser() user: CurrentUserPayload,
    @Param('sessionId') sessionId: string,
  ) {
    return this.academicService.lockSession(user.tenantId, sessionId);
  }

  // ----------------------------------------------------
  // CLASSES & SECTIONS
  // ----------------------------------------------------

  @Endpoint('CLASSES_LIST')
  @Get('/academic/classes')
  async getClasses(@CurrentUser() user: CurrentUserPayload) {
    return this.academicService.getClasses(user.tenantId);
  }

  @Endpoint('CLASS_CREATE')
  @Post('/academic/classes')
  @HttpCode(HttpStatus.CREATED)
  async createClass(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<ClassCreateDto>(ClassCreateSchema, body);
    return this.academicService.createClass(user.tenantId, dto);
  }

  @Endpoint('CLASS_UPDATE')
  @Put('/academic/classes/:classId')
  async updateClass(
    @CurrentUser() user: CurrentUserPayload,
    @Param('classId') classId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<ClassUpdateDto>(ClassUpdateSchema, body);
    return this.academicService.updateClass(user.tenantId, classId, dto);
  }

  @Endpoint('CLASS_DELETE')
  @Delete('/academic/classes/:classId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClass(
    @CurrentUser() user: CurrentUserPayload,
    @Param('classId') classId: string,
  ) {
    await this.academicService.deleteClass(user.tenantId, classId);
  }

  // ----------------------------------------------------
  // SUBJECTS
  // ----------------------------------------------------

  @Endpoint('SUBJECTS_LIST')
  @Get('/academic/subjects')
  async getSubjects(@CurrentUser() user: CurrentUserPayload) {
    return this.academicService.getSubjects(user.tenantId);
  }

  @Endpoint('SUBJECT_CREATE')
  @Post('/academic/subjects')
  @HttpCode(HttpStatus.CREATED)
  async createSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<SubjectCreateDto>(SubjectCreateSchema, body);
    return this.academicService.createSubject(user.tenantId, dto);
  }

  @Endpoint('SUBJECT_UPDATE')
  @Put('/academic/subjects/:subjectId')
  async updateSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('subjectId') subjectId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<SubjectUpdateDto>(SubjectUpdateSchema, body);
    return this.academicService.updateSubject(user.tenantId, subjectId, dto);
  }

  @Endpoint('CLASS_SUBJECTS_ASSIGN')
  @Put('/academic/classes/:classId/subjects')
  async assignClassSubjects(
    @CurrentUser() user: CurrentUserPayload,
    @Param('classId') classId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<ClassSubjectsAssignDto>(ClassSubjectsAssignSchema, body);
    return this.academicService.assignClassSubjects(user.tenantId, classId, dto);
  }

  // ----------------------------------------------------
  // GRADE SCALES
  // ----------------------------------------------------

  @Endpoint('GRADE_SCALES_LIST')
  @Get('/academic/grade-scales')
  async getGradeScales(@CurrentUser() user: CurrentUserPayload) {
    return this.academicService.getGradeScales(user.tenantId);
  }

  @Endpoint('GRADE_SCALE_UPSERT')
  @Put('/academic/grade-scales/:gradeScaleId')
  async upsertGradeScale(
    @CurrentUser() user: CurrentUserPayload,
    @Param('gradeScaleId') gradeScaleId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<GradeScaleUpsertDto>(GradeScaleUpsertSchema, body);
    return this.academicService.upsertGradeScale(user.tenantId, gradeScaleId, dto);
  }
}

