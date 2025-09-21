import { BaseQueue, JobData, JobResult } from '../core/base-queue';
import { WEBSOCKET_EVENTS } from '@ht-cal-01/shared-types';
import { GoogleOAuthService } from '../../google-oauth/google-oauth.service';
import { EventsService } from '../../events/events.service';
import { SocketsService } from '../../sockets/sockets.service';

export interface CalendarJobData extends JobData {
  googleCode: string;
}

export class CalendarQueue extends BaseQueue {
  constructor(
    redisConfig: any,
    socketsService: SocketsService,
    private googleOAuthService: GoogleOAuthService,
    private eventsService: EventsService
  ) {
    super('connect-calendar', redisConfig, socketsService);
  }

  protected async processJob(data: JobData): Promise<JobResult> {
    try {
      if (!data.userId || !(data as CalendarJobData).googleCode) {
        throw new Error(
          'User ID and Google code are required for connect calendar job'
        );
      }

      const calendarData = data as CalendarJobData;

      await this.googleOAuthService.exchangeCodeForTokens(
        calendarData.userId!,
        calendarData.googleCode
      );

      const syncResult = await this.eventsService.syncEventsFromGoogle(
        calendarData.userId!
      );

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

  protected override onJobStarted(job: any): void {
    this.sendWebSocketUpdate(
      WEBSOCKET_EVENTS.CALENDAR_CONNECTION_STARTED,
      job.data.userId,
      job.id?.toString() || '',
      undefined,
      'Calendar connection started'
    );
  }

  protected override onJobCompleted(job: any): void {
    const result = job.returnvalue?.data || {};
    const synced = result.synced || 0;
    const created = result.created || 0;
    const updated = result.updated || 0;

    this.sendWebSocketUpdate(
      WEBSOCKET_EVENTS.CALENDAR_CONNECTED,
      job.data.userId,
      job.id?.toString() || '',
      result,
      `Calendar connected: ${synced} events synced (${created} new, ${updated} updated)`
    );
  }

  protected override onJobFailed(job: any, error: Error): void {
    this.sendWebSocketUpdate(
      WEBSOCKET_EVENTS.CALENDAR_CONNECTION_FAILED,
      job.data.userId,
      job.id?.toString() || '',
      undefined,
      `Calendar connection failed: ${error.message}`
    );
  }
}
