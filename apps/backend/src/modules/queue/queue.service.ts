import { BaseService } from '../../core/base.service';
import { bullQueueService } from './bull-queue.service';

export interface Job {
  id: string;
  type: string;
  data: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: Record<string, unknown>;
  attempts?: number;
  maxAttempts?: number;
}

export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export class QueueService extends BaseService {
  async addJob(type: string, data: Record<string, unknown>): Promise<string> {
    return bullQueueService.addJob(type, data);
  }

  async getJob(jobId: string): Promise<Job | null> {
    return bullQueueService.getJob(jobId);
  }

  async scheduleCleanupBlacklistedTokens(): Promise<string> {
    return bullQueueService.scheduleCleanupBlacklistedTokens();
  }

  async getQueueStats(): Promise<Record<string, any>> {
    return bullQueueService.getQueueStats();
  }

  async pauseQueue(queueName: string): Promise<void> {
    return bullQueueService.pauseQueue(queueName);
  }

  async resumeQueue(queueName: string): Promise<void> {
    return bullQueueService.resumeQueue(queueName);
  }
}

export const queueService = new QueueService();
