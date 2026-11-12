import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from '../domain.error';
import { RedisService } from '../../infra/cache/redis.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();
    const method = req.method.toUpperCase();

    // Read-only requests, public, auth, and billing endpoints are always allowed
    if (
      method === 'GET' ||
      method === 'HEAD' ||
      method === 'OPTIONS' ||
      req.url.startsWith('/api/v1/auth') ||
      req.url.startsWith('/api/v1/public') ||
      req.url.startsWith('/api/v1/subscription') ||
      req.url.startsWith('/api/v1/platform')
    ) {
      return true;
    }

    const user = (req as any).user;
    if (!user?.tenantId || user.isPlatformOwner) {
      return true;
    }

    // Check cached subscription status
    const sub = await this.redis.get<{ status: string; trialEndsAt?: string }>(
      `sub:${user.tenantId}`,
    );

    if (sub) {
      if (sub.status === 'PAST_DUE') {
        reply.header('x-subscription-warning', 'Account is past due. Please update payment.');
      } else if (['SUSPENDED', 'CANCELLED', 'EXPIRED'].includes(sub.status)) {
        throw new DomainError(
          'SUBSCRIPTION_EXPIRED',
          'School subscription is expired or suspended. Mutating actions are disabled.',
        );
      }
    }

    return true;
  }
}

