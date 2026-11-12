import { Response, NextFunction } from 'express';
import { ExtendedRequest } from './logger.middleware';
import { ForbiddenError, NotFoundError } from '../utils/response';
import db from '../config/database';

/**
 * Shared middleware that resolves the academic session:
 * Resolution order: X-Session-Id (or X-Academic-Session-Id) header -> User preference -> School's current session.
 * Validates existence and school ownership.
 * Attaches req.academicSessionId and req.academicSession.
 */
export const resolveAcademicSession = async (req: ExtendedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next();
    }

    const schoolId = req.user.schoolId;
    let candidateSessionId: string | null = null;
    let fromHeader = false;

    // 1. Check header (X-Session-Id or X-Academic-Session-Id)
    const headerValue = (req.headers['x-academic-session-id'] || req.headers['x-session-id']) as string;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (headerValue && uuidRegex.test(headerValue)) {
      candidateSessionId = headerValue;
      fromHeader = true;
    }

    // 2. User preference fallback
    if (!candidateSessionId) {
      const prefRes = await db.query(
        `SELECT selected_session_id FROM user_preferences WHERE actor_type = $1 AND actor_id = $2`,
        [req.user.actorType, req.user.actorId]
      );
      if (prefRes.rows[0]?.selected_session_id) {
        candidateSessionId = prefRes.rows[0].selected_session_id;
      }
    }

    // 3. Current active session fallback
    if (!candidateSessionId && schoolId) {
      const currentRes = await db.query(
        `SELECT id FROM academic_sessions WHERE school_id = $1 AND is_current = true LIMIT 1`,
        [schoolId]
      );
      if (currentRes.rows[0]?.id) {
        candidateSessionId = currentRes.rows[0].id;
      }
    }

    // 4. Validate school ownership and attach to req
    if (candidateSessionId) {
      const sessionRes = await db.query(
        `SELECT id, school_id, name, TO_CHAR(start_date, 'YYYY-MM-DD') as "startDate", TO_CHAR(end_date, 'YYYY-MM-DD') as "endDate", status, is_current as "isCurrent"
         FROM academic_sessions
         WHERE id = $1`,
        [candidateSessionId]
      );

      if (sessionRes.rows.length === 0) {
        if (fromHeader) {
          throw new NotFoundError(`Academic session '${candidateSessionId}' specified in X-Session-Id header was not found`);
        }
      } else {
        const session = sessionRes.rows[0];
        if (schoolId && session.school_id !== schoolId) {
          throw new ForbiddenError(`Academic session '${candidateSessionId}' does not belong to your school`);
        }
        req.academicSessionId = session.id;
        req.academicSession = session;
      }
    } else {
      req.academicSessionId = null;
      req.academicSession = null;
    }

    next();
  } catch (err) {
    next(err);
  }
};
