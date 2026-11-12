import crypto from 'crypto';
import { Logger } from './logger';

interface CacheEntry {
  data: any;
  etag: string;
  expiresAt: number;
}

export class DashboardCache {
  private static store = new Map<string, CacheEntry>();

  /**
   * Builds standardized cache key:
   * dashboard:{school}:{session}:{widget}:{date}
   */
  static buildKey(schoolId: string, sessionId: string, widget: string, date: string): string {
    return `dashboard:${schoolId}:${sessionId || 'default'}:${widget}:${date}`;
  }

  /**
   * Retrieves data and ETag from cache if not expired
   */
  static get(key: string): { data: any; etag: string } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return { data: entry.data, etag: entry.etag };
  }

  /**
   * Stores data in cache with ETag and TTL
   */
  static set(key: string, data: any, ttlSeconds: number): string {
    const payload = JSON.stringify(data);
    const etag = `"${crypto.createHash('md5').update(payload).digest('hex')}"`;
    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.store.set(key, { data, etag, expiresAt });
    return etag;
  }

  /**
   * Invalidate cache entries matching schoolId and optional widget
   */
  static invalidate(schoolId: string, widget?: string): void {
    const prefix = widget ? `dashboard:${schoolId}:` : `dashboard:${schoolId}:`;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        if (!widget || key.includes(`:${widget}:`)) {
          this.store.delete(key);
        }
      }
    }
    Logger.info(`[DashboardCache] Invalidated cache for school ${schoolId} (widget: ${widget || 'ALL'})`);
  }

  /**
   * Clear all cache entries
   */
  static clear(): void {
    this.store.clear();
  }
}
