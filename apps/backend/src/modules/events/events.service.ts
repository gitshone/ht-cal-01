import { google } from 'googleapis';
import { BaseService } from '../../core/base.service';
import { EventsRepository } from './events.repository';
import { GoogleOAuthService } from '../google-oauth/google-oauth.service';
import { prisma } from '../../core/lib/prisma';
import { cacheService } from '../../core/lib/cache.service';
import {
  Event,
  CreateEventDto,
  UpdateEventDto,
  EventFilterParams,
  EventListResponse,
  GoogleCalendarEventData,
} from '@ht-cal-01/shared-types';
import {
  GoogleApiError,
  NoGoogleTokensError,
} from '../../core/errors/http.errors';
import { EVENT_CONSTANTS } from '@ht-cal-01/shared-types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export class EventsService extends BaseService {
  constructor(
    private eventsRepository: EventsRepository,
    private googleOAuthService: GoogleOAuthService
  ) {
    super();
  }
  async syncEventsFromGoogle(
    userId: string
  ): Promise<{ synced: number; created: number; updated: number }> {
    const startTime = Date.now();
    this.logInfo('Starting Google Calendar sync', { userId });

    try {
      const oauth2Client = await this.googleOAuthService.getOAuth2Client(
        userId
      );
      const calendar = google.calendar({
        version: 'v3',
        auth: oauth2Client as any,
      });

      const { start: sixMonthsAgo, end: sixMonthsFromNow } =
        this.getSyncDateRange();

      let synced = 0;
      let created = 0;
      let updated = 0;
      let nextPageToken: string | undefined;
      let pageCount = 0;
      const maxPages = 100;

      const BATCH_SIZE = EVENT_CONSTANTS.BATCH_SIZE;

      do {
        pageCount++;
        if (pageCount > maxPages) {
          this.logWarn('Sync stopped: maximum pages reached', {
            userId,
            pageCount,
          });
          break;
        }

        try {
          const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: sixMonthsAgo.toISOString(),
            timeMax: sixMonthsFromNow.toISOString(),
            maxResults: EVENT_CONSTANTS.GOOGLE_MAX_RESULTS,
            singleEvents: true,
            orderBy: 'startTime',
            pageToken: nextPageToken,
          });

          const events = response.data.items || [];

          for (let i = 0; i < events.length; i += BATCH_SIZE) {
            const batch = events.slice(i, i + BATCH_SIZE);
            try {
              const batchResult = await this.processGoogleEventsBatch(
                batch,
                userId
              );
              synced += batchResult.synced;
              created += batchResult.created;
              updated += batchResult.updated;

              this.logInfo('Batch processed', {
                userId,
                batchIndex: i,
                batchSize: batch.length,
                batchResult,
                totalSynced: synced,
                totalCreated: created,
                totalUpdated: updated,
              });
            } catch (batchError) {
              this.logError('Batch processing failed', batchError as Error, {
                userId,
                batchIndex: i,
              });
            }
          }

          nextPageToken = response.data.nextPageToken || undefined;
        } catch (pageError) {
          this.logError('Failed to fetch events page', pageError as Error, {
            userId,
            pageCount,
          });
          break;
        }
      } while (nextPageToken);

      const duration = Date.now() - startTime;
      this.logInfo(
        `Google Calendar sync completed: synced=${synced}, created=${created}, updated=${updated}`,
        {
          userId,
          synced,
          created,
          updated,
          duration,
          pages: pageCount,
        }
      );

      // Invalidate cache after successful sync
      await cacheService.invalidateEventCache(userId);

      return { synced, created, updated };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logError('Google Calendar sync failed', error as Error, {
        userId,
        duration,
      });

      if (error instanceof Error && error.message.includes('invalid_token')) {
        throw new NoGoogleTokensError();
      }

      throw new GoogleApiError(
        'Failed to sync events from Google Calendar. Please try again.'
      );
    }
  }

  async getEvents(
    userId: string,
    params: EventFilterParams = {}
  ): Promise<EventListResponse> {
    const user = await this.eventsRepository.getUserGoogleTokens(userId);
    if (!user?.googleOauthTokens) {
      throw new NoGoogleTokensError();
    }

    return await this.eventsRepository.findMany(userId, params);
  }

  async createEvent(userId: string, eventData: CreateEventDto): Promise<Event> {
    try {
      const user = await this.eventsRepository.getUserGoogleTokens(userId);
      if (!user?.googleOauthTokens) {
        throw new NoGoogleTokensError();
      }

      const startDate = new Date(eventData.startDate);
      const endDate = new Date(eventData.endDate);
      const userTimezone = dayjs.tz.guess();
      let googleEvent: any = null;

      const oauth2Client = await this.googleOAuthService.getOAuth2Client(
        userId
      );
      const calendar = google.calendar({
        version: 'v3',
        auth: oauth2Client as any,
      });

      googleEvent = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: eventData.title,
          start: eventData.isAllDay
            ? { date: eventData.startDate.split('T')[0] }
            : {
                dateTime: eventData.startDate,
                timeZone: userTimezone,
              },
          end: eventData.isAllDay
            ? { date: eventData.endDate.split('T')[0] }
            : {
                dateTime: eventData.endDate,
                timeZone: userTimezone,
              },
        },
      });

      const event = await this.eventsRepository.create({
        userId,
        title: eventData.title,
        startDate,
        endDate,
        isAllDay: eventData.isAllDay,
        googleId: googleEvent.data.id || undefined,
        googleEventId: googleEvent.data.id || undefined,
        googleHtmlLink: googleEvent.data.htmlLink || undefined,
        googleCalendarId: 'primary',
        status: 'confirmed',
        timezone: googleEvent.data.start?.timeZone || userTimezone,
      });

      // Invalidate cache after successful creation
      await cacheService.invalidateEventCache(userId);

      this.logInfo('Event created successfully', {
        eventId: event.id,
        googleEventId: event.googleId,
        userId,
      });

      return event;
    } catch (error) {
      this.handleServiceError(error as Error, 'createEvent', { userId });
    }
  }

  async updateEvent(
    userId: string,
    eventId: string,
    eventData: UpdateEventDto
  ): Promise<Event> {
    try {
      const user = await this.eventsRepository.getUserGoogleTokens(userId);
      if (!user?.googleOauthTokens) {
        throw new NoGoogleTokensError();
      }

      const event = await this.eventsRepository.findById(eventId, userId);
      if (!event) {
        throw new GoogleApiError('Event not found.');
      }

      const updatedEvent = await this.eventsRepository.update(eventId, {
        ...eventData,
        startDate: eventData.startDate
          ? new Date(eventData.startDate)
          : undefined,
        endDate: eventData.endDate ? new Date(eventData.endDate) : undefined,
      });

      if (event.googleId) {
        try {
          const oauth2Client = await this.googleOAuthService.getOAuth2Client(
            userId
          );
          const calendar = google.calendar({
            version: 'v3',
            auth: oauth2Client as any,
          });

          const updateData: {
            summary: string;
            start: { date?: string; dateTime?: string };
            end: { date?: string; dateTime?: string };
          } = {
            summary: eventData.title || event.title,
            start:
              eventData.isAllDay !== undefined
                ? eventData.isAllDay
                  ? {
                      date: (eventData.startDate || event.startDate)
                        .toString()
                        .split('T')[0],
                    }
                  : {
                      dateTime: (() => {
                        const date = eventData.startDate || event.startDate;
                        return date instanceof Date
                          ? date.toISOString()
                          : String(date);
                      })(),
                    }
                : event.isAllDay
                ? { date: event.startDate.toString().split('T')[0] }
                : { dateTime: event.startDate.toISOString() },
            end:
              eventData.isAllDay !== undefined
                ? eventData.isAllDay
                  ? {
                      date: (eventData.endDate || event.endDate)
                        .toString()
                        .split('T')[0],
                    }
                  : {
                      dateTime: (() => {
                        const date = eventData.endDate || event.endDate;
                        return date instanceof Date
                          ? date.toISOString()
                          : String(date);
                      })(),
                    }
                : event.isAllDay
                ? { date: event.endDate.toString().split('T')[0] }
                : { dateTime: event.endDate.toISOString() },
          };

          await calendar.events.update({
            calendarId: 'primary',
            eventId: event.googleId,
            requestBody: updateData,
          });

          this.logInfo('Google Calendar event updated successfully', {
            eventId,
            googleEventId: event.googleId,
            userId,
          });
        } catch (googleError) {
          this.logError(
            'Failed to update event in Google Calendar',
            googleError as Error,
            {
              eventId,
              googleEventId: event.googleId,
              userId,
            }
          );
        }
      }

      // Invalidate cache after successful update
      await cacheService.invalidateEventCache(userId, eventId);

      this.logInfo('Event updated successfully', {
        eventId,
        userId,
      });

      return updatedEvent;
    } catch (error) {
      this.handleServiceError(error as Error, 'updateEvent', {
        eventId,
        userId,
      });
    }
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    this.logInfo('Attempting to delete event', { userId, eventId });

    await prisma.$transaction(async (tx: any) => {
      const event = await this.eventsRepository.findById(eventId, userId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Try to delete from Google Calendar first
      if (event.googleEventId) {
        try {
          const oauth2Client = await this.googleOAuthService.getOAuth2Client(
            userId
          );
          const calendar = google.calendar({
            version: 'v3',
            auth: oauth2Client as any,
          });

          await calendar.events.delete({
            calendarId: event.googleCalendarId || 'primary',
            eventId: event.googleEventId,
          });

          this.logInfo('Google Calendar event deleted successfully', {
            eventId,
            googleEventId: event.googleEventId,
            userId,
          });
        } catch (googleError) {
          this.logError(
            'Failed to delete event from Google Calendar',
            googleError as Error,
            {
              eventId,
              googleEventId: event.googleEventId,
              userId,
            }
          );
          // Continue with database deletion even if Google Calendar deletion fails
        }
      }

      // Delete from database
      await this.eventsRepository.delete(eventId, tx);
    });

    // Invalidate cache after successful deletion
    await cacheService.invalidateEventCache(userId, eventId);

    this.logInfo('Event deleted successfully', { userId, eventId });
  }

  async clearUserEvents(userId: string): Promise<void> {
    await this.eventsRepository.deleteMany(userId);
  }

  private getSyncDateRange() {
    const now = new Date();
    return {
      start: new Date(
        now.getFullYear(),
        now.getMonth() - EVENT_CONSTANTS.SYNC_MONTHS_BACK,
        now.getDate()
      ),
      end: new Date(
        now.getFullYear(),
        now.getMonth() + EVENT_CONSTANTS.SYNC_MONTHS_FORWARD,
        now.getDate()
      ),
    };
  }

  private convertGoogleEventToEvent(
    googleEvent: GoogleCalendarEventData,
    userId: string
  ): Omit<Event, 'id' | 'createdAt' | 'updatedAt'> & { timezone?: string } {
    const start = googleEvent.start;
    const end = googleEvent.end;

    if (!start) {
      throw new Error('Event must have a start time');
    }

    const isAllDay = !start.dateTime;
    const startDate = start.dateTime || start.date;
    const endDate = end?.dateTime || end?.date || startDate;

    if (!googleEvent.id || !googleEvent.summary || !startDate) {
      throw new Error('Invalid Google Calendar event data');
    }

    return {
      userId,
      googleId: googleEvent.id,
      title: googleEvent.summary,
      startDate: new Date(startDate),
      endDate: new Date(endDate || startDate),
      isAllDay,
      status:
        (googleEvent.status as 'confirmed' | 'tentative' | 'cancelled') ||
        'confirmed',
      googleCalendarId: 'primary',
      googleEventId: googleEvent.id,
      googleHtmlLink: undefined,
      timezone: start.timeZone || end?.timeZone || undefined,
      syncedAt: new Date(),
    };
  }

  private async processGoogleEventsBatch(
    googleEvents: any[],
    userId: string
  ): Promise<{ synced: number; created: number; updated: number }> {
    this.logInfo(
      `Processing Google events batch: ${googleEvents.length} total events`,
      {
        userId,
        totalEvents: googleEvents.length,
      }
    );

    const validEvents = googleEvents.filter(
      event => event.id && event.summary && event.start
    );

    this.logInfo(
      `Valid events after filtering: ${validEvents.length}/${googleEvents.length}`,
      {
        userId,
        validEvents: validEvents.length,
        totalEvents: googleEvents.length,
      }
    );

    if (validEvents.length === 0) {
      return { synced: 0, created: 0, updated: 0 };
    }

    // Get existing events for this batch
    const googleIds = validEvents.map(event => event.id);
    const existingEvents = await this.eventsRepository.findManyByGoogleIds(
      googleIds
    );

    const existingEventMap = new Map(
      existingEvents.map(event => [event.googleId, event])
    );

    const eventsToCreate: Array<{
      userId: string;
      title: string;
      startDate: Date;
      endDate: Date;
      isAllDay: boolean;
      googleId: string;
      googleEventId: string;
      googleHtmlLink?: string;
      googleCalendarId: string;
      status: string;
      timezone?: string;
      syncedAt: Date;
    }> = [];
    const eventsToUpdate: Array<{
      id: string;
      data: Partial<{
        title: string;
        startDate: Date;
        endDate: Date;
        isAllDay: boolean;
        status: string;
        timezone?: string;
        syncedAt: Date;
      }>;
    }> = [];

    for (const googleEvent of validEvents) {
      try {
        const eventData = this.convertGoogleEventToEvent(googleEvent, userId);
        const existingEvent = googleEvent.id
          ? existingEventMap.get(googleEvent.id)
          : undefined;

        if (existingEvent) {
          eventsToUpdate.push({
            id: existingEvent.id,
            data: {
              title: eventData.title,
              startDate: eventData.startDate,
              endDate: eventData.endDate,
              isAllDay: eventData.isAllDay,
              status: eventData.status,
              timezone: eventData.timezone,
              syncedAt: new Date(),
            },
          });
        } else {
          eventsToCreate.push({
            userId: eventData.userId,
            title: eventData.title,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            isAllDay: eventData.isAllDay,
            googleId: eventData.googleId || '',
            googleEventId: eventData.googleEventId || '',
            googleHtmlLink: eventData.googleHtmlLink || undefined,
            googleCalendarId: eventData.googleCalendarId || 'primary',
            status: eventData.status,
            timezone: eventData.timezone,
            syncedAt: new Date(),
          });
        }
      } catch (error) {
        this.logWarn('Failed to convert Google event', {
          googleEventId: googleEvent.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        continue;
      }
    }

    let created = 0;
    let updated = 0;

    this.logInfo(
      `Batch processing summary: ${eventsToCreate.length} to create, ${eventsToUpdate.length} to update`,
      {
        userId,
        eventsToCreate: eventsToCreate.length,
        eventsToUpdate: eventsToUpdate.length,
      }
    );

    if (eventsToCreate.length > 0) {
      const createResult = await this.eventsRepository.createMany(
        eventsToCreate
      );
      created = createResult.count;
      this.logInfo(`Created events: ${created}`, { userId, created });
    }

    if (eventsToUpdate.length > 0) {
      await this.eventsRepository.updateMany(eventsToUpdate);
      updated = eventsToUpdate.length;
      this.logInfo(`Updated events: ${updated}`, { userId, updated });
    }

    const result = {
      synced: validEvents.length,
      created,
      updated,
    };

    this.logInfo(
      `Batch processing completed: synced=${result.synced}, created=${result.created}, updated=${result.updated}`,
      { userId, result }
    );
    return result;
  }
}
