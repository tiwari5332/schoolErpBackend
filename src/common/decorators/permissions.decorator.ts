import { SetMetadata } from '@nestjs/common';
import { PermissionKey, RoleKey } from '../../contract/generated/enums';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (permission: PermissionKey | string) =>
  SetMetadata(PERMISSIONS_KEY, permission);

export const ROLES_KEY = 'roles';
export const RequireRole = (...roles: (RoleKey | string)[]) =>
  SetMetadata(ROLES_KEY, roles);

