import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/response';

export class AuthController {
  static async registerSchool(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.registerSchool(req.body);
      return ApiResponse.success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  static async adminLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, msisdn, mobileNo, phone, username, password, deviceId } = req.body;
      const identifier = email || msisdn || mobileNo || phone || username;
      const result = await AuthService.adminLogin(identifier, password, deviceId);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async teacherLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeCode, schoolId, password, deviceId } = req.body;
      const result = await AuthService.teacherLogin(employeeCode, schoolId, password, deviceId);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async parentLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = (req.query.schoolId as string) || req.body.schoolId;
      const msisdn = (req.query.msisdn as string) || req.body.msisdn;
      const { password, deviceId } = req.body;
      const result = await AuthService.parentLogin(schoolId, msisdn, password, deviceId);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getParentSchools(req: Request, res: Response, next: NextFunction) {
    try {
      const msisdn = req.query.msisdn as string;
      const result = await AuthService.getParentSchools(msisdn);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async userSignup(req: Request, res: Response, next: NextFunction) {
    try {
      const { msisdn, actorType } = req.body;
      const result = await AuthService.userSignup(msisdn, actorType);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async createPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { signupToken, newPassword } = req.body;
      const result = await AuthService.createPassword(signupToken, newPassword);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { msisdn, purpose } = req.body;
      const result = await AuthService.sendOtp(msisdn, purpose);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { msisdn, purpose, otpCode } = req.body;
      const result = await AuthService.verifyOtp(msisdn, purpose, otpCode);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const email = req.query.email as string || req.body.email;
      const mobileNo = req.query.mobileNo as string || req.body.mobileNo;
      const result = await AuthService.forgotPassword(email, mobileNo);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.resetPassword(req.body);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}
