import { BaseRepository } from '../../core/base.repository';
import {
  Event,
  EventFilterParams,
  EventListResponse,
  GroupedEvents,
} from '@ht-cal-01/shared-types';
import {
  decodeCursor,
  encodeCursor,
  PaginationCursor,
} from '../../utils/pagination';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { cacheService } from '../../core/lib/cache';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
import { EVENT_CONSTANTS } from '@ht-cal-01/shared-types';

export class EventsRepository extends BaseRepository {
  async findMany(
    userId: string,
    params: EventFilterParams & { limit?: number; cursor?: string }
  ): Promise<EventListResponse> {
    const cacheKey = {
      type: 'events',
      userId,
      params: {
        ...params,
        cursor: undefined,
      },
    };

    // Try to get from cache first
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      this.logInfo('Events cache hit', { userId, params });
      return cachedResult as EventListResponse;
    }

    this.logInfo('Events cache miss, fetching from database', {
      userId,
      params,
    });

    const result = await this.executeQuery(
      'findMany',
      'event',
      async () => {
        const {
          startDate,
          endDate,
          dateRange = EVENT_CONSTANTS.DATE_RANGES.ONE_WEEK,
          groupBy,
          limit = EVENT_CONSTANTS.DEFAULT_LIMIT,
          cursor,
        } = params;

        let start: dayjs.Dayjs;
        let end: dayjs.Dayjs;
        let actualGroupBy: 'day' | 'week';

        if (startDate && endDate) {
          start = dayjs(startDate).startOf('day');
          end = dayjs(endDate).endOf('day');
          const daysDiff = end.diff(start, 'days');
          actualGroupBy = daysDiff >= 30 ? 'week' : groupBy || 'day';
        } else {
          start = dayjs().startOf('day');
          end = dayjs().add(parseInt(dateRange), 'days').endOf('day');
          actualGroupBy = parseInt(dateRange) >= 30 ? 'week' : groupBy || 'day';
        }

        let cursorData: PaginationCursor | null = null;
        if (cursor) {
          cursorData = decodeCursor(cursor);
        }

        const whereClause: {
          userId: string;
          startDate: { gte: Date; lt: Date };
          status: string;
          AND?: Array<{
            OR: Array<{
              startDate: { gt: Date } | Date;
              id?: { gt: string };
            }>;
          }>;
        } = {
          userId,
          startDate: {
            gte: start.toDate(),
            lt: end.toDate(),
          },
          status: 'confirmed',
        };

        if (cursorData && cursorData.startDate && cursorData.id) {
          whereClause.AND = [
            {
              OR: [
                {
                  startDate: { gt: new Date(cursorData.startDate) },
                },
                {
                  startDate: new Date(cursorData.startDate),
                  id: { gt: cursorData.id },
                },
              ],
            },
          ];
        }

        const dbEvents = await this.prisma.event.findMany({
          where: whereClause,
          orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
          take: limit + 1,
        });

        const hasNextPage = dbEvents.length > limit;
        const events = hasNextPage ? dbEvents.slice(0, limit) : dbEvents;

        const eventsWithDisplayDates = events.map((event: any) => ({
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
      },
      { userId, ...params }
    );

    await cacheService.set(cacheKey, result, { ttl: 300 });
    this.logInfo('Events cached', { userId, params });

    return result;
  }

  async findById(eventId: string, userId: string): Promise<Event | null> {
    return this.executeQuery(
      'findFirst',
      'event',
      () =>
        this.prisma.event.findFirst({
          where: { id: eventId, userId },
        }),
      { eventId, userId }
    ) as Promise<Event | null>;
  }

  async create(eventData: {
    userId: string;
    title: string;
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    googleId?: string;
    googleEventId?: string;
    googleHtmlLink?: string;
    googleCalendarId: string;
    status: string;
    timezone?: string;
  }): Promise<Event> {
    const result = (await this.executeQuery(
      'create',
      'event',
      () =>
        this.prisma.event.create({
          data: eventData,
        }),
      { userId: eventData.userId, title: eventData.title }
    )) as Event;

    await cacheService.invalidateEventCache(eventData.userId);
    this.logInfo('Event cache invalidated after create', {
      userId: eventData.userId,
    });

    return result;
  }

  async update(
    eventId: string,
    eventData: Partial<{
      title: string;
      startDate: Date;
      endDate: Date;
      isAllDay: boolean;
      status: string;
      timezone: string;
    }>
  ): Promise<Event> {
    const result = (await this.executeQuery(
      'update',
      'event',
      () =>
        this.prisma.event.update({
          where: { id: eventId },
          data: eventData,
        }),
      { eventId }
    )) as Event;

    await cacheService.invalidateEventCache(result.userId, eventId);
    this.logInfo('Event cache invalidated after update', {
      userId: result.userId,
      eventId,
    });

    return result;
  }

  async delete(eventId: string, transactionClient?: any): Promise<void> {
    const client = transactionClient || this.prisma;

    const event = (await this.executeQuery(
      'findUnique',
      'event',
      () =>
        client.event.findUnique({
          where: { id: eventId },
          select: { id: true, userId: true },
        }),
      { eventId }
    )) as { id: string; userId: string } | null;

    if (!event) {
      throw new Error('Event not found');
    }

    await this.executeQuery(
      'delete',
      'event',
      () =>
        client.event.delete({
          where: { id: eventId },
        }),
      { eventId }
    );

    // Cache invalidation handled by service layer
  }

  async deleteMany(userId: string): Promise<void> {
    await this.executeQuery(
      'deleteMany',
      'event',
      () =>
        this.prisma.event.deleteMany({
          where: { userId },
        }),
      { userId }
    );

    await cacheService.invalidateEventCache(userId);
    this.logInfo('Event cache invalidated after deleteMany', { userId });
  }

  async createMany(
    events: Array<{
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
    }>
  ): Promise<{ count: number }> {
    const result = await this.executeQuery(
      'createMany',
      'event',
      () =>
        this.prisma.event.createMany({
          data: events,
          skipDuplicates: true,
        }),
      { count: events.length }
    );

    const userIds = [...new Set(events.map((event: any) => event.userId))];
    for (const userId of userIds) {
      await cacheService.invalidateEventCache(userId as string);
    }
    this.logInfo('Event cache invalidated after createMany', { userIds });

    return result as { count: number };
  }

  async updateMany(
    updates: Array<{
      id: string;
      data: Partial<{
        title: string;
        startDate: Date;
        endDate: Date;
        isAllDay: boolean;
        status: string;
        timezone: string;
        syncedAt: Date;
      }>;
    }>
  ): Promise<void> {
    const eventIds = updates.map(update => update.id);
    const events = await this.prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, userId: true },
    });

