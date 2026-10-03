import { Response, NextFunction } from 'express';
import { ExtendedRequest } from './logger.middleware';
import { ForbiddenError, UnauthorizedError } from '../utils/response';
import { ActorType, PermissionCode } from '../config/constants';
import db from '../config/database';

// In-memory cache for effective permissions: key: actorType:actorId -> Set<permissionCode>
const permissionsCache = new Map<string, { permissions: Set<string>; expiresAt: number }>();
const CACHE_TTL_MS = 300000; // 5 minutes

export class RbacService {
  static async getEffectivePermissions(actorType: string, actorId: string): Promise<Set<string>> {
    const cacheKey = `${actorType}:${actorId}`;
    const cached = permissionsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    if (actorType === ActorType.SUPER_ADMIN) {
      const allPermissions = Object.values(PermissionCode) as string[];
      const permSet = new Set<string>(allPermissions);
      permissionsCache.set(cacheKey, { permissions: permSet, expiresAt: Date.now() + CACHE_TTL_MS });
      return permSet;
    }

    const permSet = new Set<string>();

    if (actorType === ActorType.ADMIN) {
      const adminExcluded = new Set<string>([
        PermissionCode.SUPER_ADMIN_ALL,
        PermissionCode.SUBSCRIPTION_OVERRIDE,
        PermissionCode.PLAN_MANAGE,
        PermissionCode.SCHOOL_MANAGE,
      ]);
      const adminPerms = (Object.values(PermissionCode) as string[]).filter((p) => !adminExcluded.has(p));
      for (const p of adminPerms) {
        permSet.add(p);
      }
    }

    // Fetch custom assigned permissions via raw SQL query
    const res = await db.query<{ code: string }>(
      `SELECT DISTINCT p.code
       FROM actor_role_assignments ara
       JOIN role_permissions rp ON ara.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ara.actor_type = $1 AND ara.actor_id = $2`,
      [actorType, actorId]
    );

    for (const row of res.rows) {
      permSet.add(row.code);
    }

    permissionsCache.set(cacheKey, { permissions: permSet, expiresAt: Date.now() + CACHE_TTL_MS });
    return permSet;
  }

  static evictCache(actorType: string, actorId: string): void {
    const cacheKey = `${actorType}:${actorId}`;
    permissionsCache.delete(cacheKey);
  }
}

export const hasPermission = (permissionCode: string) => {
  return async (req: ExtendedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User unauthenticated'));
    }

    if (req.user.actorType === ActorType.SUPER_ADMIN) {
      return next();
    }

    try {
      const effectivePerms = await RbacService.getEffectivePermissions(req.user.actorType, req.user.actorId);
      if (effectivePerms.has(permissionCode)) {
        return next();
      }
      return next(new ForbiddenError(`Missing required permission: ${permissionCode}`));
    } catch (err) {
      return next(err);
    }
  };
};
