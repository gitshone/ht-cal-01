import { BaseService } from '../../core/base.service';
import { QueueManager } from './core/queue-manager';

export interface JobData {
  userId?: string;
  googleCode?: string;
  [key: string]: unknown;
}

export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export class BullQueueService extends BaseService {
  private queueManager: QueueManager;

  constructor() {
    super();
    this.queueManager = new QueueManager();
  }

  async addJob(type: string, data: JobData): Promise<string> {
    return this.queueManager.addJob(type, data);
  }

  async getJob(jobId: string): Promise<any> {
    return this.queueManager.getJob(jobId);
  }

  async scheduleCleanupBlacklistedTokens(): Promise<string> {
    return this.queueManager.scheduleCleanupBlacklistedTokens();
  }

  async getQueueStats(): Promise<Record<string, any>> {
    return this.queueManager.getQueueStats();
  }

  async pauseQueue(queueName: string): Promise<void> {
    return this.queueManager.pauseQueue(queueName);
  }

  async resumeQueue(queueName: string): Promise<void> {
    return this.queueManager.resumeQueue(queueName);
  }

  async close(): Promise<void> {
    return this.queueManager.close();
  }
}

export const bullQueueService = new BullQueueService();
