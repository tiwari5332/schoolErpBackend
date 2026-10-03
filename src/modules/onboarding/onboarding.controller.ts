import { Request, Response, NextFunction } from 'express';
import { getTenantSchoolId } from '../../middleware/tenant.middleware';
import { OnboardingService } from './onboarding.service';
import { ApiResponse, BusinessRuleException } from '../../utils/response';

export class OnboardingController {
  static async onboardStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const result = await OnboardingService.onboardStudent(schoolId, req.body);
      return ApiResponse.success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async bulkOnboardStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const sectionId = (req.query.sectionId as string) || req.body.sectionId;
      if (!req.file) {
        throw new BusinessRuleException('No CSV file uploaded', 400);
      }
      const result = await OnboardingService.bulkOnboardStudents(schoolId, sectionId, req.file.buffer);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async onboardTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const result = await OnboardingService.onboardTeacher(schoolId, req.body);
      return ApiResponse.success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async bulkOnboardTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      if (!req.file) {
        throw new BusinessRuleException('No CSV file uploaded', 400);
      }
      const result = await OnboardingService.bulkOnboardTeachers(schoolId, req.file.buffer);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}
