import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigService } from '../../core/config/app-config.service';

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export interface CacheKey {
  type: string;
  userId?: string;
  id?: string;
  [key: string]: any;
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private redis: Redis;
  private readonly DEFAULT_TTL = 300;

  constructor(private config: AppConfigService) {
    this.redis = new Redis({
      host: this.config.redisHost,
      port: this.config.redisPort,
      db: 0,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('error', error => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  async onModuleDestroy() {
    await this.redis.disconnect();
  }

  async ping(): Promise<string> {
    return await this.redis.ping();
  }

  private generateCacheKey(key: CacheKey, options: CacheOptions = {}): string {
    const prefix = options.prefix || 'ht-cal';
    const keyString = this.hashObject(key);
    return `${prefix}:${keyString}`;
  }

  private hashObject(obj: Record<string, any>): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async get<T>(key: CacheKey, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.generateCacheKey(key, options);
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        console.log('Cache hit', { cacheKey, key });
        return JSON.parse(cached);
      }

      console.log('Cache miss', { cacheKey, key });
      return null;
    } catch (error) {
      console.error('Cache get error', error, { key });
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

      await this.redis.setex(cacheKey, ttl, JSON.stringify(value));
      console.log('Cache set', { cacheKey, key, ttl });
    } catch (error) {
      console.error('Cache set error', error, { key });
    }
  }

  async del(key: CacheKey, options: CacheOptions = {}): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(key, options);
      await this.redis.del(cacheKey);
      console.log('Cache deleted', { cacheKey, key });
    } catch (error) {
      console.error('Cache delete error', error, { key });
    }
  }

  async exists(key: CacheKey, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.generateCacheKey(key, options);
      const exists = await this.redis.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      console.error('Cache exists error', error, { key });
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
      console.log('Cache flushed');
    } catch (error) {
      console.error('Cache flush error', error);
    }
  }

  async getStats(): Promise<{
    memory: string;
    keys: number;
    connected: boolean;
  }> {
    try {
      const info = await this.redis.info('memory');
      const keys = await this.redis.dbsize();

      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memory = memoryMatch ? memoryMatch[1] : 'unknown';

      return {
        memory,
        keys,
        connected: this.redis.status === 'ready',
      };
    } catch (error) {
      console.error('Cache stats error', error);
      return {
        memory: 'unknown',
        keys: 0,
        connected: false,
      };
    }
  }
}
