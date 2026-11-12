import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import jwt from 'jsonwebtoken';
import { FastifyRequest } from 'fastify';
import { env } from '../../config/env.config';
import { DomainError } from '../domain.error';
import { TenantContext } from '../../infra/db/tenant-context';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CONTRACT_ENDPOINT_KEY } from '../../contract/endpoint.decorator';
import { CONTRACT_ROUTES, EndpointId } from '../../contract/generated/routes';

export interface JwtPayload {
  sub: string;
  tenantId?: string;
  roleKey?: string;
  permissions?: string[];
  isPlatformOwner?: boolean;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const endpointId = this.reflector.get<EndpointId>(
      CONTRACT_ENDPOINT_KEY,
      context.getHandler(),
    );

    const isContractPublic = endpointId ? CONTRACT_ROUTES[endpointId]?.auth === false : false;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (isPublic || isContractPublic) {
      if (token) {
        try {
          const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
          this.setContext(request, decoded);
        } catch {
          // Public endpoint, ignore invalid token
        }
      }
      return true;
    }

    if (!token) {
      throw new DomainError('UNAUTHENTICATED', 'Missing or malformed Authorization header');
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      this.setContext(request, decoded);
      return true;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new DomainError('TOKEN_EXPIRED', 'Access token has expired');
      }
      throw new DomainError('UNAUTHENTICATED', 'Invalid authentication token');
    }
  }

  private setContext(request: FastifyRequest, decoded: JwtPayload) {
    const sessionId = (request.headers['x-session-id'] as string) || undefined;
    const contextData = {
      tenantId: decoded.tenantId || '',
      userId: decoded.sub,
      roleKey: decoded.roleKey,
      permissions: decoded.permissions || [],
      isPlatformOwner: decoded.isPlatformOwner || decoded.roleKey === 'PLATFORM_OWNER',
      sessionId,
    };

    (request as any).user = contextData;

    // Run tenant context in AsyncLocalStorage
    TenantContext.run(contextData, () => {});
  }
}

