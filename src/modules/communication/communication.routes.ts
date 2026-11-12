import { Router } from 'express';
import { hasPermission } from '../../middleware/rbac.middleware';
import { PermissionCode } from '../../config/constants';
import CommunicationController from './communication.controller';

const router = Router();

// Broadcast management & dispatch
router.get('/list', hasPermission(PermissionCode.BROADCAST_VIEW), CommunicationController.getBroadCastList);
router.post('/send', hasPermission(PermissionCode.BROADCAST_SEND), CommunicationController.sendBroadcast);

// Pre-approved message templates (HLD Section 10)
router.get('/templates', hasPermission(PermissionCode.BROADCAST_VIEW), CommunicationController.getTemplates);
router.post('/templates', hasPermission(PermissionCode.BROADCAST_SEND), CommunicationController.createTemplate);

// Teacher quota management (HLD Section 10)
router.post('/quotas/assign', hasPermission(PermissionCode.BROADCAST_SEND), CommunicationController.assignTeacherQuota);
router.get('/quotas/teacher/:teacherId', hasPermission(PermissionCode.BROADCAST_VIEW), CommunicationController.getTeacherQuotas);

export default router;
