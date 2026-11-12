import { Response, NextFunction } from 'express';
import { ExtendedRequest } from '../../middleware/logger.middleware';
import db from '../../config/database';
import { ApiResponse, UnauthorizedError } from '../../utils/response';

export class NotificationController {
  /**
   * 9. GET /api/notifications/unread-count (bell badge)
   */
  static async getUnreadCount(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User unauthenticated');
      }

      const schoolId = req.user.schoolId;
      const actorId = req.user.actorId;

      const resCount = await db.query(
        `SELECT COUNT(id)::int as count
         FROM notifications
         WHERE (school_id = $1 OR school_id IS NULL)
           AND recipient_id = $2
           AND is_read = false`,
        [schoolId, actorId]
      );

      const count = resCount.rows[0]?.count || 0;
      return ApiResponse.success(res, { count });
    } catch (err) {
      next(err);
    }
  }
}

