import { BaseService } from '../../core/base.service';
import { calendarRepository } from './calendar.repository';
import { queueService } from '../queue/queue.service';
import { eventsService } from '../events/events.service';
import { EVENT_CONSTANTS } from '@ht-cal-01/shared-types';

export class CalendarService extends BaseService {
  async connectCalendar(
    userId: string,
    googleCode: string
  ): Promise<{ jobId: string }> {
    try {
      const jobId = await queueService.addJob(
        EVENT_CONSTANTS.JOB_TYPES.CONNECT_CALENDAR,
        {
          userId,
          googleCode,
        }
      );

      this.logInfo('Calendar connection job started', { userId, jobId });
      return { jobId };
    } catch (error) {
      this.handleServiceError(error as Error, 'connectCalendar', { userId });
    }
  }

  async disconnectCalendar(userId: string): Promise<void> {
    try {
      // Remove Google OAuth tokens from user
      await calendarRepository.disconnectUser(userId);

      // Clear all events for this user
      await eventsService.clearUserEvents(userId);

      this.logInfo('Calendar disconnected successfully', { userId });
    } catch (error) {
      this.handleServiceError(error as Error, 'disconnectCalendar', { userId });
    }
  }

  async getConnectionStatus(userId: string): Promise<{ connected: boolean }> {
    try {
      const user = await calendarRepository.getUserTokens(userId);
      const connected = !!user?.googleOauthTokens;

      this.logInfo('Calendar connection status retrieved', {
        userId,
        connected,
      });
      return { connected };
    } catch (error) {
      this.handleServiceError(error as Error, 'getConnectionStatus', {
        userId,
      });
    }
  }
}

export const calendarService = new CalendarService();
