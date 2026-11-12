import { Router } from 'express';
import { OnboardingController } from './onboarding.controller';
import { StudentController } from '../student/student.controller';
import { TeacherController } from '../teacher/teacher.controller';
import { hasPermission } from '../../middleware/rbac.middleware';
import { uploadSingleCsv } from '../../middleware/upload.middleware';
import { PermissionCode } from '../../config/constants';

const router = Router();

router.post('/students', hasPermission(PermissionCode.STUDENT_CREATE), OnboardingController.onboardStudent);
router.post('/students/bulk', hasPermission(PermissionCode.STUDENT_CREATE), uploadSingleCsv, OnboardingController.bulkOnboardStudents);
router.put('/students/:id', hasPermission(PermissionCode.STUDENT_CREATE), StudentController.updateStudent);
router.patch('/students/:id', hasPermission(PermissionCode.STUDENT_CREATE), StudentController.updateStudent);

router.post('/teachers', hasPermission(PermissionCode.TEACHER_CREATE), OnboardingController.onboardTeacher);
router.post('/teachers/bulk', hasPermission(PermissionCode.TEACHER_CREATE), uploadSingleCsv, OnboardingController.bulkOnboardTeachers);
router.put('/teachers/:id', hasPermission(PermissionCode.TEACHER_CREATE), TeacherController.updateTeacher);
router.patch('/teachers/:id', hasPermission(PermissionCode.TEACHER_CREATE), TeacherController.updateTeacher);

export default router;
