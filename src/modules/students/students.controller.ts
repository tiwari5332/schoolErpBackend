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
import { StudentsService } from './students.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  StudentsQuerySchema,
  StudentCreateSchema,
  StudentUpdateSchema,
  StudentStatusSchema,
  StudentDocumentUploadSchema,
  StudentPromoteSchema,
  StudentTcGenerateSchema,
  StudentIdCardsSchema,
  StudentsQueryDto,
  StudentCreateDto,
  StudentUpdateDto,
  StudentStatusDto,
  StudentDocumentUploadDto,
  StudentPromoteDto,
  StudentTcGenerateDto,
  StudentIdCardsDto,
} from './dto/students.dto';
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
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Endpoint('STUDENTS_LIST')
  @Get('/students')
  async getStudents(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<StudentsQueryDto>(StudentsQuerySchema, query);
    return this.studentsService.getStudents(user.tenantId, queryDto);
  }

  @Endpoint('STUDENT_CREATE')
  @Post('/students')
  @HttpCode(HttpStatus.CREATED)
  async createStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<StudentCreateDto>(StudentCreateSchema, body);
    return this.studentsService.createStudent(user.tenantId, dto);
  }

  @Endpoint('STUDENT_GET')
  @Get('/students/:studentId')
  async getStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
  ) {
    return this.studentsService.getStudentById(user.tenantId, studentId);
  }

  @Endpoint('STUDENT_UPDATE')
  @Put('/students/:studentId')
  async updateStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<StudentUpdateDto>(StudentUpdateSchema, body);
    return this.studentsService.updateStudent(user.tenantId, studentId, dto);
  }

  @Endpoint('STUDENT_STATUS')
  @Patch('/students/:studentId/status')
  async updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<StudentStatusDto>(StudentStatusSchema, body);
    return this.studentsService.updateStatus(user.tenantId, studentId, dto);
  }

  @Endpoint('STUDENT_DELETE')
  @Delete('/students/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
  ) {
    await this.studentsService.deleteStudent(user.tenantId, studentId);
  }

  @Endpoint('STUDENT_DOCUMENT_UPLOAD')
  @Post('/students/:studentId/documents')
  @HttpCode(HttpStatus.CREATED)
  async uploadDocument(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<StudentDocumentUploadDto>(StudentDocumentUploadSchema, body);
    return this.studentsService.uploadDocument(user.tenantId, studentId, dto);
  }

  @Endpoint('STUDENT_PROMOTE')
  @Post('/students/promotions')
  @HttpCode(HttpStatus.OK)
  async promoteStudents(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<StudentPromoteDto>(StudentPromoteSchema, body);
    return this.studentsService.promoteStudents(user.tenantId, dto);
  }

  @Endpoint('STUDENT_TC_GENERATE')
  @Post('/students/:studentId/transfer-certificate')
  @HttpCode(HttpStatus.CREATED)
  async generateTc(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<StudentTcGenerateDto>(StudentTcGenerateSchema, body);
    return this.studentsService.generateTc(user.tenantId, studentId, dto);
  }

  @Endpoint('STUDENT_ID_CARDS')
  @Post('/students/id-cards')
  @HttpCode(HttpStatus.OK)
  async generateIdCards(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<StudentIdCardsDto>(StudentIdCardsSchema, body);
    return this.studentsService.generateIdCards(user.tenantId, dto);
  }

  @Endpoint('STUDENT_NEXT_ADMISSION_NO')
  @Get('/students/next-admission-no')
  async getNextAdmissionNo(@CurrentUser() user: CurrentUserPayload) {
    return this.studentsService.getNextAdmissionNo(user.tenantId);
  }
}

