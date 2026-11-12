import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ExtendedRequest } from '../../middleware/logger.middleware';
import { SessionService } from './session.service';
import { createSessionSchema, updateSessionSchema, querySessionSchema } from './session.dto';
import { ApiResponse, BusinessRuleException } from '../../utils/response';

export class SessionController {
  private static resolveSchoolId(req: ExtendedRequest): string {
    const headerSchoolId = req.headers['x-school-id'] as string;
    const userSchoolId = req.user?.schoolId;

    const schoolId = (req.user?.actorType === 'SUPER_ADMIN' && headerSchoolId) ? headerSchoolId : userSchoolId;

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
   * 1. GET /api/academic-sessions
   * - Scoped by school_id
   * - Cache-Control: private, max-age=300
   * - ETag support with 304 Not Modified
   */
  static async getSessions(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = SessionController.resolveSchoolId(req);
      const query = querySessionSchema.parse(req.query);

      const sessions = await SessionService.getSessions(schoolId, query.status);

      // Compute deterministic ETag
      const payloadString = JSON.stringify(sessions);
      const etag = crypto.createHash('md5').update(payloadString).digest('hex');
      const formattedEtag = `"${etag}"`;

      res.setHeader('Cache-Control', 'private, max-age=300');
      res.setHeader('ETag', formattedEtag);

      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch && (ifNoneMatch === formattedEtag || ifNoneMatch === etag)) {
        return res.status(304).end();
      }

      return ApiResponse.success(res, sessions);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 2. POST /api/academic-sessions (Super Admin only)
   */
  static async createSession(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = SessionController.resolveSchoolId(req);
      const validatedBody = createSessionSchema.parse(req.body);

      const newSession = await SessionService.createSession(
        schoolId,
        validatedBody,
        req.user?.actorId
      );

      return ApiResponse.success(res, newSession, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 3. PUT /api/academic-sessions/:id (Super Admin only)
   */
  static async updateSession(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = SessionController.resolveSchoolId(req);
      const { id } = req.params;
      const validatedBody = updateSessionSchema.parse(req.body);

      const updatedSession = await SessionService.updateSession(
        schoolId,
        id,
        validatedBody,
        req.user?.actorId
      );

      return ApiResponse.success(res, updatedSession);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 4. PATCH /api/academic-sessions/:id/set-current (Super Admin only)
   */
  static async setCurrentSession(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = SessionController.resolveSchoolId(req);
      const { id } = req.params;

      const currentSession = await SessionService.setCurrentSession(
        schoolId,
        id,
        req.user?.actorId
      );

      return ApiResponse.success(res, currentSession);
    } catch (err) {
      next(err);
    }
  }
}
