import { Router } from 'express';
import { StudentController } from './student.controller';
import { hasPermission } from '../../middleware/rbac.middleware';
import { PermissionCode } from '../../config/constants';

const router = Router();

router.get('/', hasPermission(PermissionCode.STUDENT_VIEW), StudentController.getStudents);
router.get('/:id', hasPermission(PermissionCode.STUDENT_VIEW), StudentController.getStudentById);
router.put('/:id', hasPermission(PermissionCode.STUDENT_CREATE), StudentController.updateStudent);
router.patch('/:id', hasPermission(PermissionCode.STUDENT_CREATE), StudentController.updateStudent);

export default router;

