import { google } from 'googleapis';
import {
  CalendarEvent,
  CalendarListParams,
  CalendarListResponse,
  GoogleCalendarEventData,
} from '@ht-cal-01/shared-types';
import { googleOAuthService } from './googleOAuth.service';
import { CalendarError } from '../errors/calendar.errors';

export class CalendarService {
  async getEvents(
    userId: string,
    params: CalendarListParams = {}
  ): Promise<CalendarListResponse> {
    try {
      const oauth2Client = await googleOAuthService.getOAuth2Client(userId);

      const calendar = google.calendar({
        version: 'v3',
        auth: oauth2Client,
      });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: params.timeMin || new Date().toISOString(),
        timeMax: params.timeMax,
        maxResults: params.maxResults || 100,
        singleEvents: params.singleEvents !== false,
        orderBy: params.orderBy || 'startTime',
        pageToken: params.pageToken,
        syncToken: params.syncToken,
      });

      const events: CalendarEvent[] = (response.data.items || [])
        .filter(event => event.status !== 'cancelled')
        .map(event => this.convertToSimplifiedEvent(event))
        .filter(event => event !== null) as CalendarEvent[];

      return {
        events,
        nextPageToken: response.data.nextPageToken || undefined,
        nextSyncToken: response.data.nextSyncToken || undefined,
      };
    } catch (error) {
      console.error('Error fetching calendar events:', error);

      // If it's already a CalendarError, re-throw it
      if (error instanceof CalendarError) {
        throw error;
      }

      // Handle Google API specific errors
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // Check for authentication errors
        if (
          errorMessage.includes('invalid_grant') ||
          errorMessage.includes('invalid_token') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('access_denied')
        ) {
          throw CalendarError.googleAuthExpired();
        }

        // Check for quota/rate limit errors
        if (
          errorMessage.includes('quota') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('too many requests')
        ) {
          throw CalendarError.googleQuotaExceeded();
        }

        // Check for calendar access denied
        if (
          errorMessage.includes('forbidden') ||
          errorMessage.includes('insufficient permission')
        ) {
          throw CalendarError.calendarAccessDenied();
        }

        // Generic Google API error
        if (
          errorMessage.includes('google') ||
          errorMessage.includes('calendar') ||
          errorMessage.includes('oauth')
        ) {
          throw CalendarError.googleApiError(error.message);
        }
      }

      // Unknown error
      throw CalendarError.unknownError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  private convertToSimplifiedEvent(
    event: GoogleCalendarEventData
  ): CalendarEvent | null {
    if (!event.id || !event.summary) return null;

    const start = event.start;
    const end = event.end;

    if (!start) return null;

    const isAllDay = !start.dateTime && !!start.date;

    let date: string;
    let startTime: string;
    let endTime: string;

    if (isAllDay) {
      date = start.date || new Date().toISOString().split('T')[0];
      startTime = '00:00:00';
      endTime = '23:59:59';
    } else {
      const startDateTime = start.dateTime
        ? new Date(start.dateTime)
        : new Date();
      const endDateTime = end?.dateTime
        ? new Date(end.dateTime)
        : new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour

      date = startDateTime.toISOString().split('T')[0];
      startTime = startDateTime.toTimeString().split(' ')[0];
      endTime = endDateTime.toTimeString().split(' ')[0];
    }

    return {
      id: event.id,
      name: event.summary,
      date,
      startTime,
      endTime,
      isAllDay,
    };
  }
}
