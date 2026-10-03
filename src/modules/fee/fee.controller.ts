import { Request, Response, NextFunction } from 'express';
import { getTenantSchoolId } from '../../middleware/tenant.middleware';
import { FeeService } from './fee.service';
import { ApiResponse } from '../../utils/response';

export class FeeController {
  // Fee Components
  static async getFeeComponents(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const components = await FeeService.getFeeComponents(schoolId);
      return ApiResponse.success(res, components);
    } catch (err) {
      next(err);
    }
  }

  static async createFeeComponent(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const component = await FeeService.createFeeComponent(schoolId, req.body.name, req.body.code);
      return ApiResponse.success(res, component, 201);
    } catch (err) {
      next(err);
    }
  }

  // Section Fee Structure
  static async getSectionFeeStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const structure = await FeeService.getSectionFeeStructure(req.params.sectionId);
      return ApiResponse.success(res, structure);
    } catch (err) {
      next(err);
    }
  }

  static async setSectionFeeStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const { sectionId, items } = req.body;
      const result = await FeeService.setSectionFeeStructure(sectionId, items);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  // Late Fee Slabs
  static async getLateFeeSlabs(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const slabs = await FeeService.getLateFeeSlabs(schoolId);
      return ApiResponse.success(res, slabs);
    } catch (err) {
      next(err);
    }
  }

  static async updateLateFeeSlabs(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const slabs = await FeeService.updateLateFeeSlabs(schoolId, req.body.slabs || req.body);
      return ApiResponse.success(res, slabs);
    } catch (err) {
      next(err);
    }
  }

  // Bulk Discount Policies
  static async createDiscountPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const policy = await FeeService.createDiscountPolicy(schoolId, req.body);
      return ApiResponse.success(res, policy, 201);
    } catch (err) {
      next(err);
    }
  }

  // Invoice Search
  static async searchInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const filters = {
        status: req.query.status as string,
        sectionId: (req.query.classId || req.query.sectionId) as string,
        yearMonth: req.query.yearMonth as string,
      };
      const invoices = await FeeService.searchInvoices(schoolId, filters);
      return ApiResponse.success(res, invoices);
    } catch (err) {
      next(err);
    }
  }

  // Payments & Refunds
  static async recordGatewayPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await FeeService.recordGatewayPayment(req.body);
      return ApiResponse.success(res, payment, 201);
    } catch (err) {
      next(err);
    }
  }

  static async recordManualCashPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const adminId = req.user!.actorId;
      const payment = await FeeService.recordManualCashPayment(schoolId, adminId, req.body);
      return ApiResponse.success(res, payment, 201);
    } catch (err) {
      next(err);
    }
  }

  static async applyWaiver(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceId = req.params.invoiceId;
      const adminId = req.user!.actorId;
      const reason = req.body.reason;
      const result = await FeeService.applyFeeWaiver(invoiceId, adminId, reason);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const paymentId = req.params.paymentId;
      const adminId = req.user!.actorId;
      const { amount, mode, reason } = req.body;
      const refund = await FeeService.processRefund(paymentId, adminId, amount, mode, reason);
      return ApiResponse.success(res, refund, 201);
    } catch (err) {
      next(err);
    }
  }
}
