import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { env } from '../../config/env.config';
import { TenantContext } from '../db/tenant-context';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  onModuleInit() {
    this.client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: () => null,
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis client notice: ${err.message}`);
    });

    this.client.connect().then(() => {
      this.logger.log('✅ Redis connected successfully.');
    }).catch((err) => {
      this.logger.warn(`⚠️ Redis connection failed (${err.message}). In-memory fallback will be used where applicable.`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  private formatKey(key: string): string {
    const tenantId = TenantContext.get()?.tenantId;
    return tenantId ? `t:${tenantId}:${key}` : `global:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(this.formatKey(key));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const formattedKey = this.formatKey(key);
      const strVal = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(formattedKey, strVal, 'EX', ttlSeconds);
      } else {
        await this.client.set(formattedKey, strVal);
      }
    } catch (err: any) {
      this.logger.warn(`Redis set failed: ${err.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(this.formatKey(key));
    } catch (err: any) {
      this.logger.warn(`Redis del failed: ${err.message}`);
    }
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    try {
      const pattern = this.formatKey(`${prefix}*`);
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err: any) {
      this.logger.warn(`Redis invalidatePrefix failed: ${err.message}`);
    }
  }
}

