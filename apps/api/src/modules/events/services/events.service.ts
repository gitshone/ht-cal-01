import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { EventsRepository } from '../repositories/events.repository';
import {
  CreateEventDto,
  UpdateEventDto,
  EventResponseDto,
  CalendarViewType,
  EventFilterType,
} from '../dtos/event.dto';
import { PaginatedResponseDto } from '../../../shared/dto';
import { ProviderQueueService } from '../../integrations/services/provider-queue.service';

@Injectable()
export class EventsService {
  constructor(
    private eventsRepository: EventsRepository,
    private providerQueueService: ProviderQueueService
  ) {}

  async create(
    userId: string,
    createEventDto: CreateEventDto
  ): Promise<EventResponseDto> {
    try {
      const providerType = createEventDto.providerType || 'google';

      const event = await this.eventsRepository.createWithUserId(userId, {
        ...createEventDto,
        providerType,
      });

      if (providerType !== 'local') {
        await this.queueProviderOperation(
          'create',
          userId,
          providerType,
          event.id,
          undefined,
          createEventDto
        );
      }

      // Add breadcrumb for successful event creation
      Sentry.addBreadcrumb({
        message: 'Event created successfully',
        category: 'event',
        level: 'info',
        data: {
          eventId: event.id,
          userId,
          providerType,
        },
      });

      return event;
    } catch (error) {
      // Capture the error with additional context
      Sentry.captureException(error, {
        tags: {
          operation: 'create_event',
          userId,
          providerType: createEventDto.providerType || 'google',
        },
        extra: {
          eventData: createEventDto,
        },
      });
      throw error;
    }
  }

  async findAll(
    userId: string,
    skip = 0,
    take = 10
  ): Promise<PaginatedResponseDto<EventResponseDto>> {
    const { events, total } = await this.eventsRepository.findByUserId(
      userId,
      skip,
      take
    );
    return new PaginatedResponseDto(events, total, skip, take);
  }

  async getEvents(
    userId: string,
    viewType: CalendarViewType,
    startDate: string,
    endDate: string,
    providerFilter?: EventFilterType,
    searchQuery?: string
  ): Promise<EventResponseDto[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const where: any = {
      userId,
      startDate: {
        lt: end, // Event starts before range ends
      },
      endDate: {
        gt: start, // Event ends after range starts
      },
    };

    if (providerFilter && providerFilter !== EventFilterType.ALL) {
      where.providerType = providerFilter;
    }

    if (searchQuery) {
      where.title = {
        contains: searchQuery,
        mode: 'insensitive',
      };
    }

    return this.eventsRepository.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<EventResponseDto> {
    const event = await this.eventsRepository.findByUserIdAndId(userId, id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EventResponseDto[]> {
    return this.eventsRepository.findByDateRange(userId, startDate, endDate);
  }

  async update(
    id: string,
    userId: string,
    updateEventDto: UpdateEventDto
  ): Promise<EventResponseDto> {
    const existingEvent = await this.findOne(id, userId);

    if (!updateEventDto || typeof updateEventDto !== 'object') {
      throw new BadRequestException('Invalid update data provided');
    }

    const filteredData = Object.keys(updateEventDto).reduce((acc, key) => {
      const value = (updateEventDto as any)[key];
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    if (Object.keys(filteredData).length === 0) {
      throw new BadRequestException('No valid data provided for update');
    }

    const updatedEvent = await this.eventsRepository.update(id, filteredData);

    if (
      existingEvent.externalEventId &&
      existingEvent.providerType !== 'local'
    ) {
      await this.queueProviderOperation(
        'update',
        userId,
        existingEvent.providerType,
        id,
        existingEvent.externalEventId,
        updateEventDto
      );
    }

    return updatedEvent;
  }

  async remove(id: string, userId: string): Promise<EventResponseDto> {
    const existingEvent = await this.findOne(id, userId);

    const deletedEvent = await this.eventsRepository.delete(id);

    if (
      existingEvent.externalEventId &&
      existingEvent.providerType !== 'local'
    ) {
      await this.queueProviderOperation(
        'delete',
        userId,
        existingEvent.providerType,
        id,
        existingEvent.externalEventId
      );
    }

    return deletedEvent;
  }

  async findByExternalId(
    externalEventId: string,
    providerType: string
  ): Promise<EventResponseDto | null> {
    return this.eventsRepository.findByExternalId(
      externalEventId,
      providerType
    );
  }

  async updateSyncTime(id: string): Promise<EventResponseDto> {
    return this.eventsRepository.updateSyncTime(id);
  }

  private async queueProviderOperation(
    operation: 'create' | 'update' | 'delete',
    userId: string,
    providerType: string,
    eventId: string,
    externalEventId?: string,
    eventData?: CreateEventDto | UpdateEventDto
  ): Promise<void> {
    try {
      switch (operation) {
        case 'create':
          await this.providerQueueService.createEventOnProvider(
            userId,
            providerType,
            eventId,
            eventData as CreateEventDto
          );
          break;
        case 'update':
          if (!externalEventId) {
            throw new Error('External event ID not found');
          }
          await this.providerQueueService.updateEventOnProvider(
            userId,
            providerType,
            eventId,
            externalEventId,
            eventData as UpdateEventDto
          );
          break;
        case 'delete':
          if (!externalEventId) {
            throw new Error('External event ID not found');
          }
          await this.providerQueueService.deleteEventOnProvider(
            userId,
            providerType,
            eventId,
            externalEventId
          );
          break;
      }
    } catch (error) {
      console.error(
        `Failed to queue ${operation} operation for provider:`,
        error
      );
    }
  }
}
