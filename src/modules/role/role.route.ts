import { Router } from 'express';
import { RoleController } from './role.controller';

const router = Router();

router.get('/', RoleController.getSchoolCustomRoles);
router.post('/', RoleController.createCustomRole);
router.post('/assign', RoleController.assignRole);

export default router;
