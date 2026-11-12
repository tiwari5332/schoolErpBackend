import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { DomainError } from '../domain.error';
import { RedisService } from '../../infra/cache/redis.service';

@Injectable()
export class SessionLockGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const method = request.method.toUpperCase();

    // Safe GET / HEAD requests are always allowed
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }

    // Exempt session management routes (e.g. unlocking, switching)
    const url = request.url;
    if (url.includes('/academic/sessions') || url.includes('/auth') || url.includes('/public')) {
      return true;
    }

    const sessionId = request.headers['x-session-id'] as string;
    if (!sessionId) {
      return true;
    }

    // Check if session is cached as locked
    const isLocked = await this.redis.get<boolean>(`session:${sessionId}:locked`);
    if (isLocked) {
      throw new DomainError(
        'SESSION_LOCKED',
        'The selected academic session is locked and cannot be modified.',
      );
    }

    return true;
  }
}

