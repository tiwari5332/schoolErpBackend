import { Router } from 'express';
import { FeeController } from './fee.controller';
import { hasPermission } from '../../middleware/rbac.middleware';
import { PermissionCode } from '../../config/constants';

const router = Router();

// Setup Routes
router.get('/setup/components', hasPermission(PermissionCode.FEE_STRUCTURE_VIEW), FeeController.getFeeComponents);
router.post('/setup/components', hasPermission(PermissionCode.FEE_STRUCTURE_MANAGE), FeeController.createFeeComponent);

router.get('/setup/sections/:sectionId/structure', hasPermission(PermissionCode.FEE_STRUCTURE_VIEW), FeeController.getSectionFeeStructure);
router.post('/setup/sections/structure', hasPermission(PermissionCode.FEE_STRUCTURE_MANAGE), FeeController.setSectionFeeStructure);

router.get('/setup/late-fee-slabs', hasPermission(PermissionCode.FEE_STRUCTURE_VIEW), FeeController.getLateFeeSlabs);
router.post('/setup/late-fee-slabs', hasPermission(PermissionCode.FEE_STRUCTURE_MANAGE), FeeController.updateLateFeeSlabs);

router.post('/setup/bulk-discount-policies', hasPermission(PermissionCode.FEE_STRUCTURE_MANAGE), FeeController.createDiscountPolicy);

// Payments, Waivers & Refunds
router.post('/payments/gateway', hasPermission(PermissionCode.FEE_PAYMENT_RECORD), FeeController.recordGatewayPayment);
router.post('/payments/manual-cash', hasPermission(PermissionCode.FEE_PAYMENT_RECORD), FeeController.recordManualCashPayment);
router.post('/invoices/:invoiceId/waiver', hasPermission(PermissionCode.FEE_WAIVER_APPLY), FeeController.applyWaiver);
router.post('/payments/:paymentId/refund', hasPermission(PermissionCode.FEE_REFUND_PROCESS), FeeController.processRefund);

export default router;
