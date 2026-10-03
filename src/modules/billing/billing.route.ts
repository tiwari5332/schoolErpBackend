import { Router } from 'express';
import { BillingController } from './billing.controller';
import { AuthController } from '../auth/auth.controller';
import { hasPermission } from '../../middleware/rbac.middleware';
import { PermissionCode } from '../../config/constants';

const router = Router();

// Plans
router.get('/plans', hasPermission(PermissionCode.PLAN_VIEW), BillingController.getPlans);
router.post('/plans', hasPermission(PermissionCode.PLAN_MANAGE), BillingController.createPlan);
router.put('/plans/:id', hasPermission(PermissionCode.PLAN_MANAGE), BillingController.updatePlan);

// Super Admin School Creation
router.post('/schools', hasPermission(PermissionCode.SCHOOL_MANAGE), AuthController.registerSchool);
router.post('/schools/:schoolId/subscription/override-cap', hasPermission(PermissionCode.SUBSCRIPTION_OVERRIDE), BillingController.overrideCap);

// School Subscription
router.get('/subscription', hasPermission(PermissionCode.SUBSCRIPTION_VIEW), BillingController.getSchoolSubscription);
router.post('/subscription/upgrade', hasPermission(PermissionCode.SUBSCRIPTION_MANAGE), BillingController.upgradeSubscription);

// Topups & Usage
router.post('/topups', hasPermission(PermissionCode.TOPUP_MANAGE), BillingController.purchaseTopUp);
router.get('/topups', hasPermission(PermissionCode.USAGE_VIEW), BillingController.getTopUpPacks);
router.get('/topups/usage', hasPermission(PermissionCode.USAGE_VIEW), BillingController.getUsageLedger);

export default router;
