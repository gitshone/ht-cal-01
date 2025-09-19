import { BaseQueue, JobData, JobResult } from '../core/base-queue';
import { tokenBlacklistRepository } from '../../auth/token-blacklist.repository';

export class CleanupTokensQueue extends BaseQueue {
  constructor(redisConfig: any) {
    super('cleanup-tokens', redisConfig, {
      removeOnComplete: 50,
      removeOnFail: 25,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  protected async processJob(_data: JobData): Promise<JobResult> {
    try {
      const cleanedCount =
        await tokenBlacklistRepository.cleanupExpiredTokens();

      this.logInfo('Cleanup blacklisted tokens job completed', {
        cleanedCount,
      });

      return {
        success: true,
        data: {
          cleanedCount,
          message: `Cleaned up ${cleanedCount} expired blacklisted tokens`,
        },
      };
    } catch (error) {
      this.logError('Cleanup blacklisted tokens job failed', error as Error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }
}
