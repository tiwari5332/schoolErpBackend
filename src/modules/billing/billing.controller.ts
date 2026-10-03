import { Request, Response, NextFunction } from 'express';
import { getTenantSchoolId } from '../../middleware/tenant.middleware';
import { BillingService } from './billing.service';
import { ApiResponse } from '../../utils/response';

export class BillingController {
  static async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const plans = await BillingService.getPlans();
      return ApiResponse.success(res, plans);
    } catch (err) {
      next(err);
    }
  }

  static async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await BillingService.createPlan(req.body);
      return ApiResponse.success(res, plan, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await BillingService.updatePlan(req.params.id, req.body);
      return ApiResponse.success(res, plan);
    } catch (err) {
      next(err);
    }
  }

  static async getSchoolSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const sub = await BillingService.getSchoolSubscription(schoolId);
      return ApiResponse.success(res, sub);
    } catch (err) {
      next(err);
    }
  }

  static async upgradeSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const { planId, billingCycle, changeReason } = req.body;
      const sub = await BillingService.upgradeSubscription(schoolId, planId, billingCycle, changeReason);
      return ApiResponse.success(res, sub);
    } catch (err) {
      next(err);
    }
  }

  static async overrideCap(req: Request, res: Response, next: NextFunction) {
    try {
      const superAdminId = req.user!.actorId;
      const schoolId = req.params.schoolId;
      const sub = await BillingService.overrideCap(superAdminId, schoolId, req.body);
      return ApiResponse.success(res, sub);
    } catch (err) {
      next(err);
    }
  }

  static async purchaseTopUp(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const { channel, creditsPurchased, costPaid } = req.body;
      const pack = await BillingService.purchaseTopUp(schoolId, channel, creditsPurchased, costPaid);
      return ApiResponse.success(res, pack, 201);
    } catch (err) {
      next(err);
    }
  }

  static async getTopUpPacks(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const packs = await BillingService.getTopUpPacks(schoolId);
      return ApiResponse.success(res, packs);
    } catch (err) {
      next(err);
    }
  }

  static async getUsageLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const channel = req.query.channel as string;
      const ledgers = await BillingService.getUsageLedgers(schoolId, channel);
      return ApiResponse.success(res, ledgers);
    } catch (err) {
      next(err);
    }
  }
}
