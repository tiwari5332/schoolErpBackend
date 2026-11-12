import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DomainError } from '../domain.error';
import { PERMISSIONS_KEY, ROLES_KEY } from '../decorators/permissions.decorator';
import { CONTRACT_ENDPOINT_KEY } from '../../contract/endpoint.decorator';
import { CONTRACT_ROUTES, EndpointId } from '../../contract/generated/routes';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const endpointId = this.reflector.get<EndpointId>(
      CONTRACT_ENDPOINT_KEY,
      context.getHandler(),
    );

    // 1. Check roles required
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Check permission required
    let requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check if contract specifies a permission or role guard
    if (!requiredPermission && endpointId) {
      const contractPerm = CONTRACT_ROUTES[endpointId]?.permission;
      if (contractPerm) {
        requiredPermission = contractPerm;
      }
    }

    if (!requiredRoles && !requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new DomainError('UNAUTHENTICATED', 'Authentication required');
    }

    // Platform owner has full access
    if (user.isPlatformOwner || user.roleKey === 'PLATFORM_OWNER') {
      return true;
    }

    // Role check
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.roleKey)) {
        throw new DomainError('FORBIDDEN', `Role '${user.roleKey}' is not permitted.`);
      }
    }

    // Permission check
    if (requiredPermission) {
      // Contract permission field could be a role guard like "PARENT" or "PLATFORM_OWNER"
      if (requiredPermission === 'PLATFORM_OWNER' && user.roleKey !== 'PLATFORM_OWNER') {
        throw new DomainError('FORBIDDEN', 'Platform owner access required.');
      }
      if (requiredPermission === 'PARENT' && user.roleKey !== 'PARENT' && user.roleKey !== 'SUPER_ADMIN') {
        throw new DomainError('FORBIDDEN', 'Parent access required.');
      }

      // Check specific permission key
      if (
        !requiredPermission.includes('.') &&
        ['PARENT', 'PLATFORM_OWNER', 'SUPER_ADMIN', 'ADMIN'].includes(requiredPermission)
      ) {
        if (user.roleKey !== requiredPermission && user.roleKey !== 'SUPER_ADMIN') {
          throw new DomainError('FORBIDDEN', `Access forbidden. Requires role: ${requiredPermission}`);
        }
        return true;
      }

      // Super admin bypasses tenant-level permissions
      if (user.roleKey === 'SUPER_ADMIN') {
        return true;
      }

      const userPermissions = user.permissions || [];
      if (!userPermissions.includes(requiredPermission)) {
        throw new DomainError(
          'FORBIDDEN',
          `Missing required permission: '${requiredPermission}'`,
        );
      }
    }

    return true;
  }
}

