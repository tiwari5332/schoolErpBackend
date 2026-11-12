import { Response, NextFunction } from 'express';
import { ExtendedRequest } from '../../middleware/logger.middleware';
import { SessionService } from '../session/session.service';
import { userPreferenceSchema } from '../session/session.dto';
import { ApiResponse, UnauthorizedError } from '../../utils/response';
import db from '../../config/database';
import { ActorType, PermissionCode } from '../../config/constants';
import { RbacService } from '../../middleware/rbac.middleware';

export class MeController {
  /**
   * 5. GET /api/me
   * Returns user profile including selectedSessionId (fallback to current session).
   * Does NOT embed the session list.
   */
  static async getMe(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User unauthenticated');
      }

      const { actorType, actorId, schoolId } = req.user;
      let userDetails: any = {
        actorId,
        actorType,
        schoolId,
      };

      if (actorType === ActorType.ADMIN) {
        const adminRes = await db.query(
          `SELECT a.id, a.name, a.email, a.msisdn, s.name as "schoolName"
           FROM admins a
           LEFT JOIN schools s ON a.school_id = s.id
           WHERE a.id = $1`,
          [actorId]
        );
        if (adminRes.rows[0]) {
          const row = adminRes.rows[0];
          userDetails = {
            ...userDetails,
            name: row.name,
            email: row.email,
            msisdn: row.msisdn,
            schoolName: row.schoolName,
          };
        }
      } else if (actorType === ActorType.TEACHER) {
        const teacherRes = await db.query(
          `SELECT t.id, t.name, t.email, t.login_msisdn as "msisdn", t.employee_code as "employeeCode", s.name as "schoolName"
           FROM teachers t
           LEFT JOIN schools s ON t.school_id = s.id
           WHERE t.id = $1`,
          [actorId]
        );
        if (teacherRes.rows[0]) {
          const row = teacherRes.rows[0];
          userDetails = {
            ...userDetails,
            name: row.name,
            email: row.email,
            msisdn: row.msisdn,
            employeeCode: row.employeeCode,
            schoolName: row.schoolName,
          };
        }
      } else if (actorType === ActorType.PARENT) {
        const parentRes = await db.query(
          `SELECT pa.id, pa.name, pa.email, pa.msisdn, s.name as "schoolName"
           FROM parent_accounts pa
           LEFT JOIN schools s ON pa.school_id = s.id
           WHERE pa.id = $1`,
          [actorId]
        );
        if (parentRes.rows[0]) {
          const row = parentRes.rows[0];
          userDetails = {
            ...userDetails,
            name: row.name,
            email: row.email,
            msisdn: row.msisdn,
            schoolName: row.schoolName,
          };
        }
      } else if (actorType === ActorType.SUPER_ADMIN) {
        const saRes = await db.query(`SELECT id, name, email FROM super_admins WHERE id = $1`, [actorId]);
        if (saRes.rows[0]) {
          userDetails = {
            ...userDetails,
            name: saRes.rows[0].name,
            email: saRes.rows[0].email,
          };
        }
      }

      // Resolve selectedSessionId (stored preference with fallback to current session)
      const selectedSessionId = await SessionService.getUserSelectedSessionId(actorType, actorId, schoolId);
      userDetails.selectedSessionId = selectedSessionId;

      return ApiResponse.success(res, userDetails);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 6. PUT /api/me/preferences -> { selectedSessionId }
   * Validates that the session belongs to the user's school.
   */
  static async updatePreferences(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User unauthenticated');
      }

      const validated = userPreferenceSchema.parse(req.body);
      const result = await SessionService.setUserPreference(
        req.user.actorType,
        req.user.actorId,
        req.user.schoolId,
        validated.selectedSessionId
      );

      return ApiResponse.success(res, {
        success: true,
        selectedSessionId: result.selectedSessionId,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 10. GET /api/me/quick-actions
   * Returns list of quick actions the user is permitted to see based on RBAC permissions.
   */
  static async getQuickActions(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User unauthenticated');
      }

      const { actorType, actorId } = req.user;
      const effectivePerms = await RbacService.getEffectivePermissions(actorType, actorId);

      const allQuickActions = [
        {
          id: 'mark_attendance',
          label: 'Mark Attendance',
          path: '/attendance/mark',
          icon: 'clipboard-check',
          permission: PermissionCode.ATTENDANCE_RECORD,
        },
        {
          id: 'collect_fee',
          label: 'Collect Fee',
          path: '/fees/collect',
          icon: 'credit-card',
          permission: PermissionCode.FEE_PAYMENT_RECORD,
        },
        {
          id: 'add_student',
          label: 'Add Student',
          path: '/students/add',
          icon: 'user-plus',
          permission: PermissionCode.STUDENT_CREATE,
        },
        {
          id: 'send_notice',
          label: 'Send Notice',
          path: '/communication/broadcast',
          icon: 'megaphone',
          permission: PermissionCode.BROADCAST_SEND,
        },
        {
          id: 'add_event',
          label: 'Add Event',
          path: '/calendar/events/create',
          icon: 'calendar-plus',
          permission: PermissionCode.EVENT_CREATE,
        },
      ];

      // Filter actions based on permissions (Super Admin has all permissions)
      const permittedActions = allQuickActions.filter(
        (action) =>
          actorType === ActorType.SUPER_ADMIN ||
          effectivePerms.has(action.permission) ||
          effectivePerms.has(PermissionCode.SUPER_ADMIN_ALL)
      );

      return ApiResponse.success(res, { actions: permittedActions });
    } catch (err) {
      next(err);
    }
  }
}
