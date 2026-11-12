import { Request, Response, NextFunction } from 'express';
import { getTenantSchoolId } from '../../middleware/tenant.middleware';
import { TeacherService } from './teacher.service';
import { updateTeacherSchema } from './teacher.dto';
import { ApiResponse } from '../../utils/response';

export class TeacherController {
  static async getTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const sectionId = req.query.sectionId as string;
      const teachers = await TeacherService.getTeachers(schoolId, sectionId);
      return ApiResponse.success(res, teachers);
    } catch (err) {
      next(err);
    }
  }

  static async getTeacherById(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const teacher = await TeacherService.getTeacherById(schoolId, req.params.id);
      return ApiResponse.success(res, teacher);
    } catch (err) {
      next(err);
    }
  }

  static async updateTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const id = req.params.id;
      const validatedBody = updateTeacherSchema.parse(req.body);
      const updatedTeacher = await TeacherService.updateTeacher(schoolId, id, validatedBody);
      return ApiResponse.success(res, updatedTeacher);
    } catch (err) {
      next(err);
    }
  }

  static async getSectionTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const sectionId = req.params.sectionId;
      const result = await TeacherService.getSectionTeachers(sectionId);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}
