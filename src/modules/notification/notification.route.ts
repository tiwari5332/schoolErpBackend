import { Router } from 'express';
import { NotificationController } from './notification.controller';

const router = Router();

// 9. GET /api/notifications/unread-count
router.get('/unread-count', NotificationController.getUnreadCount);

export default router;

