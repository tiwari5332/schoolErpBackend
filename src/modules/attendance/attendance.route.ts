import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { hasPermission } from '../../middleware/rbac.middleware';
import { PermissionCode } from '../../config/constants';

const router = Router();

// Student Daily Homeroom Attendance (Primary)
router.post('/daily', hasPermission(PermissionCode.ATTENDANCE_RECORD), AttendanceController.recordDailyHomeroom);

// Student Period / Subject-Wise Attendance (Secondary)
router.post('/subject', hasPermission(PermissionCode.ATTENDANCE_RECORD), AttendanceController.recordSubjectWise);

// Section Attendance Query
router.get('/sections/:sectionId', hasPermission(PermissionCode.ATTENDANCE_VIEW), AttendanceController.getSectionAttendance);

// Student Monthly Summary & Exam Eligibility
router.get('/students/:studentId/summary', hasPermission(PermissionCode.ATTENDANCE_VIEW), AttendanceController.getStudentAttendanceSummary);

// Staff Attendance
router.post('/staff/check-in', hasPermission(PermissionCode.ATTENDANCE_RECORD), AttendanceController.recordStaffCheckIn);
router.post('/staff/check-out', hasPermission(PermissionCode.ATTENDANCE_RECORD), AttendanceController.recordStaffCheckOut);
router.get('/staff', hasPermission(PermissionCode.ATTENDANCE_VIEW), AttendanceController.getStaffAttendance);

export default router;

