import { Request, Response, NextFunction } from 'express';
import { getTenantSchoolId } from '../../middleware/tenant.middleware';
import { AcademicService } from './academic.service';
import { ApiResponse } from '../../utils/response';

export class AcademicController {
  // Academic Years
  static async getAcademicYears(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const years = await AcademicService.getAcademicYears(schoolId);
      return ApiResponse.success(res, years);
    } catch (err) {
      next(err);
    }
  }

  static async getActiveAcademicYear(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const activeYear = await AcademicService.getActiveAcademicYear(schoolId);
      return ApiResponse.success(res, activeYear);
    } catch (err) {
      next(err);
    }
  }

  static async getAcademicYearById(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const year = await AcademicService.getAcademicYearById(schoolId, req.params.id);
      return ApiResponse.success(res, year);
    } catch (err) {
      next(err);
    }
  }

  static async createAcademicYear(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const year = await AcademicService.createAcademicYear(schoolId, {
        name: req.body.name,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        status: req.body.status,
      });
      return ApiResponse.success(res, year, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateAcademicYear(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const year = await AcademicService.updateAcademicYear(schoolId, req.params.id, {
        name: req.body.name,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        status: req.body.status,
      });
      return ApiResponse.success(res, year);
    } catch (err) {
      next(err);
    }
  }

  static async activateAcademicYear(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const year = await AcademicService.activateAcademicYear(schoolId, req.params.id);
      return ApiResponse.success(res, year);
    } catch (err) {
      next(err);
    }
  }

  static async closeAcademicYear(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const year = await AcademicService.closeAcademicYear(schoolId, req.params.id);
      return ApiResponse.success(res, year);
    } catch (err) {
      next(err);
    }
  }

  // Grades
  static async getGrades(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const grades = await AcademicService.getGrades(schoolId);
      return ApiResponse.success(res, grades);
    } catch (err) {
      next(err);
    }
  }

  static async createGrade(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const grade = await AcademicService.createGrade(schoolId, req.body.name, req.body.sequenceOrder);
      return ApiResponse.success(res, grade, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateGrade(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const grade = await AcademicService.updateGrade(schoolId, req.params.id, req.body.name, req.body.sequenceOrder);
      return ApiResponse.success(res, grade);
    } catch (err) {
      next(err);
    }
  }

  // Departments
  static async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const academicYearId = req.query.academicYearId as string;
      const depts = await AcademicService.getDepartments(schoolId, academicYearId);
      return ApiResponse.success(res, depts);
    } catch (err) {
      next(err);
    }
  }

  static async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const dept = await AcademicService.createDepartment(schoolId, req.body.name, req.body.code, req.body.hodTeacherId);
      return ApiResponse.success(res, dept, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const dept = await AcademicService.updateDepartment(schoolId, req.params.id, req.body.name, req.body.code, req.body.hodTeacherId);
      return ApiResponse.success(res, dept);
    } catch (err) {
      next(err);
    }
  }

  static async deleteDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      await AcademicService.deleteDepartment(schoolId, req.params.id);
      return ApiResponse.success(res, { success: true });
    } catch (err) {
      next(err);
    }
  }

  static async assignFaculty(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, academicYearId, teacherIds } = req.body;
      const result = await AcademicService.assignFacultyToDepartment(departmentId, academicYearId, teacherIds);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  // Sections
  static async getSections(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const academicYearId = req.query.academicYearId as string;
      const sections = await AcademicService.getSections(schoolId, academicYearId);
      return ApiResponse.success(res, sections);
    } catch (err) {
      next(err);
    }
  }

  static async createSection(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const section = await AcademicService.createSection(
        schoolId,
        req.body.gradeId,
        req.body.academicYearId,
        req.body.name,
        req.body.capacity,
        req.body.classTeacherId
      );
      return ApiResponse.success(res, section, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateSection(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const section = await AcademicService.updateSection(schoolId, req.params.id, req.body.name, req.body.capacity, req.body.classTeacherId);
      return ApiResponse.success(res, section);
    } catch (err) {
      next(err);
    }
  }

  static async setClassTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const teacherId = (req.query.teacherId as string) || req.body.teacherId;
      const section = await AcademicService.setClassTeacher(schoolId, req.params.id, teacherId);
      return ApiResponse.success(res, section);
    } catch (err) {
      next(err);
    }
  }

  // Subjects & Subject Types
  static async getSubjectTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const types = await AcademicService.getSubjectTypes(schoolId);
      return ApiResponse.success(res, types);
    } catch (err) {
      next(err);
    }
  }

  static async createSubjectType(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const type = await AcademicService.createSubjectType(schoolId, req.body.name, req.body.code, req.body.description);
      return ApiResponse.success(res, type, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateSubjectType(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const type = await AcademicService.updateSubjectType(schoolId, req.params.id, req.body.name, req.body.code, req.body.description);
      return ApiResponse.success(res, type);
    } catch (err) {
      next(err);
    }
  }

  static async deleteSubjectType(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      await AcademicService.deleteSubjectType(schoolId, req.params.id);
      return ApiResponse.success(res, { success: true });
    } catch (err) {
      next(err);
    }
  }

  static async getSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const subjects = await AcademicService.getSubjects(schoolId);
      return ApiResponse.success(res, subjects);
    } catch (err) {
      next(err);
    }
  }

  static async createSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const subject = await AcademicService.createSubject(schoolId, req.body.name, req.body.code, req.body.subjectTypeId);
      return ApiResponse.success(res, subject, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getSectionSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const subjects = await AcademicService.getSectionSubjects(req.params.id);
      return ApiResponse.success(res, subjects);
    } catch (err) {
      next(err);
    }
  }

  static async mapSubjectsToSection(req: Request, res: Response, next: NextFunction) {
    try {
      const { sectionId, subjectIds } = req.body;
      const result = await AcademicService.mapSubjectsToSection(sectionId, subjectIds);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async assignSubjectTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const { sectionId, subjectId, teacherId } = req.body;
      const result = await AcademicService.assignSubjectTeacher(sectionId, subjectId, teacherId);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async rollover(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const fromAcademicYearId = (req.query.fromAcademicYearId as string) || req.body.fromAcademicYearId;
      const toAcademicYearId = (req.query.toAcademicYearId as string) || req.body.toAcademicYearId;
      const result = await AcademicService.rolloverAcademicYear(schoolId, fromAcademicYearId, toAcademicYearId);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}
