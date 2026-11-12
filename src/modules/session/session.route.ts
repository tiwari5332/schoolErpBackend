import { Router } from 'express';
import { SessionController } from './session.controller';
import { requireSuperAdmin } from '../../middleware/rbac.middleware';

const router = Router();

// GET /api/academic-sessions - any authenticated user
router.get('/', SessionController.getSessions);

// POST /api/academic-sessions - Super Admin only
router.post('/', requireSuperAdmin, SessionController.createSession);

// PUT /api/academic-sessions/:id - Super Admin only
router.put('/:id', requireSuperAdmin, SessionController.updateSession);

// PATCH /api/academic-sessions/:id/set-current - Super Admin only
router.patch('/:id/set-current', requireSuperAdmin, SessionController.setCurrentSession);

export default router;
