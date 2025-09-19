import { BaseService } from '../../../core/base.service';
import { SyncEventsQueue } from '../queues/sync-events-queue';
import { CalendarQueue } from '../queues/calendar-queue';
import { CleanupTokensQueue } from '../queues/cleanup-tokens-queue';
import { EVENT_CONSTANTS } from '@ht-cal-01/shared-types';

export class QueueManager extends BaseService {
  private syncEventsQueue!: SyncEventsQueue;
  private calendarQueue!: CalendarQueue;
  private cleanupTokensQueue!: CleanupTokensQueue;

  constructor() {
    super();
    this.initializeQueues();
  }

  private initializeQueues(): void {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
    };

    this.syncEventsQueue = new SyncEventsQueue(redisConfig);
    this.calendarQueue = new CalendarQueue(redisConfig);
    this.cleanupTokensQueue = new CleanupTokensQueue(redisConfig);

    this.logInfo('All queues initialized successfully');
  }

  async addJob(type: string, data: Record<string, unknown>): Promise<string> {
    switch (type) {
      case EVENT_CONSTANTS.JOB_TYPES.SYNC_EVENTS:
        return this.syncEventsQueue.addJob(data);
      case EVENT_CONSTANTS.JOB_TYPES.CONNECT_CALENDAR:
        return this.calendarQueue.addJob(data);
      case EVENT_CONSTANTS.JOB_TYPES.CLEANUP_BLACKLISTED_TOKENS:
        return this.cleanupTokensQueue.addJob(data);
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }

  async getJob(jobId: string): Promise<any> {
    const queues = [
      this.syncEventsQueue,
      this.calendarQueue,
      this.cleanupTokensQueue,
    ];

    for (const queue of queues) {
      const job = await queue.getJob(jobId);
      if (job) {
        return job;
      }
    }

    return null;
  }

  async getQueueStats(): Promise<Record<string, any>> {
    const syncStats = await this.syncEventsQueue.getJobCounts();
    const calendarStats = await this.calendarQueue.getJobCounts();
    const cleanupStats = await this.cleanupTokensQueue.getJobCounts();

    return {
      syncEvents: syncStats,
      connectCalendar: calendarStats,
      cleanupTokens: cleanupStats,
    };
  }

  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    await queue.pause();
  }

  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueueByName(queueName);
    await queue.resume();
  }

  private getQueueByName(
    queueName: string
  ): SyncEventsQueue | CalendarQueue | CleanupTokensQueue {
    switch (queueName) {
      case 'sync-events':
        return this.syncEventsQueue;
      case 'connect-calendar':
        return this.calendarQueue;
      case 'cleanup-tokens':
        return this.cleanupTokensQueue;
      default:
        throw new Error(`Unknown queue name: ${queueName}`);
    }
  }

  async scheduleCleanupBlacklistedTokens(): Promise<string> {
    return this.cleanupTokensQueue.addJob({});
  }

  async close(): Promise<void> {
    await Promise.all([
      this.syncEventsQueue.close(),
      this.calendarQueue.close(),
      this.cleanupTokensQueue.close(),
    ]);

    this.logInfo('All queues closed successfully');
  }

  get syncEvents(): SyncEventsQueue {
    return this.syncEventsQueue;
  }

  get calendar(): CalendarQueue {
    return this.calendarQueue;
  }

  get cleanupTokens(): CleanupTokensQueue {
    return this.cleanupTokensQueue;
  }
}
