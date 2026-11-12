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
import { CalendarService } from './calendar.service';
import { Endpoint } from '../../contract/endpoint.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  CalendarEventsQuerySchema,
  CalendarUpcomingQuerySchema,
  CalendarEventCreateSchema,
  CalendarEventUpdateSchema,
  CalendarEventsQueryDto,
  CalendarUpcomingQueryDto,
  CalendarEventCreateDto,
  CalendarEventUpdateDto,
} from './dto/calendar.dto';
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
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Endpoint('CALENDAR_EVENTS')
  @Get('/calendar/events')
  async getEvents(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<CalendarEventsQueryDto>(CalendarEventsQuerySchema, query);
    return this.calendarService.getEvents(user.tenantId, queryDto);
  }

  @Endpoint('CALENDAR_UPCOMING')
  @Get('/calendar/upcoming')
  async getUpcoming(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: unknown,
  ) {
    const queryDto = validate<CalendarUpcomingQueryDto>(CalendarUpcomingQuerySchema, query);
    return this.calendarService.getUpcoming(user.tenantId, queryDto);
  }

  @Endpoint('CALENDAR_EVENT_CREATE')
  @Post('/calendar/events')
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: unknown,
  ) {
    const dto = validate<CalendarEventCreateDto>(CalendarEventCreateSchema, body);
    return this.calendarService.createEvent(user.tenantId, dto);
  }

  @Endpoint('CALENDAR_EVENT_UPDATE')
  @Put('/calendar/events/:eventId')
  async updateEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('eventId') eventId: string,
    @Body() body: unknown,
  ) {
    const dto = validate<CalendarEventUpdateDto>(CalendarEventUpdateSchema, body);
    return this.calendarService.updateEvent(user.tenantId, eventId, dto);
  }

  @Endpoint('CALENDAR_EVENT_DELETE')
  @Delete('/calendar/events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEvent(
    @CurrentUser() user: CurrentUserPayload,
    @Param('eventId') eventId: string,
  ) {
    await this.calendarService.deleteEvent(user.tenantId, eventId);
  }
}

