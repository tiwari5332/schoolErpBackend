import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { RedisService } from '../infra/cache/redis.service';
import { DomainError } from './domain.error';

export interface IdempotencyRecord {
  requestHash: string;
  response: any;
  status: number;
  createdAt: string;
}

@Injectable()
export class IdempotencyService {
  constructor(private readonly redis: RedisService) {}

  private hashBody(body: any): string {
    const str = typeof body === 'string' ? body : JSON.stringify(body || {});
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  async check(key: string, body: any): Promise<IdempotencyRecord | null> {
    const record = await this.redis.get<IdempotencyRecord>(`idemp:${key}`);
    if (!record) return null;

    const currentHash = this.hashBody(body);
    if (record.requestHash !== currentHash) {
      throw new DomainError(
        'CONFLICT',
        'Idempotency key was previously used with a different request body.',
      );
    }

    return record;
  }

  async store(key: string, body: any, response: any, status = 200, ttlSeconds = 86400): Promise<void> {
    const record: IdempotencyRecord = {
      requestHash: this.hashBody(body),
      response,
      status,
      createdAt: new Date().toISOString(),
    };
    await this.redis.set(`idemp:${key}`, record, ttlSeconds);
  }
}

