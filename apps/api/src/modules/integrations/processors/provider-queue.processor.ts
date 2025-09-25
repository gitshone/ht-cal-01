import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { IntegrationsService } from '../services/integrations.service';
import { EventsRepository } from '../../events/repositories/events.repository';
import { ProviderJobData } from '../services/provider-queue.service';
import { CreateEventDto, UpdateEventDto } from '../../events/dtos/event.dto';

@Processor('provider')
export class ProviderQueueProcessor {
  private readonly logger = new Logger(ProviderQueueProcessor.name);

  constructor(
    private integrationsService: IntegrationsService,
    private eventsRepository: EventsRepository
  ) {}

  @Process('create-event')
  async handleCreateEvent(job: Job<ProviderJobData>) {
    const { userId, providerType, eventId, eventData } = job.data;

    try {
      this.logger.log(
        `Creating event on ${providerType} for user ${userId}, event ${eventId}`
      );

      const externalEvent =
        await this.integrationsService.createEventWithProvider(
          userId,
          providerType,
          eventData! as CreateEventDto
        );

      // Update the local event with the external event ID
      await this.eventsRepository.update(eventId!, {
        externalEventId: externalEvent.externalEventId,
        syncedAt: new Date(),
      } as any);

      this.logger.log(
        `Successfully created event on ${providerType} for user ${userId}, event ${eventId}`
      );

      return {
        success: true,
        externalEventId: externalEvent.externalEventId,
        providerType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create event on ${providerType} for user ${userId}, event ${eventId}:`,
        error
      );

      // Update the local event to mark sync failure
      await this.eventsRepository.update(eventId!, {
        syncedAt: null, // Mark as not synced
      } as any);

      throw error;
    }
  }

  @Process('update-event')
  async handleUpdateEvent(job: Job<ProviderJobData>) {
    const { userId, providerType, eventId, externalEventId, eventData } =
      job.data;

    try {
      this.logger.log(
        `Updating event on ${providerType} for user ${userId}, event ${eventId}`
      );

      const externalEvent =
        await this.integrationsService.updateEventWithProvider(
          userId,
          providerType,
          externalEventId!,
          eventData! as UpdateEventDto
        );

      // Update the local event sync time
      await this.eventsRepository.update(eventId!, {
        syncedAt: new Date(),
      } as any);

      this.logger.log(
        `Successfully updated event on ${providerType} for user ${userId}, event ${eventId}`
      );

      return {
        success: true,
        externalEventId: externalEvent.externalEventId,
        providerType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update event on ${providerType} for user ${userId}, event ${eventId}:`,
        error
      );

      // Update the local event to mark sync failure
      await this.eventsRepository.update(eventId!, {
        syncedAt: null, // Mark as not synced
      } as any);

      throw error;
    }
  }

  @Process('delete-event')
  async handleDeleteEvent(job: Job<ProviderJobData>) {
    const { userId, providerType, eventId, externalEventId } = job.data;

    try {
      this.logger.log(
        `Deleting event on ${providerType} for user ${userId}, event ${eventId}`
      );

      await this.integrationsService.deleteEventWithProvider(
        userId,
        providerType,
        externalEventId!
      );

      this.logger.log(
        `Successfully deleted event on ${providerType} for user ${userId}, event ${eventId}`
      );

      return {
        success: true,
        providerType,
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete event on ${providerType} for user ${userId}, event ${eventId}:`,
        error
      );
      throw error;
    }
  }

  @Process('sync-calendar')
  async handleSyncCalendar(job: Job<ProviderJobData>) {
    const { userId, providerType } = job.data;

    try {
      this.logger.log(
        `Syncing calendar for user ${userId} with ${providerType}`
      );

      await this.integrationsService.syncCalendar(userId, providerType);

      this.logger.log(
        `Successfully synced calendar for user ${userId} with ${providerType}`
      );

      return {
        success: true,
        providerType,
        syncedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to sync calendar for user ${userId} with ${providerType}:`,
        error
      );
      throw error;
    }
  }
}
