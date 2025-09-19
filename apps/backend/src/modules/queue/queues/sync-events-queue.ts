import { BaseQueue, JobData, JobResult } from '../core/base-queue';
import { eventsService } from '../../events/events.service';
import { WEBSOCKET_EVENTS } from '@ht-cal-01/shared-types';

export class SyncEventsQueue extends BaseQueue {
  constructor(redisConfig: any) {
    super('sync-events', redisConfig);
  }

  protected async processJob(data: JobData): Promise<JobResult> {
    try {
      if (!data.userId) {
        throw new Error('User ID is required for sync events job');
      }

      const result = await eventsService.syncEventsFromGoogle(
        data.userId as string
      );
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

  protected override onJobStarted(job: any): void {
    this.sendWebSocketUpdate(
      WEBSOCKET_EVENTS.SYNC_STARTED,
      job.data.userId,
      job.id?.toString() || '',
      undefined,
      'Sync job started'
    );
  }

  protected override onJobCompleted(job: any): void {
    const result = job.returnvalue?.data || {};
    const synced = result.synced || 0;
    const created = result.created || 0;
    const updated = result.updated || 0;

    this.sendWebSocketUpdate(
      WEBSOCKET_EVENTS.SYNC_COMPLETED,
      job.data.userId,
      job.id?.toString() || '',
      result,
      `Sync completed: ${synced} events processed (${created} new, ${updated} updated)`
    );
  }

  protected override onJobFailed(job: any, error: Error): void {
    this.sendWebSocketUpdate(
      WEBSOCKET_EVENTS.SYNC_FAILED,
      job.data.userId,
      job.id?.toString() || '',
      undefined,
      `Sync failed: ${error.message}`
    );
  }
}
