import { Request, Response } from 'express';
import { BaseController } from '../../core/base.controller';
import { prisma } from '../../core/lib/prisma';
import { cacheService } from '../../core/lib/cache.service';

export class HealthController extends BaseController {
  async healthCheck(req: Request, res: Response) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      const cacheStats = await cacheService.getStats();

      this.sendSuccess(
        res,
        {
          status: 'healthy',
          database: 'connected',
          cache: cacheStats,
          timestamp: new Date().toISOString(),
        },
        'Health check successful'
      );
    } catch {
      this.sendError(res, 'Health check failed', 503);
    }
  }

  async clearCache(req: Request, res: Response) {
    try {
      const deletedCount = await cacheService.clearAllCache();
      this.sendSuccess(res, { deletedCount }, 'Cache cleared successfully');
    } catch (error) {
      this.sendError(res, 'Failed to clear cache', 500);
    }
  }
}
