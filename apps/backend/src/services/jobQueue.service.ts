// In memory queue, can be replaced with redis or bull.
import logger from '../utils/winston-logger';

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
}

export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

class JobQueueService {
  private jobs: Map<string, Job> = new Map();
  private processing = false;

  async addJob(type: string, data: Record<string, unknown>): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const job: Job = {
      id: jobId,
      type,
      data,
      status: 'pending',
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);

    logger.jobqueue('Job added to queue', {
      jobId,
      type,
      userId: data.userId,
      queueSize: this.jobs.size,
    });

    // Emit started event for relevant jobs
    if (
      (type === 'sync_events' || type === 'connect_calendar') &&
      data.userId
    ) {
      const { webSocketService } = await import('./websocket.service');

      // Send different start event types based on job type
      const startEventType =
        type === 'connect_calendar'
          ? 'calendar_connection_started'
          : 'sync_started';

      webSocketService.sendSyncUpdate({
        type: startEventType as 'sync_started' | 'calendar_connection_started',
        userId: data.userId as string,
        jobId,
        message:
          type === 'connect_calendar'
            ? 'Calendar connection started'
            : 'Sync job started',
      });
    }

    // Start processing if not already running
    if (!this.processing) {
      this.processJobs();
    }

    return jobId;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Process jobs in the queue
   */
  private async processJobs(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    while (true) {
      const pendingJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'pending')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      if (pendingJobs.length === 0) {
        this.processing = false;
        break;
      }

      const job = pendingJobs[0];
      await this.processJob(job);
    }
  }

  private async processJob(job: Job): Promise<void> {
    const startTime = Date.now();

    try {
      // Update job status
      job.status = 'processing';
      job.startedAt = new Date();
      this.jobs.set(job.id, job);

      logger.jobqueue('Processing job', {
        jobId: job.id,
        type: job.type,
        userId: job.data.userId,
      });

      // Execute job based on type
      let result: JobResult;

      switch (job.type) {
        case 'sync_events':
          result = await this.processSyncEventsJob(
            job.data as { userId: string }
          );
          break;
        case 'connect_calendar':
          result = await this.processConnectCalendarJob(
            job.data as { userId: string; googleCode: string }
          );
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Update job with result
      job.status = result.success ? 'completed' : 'failed';
      job.completedAt = new Date();
      job.result = result.data;
      job.error = result.error;
      this.jobs.set(job.id, job);

      const duration = Date.now() - startTime;

      logger.jobqueue('Job completed', {
        jobId: job.id,
        type: job.type,
        status: job.status,
        duration: `${duration}ms`,
        userId: job.data.userId,
        result: result.success ? 'success' : 'failed',
      });

      // Emit completion event for relevant jobs
      if (
        (job.type === 'sync_events' || job.type === 'connect_calendar') &&
        job.data.userId
      ) {
        const { webSocketService } = await import('./websocket.service');

        // Send different event types based on job type
        const eventType = result.success
          ? job.type === 'connect_calendar'
            ? 'calendar_connected'
            : 'sync_completed'
          : job.type === 'connect_calendar'
          ? 'calendar_connection_failed'
          : 'sync_failed';

        webSocketService.sendSyncUpdate({
          type: eventType as
            | 'sync_completed'
            | 'sync_failed'
            | 'calendar_connected'
            | 'calendar_connection_failed',
          userId: job.data.userId as string,
          jobId: job.id,
          data: result.data,
          message: result.success
            ? job.type === 'connect_calendar'
              ? `Calendar connected: ${result.data?.synced || 0} events synced`
              : `Sync completed: ${result.data?.synced || 0} events processed`
            : job.type === 'connect_calendar'
            ? `Calendar connection failed: ${result.error}`
            : `Sync failed: ${result.error}`,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.jobqueue('Job failed', {
        jobId: job.id,
        type: job.type,
        duration: `${duration}ms`,
        userId: job.data.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.jobs.set(job.id, job);
    }
  }

  /**
   * Process sync events job
   */
  private async processSyncEventsJob(data: {
    userId: string;
  }): Promise<JobResult> {
    try {
      const { eventService } = await import('./event.service');

      const result = await eventService.syncEventsFromGoogle(data.userId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process connect calendar job
   */
  private async processConnectCalendarJob(data: {
    userId: string;
    googleCode: string;
  }): Promise<JobResult> {
    try {
      const { googleOAuthService } = await import('./googleOAuth.service');
      const { eventService } = await import('./event.service');

      // Exchange code for tokens and store them
      await googleOAuthService.exchangeCodeForTokens(
        data.userId,
        data.googleCode
      );

      // Automatically sync events after connecting
      const syncResult = await eventService.syncEventsFromGoogle(data.userId);

      return {
        success: true,
        data: {
          connected: true,
          synced: syncResult.synced,
          created: syncResult.created,
          updated: syncResult.updated,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clean up old completed jobs (keep last 100)
   */
  cleanupOldJobs(): void {
    const completedJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'completed' || job.status === 'failed')
      .sort(
        (a, b) =>
          (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
      );

    if (completedJobs.length > 100) {
      const jobsToRemove = completedJobs.slice(100);
      jobsToRemove.forEach(job => this.jobs.delete(job.id));

      logger.jobqueue('Cleaned up old jobs', {
        removedCount: jobsToRemove.length,
        remainingCount: this.jobs.size,
      });
    }
  }
}

export const jobQueueService = new JobQueueService();

// Clean up old jobs every 5 minutes
setInterval(() => {
  jobQueueService.cleanupOldJobs();
}, 5 * 60 * 1000);
