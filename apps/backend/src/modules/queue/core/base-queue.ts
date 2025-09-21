import Queue from 'bull';
import { BaseService } from '../../../core/base.service';
import { SocketsService } from '../../sockets/sockets.service';

export interface JobData {
  userId?: string;
  [key: string]: unknown;
}

export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export abstract class BaseQueue extends BaseService {
  protected queue: Queue.Queue;
  protected queueName: string;

  constructor(
    queueName: string,
    redisConfig: Queue.QueueOptions['redis'],
    private socketsService: SocketsService,
    customJobOptions?: Queue.QueueOptions['defaultJobOptions']
  ) {
    super();
    this.queueName = queueName;
    this.queue = new Queue(queueName, {
      redis: redisConfig,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        ...customJobOptions,
      },
    });

    this.setupQueueEventListeners();
    this.setupProcessor();
  }

  private setupQueueEventListeners(): void {
    this.queue.on('completed', job => {
      this.logInfo(`${this.queueName} job completed`, {
        jobId: job.id,
        userId: job.data.userId,
        duration: Date.now() - job.timestamp,
      });

      this.onJobCompleted(job);
    });

    this.queue.on('failed', (job, error) => {
      this.logError(`${this.queueName} job failed`, error, {
        jobId: job.id,
        userId: job.data.userId,
        attempts: job.attemptsMade,
      });

      this.onJobFailed(job, error);
    });

    this.queue.on('stalled', job => {
      this.logWarn(`${this.queueName} job stalled`, {
        jobId: job.id,
        userId: job.data.userId,
      });
    });
  }

  private setupProcessor(): void {
    this.queue.process(this.queueName, async job => {
      this.logInfo(`Processing ${this.queueName} job`, {
        jobId: job.id,
        userId: job.data.userId,
      });

      this.onJobStarted(job);
      const result = await this.processJob(job.data);
      return result;
    });
  }

  async addJob(data: JobData): Promise<string> {
    const job = await this.queue.add(this.queueName, data, {
      jobId: `${this.queueName}_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    });

    this.logInfo(`Job added to ${this.queueName} queue`, {
      jobId: job.id,
      userId: data.userId,
    });

    return job.id?.toString() || '';
  }

  async getJob(jobId: string): Promise<any> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) return null;

      return {
        id: job.id,
        type: this.queueName,
        data: job.data,
        status: await this.getJobStatus(job),
        createdAt: new Date(job.timestamp),
        startedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
        error: job.failedReason,
        result: job.returnvalue,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      };
    } catch (error) {
      this.logError(`Failed to get job ${jobId}`, error as Error);
      return null;
    }
  }

  async getJobCounts(): Promise<Queue.JobCounts> {
    return this.queue.getJobCounts();
  }

  async pause(): Promise<void> {
    await this.queue.pause();
    this.logInfo(`${this.queueName} queue paused`);
  }

  async resume(): Promise<void> {
    await this.queue.resume();
    this.logInfo(`${this.queueName} queue resumed`);
  }

  async close(): Promise<void> {
    await this.queue.close();
    this.logInfo(`${this.queueName} queue closed`);
  }

  private async getJobStatus(job: Queue.Job): Promise<string> {
    const state = await job.getState();
    switch (state) {
      case 'waiting':
        return 'pending';
      case 'active':
        return 'processing';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'delayed':
        return 'pending';
      case 'paused':
        return 'pending';
      default:
        return 'unknown';
    }
  }

  // Abstract methods to be implemented by subclasses
  protected abstract processJob(data: JobData): Promise<JobResult>;

  // Optional hooks for subclasses to override
  protected onJobStarted(job: Queue.Job): void {
    this.logInfo(`Job started: ${job.id}`, {
      jobId: job.id,
      jobName: this.queueName,
    });
  }

  protected onJobCompleted(job: Queue.Job): void {
    this.logInfo(`Job completed: ${job.id}`, {
      jobId: job.id,
      jobName: this.queueName,
    });
  }

  protected onJobFailed(_job: Queue.Job, _error: Error): void {
    // Default implementation - can be overridden by subclasses
  }

  protected sendWebSocketUpdate(
    type: string,
    userId: string,
    jobId: string,
    data?: any,
    message?: string
  ): void {
    if (userId) {
      this.socketsService.sendSyncUpdate({
        type: type as any,
        userId,
        jobId,
        data,
        message,
      });
    }
  }
}
