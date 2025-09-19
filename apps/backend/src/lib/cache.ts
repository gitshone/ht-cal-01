import { BaseService } from '../core/base.service';
import { redis } from './redis';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export interface CacheKey {
  type: string;
  userId?: string;
  params?: Record<string, any>;
}

export class CacheService extends BaseService {
  private readonly DEFAULT_TTL = 300;
  private readonly DEFAULT_PREFIX = 'ht-cal:';

  constructor() {
    super();
  }

  private generateCacheKey(key: CacheKey, options: CacheOptions = {}): string {
    const prefix = options.prefix || this.DEFAULT_PREFIX;
    const { type, userId, params } = key;

    let cacheKey = `${prefix}${type}`;

    if (userId) {
      cacheKey += `:user:${userId}`;
    }

    if (params) {
      const paramsHash = this.hashObject(params);
      cacheKey += `:params:${paramsHash}`;
    }

    return cacheKey;
  }

  private hashObject(obj: Record<string, any>): string {
    const sortedKeys = Object.keys(obj).sort();
    const hashString = sortedKeys
      .map(key => `${key}=${JSON.stringify(obj[key])}`)
      .join('&');

    let hash = 0;
    for (let i = 0; i < hashString.length; i++) {
      const char = hashString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async get<T>(key: CacheKey, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.generateCacheKey(key, options);
      const cached = await redis.get(cacheKey);

      if (cached) {
        this.logInfo('Cache hit', { cacheKey, key });
        return JSON.parse(cached);
      }

      this.logInfo('Cache miss', { cacheKey, key });
      return null;
    } catch (error) {
      this.logError('Cache get error', error as Error, { key });
      return null;
    }
  }

  async set<T>(
    key: CacheKey,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(key, options);
      const ttl = options.ttl || this.DEFAULT_TTL;

      await redis.setex(cacheKey, ttl, JSON.stringify(value));
      this.logInfo('Cache set', { cacheKey, key, ttl });
    } catch (error) {
      this.logError('Cache set error', error as Error, { key });
    }
  }

  async delete(key: CacheKey, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(key, options);
      await redis.del(cacheKey);
      this.logInfo('Cache deleted', { cacheKey, key });
    } catch (error) {
      this.logError('Cache delete error', error as Error, { key });
    }
  }

  async deletePattern(
    pattern: string,
    options: CacheOptions = {}
  ): Promise<number> {
    try {
      const prefix = options.prefix || this.DEFAULT_PREFIX;
      const fullPattern = `${prefix}${pattern}`;

      const keys = await redis.keys(fullPattern);
      if (keys.length === 0) {
        return 0;
      }

      const deletedCount = await redis.del(...keys);
      this.logInfo('Cache pattern deleted', { pattern, deletedCount });
      return deletedCount;
    } catch (error) {
      this.logError('Cache pattern delete error', error as Error, { pattern });
      return 0;
    }
  }

  async invalidateUserCache(
    userId: string,
    cacheTypes: string[] = []
  ): Promise<void> {
    try {
      const patterns =
        cacheTypes.length > 0
          ? cacheTypes.map(type => `${type}:user:${userId}:*`)
          : [`*:user:${userId}:*`];

      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await this.deletePattern(pattern);
        totalDeleted += deleted;
      }

      this.logInfo('User cache invalidated', {
        userId,
        totalDeleted,
        patterns,
      });
    } catch (error) {
      this.logError('User cache invalidation error', error as Error, {
        userId,
      });
    }
  }

  async invalidateEventCache(userId: string, eventId?: string): Promise<void> {
    try {
      const patterns = [
        'events:user:*', // All events for all users (if eventId provided)
        `events:user:${userId}:*`, // All events for specific user
      ];

      if (eventId) {
        patterns.push(`event:user:${userId}:*`); // Specific event cache
      }

      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await this.deletePattern(pattern);
        totalDeleted += deleted;
      }

      this.logInfo('Event cache invalidated', {
        userId,
        eventId,
        totalDeleted,
      });
    } catch (error) {
      this.logError('Event cache invalidation error', error as Error, {
        userId,
        eventId,
      });
    }
  }

  async getStats(): Promise<{
    isConnected: boolean;
    memoryUsage?: string;
    keyCount?: number;
  }> {
    try {
      const info = await redis.info('memory');
      const keys = await redis.dbsize();

      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';

      return {
        isConnected: true,
        memoryUsage,
        keyCount: keys,
      };
    } catch (error) {
      this.logError('Cache stats error', error as Error);
      return { isConnected: false };
    }
  }
}

export const cacheService = new CacheService();
