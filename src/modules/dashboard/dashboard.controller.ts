import { Response, NextFunction } from 'express';
import { ExtendedRequest } from '../../middleware/logger.middleware';
import { DashboardService } from './dashboard.service';
import {
  staffAttendanceQuerySchema,
  feeTrendQuerySchema,
} from './dashboard.dto';
import { ApiResponse, AppError, BusinessRuleException } from '../../utils/response';
import { DashboardCache } from '../../libs/cache';
import { ActorType } from '../../config/constants';
import db from '../../config/database';

export class DashboardController {
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

  private static async checkAccountantRole(actorType: string, actorId: string): Promise<boolean> {
    const res = await db.query<{ name: string }>(
      `SELECT r.name FROM actor_role_assignments ara
       JOIN roles r ON ara.role_id = r.id
       WHERE ara.actor_type = $1 AND ara.actor_id = $2`,
      [actorType, actorId]
    );
    return res.rows.some((r) => r.name.toUpperCase().includes('ACCOUNTANT'));
  }

  /**
   * 1. GET /api/dashboard/summary (cache 60s per school+session)
   */
  static async getSummary(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = DashboardController.resolveSchoolId(req);
      const sessionId = req.academicSessionId || null;

      // Role check: Teacher cannot see fees
      const canViewFees = req.user?.actorType !== ActorType.TEACHER;

      const { today } = await DashboardService.getSchoolTimezoneAndToday(schoolId);
      const cacheKey = DashboardCache.buildKey(schoolId, sessionId || 'default', `summary:${canViewFees}`, today);

      const cached = DashboardCache.get(cacheKey);
      if (cached) {
        res.setHeader('Cache-Control', 'private, max-age=60');
        res.setHeader('ETag', cached.etag);
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        return ApiResponse.success(res, cached.data);
      }

      const summary = await DashboardService.getSummary(schoolId, sessionId, canViewFees);
      const etag = DashboardCache.set(cacheKey, summary, 60);

      res.setHeader('Cache-Control', 'private, max-age=60');
      res.setHeader('ETag', etag);

      return ApiResponse.success(res, summary);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 2. GET /api/dashboard/staff-attendance?date=YYYY-MM-DD&limit=5 (cache 60s)
   */
  static async getStaffAttendance(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = DashboardController.resolveSchoolId(req);

      // Role check: Accountant cannot see staff attendance
      if (req.user) {
        const isAccountant = await DashboardController.checkAccountantRole(req.user.actorType, req.user.actorId);
        if (isAccountant) {
          throw new AppError(
            'Accountants are not permitted to view staff attendance',
            403,
            null,
            true,
            'WIDGET_FORBIDDEN'
          );
        }
      }

      const query = staffAttendanceQuerySchema.parse(req.query);
      const { today } = await DashboardService.getSchoolTimezoneAndToday(schoolId);
      const date = query.date || today;

      const cacheKey = DashboardCache.buildKey(schoolId, 'global', `staff-att:${date}:${query.limit}`, date);
      const cached = DashboardCache.get(cacheKey);

      if (cached) {
        res.setHeader('Cache-Control', 'private, max-age=60');
        res.setHeader('ETag', cached.etag);
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        return ApiResponse.success(res, cached.data);
      }

      const result = await DashboardService.getStaffAttendance(schoolId, query.date, query.limit);
      const etag = DashboardCache.set(cacheKey, result, 60);

      res.setHeader('Cache-Control', 'private, max-age=60');
      res.setHeader('ETag', etag);

      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 3. GET /api/dashboard/communication-balance (cache 5 min)
   */
  static async getCommunicationBalance(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = DashboardController.resolveSchoolId(req);
      const { today } = await DashboardService.getSchoolTimezoneAndToday(schoolId);

      const cacheKey = DashboardCache.buildKey(schoolId, 'global', 'comm-balance', today);
      const cached = DashboardCache.get(cacheKey);

      if (cached) {
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.setHeader('ETag', cached.etag);
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        return ApiResponse.success(res, cached.data);
      }

      const result = await DashboardService.getCommunicationBalance(schoolId);
      const etag = DashboardCache.set(cacheKey, result, 300);

      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('ETag', etag);

      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 4. GET /api/dashboard/pending-actions (cache 60s)
   */
  static async getPendingActions(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = DashboardController.resolveSchoolId(req);
      const sessionId = req.academicSessionId || null;
      const { today } = await DashboardService.getSchoolTimezoneAndToday(schoolId);

      const cacheKey = DashboardCache.buildKey(schoolId, sessionId || 'default', 'pending-actions', today);
      const cached = DashboardCache.get(cacheKey);

      if (cached) {
        res.setHeader('Cache-Control', 'private, max-age=60');
        res.setHeader('ETag', cached.etag);
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        return ApiResponse.success(res, cached.data);
      }

      const result = await DashboardService.getPendingActions(schoolId, sessionId);
      const etag = DashboardCache.set(cacheKey, result, 60);

      res.setHeader('Cache-Control', 'private, max-age=60');
      res.setHeader('ETag', etag);

      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 5. GET /api/dashboard/fee-trend?days=7|30 (cache 5 min)
   */
  static async getFeeTrend(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = DashboardController.resolveSchoolId(req);

      // Role check: Teacher cannot see fee data
      if (req.user?.actorType === ActorType.TEACHER) {
        throw new AppError(
          'Teachers are not permitted to view fee data',
          403,
          null,
          true,
          'WIDGET_FORBIDDEN'
        );
      }

      const query = feeTrendQuerySchema.parse(req.query);
      const { today } = await DashboardService.getSchoolTimezoneAndToday(schoolId);

      const cacheKey = DashboardCache.buildKey(schoolId, 'global', `fee-trend:${query.days}`, today);
      const cached = DashboardCache.get(cacheKey);

      if (cached) {
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.setHeader('ETag', cached.etag);
        if (req.headers['if-none-match'] === cached.etag) {
          return res.status(304).end();
        }
        return ApiResponse.success(res, cached.data);
      }

      const result = await DashboardService.getFeeTrend(schoolId, query.days);
      const etag = DashboardCache.set(cacheKey, result, 300);

      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('ETag', etag);

      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}
