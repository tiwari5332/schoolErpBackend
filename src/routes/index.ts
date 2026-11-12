import { Router } from 'express';
import authRoutes from '../modules/auth/auth.route';
import academicRoutes from '../modules/academic/academic.route';
import onboardingRoutes from '../modules/onboarding/onboarding.route';
import teacherRoutes from '../modules/teacher/teacher.route';
import feeRoutes from '../modules/fee/fee.route';
import billingRoutes from '../modules/billing/billing.route';
import roleRoutes from '../modules/role/role.route';
import { FeeController } from '../modules/fee/fee.controller';
import { RoleController } from '../modules/role/role.controller';
import { hasPermission } from '../middleware/rbac.middleware';
import { PermissionCode } from '../config/constants';
import { ApiResponse } from '../utils/response';
import communicationRouter from '../modules/communication/communication.routes';
import attendanceRoutes from '../modules/attendance/attendance.route';
import sessionRoutes from '../modules/session/session.route';
import meRoutes from '../modules/me/me.route';
import dashboardRoutes from '../modules/dashboard/dashboard.route';
import calendarRoutes from '../modules/calendar/calendar.route';
import { CalendarController } from '../modules/calendar/calendar.controller';
import notificationRoutes from '../modules/notification/notification.route';
import studentRoutes from '../modules/student/student.route';

const router = Router();

// Mount primary sub-routers
router.use('/auth', authRoutes);
router.use('/academic', academicRoutes);
router.use('/academic-sessions', sessionRoutes);
router.use('/me', meRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/calendar', calendarRoutes);
router.get('/events/upcoming', CalendarController.getUpcomingEvents);
router.use('/notifications', notificationRoutes);
router.use('/students', studentRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/teachers', teacherRoutes);
router.use('/fee', feeRoutes);
router.use('/billing', billingRoutes);
router.use('/roles', roleRoutes);
router.use('/broadcast', communicationRouter);
router.use('/attendance', attendanceRoutes);

// Fee Invoices search top-level route
router.get('/fee-invoices/search', hasPermission(PermissionCode.FEE_INVOICE_VIEW), FeeController.searchInvoices);

// Public Endpoints
router.get('/public/ping', (req, res) => ApiResponse.success(res, { message: 'pong', timestamp: new Date().toISOString() }));
router.get('/public/schools/:schoolId/roles/:roleId/permissions', RoleController.getRolePermissions);
router.get('/public/schools/:schoolId/roles/by-name/:roleName/permissions', RoleController.getRolePermissionsByName);

export default router;
