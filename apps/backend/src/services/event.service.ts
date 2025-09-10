import { google } from 'googleapis';
import { googleOAuthService } from './googleOAuth.service';
import { prisma } from '../lib/prisma';
import {
  Event,
  CreateEventDto,
  UpdateEventDto,
  EventFilterParams,
  EventListResponse,
  GroupedEvents,
  GoogleCalendarEventData,
} from '@ht-cal-01/shared-types';
import { GoogleApiError, NoGoogleTokensError } from '../errors/http.errors';
import logger from '../utils/winston-logger';
import { EVENT_CONSTANTS } from '../constants/events';
import moment from 'moment';
import 'moment-timezone';
import {
  decodeCursor,
  encodeCursor,
  PaginationCursor,
} from '../utils/pagination';

export class EventService {
  async syncEventsFromGoogle(
    userId: string
  ): Promise<{ synced: number; created: number; updated: number }> {
    const startTime = Date.now();
    logger.info('Starting Google Calendar sync', { userId });

    try {
      const oauth2Client = await googleOAuthService.getOAuth2Client(userId);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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
          logger.warn('Sync stopped: maximum pages reached', {
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
              const batchResult = await this.processEventBatch(batch, userId);
              synced += batchResult.synced;
              created += batchResult.created;
              updated += batchResult.updated;
            } catch (batchError) {
              logger.error('Batch processing failed', {
                userId,
                batchIndex: i,
                error:
                  batchError instanceof Error
                    ? batchError.message
                    : 'Unknown error',
              });
            }
          }

          nextPageToken = response.data.nextPageToken || undefined;
        } catch (pageError) {
          logger.error('Failed to fetch events page', {
            userId,
            pageCount,
            error:
              pageError instanceof Error ? pageError.message : 'Unknown error',
          });
          break;
        }
      } while (nextPageToken);

      const duration = Date.now() - startTime;
      logger.info('Google Calendar sync completed', {
        userId,
        synced,
        created,
        updated,
        duration,
        pages: pageCount,
      });

      return { synced, created, updated };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Google Calendar sync failed', {
        userId,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      if (error instanceof Error && error.message.includes('invalid_token')) {
        throw new NoGoogleTokensError();
      }

