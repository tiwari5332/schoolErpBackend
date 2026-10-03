import { Request, Response, NextFunction } from 'express';
import { getTenantSchoolId } from '../../middleware/tenant.middleware';
import { TeacherService } from './teacher.service';
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
