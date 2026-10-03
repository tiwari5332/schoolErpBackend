import { Router } from 'express';
import { TeacherController } from './teacher.controller';

const router = Router();

router.get('/', TeacherController.getTeachers);
router.get('/section/:sectionId', TeacherController.getSectionTeachers);

export default router;
