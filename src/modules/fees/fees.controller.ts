import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FeesService } from './fees.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  FeeCategoryCreateSchema,
  FeeStructureCreateSchema,
  FeeStructureUpdateSchema,
  FeeAssignStudentSchema,
  FeeCollectSchema,
  FeePaymentsQuerySchema,
  FeePaymentRefundSchema,
  FeeConcessionSchema,
  FeeDuesQuerySchema,
  FeeRemindersSendSchema,
  FeeOnlineInitiateSchema,
  FeeOnlineConfirmSchema,
  FeeCategoryCreateDto,
  FeeStructureCreateDto,
  FeeStructureUpdateDto,
  FeeAssignStudentDto,
  FeeCollectDto,
  FeePaymentsQueryDto,
  FeePaymentRefundDto,
  FeeConcessionDto,
  FeeDuesQueryDto,
  FeeRemindersSendDto,
  FeeOnlineInitiateDto,
  FeeOnlineConfirmDto,
} from './dto/fees.dto';
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
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Endpoint('FEE_CATEGORIES_LIST')
  @Get('/fees/categories')
  async getCategories(@CurrentUser() user: CurrentUserPayload) {
    return this.feesService.getCategories(user.tenantId);
  }

  @Endpoint('FEE_CATEGORY_CREATE')
  @Post('/fees/categories')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<FeeCategoryCreateDto>(FeeCategoryCreateSchema, body);
    return this.feesService.createCategory(user.tenantId, dto);
  }

  @Endpoint('FEE_STRUCTURES_LIST')
  @Get('/fees/structures')
  async getStructures(
    @CurrentUser() user: CurrentUserPayload,
    @Query('classId') classId?: string,
  ) {
    return this.feesService.getStructures(user.tenantId, classId);
  }

  @Endpoint('FEE_STRUCTURE_CREATE')
  @Post('/fees/structures')
  @HttpCode(HttpStatus.CREATED)
  async createStructure(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<FeeStructureCreateDto>(FeeStructureCreateSchema, body);
    return this.feesService.createStructure(user.tenantId, dto);
  }

  @Endpoint('FEE_STRUCTURE_UPDATE')
  @Put('/fees/structures/:structureId')
  async updateStructure(
    @CurrentUser() user: CurrentUserPayload,
    @Param('structureId') structureId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<FeeStructureUpdateDto>(FeeStructureUpdateSchema, body);
    return this.feesService.updateStructure(user.tenantId, structureId, dto);
  }

  @Endpoint('FEE_ASSIGN_STUDENT')
  @Post('/fees/students/:studentId/assign')
  @HttpCode(HttpStatus.CREATED)
  async assignStudentFee(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<FeeAssignStudentDto>(FeeAssignStudentSchema, body);
    return this.feesService.assignStudentFee(user.tenantId, studentId, dto);
  }

  @Endpoint('FEE_STUDENT_LEDGER')
  @Get('/fees/students/:studentId/ledger')
  async getStudentLedger(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
  ) {
    return this.feesService.getStudentLedger(user.tenantId, studentId);
  }

  @Endpoint('FEE_COLLECT')
  @Post('/fees/payments')
  @HttpCode(HttpStatus.CREATED)
  async collectFee(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<FeeCollectDto>(FeeCollectSchema, body);
    return this.feesService.collectFee(user.tenantId, user.userId, dto);
  }

  @Endpoint('FEE_PAYMENTS_LIST')
  @Get('/fees/payments')
  async getPayments(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<FeePaymentsQueryDto>(FeePaymentsQuerySchema, query);
    return this.feesService.getPayments(user.tenantId, queryDto);
  }

  @Endpoint('FEE_RECEIPT')
  @Get('/fees/payments/:paymentId/receipt')
  async getReceipt(
    @CurrentUser() user: CurrentUserPayload,
    @Param('paymentId') paymentId: string,
  ) {
    return this.feesService.getReceipt(user.tenantId, paymentId);
  }

  @Endpoint('FEE_PAYMENT_REFUND')
  @Post('/fees/payments/:paymentId/refund')
  @HttpCode(HttpStatus.OK)
  async refundPayment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('paymentId') paymentId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<FeePaymentRefundDto>(FeePaymentRefundSchema, body);
    return this.feesService.refundPayment(user.tenantId, paymentId, dto);
  }

  @Endpoint('FEE_CONCESSION')
  @Post('/fees/concessions')
  @HttpCode(HttpStatus.CREATED)
  async applyConcession(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<FeeConcessionDto>(FeeConcessionSchema, body);
    return this.feesService.applyConcession(user.tenantId, user.userId, dto);
  }

  @Endpoint('FEE_DUES')
  @Get('/fees/dues')
  async getDues(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<FeeDuesQueryDto>(FeeDuesQuerySchema, query);
    return this.feesService.getDues(user.tenantId, queryDto);
  }

  @Endpoint('FEE_REMINDERS_SEND')
  @Post('/fees/reminders')
  @HttpCode(HttpStatus.OK)
  async sendReminders(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<FeeRemindersSendDto>(FeeRemindersSendSchema, body);
    return this.feesService.sendReminders(user.tenantId, dto);
  }

  @Endpoint('FEE_SUMMARY')
  @Get('/fees/summary')
  async getFeeSummary(@CurrentUser() user: CurrentUserPayload) {
    return this.feesService.getFeeSummary(user.tenantId);
  }

  @Endpoint('FEE_ONLINE_INITIATE')
  @Post('/fees/online/initiate')
  @HttpCode(HttpStatus.OK)
  async initiateOnlinePayment(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<FeeOnlineInitiateDto>(FeeOnlineInitiateSchema, body);
    return this.feesService.initiateOnlinePayment(user.tenantId, dto);
  }

  @Endpoint('FEE_ONLINE_CONFIRM')
  @Post('/fees/online/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmOnlinePayment(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<FeeOnlineConfirmDto>(FeeOnlineConfirmSchema, body);
    return this.feesService.confirmOnlinePayment(user.tenantId, user.userId, dto);
  }
}