      throw new GoogleApiError(
        'Failed to sync events from Google Calendar. Please try again.'
      );
    }
  }

  private async processEventBatch(
    events: GoogleCalendarEventData[],
    userId: string
  ): Promise<{ synced: number; created: number; updated: number }> {
    const validEvents = events.filter(event => event.id && event.summary);

    if (validEvents.length === 0) {
      return { synced: 0, created: 0, updated: 0 };
    }

    const googleIds = validEvents
      .map(event => event.id)
      .filter((id): id is string => id !== null && id !== undefined);

    const existingEvents = await prisma.event.findMany({
      where: {
        googleId: { in: googleIds },
        userId,
      },
      select: { id: true, googleId: true, updatedAt: true },
    });

    const existingEventMap = new Map(
      existingEvents.map(event => [event.googleId, event])
    );

    const eventsToCreate: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const eventsToUpdate: Array<{
      id: string;
      googleId: string;
      data: Partial<Event>;
    }> = [];

    for (const googleEvent of validEvents) {
      try {
        const eventData = this.convertGoogleEventToEvent(googleEvent, userId);
        const existingEvent = existingEventMap.get(googleEvent.id!);

        if (existingEvent) {
          eventsToUpdate.push({
            id: existingEvent.id,
            googleId: existingEvent.googleId!,
            data: {
              ...eventData,
              syncedAt: new Date(),
            },
          });
        } else {
          eventsToCreate.push(eventData);
        }
      } catch (error) {
        logger.warn('Failed to convert Google event', {
          googleEventId: googleEvent.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        continue;
      }
    }
    const result = await prisma.$transaction(async tx => {
      let created = 0;
      let updated = 0;

      if (eventsToCreate.length > 0) {
        const createResult = await tx.event.createMany({
          data: eventsToCreate,
          skipDuplicates: true,
        });
        created = createResult.count;
      }

      if (eventsToUpdate.length > 0) {
        for (const updateItem of eventsToUpdate) {
          await tx.event.update({
            where: { id: updateItem.id },
            data: updateItem.data,
          });
          updated++;
        }
      }

      return { created, updated };
    });

    return {
      synced: validEvents.length,
      created: result.created,
      updated: result.updated,
    };
  }

  async getEvents(
    userId: string,
    params: EventFilterParams = {}
  ): Promise<EventListResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleOauthTokens: true },
    });

    if (!user?.googleOauthTokens) {
      throw new NoGoogleTokensError();
    }

    const {
      startDate,
      endDate,
      dateRange = EVENT_CONSTANTS.DATE_RANGES.ONE_WEEK,
      groupBy,
      limit = EVENT_CONSTANTS.DEFAULT_LIMIT,
      cursor,
    } = params as EventFilterParams & { limit?: number; cursor?: string };

    let start: moment.Moment;
    let end: moment.Moment;
    let actualGroupBy: 'day' | 'week';

    if (startDate && endDate) {
      start = moment(startDate).startOf('day');
      end = moment(endDate).endOf('day');
      const daysDiff = end.diff(start, 'days');
      actualGroupBy = daysDiff >= 30 ? 'week' : groupBy || 'day';
    } else {
      start = moment().startOf('day');
      end = moment().add(parseInt(dateRange), 'days').endOf('day');
      actualGroupBy = parseInt(dateRange) >= 30 ? 'week' : groupBy || 'day';
    }

    let cursorData: PaginationCursor | null = null;
    if (cursor) {
      cursorData = decodeCursor(cursor);
    }

    const whereClause: any = {
      userId,
      startDate: {
        gte: start.toDate(),
        lt: end.toDate(),
      },
      status: 'confirmed',
    };

    if (cursorData) {
      whereClause.AND = [
        {
          OR: [
            {
              startDate: { gt: new Date(cursorData.startDate!) },
            },
            {
              startDate: new Date(cursorData.startDate!),
              id: { gt: cursorData.id! },
            },
          ],
        },
      ];
    }

    const dbEvents = await prisma.event.findMany({
      where: whereClause,
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
      take: limit + 1,
    });

    const hasNextPage = dbEvents.length > limit;
    const events = hasNextPage ? dbEvents.slice(0, limit) : dbEvents;

    const eventsWithDisplayDates = events.map(event => ({
      ...event,
      displayDate: this.formatEventDate(
        event.startDate,
        event.endDate,
        event.isAllDay
      ),
    })) as Event[];

    const groupedEvents = this.groupEvents(
      eventsWithDisplayDates,
      actualGroupBy
    );

    let nextCursor: string | undefined;
    let previousCursor: string | undefined;

    if (hasNextPage && events.length > 0) {
      const lastEvent = events[events.length - 1];
      nextCursor = encodeCursor({
        id: lastEvent.id,
        startDate: lastEvent.startDate.toISOString(),
      });
    }

    if (cursor && events.length > 0) {
      const firstEvent = events[0];
      previousCursor = encodeCursor({
        id: firstEvent.id,
        startDate: firstEvent.startDate.toISOString(),
      });
    }

    return {
      groupedEvents,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      groupBy: actualGroupBy,
      hasNextPage,
      nextCursor,
      hasPreviousPage: !!cursor,
      previousCursor,
    };
  }

  async createEvent(userId: string, eventData: CreateEventDto): Promise<Event> {
    try {
      const oauth2Client = await googleOAuthService.getOAuth2Client(userId);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const userTimezone = moment.tz.guess();

      const googleEvent = await calendar.events.insert({
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

      const event = (await prisma.event.create({
        data: {
          userId,
          title: eventData.title,
          startDate: new Date(eventData.startDate),
          endDate: new Date(eventData.endDate),
          isAllDay: eventData.isAllDay,
          googleId: googleEvent.data.id || undefined,
          googleEventId: googleEvent.data.id || undefined,
          googleHtmlLink: googleEvent.data.htmlLink || undefined,
          googleCalendarId: 'primary',
          status: 'confirmed',
          timezone: googleEvent.data.start?.timeZone || userTimezone,
        },
      })) as Event;

      return event;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw new GoogleApiError('Failed to create event. Please try again.');
    }
  }

  async updateEvent(
    userId: string,
    eventId: string,
    eventData: UpdateEventDto
  ): Promise<Event> {
    try {
      const event = await prisma.event.findFirst({
        where: { id: eventId, userId },
      });

      if (!event) {
        throw new GoogleApiError('Event not found.');
      }

      const updatedEvent = (await prisma.event.update({
        where: { id: eventId },
        data: {
          ...eventData,
          startDate: eventData.startDate
            ? new Date(eventData.startDate)
            : undefined,
          endDate: eventData.endDate ? new Date(eventData.endDate) : undefined,
        },
      })) as Event;

      if (event.googleId) {
        try {
          const oauth2Client = await googleOAuthService.getOAuth2Client(userId);
          const calendar = google.calendar({
            version: 'v3',
            auth: oauth2Client,
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

          if (event.googleId) {
            await calendar.events.update({
              calendarId: 'primary',
              eventId: event.googleId,
              requestBody: updateData,
            });
          }
        } catch (googleError) {
          logger.warn(
            'Failed to update event in Google Calendar:',
            googleError
          );
        }
      }

      return updatedEvent;
    } catch (error) {
      logger.error('Error updating event:', error);
      throw new GoogleApiError('Failed to update event. Please try again.');
    }
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    try {
      const event = await prisma.event.findFirst({
        where: { id: eventId, userId },
      });

      if (!event) {
        throw new GoogleApiError('Event not found.');
      }

      if (event.googleId) {
        try {
          const oauth2Client = await googleOAuthService.getOAuth2Client(userId);
          const calendar = google.calendar({
            version: 'v3',
            auth: oauth2Client,
          });

          await calendar.events.delete({
            calendarId: 'primary',
            eventId: event.googleId,
          });
        } catch (googleError) {
          logger.warn(
            'Failed to delete event from Google Calendar:',
            googleError
          );
        }
      }

      await prisma.event.delete({
        where: { id: eventId },
      });
    } catch (error) {
      logger.error('Error deleting event:', error);
      throw new GoogleApiError('Failed to delete event. Please try again.');
    }
  }

  async clearUserEvents(userId: string): Promise<void> {
    await prisma.event.deleteMany({
      where: { userId },
    });
  }

  private generateWeekKeys(startDate: Date, endDate: Date): string[] {
    const startWeek = moment(startDate).startOf('isoWeek');
    const endWeek = moment(endDate).startOf('isoWeek');

    const weeks: string[] = [];
    for (
      let current = startWeek.clone();
      current.isSameOrBefore(endWeek, 'week');
      current.add(1, 'week')
    ) {
      weeks.push(current.format('YYYY-[W]WW'));
    }

    return weeks;
  }

  private addEventToGroup(
    grouped: GroupedEvents,
    key: string,
    event: Event
  ): GroupedEvents {
    return {
      ...grouped,
      [key]: [...(grouped[key] ?? []), event],
    };
  }

  private groupEvents(events: Event[], groupBy: 'day' | 'week'): GroupedEvents {
    const keyExtractors = {
      day: (event: Event): string[] => [
        moment(event.startDate).format('YYYY-MM-DD'),
      ],
      week: (event: Event): string[] =>
        this.generateWeekKeys(event.startDate, event.endDate),
    };

    const getKeys = keyExtractors[groupBy];

    return events.reduce<GroupedEvents>(
      (grouped, event) =>
        getKeys(event).reduce(
          (acc, key) => this.addEventToGroup(acc, key, event),
          grouped
        ),
      {}
    );
  }

  private formatEventDate(
    startDate: Date,
    endDate: Date,
    isAllDay: boolean
  ): string {
    const start = moment(startDate);
    const end = moment(endDate);
    const isSameDay = start.format('YYYY-MM-DD') === end.format('YYYY-MM-DD');

    if (isAllDay) {
      if (isSameDay) {
        return start.format('MMM D, YYYY');
      }

      if (start.year() === end.year()) {
        return start.month() === end.month()
          ? `${start.format('MMM D')}-${end.format('D, YYYY')}`
          : `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
      }

      return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
    }

    return isSameDay
      ? `${start.format('MMM D, YYYY')} at ${start.format(
          'h:mm A'
        )} - ${end.format('h:mm A')}`
      : `${start.format('MMM D, YYYY h:mm A')} - ${end.format(
          'MMM D, YYYY h:mm A'
        )}`;
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
}

export const eventService = new EventService();
