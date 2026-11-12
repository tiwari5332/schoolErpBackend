import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { Clock } from '../../common/clock';
import { IdGenerator } from '../../common/id.generator';
import { DomainError } from '../../common/domain.error';
import {
  CalendarEventsQueryDto,
  CalendarUpcomingQueryDto,
  CalendarEventCreateDto,
  CalendarEventUpdateDto,
} from './dto/calendar.dto';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: Clock,
    private readonly idGen: IdGenerator,
  ) {}

  private formatEvent(e: any) {
    return {
      id: e.id,
      title: e.title,
      type: e.type,
      startDate: e.startDate,
      endDate: e.endDate,
      allDay: e.allDay,
      startTime: e.startTime || null,
      endTime: e.endTime || null,
      description: e.description || '',
      audience: e.audience,
      isHoliday: e.isHoliday,
      color: e.color || '#6366F1',
    };
  }

  async getEvents(tenantId: string, query: CalendarEventsQueryDto) {
    const today = this.clock.today('Asia/Kolkata');
    const month = query.month || today.slice(0, 7);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        tenantId,
        OR: [
          { startDate: { startsWith: month } },
          { endDate: { startsWith: month } },
        ],
      },
      orderBy: { startDate: 'asc' },
    });

    return {
      month,
      serverDate: today,
      events: events.map((e) => this.formatEvent(e)),
    };
  }

  async getUpcoming(tenantId: string, query: CalendarUpcomingQueryDto) {
    const today = this.clock.today('Asia/Kolkata');
    const days = query.days || 30;

    const futureDateObj = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const maxDate = futureDateObj.toISOString().slice(0, 10);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        tenantId,
        endDate: { gte: today },
        startDate: { lte: maxDate },
      },
      orderBy: { startDate: 'asc' },
    });

    const items = events.map((e) => this.formatEvent(e));
    return {
      count: items.length,
      items,
    };
  }

  async createEvent(tenantId: string, dto: CalendarEventCreateDto) {
    if (dto.startDate > dto.endDate) {
      throw new DomainError('VALIDATION_ERROR', 'endDate cannot be before startDate');
    }

    const event = await this.prisma.calendarEvent.create({
      data: {
        id: this.idGen.generate('evt'),
        tenantId,
        title: dto.title,
        type: dto.type || 'EVENT',
        startDate: dto.startDate,
        endDate: dto.endDate,
        allDay: dto.allDay ?? true,
        startTime: dto.startTime || null,
        endTime: dto.endTime || null,
        description: dto.description || '',
        audience: dto.audience || 'ALL',
        isHoliday: dto.isHoliday ?? false,
        color: dto.color || (dto.isHoliday ? '#EF4444' : '#6366F1'),
      },
    });

    return this.formatEvent(event);
  }

  async updateEvent(tenantId: string, eventId: string, dto: CalendarEventUpdateDto) {
    const existing = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Event not found');
    }

    const updated = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.type && { type: dto.type }),
        ...(dto.startDate && { startDate: dto.startDate }),
        ...(dto.endDate && { endDate: dto.endDate }),
        ...(dto.allDay !== undefined && { allDay: dto.allDay }),
        ...(dto.startTime !== undefined && { startTime: dto.startTime }),
        ...(dto.endTime !== undefined && { endTime: dto.endTime }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.audience && { audience: dto.audience }),
        ...(dto.isHoliday !== undefined && { isHoliday: dto.isHoliday }),
        ...(dto.color && { color: dto.color }),
      },
    });

    return this.formatEvent(updated);
  }

  async deleteEvent(tenantId: string, eventId: string) {
    const existing = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, tenantId },
    });
    if (!existing) {
      throw new DomainError('NOT_FOUND', 'Event not found');
    }

    await this.prisma.calendarEvent.delete({
      where: { id: eventId },
    });
  }
}

