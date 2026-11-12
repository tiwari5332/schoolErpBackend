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
import { CommunicationService } from './communication.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  NoticesQuerySchema,
  NoticeCreateSchema,
  NoticeRecipientCountSchema,
  TemplateUpsertSchema,
  ThreadCreateSchema,
  MessageSendSchema,
  NoticesQueryDto,
  NoticeCreateDto,
  NoticeRecipientCountDto,
  TemplateUpsertDto,
  ThreadCreateDto,
  MessageSendDto,
} from './dto/communication.dto';
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
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Endpoint('NOTICES_LIST')
  @Get('/communication/notices')
  async getNotices(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<NoticesQueryDto>(NoticesQuerySchema, query);
    return this.communicationService.getNotices(user.tenantId, queryDto);
  }

  @Endpoint('NOTICE_CREATE')
  @Post('/communication/notices')
  @HttpCode(HttpStatus.CREATED)
  async createNotice(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<NoticeCreateDto>(NoticeCreateSchema, body);
    return this.communicationService.createNotice(user.tenantId, user.userId, dto);
  }

  @Endpoint('NOTICE_GET')
  @Get('/communication/notices/:noticeId')
  async getNoticeById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('noticeId') noticeId: string,
  ) {
    return this.communicationService.getNoticeById(user.tenantId, noticeId);
  }

  @Endpoint('NOTICE_DELETE')
  @Delete('/communication/notices/:noticeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotice(
    @CurrentUser() user: CurrentUserPayload,
    @Param('noticeId') noticeId: string,
  ) {
    await this.communicationService.deleteNotice(user.tenantId, noticeId);
  }

  @Endpoint('NOTICE_RECIPIENT_COUNT')
  @Post('/communication/notices/recipient-count')
  @HttpCode(HttpStatus.OK)
  async calculateRecipientCount(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<NoticeRecipientCountDto>(NoticeRecipientCountSchema, body);
    return this.communicationService.calculateRecipientCount(user.tenantId, dto);
  }

  @Endpoint('TEMPLATES_LIST')
  @Get('/communication/templates')
  async getTemplates(
    @CurrentUser() user: CurrentUserPayload,
    @Query('channel') channel?: string,
  ) {
    return this.communicationService.getTemplates(user.tenantId, channel);
  }

  @Endpoint('TEMPLATE_UPSERT')
  @Put('/communication/templates/:templateId')
  async upsertTemplate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('templateId') templateId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<TemplateUpsertDto>(TemplateUpsertSchema, body);
    return this.communicationService.upsertTemplate(user.tenantId, templateId, dto);
  }

  @Endpoint('THREADS_LIST')
  @Get('/communication/threads')
  async getThreads(@CurrentUser() user: CurrentUserPayload) {
    return this.communicationService.getThreads(user.tenantId, user.userId);
  }

  @Endpoint('THREAD_CREATE')
  @Post('/communication/threads')
  @HttpCode(HttpStatus.CREATED)
  async createThread(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<ThreadCreateDto>(ThreadCreateSchema, body);
    return this.communicationService.createThread(user.tenantId, user.userId, dto);
  }

  @Endpoint('THREAD_MESSAGES')
  @Get('/communication/threads/:threadId/messages')
  async getThreadMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Param('threadId') threadId: string,
  ) {
    return this.communicationService.getThreadMessages(user.tenantId, threadId);
  }

  @Endpoint('THREAD_SEND')
  @Post('/communication/threads/:threadId/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('threadId') threadId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<MessageSendDto>(MessageSendSchema, body);
    return this.communicationService.sendMessage(user.tenantId, threadId, user.userId, dto);
  }

  @Endpoint('THREAD_READ')
  @Post('/communication/threads/:threadId/read')
  @HttpCode(HttpStatus.OK)
  async markThreadRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('threadId') threadId: string,
  ) {
    return this.communicationService.markThreadRead(user.tenantId, threadId, user.userId);
  }

  @Endpoint('PORTAL_NOTICES')
  @Get('/portal/notices')
  async getPortalNotices(@CurrentUser() user: CurrentUserPayload) {
    return this.communicationService.getPortalNotices(user.tenantId);
  }
}

