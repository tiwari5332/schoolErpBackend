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

const router = Router();

// Mount primary sub-routers
router.use('/auth', authRoutes);
router.use('/academic', academicRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/teachers', teacherRoutes);
router.use('/fee', feeRoutes);
router.use('/billing', billingRoutes);
router.use('/roles', roleRoutes);

// Fee Invoices search top-level route
router.get('/fee-invoices/search', hasPermission(PermissionCode.FEE_INVOICE_VIEW), FeeController.searchInvoices);

// Public Endpoints
router.get('/public/ping', (req, res) => ApiResponse.success(res, { message: 'pong', timestamp: new Date().toISOString() }));
router.get('/public/schools/:schoolId/roles/:roleId/permissions', RoleController.getRolePermissions);
router.get('/public/schools/:schoolId/roles/by-name/:roleName/permissions', RoleController.getRolePermissionsByName);

export default router;