    await this.executeQuery(
      'updateMany',
      'event',
      () =>
        this.prisma.$transaction(
          updates.map(update =>
            this.prisma.event.update({
              where: { id: update.id },
              data: update.data,
            })
          )
        ),
      { count: updates.length }
    );

    const userIds = [...new Set(events.map((event: any) => event.userId))];
    for (const userId of userIds) {
      await cacheService.invalidateEventCache(userId as string);
    }
    this.logInfo('Event cache invalidated after updateMany', { userIds });
  }

  async findManyByGoogleIds(googleIds: string[]): Promise<Event[]> {
    return this.executeQuery(
      'findMany',
      'event',
      () =>
        this.prisma.event.findMany({
          where: {
            googleId: {
              in: googleIds,
            },
          },
        }),
      { googleIdsCount: googleIds.length }
    ) as Promise<Event[]>;
  }

  async getUserGoogleTokens(
    userId: string
  ): Promise<{ googleOauthTokens: any } | null> {
    return this.executeQuery(
      'findUnique',
      'user',
      () =>
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { googleOauthTokens: true },
        }),
      { userId }
    );
  }

  async countEventsInRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    return this.executeQuery(
      'count',
      'event',
      () =>
        this.prisma.event.count({
          where: {
            userId,
            startDate: {
              gte: startDate,
              lte: endDate,
            },
            status: 'confirmed',
          },
        }),
      { userId, startDate, endDate }
    );
  }

  private formatEventDate(
    startDate: Date,
    endDate: Date,
    isAllDay: boolean
  ): string {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
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

  private generateWeekKeys(startDate: Date, endDate: Date): string[] {
    const startWeek = dayjs(startDate).startOf('isoWeek');
    const endWeek = dayjs(endDate).startOf('isoWeek');

    const weeks: string[] = [];
    for (
      let current = startWeek.clone();
      current.isSameOrBefore(endWeek, 'week');
      current = current.add(1, 'week')
    ) {
      weeks.push(
        current.format('YYYY') +
          '-W' +
          current.isoWeek().toString().padStart(2, '0')
      );
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
        dayjs(event.startDate).format('YYYY-MM-DD'),
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
}
