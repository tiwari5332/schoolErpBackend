import { Router } from 'express';
import { DashboardController } from './dashboard.controller';

const router = Router();

router.get('/summary', DashboardController.getSummary);
router.get('/staff-attendance', DashboardController.getStaffAttendance);
router.get('/communication-balance', DashboardController.getCommunicationBalance);
router.get('/pending-actions', DashboardController.getPendingActions);
router.get('/fee-trend', DashboardController.getFeeTrend);

export default router;
