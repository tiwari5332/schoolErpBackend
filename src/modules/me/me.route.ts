import { Router } from 'express';
import { MeController } from './me.controller';

const router = Router();

// GET /api/me - user profile with selectedSessionId
router.get('/', MeController.getMe);

// GET /api/me/quick-actions - RBAC-permitted quick actions
router.get('/quick-actions', MeController.getQuickActions);

// PUT /api/me/preferences - update user preferences
router.put('/preferences', MeController.updatePreferences);

export default router;
