import { Request, Response, NextFunction } from 'express';
import { getTenantSchoolId } from '../../middleware/tenant.middleware';
import { RoleService } from './role.service';
import { ApiResponse } from '../../utils/response';

export class RoleController {
  static async getSchoolCustomRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const roles = await RoleService.getSchoolCustomRoles(schoolId);
      return ApiResponse.success(res, roles);
    } catch (err) {
      next(err);
    }
  }

  static async createCustomRole(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = getTenantSchoolId(req)!;
      const { name, description, permissionCodes } = req.body;
      const role = await RoleService.createCustomRole(schoolId, name, description, permissionCodes || []);
      return ApiResponse.success(res, role, 201);
    } catch (err) {
      next(err);
    }
  }

  static async assignRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { actorType, actorId, roleId } = req.body;
      const assignment = await RoleService.assignRole(actorType, actorId, roleId);
      return ApiResponse.success(res, assignment);
    } catch (err) {
      next(err);
    }
  }

  static async getRolePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const roleId = req.params.roleId;
      const permissions = await RoleService.getRolePermissions(roleId);
      return ApiResponse.success(res, { roleId, permissions });
    } catch (err) {
      next(err);
    }
  }

  static async getRolePermissionsByName(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.params.schoolId;
      const roleName = req.params.roleName;
      const permissions = await RoleService.getRolePermissionsByName(schoolId, roleName);
      return ApiResponse.success(res, { schoolId, roleName, permissions });
    } catch (err) {
      next(err);
    }
  }
}
