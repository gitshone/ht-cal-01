import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { QueueService } from '../../../infrastructure/queue/queue.service';
import { FileStorageService } from '../../../infrastructure/file-storage/file-storage.service';
import { HealthStatusDto } from '../dtos/health.dto';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private queueService: QueueService,
    private fileStorageService: FileStorageService
  ) {}

  async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  async checkRedis(): Promise<boolean> {
    try {
      await this.cacheService.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }

  async checkQueue(): Promise<boolean> {
    try {
      await this.queueService.getQueueStats();
      return true;
    } catch (error) {
      this.logger.error('Queue health check failed:', error);
      return false;
    }
  }

  async checkS3Client(): Promise<boolean> {
    try {
      // Try to get a signed URL for a test file to verify S3Client is working
      await this.fileStorageService.getSignedUrl('test/connection.txt', 60);
      return true;
    } catch (error) {
      this.logger.error('S3Client health check failed:', error);
      return false;
    }
  }

  async getHealthStatus(): Promise<HealthStatusDto> {
    const [database, redis, queue, s3Client] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueue(),
      this.checkS3Client(),
    ]);

    const allHealthy = database && redis && queue && s3Client;
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      uptime,
      database,
      redis,
      queue,
      s3Client,
      timestamp: new Date().toISOString(),
    };
  }

  async clearCache(): Promise<void> {
    try {
      await this.cacheService.flush();
      this.logger.log('Cache cleared successfully');
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
      throw error;
    }
  }
}
