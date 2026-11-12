import { Request, Response, NextFunction } from 'express';
import { getTenantSchoolId } from '../../middleware/tenant.middleware';
import { AttendanceService } from './attendance.service';
import { ApiResponse } from '../../utils/response';
import { ExtendedRequest } from '../../middleware/logger.middleware';

export class AttendanceController {
  /**
   * POST /api/attendance/daily
   * Mark daily homeroom attendance for a section
   */
  static async recordDailyHomeroom(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const user = (req as ExtendedRequest).user;
      const teacherId = user?.actorType === 'TEACHER' ? user.actorId : null;
      const { sectionId, date, records } = req.body;

      const result = await AttendanceService.recordDailyHomeroomAttendance(
        schoolId,
        teacherId,
        sectionId,
        date,
        records
      );

      return ApiResponse.success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/attendance/subject
   * Mark subject/period-wise attendance for a section
   */
  static async recordSubjectWise(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const user = (req as ExtendedRequest).user;
      const teacherId = user?.actorType === 'TEACHER' ? user.actorId : null;
      const { sectionId, subjectId, date, records } = req.body;

      const result = await AttendanceService.recordSubjectWiseAttendance(
        schoolId,
        teacherId,
        sectionId,
        subjectId,
        date,
        records
      );

      return ApiResponse.success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/sections/:sectionId
   * Query section attendance for a date
   */
  static async getSectionAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const sectionId = req.params.sectionId;
      const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
      const attendanceType = (req.query.attendanceType as string) || 'DAILY_HOMEROOM';
      const subjectId = req.query.subjectId as string | undefined;

      const result = await AttendanceService.getSectionAttendance(
        schoolId,
        sectionId,
        date,
        attendanceType,
        subjectId
      );

      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/students/:studentId/summary
   * Student attendance history and exam eligibility
   */
  static async getStudentAttendanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const studentId = req.params.studentId;
      const yearMonth = req.query.yearMonth as string | undefined;

      const result = await AttendanceService.getStudentAttendanceSummary(schoolId, studentId, yearMonth);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/attendance/staff/check-in
   * Record teacher/staff check-in
   */
  static async recordStaffCheckIn(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const user = (req as ExtendedRequest).user;
      const teacherId = req.body.teacherId || (user?.actorType === 'TEACHER' ? user.actorId : null);
      const { source, remarks } = req.body;

      const result = await AttendanceService.recordStaffCheckIn(
        schoolId,
        teacherId,
        source,
        remarks
      );

      return ApiResponse.success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/attendance/staff/check-out
   * Record teacher/staff check-out
   */
  static async recordStaffCheckOut(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const user = (req as ExtendedRequest).user;
      const teacherId = req.body.teacherId || (user?.actorType === 'TEACHER' ? user.actorId : null);
      const { source, remarks } = req.body;

      const result = await AttendanceService.recordStaffCheckOut(
        schoolId,
        teacherId,
        source,
        remarks
      );

      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/attendance/staff
   * Query staff attendance records
   */
  static async getStaffAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const date = req.query.date as string | undefined;
      const yearMonth = req.query.yearMonth as string | undefined;

      const result = await AttendanceService.getStaffAttendance(schoolId, date, yearMonth);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export default AttendanceController;

