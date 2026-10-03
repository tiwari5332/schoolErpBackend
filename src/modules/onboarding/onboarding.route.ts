import { Router } from 'express';
import { OnboardingController } from './onboarding.controller';
import { hasPermission } from '../../middleware/rbac.middleware';
import { uploadSingleCsv } from '../../middleware/upload.middleware';
import { PermissionCode } from '../../config/constants';

const router = Router();

router.post('/students', hasPermission(PermissionCode.STUDENT_CREATE), OnboardingController.onboardStudent);
router.post('/students/bulk', hasPermission(PermissionCode.STUDENT_CREATE), uploadSingleCsv, OnboardingController.bulkOnboardStudents);

router.post('/teachers', hasPermission(PermissionCode.TEACHER_CREATE), OnboardingController.onboardTeacher);
router.post('/teachers/bulk', hasPermission(PermissionCode.TEACHER_CREATE), uploadSingleCsv, OnboardingController.bulkOnboardTeachers);

export default router;
