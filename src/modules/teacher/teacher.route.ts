import { Router } from 'express';
import { TeacherController } from './teacher.controller';
import { hasPermission } from '../../middleware/rbac.middleware';
import { PermissionCode } from '../../config/constants';

const router = Router();

router.get('/', hasPermission(PermissionCode.TEACHER_VIEW), TeacherController.getTeachers);
router.get('/:id', hasPermission(PermissionCode.TEACHER_VIEW), TeacherController.getTeacherById);
router.put('/:id', hasPermission(PermissionCode.TEACHER_CREATE), TeacherController.updateTeacher);
router.patch('/:id', hasPermission(PermissionCode.TEACHER_CREATE), TeacherController.updateTeacher);
router.get('/section/:sectionId', hasPermission(PermissionCode.TEACHER_VIEW), TeacherController.getSectionTeachers);

export default router;
