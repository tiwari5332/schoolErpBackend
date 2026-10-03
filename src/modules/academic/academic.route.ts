import { Router } from 'express';
import { AcademicController } from './academic.controller';
import { hasPermission } from '../../middleware/rbac.middleware';
import { PermissionCode } from '../../config/constants';

const router = Router();

// Academic Years / Sessions
router.get('/academic-years', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getAcademicYears);
router.get('/years', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getAcademicYears);

router.get('/academic-years/active', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getActiveAcademicYear);
router.get('/years/active', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getActiveAcademicYear);

router.get('/academic-years/:id', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getAcademicYearById);
router.get('/years/:id', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getAcademicYearById);

router.post('/academic-years', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.createAcademicYear);
router.post('/years', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.createAcademicYear);

router.put('/academic-years/:id', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.updateAcademicYear);
router.put('/years/:id', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.updateAcademicYear);

router.patch('/academic-years/:id/activate', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.activateAcademicYear);
router.patch('/years/:id/activate', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.activateAcademicYear);

router.patch('/academic-years/:id/close', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.closeAcademicYear);
router.patch('/years/:id/close', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.closeAcademicYear);

// Grades / Classes
router.get('/grades', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getGrades);
router.get('/classes', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getGrades);

router.post('/grades', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.createGrade);
router.post('/classes', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.createGrade);

router.put('/grades/:id', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.updateGrade);
router.put('/classes/:id', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.updateGrade);

// Departments
router.get('/departments', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getDepartments);
router.post('/departments', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.createDepartment);
router.put('/departments/:id', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.updateDepartment);
router.delete('/departments/:id', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.deleteDepartment);
router.post('/departments/assign-faculty', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.assignFaculty);

// Sections
router.get('/sections', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getSections);
router.get('/sections/:id/subjects', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getSectionSubjects);
router.post('/sections', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.createSection);
router.put('/sections/:id', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.updateSection);
router.patch('/sections/:id/class-teacher', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.setClassTeacher);

// Rollover
router.post('/rollover', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.rollover);

// Subjects & Subject Types
router.get('/subjects', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getSubjects);
router.post('/subjects', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.createSubject);
router.post('/subjects/map-to-section', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.mapSubjectsToSection);
router.post('/subjects/assign-teacher', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.assignSubjectTeacher);

router.get('/subject-types', hasPermission(PermissionCode.ACADEMIC_SETUP_VIEW), AcademicController.getSubjectTypes);
router.post('/subject-types', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.createSubjectType);
router.put('/subject-types/:id', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.updateSubjectType);
router.delete('/subject-types/:id', hasPermission(PermissionCode.ACADEMIC_SETUP_MANAGE), AcademicController.deleteSubjectType);

export default router;
