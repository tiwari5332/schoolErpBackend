import { Request, Response, NextFunction } from 'express';
import { getTenantSchoolId } from '../../middleware/tenant.middleware';
import CommunicationService from './communication.service';
import { ApiResponse } from '../../utils/response';
import { ExtendedRequest } from '../../middleware/logger.middleware';

class CommunicationController {
  static async getBroadCastList(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const channel = req.query.channel as string | undefined;
      const status = req.query.status as string | undefined;

      const broadCastList = await CommunicationService.getBroadCastList(schoolId, channel, status);
      return ApiResponse.success(res, broadCastList);
    } catch (error: any) {
      next(error);
    }
  }

  static async sendBroadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const user = (req as ExtendedRequest).user;
      const senderTeacherId = user?.actorType === 'TEACHER' ? user.actorId : (req.body.senderTeacherId || null);
      const actorType = user?.actorType || 'ADMIN';

      const result = await CommunicationService.sendBroadcast({
        schoolId,
        senderTeacherId,
        actorType,
        channel: req.body.channel,
        messageBody: req.body.messageBody,
        templateCode: req.body.templateCode,
        templateVariables: req.body.templateVariables,
        sectionIds: req.body.sectionIds,
        directRecipients: req.body.directRecipients,
      });

      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      next(error);
    }
  }

  static async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = req.query.channel as string | undefined;
      const templates = await CommunicationService.getTemplates(channel);
      return ApiResponse.success(res, templates);
    } catch (error: any) {
      next(error);
    }
  }

  static async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, code, template, channel } = req.body;
      const result = await CommunicationService.createTemplate(name, code, template, channel);
      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      next(error);
    }
  }

  static async assignTeacherQuota(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const { teacherId, channel, quotaLimit, yearMonth } = req.body;
      const ym = yearMonth || new Date().toISOString().slice(0, 7);

      const result = await CommunicationService.assignTeacherQuota(
        schoolId,
        teacherId,
        channel,
        quotaLimit,
        ym
      );
      return ApiResponse.success(res, result, 201);
    } catch (error: any) {
      next(error);
    }
  }

  static async getTeacherQuotas(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const teacherId = req.params.teacherId;
      const yearMonth = req.query.yearMonth as string | undefined;

      const result = await CommunicationService.getTeacherQuotas(schoolId, teacherId, yearMonth);
      return ApiResponse.success(res, result);
    } catch (error: any) {
      next(error);
    }
  }
}

export default CommunicationController;
