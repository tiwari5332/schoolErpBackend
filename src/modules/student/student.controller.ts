import { Request, Response, NextFunction } from 'express';
import { getTenantSchoolId } from '../../middleware/tenant.middleware';
import { StudentService } from './student.service';
import { updateStudentSchema, queryStudentsSchema } from './student.dto';
import { ApiResponse } from '../../utils/response';

export class StudentController {
  static async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const query = queryStudentsSchema.parse(req.query);
      const result = await StudentService.getStudents(schoolId, query);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getStudentById(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const student = await StudentService.getStudentById(schoolId, req.params.id);
      return ApiResponse.success(res, student);
    } catch (err) {
      next(err);
    }
  }

  static async updateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const id = req.params.id;
      const validatedBody = updateStudentSchema.parse(req.body);
      const updatedStudent = await StudentService.updateStudent(schoolId, id, validatedBody);
      return ApiResponse.success(res, updatedStudent);
    } catch (err) {
      next(err);
    }
  }
}

