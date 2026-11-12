import { Router } from 'express';
import { CalendarController } from './calendar.controller';
import { hasPermission } from '../../middleware/rbac.middleware';
import { PermissionCode } from '../../config/constants';

const router = Router();

// 6. GET /api/calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/events', CalendarController.getEvents);

// 8. POST /api/calendar/events
router.post('/events', hasPermission(PermissionCode.EVENT_CREATE), CalendarController.createEvent);

// Also alias /calendar/upcoming
router.get('/upcoming', CalendarController.getUpcomingEvents);

export default router;

