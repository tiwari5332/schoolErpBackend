import { Response, NextFunction } from 'express';
import { ExtendedRequest } from '../../middleware/logger.middleware';
import { CalendarService } from './calendar.service';
import {
  calendarEventsQuerySchema,
  upcomingEventsQuerySchema,
  calendarEventCreateSchema,
} from '../dashboard/dashboard.dto';
import { ApiResponse, BusinessRuleException } from '../../utils/response';
import { ActorType } from '../../config/constants';

export class CalendarController {
  private static resolveSchoolId(req: ExtendedRequest): string {
    const headerSchoolId = req.headers['x-school-id'] as string;
    const userSchoolId = req.user?.schoolId;
    const schoolId = (req.user?.actorType === ActorType.SUPER_ADMIN && headerSchoolId) ? headerSchoolId : userSchoolId;

    if (!schoolId) {
      throw new BusinessRuleException(
        'School context is required. Please provide a valid tenant token or X-School-Id header.',
        400,
        null,
        'VALIDATION_ERROR'
      );
    }
    return schoolId;
  }

  /**
   * 6. GET /api/calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  static async getEvents(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = CalendarController.resolveSchoolId(req);
      const query = calendarEventsQuerySchema.parse(req.query);

      const events = await CalendarService.getEvents(schoolId, query.from, query.to);
      return ApiResponse.success(res, events);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 7. GET /api/events/upcoming?days=30&limit=5
   */
  static async getUpcomingEvents(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = CalendarController.resolveSchoolId(req);
      const query = upcomingEventsQuerySchema.parse(req.query);

      const events = await CalendarService.getUpcomingEvents(schoolId, query.days, query.limit);
      return ApiResponse.success(res, events);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 8. POST /api/calendar/events
   */
  static async createEvent(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = CalendarController.resolveSchoolId(req);
      const data = calendarEventCreateSchema.parse(req.body);

      const event = await CalendarService.createEvent(schoolId, data, req.user?.actorId);
      return ApiResponse.success(res, event, 201);
    } catch (err) {
      next(err);
    }
  }
}

