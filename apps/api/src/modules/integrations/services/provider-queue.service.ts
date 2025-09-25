import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CreateEventDto, UpdateEventDto } from '../../events/dtos/event.dto';

export interface ProviderJobData {
  userId: string;
  providerType: string;
  eventId?: string;
  externalEventId?: string;
  eventData?: CreateEventDto | UpdateEventDto;
}

export interface ProviderJobOptions {
  attempts?: number;
  delay?: number;
  priority?: number;
}

@Injectable()
export class ProviderQueueService {
  constructor(@InjectQueue('provider') private providerQueue: Queue) {}

  async createEventOnProvider(
    userId: string,
    providerType: string,
    eventId: string,
    eventData: CreateEventDto,
    options?: ProviderJobOptions
  ): Promise<string> {
    const job = await this.providerQueue.add(
      'create-event',
      {
        userId,
        providerType,
        eventId,
        eventData,
      } as ProviderJobData,
      {
        attempts: options?.attempts || 3,
        delay: options?.delay || 0,
        priority: options?.priority || 0,
        removeOnComplete: 50,
        removeOnFail: 20,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    return job.id.toString();
  }

  async updateEventOnProvider(
    userId: string,
    providerType: string,
    eventId: string,
    externalEventId: string,
    eventData: UpdateEventDto,
    options?: ProviderJobOptions
  ): Promise<string> {
    const job = await this.providerQueue.add(
      'update-event',
      {
        userId,
        providerType,
        eventId,
        externalEventId,
        eventData,
      } as ProviderJobData,
      {
        attempts: options?.attempts || 3,
        delay: options?.delay || 0,
        priority: options?.priority || 0,
        removeOnComplete: 50,
        removeOnFail: 20,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    return job.id.toString();
  }

  async deleteEventOnProvider(
    userId: string,
    providerType: string,
    eventId: string,
    externalEventId: string,
    options?: ProviderJobOptions
  ): Promise<string> {
    const job = await this.providerQueue.add(
      'delete-event',
      {
        userId,
        providerType,
        eventId,
        externalEventId,
      } as ProviderJobData,
      {
        attempts: options?.attempts || 3,
        delay: options?.delay || 0,
        priority: options?.priority || 0,
        removeOnComplete: 50,
        removeOnFail: 20,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );

    return job.id.toString();
  }

  async syncCalendarOnProvider(
    userId: string,
    providerType: string,
    options?: ProviderJobOptions
  ): Promise<string> {
    const job = await this.providerQueue.add(
      'sync-calendar',
      {
        userId,
        providerType,
      } as ProviderJobData,
      {
        attempts: options?.attempts || 5,
        delay: options?.delay || 0,
        priority: options?.priority || 1, // Higher priority for sync operations
        removeOnComplete: 20,
        removeOnFail: 10,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    return job.id.toString();
  }
}
