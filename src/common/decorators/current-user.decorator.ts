import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../../infra/db/tenant-context';

export interface CurrentUserPayload {
  id?: string;
  userId: string;
  tenantId: string;
  roleKey?: string;
  permissions?: string[];
  isPlatformOwner?: boolean;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    if (request.user) {
      return {
        id: request.user.sub || request.user.id || request.user.userId,
        userId: request.user.sub || request.user.id || request.user.userId,
        tenantId: request.user.tenantId,
        roleKey: request.user.roleKey,
        permissions: request.user.permissions,
        isPlatformOwner: request.user.isPlatformOwner,
      };
    }
    return {
      userId: TenantContext.getUserId() || '',
      tenantId: TenantContext.get()?.tenantId || '',
      roleKey: TenantContext.getRoleKey(),
      permissions: TenantContext.getPermissions(),
      isPlatformOwner: TenantContext.isPlatformOwner(),
    };
  },
);

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return TenantContext.getTenantId();
  },
);

export const SessionId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return TenantContext.getSessionId();
  },
);

