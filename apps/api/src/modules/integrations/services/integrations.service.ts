import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProviderRegistry } from '../providers/provider-registry';
import { UserIntegrationsRepository } from '../repositories/user-integrations.repository';
import {
  GoogleCalendarProvider,
  ExternalEvent,
} from '../providers/google-calendar.provider';
import {
  ConnectProviderDto,
  ProviderStatusDto,
  ProviderConfigDto,
} from '../dtos/integrations.dto';
import { CreateEventDto, UpdateEventDto } from '../../events/dtos/event.dto';

@Injectable()
export class IntegrationsService {
  constructor(
    private providerRegistry: ProviderRegistry,
    private userIntegrationsRepository: UserIntegrationsRepository,
    private googleCalendarProvider: GoogleCalendarProvider
  ) {}

  async getConnectedProviders(userId: string): Promise<ProviderStatusDto[]> {
    const integrations = await this.userIntegrationsRepository.findByUserId(
      userId
    );

    return integrations.map(integration => ({
      connected: true,
      providerType: integration.providerType,
      lastSyncAt: integration.lastSyncAt,
      isActive: integration.isActive,
    }));
  }

  async getProviderConfigs(): Promise<ProviderConfigDto[]> {
    const configs = await this.providerRegistry.getAllProviderConfigs();
    return Promise.all(
      configs.map(async config => ({
        ...config,
        authUrl: await config.authUrl,
      }))
    );
  }

  async connectProvider(
    userId: string,
    providerType: string,
    data: ConnectProviderDto
  ): Promise<void> {
    if (!this.providerRegistry.hasProvider(providerType as any)) {
      throw new BadRequestException(`Provider ${providerType} not supported`);
    }

    const existing =
      await this.userIntegrationsRepository.findByUserIdAndProvider(
        userId,
        providerType
      );
    if (existing) {
      throw new BadRequestException(
        `Provider ${providerType} already connected`
      );
    }

    switch (providerType) {
      case 'google':
        await this.googleCalendarProvider.connect(userId, data);
        break;
      default:
        throw new BadRequestException(
          `Provider ${providerType} not implemented`
        );
    }
  }

  async disconnectProvider(
    userId: string,
    providerType: string
  ): Promise<void> {
    const integration =
      await this.userIntegrationsRepository.findByUserIdAndProvider(
        userId,
        providerType
      );

    if (!integration) {
      throw new NotFoundException(`Provider ${providerType} not connected`);
    }

    switch (providerType) {
      case 'google':
        await this.googleCalendarProvider.disconnect(userId);
        break;
      default:
        throw new BadRequestException(
          `Provider ${providerType} not implemented`
        );
    }
  }

  async getProviderStatus(
    userId: string,
    providerType: string
  ): Promise<ProviderStatusDto> {
    const integration =
      await this.userIntegrationsRepository.findByUserIdAndProvider(
        userId,
        providerType
      );

    if (!integration) {
      return {
        connected: false,
        providerType,
        isActive: false,
      };
    }

    return {
      connected: true,
      providerType: integration.providerType,
      lastSyncAt: integration.lastSyncAt,
      isActive: integration.isActive,
    };
  }

  async syncCalendar(userId: string, providerType: string): Promise<void> {
    const integration =
      await this.userIntegrationsRepository.findByUserIdAndProvider(
        userId,
        providerType
      );

    if (!integration) {
      throw new NotFoundException(`Provider ${providerType} not connected`);
    }

    if (!integration.isActive) {
      throw new BadRequestException(`Provider ${providerType} is not active`);
    }

    // This would trigger a background job for syncing
    // For now, just update the last sync time
    await this.userIntegrationsRepository.update(integration.id, {
      lastSyncAt: new Date(),
    });
  }

  async getAuthUrl(providerType: string): Promise<string> {
    if (!this.providerRegistry.hasProvider(providerType as any)) {
      throw new BadRequestException(`Provider ${providerType} not supported`);
    }

    switch (providerType) {
      case 'google':
        return this.googleCalendarProvider.getAuthUrl();
      default:
        throw new BadRequestException(
          `Provider ${providerType} not implemented`
        );
    }
  }

  async createEventWithProvider(
    userId: string,
    providerType: string,
    eventData: CreateEventDto
  ): Promise<ExternalEvent> {
    const integration =
      await this.userIntegrationsRepository.findByUserIdAndProvider(
        userId,
        providerType
      );

    if (!integration || !integration.isActive) {
      throw new NotFoundException(
        `Provider ${providerType} not connected or not active`
      );
    }

    switch (providerType) {
      case 'google':
        return this.googleCalendarProvider.createEvent(userId, eventData);
      default:
        throw new BadRequestException(
          `Provider ${providerType} not implemented`
        );
    }
  }

  async updateEventWithProvider(
    userId: string,
    providerType: string,
    externalEventId: string,
    eventData: UpdateEventDto
  ): Promise<ExternalEvent> {
    const integration =
      await this.userIntegrationsRepository.findByUserIdAndProvider(
        userId,
        providerType
      );

    if (!integration || !integration.isActive) {
      throw new NotFoundException(
        `Provider ${providerType} not connected or not active`
      );
    }

    switch (providerType) {
      case 'google':
        return this.googleCalendarProvider.updateEvent(
          userId,
          externalEventId,
          eventData
        );
      default:
        throw new BadRequestException(
          `Provider ${providerType} not implemented`
        );
    }
  }

  async deleteEventWithProvider(
    userId: string,
    providerType: string,
    externalEventId: string
  ): Promise<void> {
    const integration =
      await this.userIntegrationsRepository.findByUserIdAndProvider(
        userId,
        providerType
      );

    if (!integration || !integration.isActive) {
      throw new NotFoundException(
        `Provider ${providerType} not connected or not active`
      );
    }

    switch (providerType) {
      case 'google':
        return this.googleCalendarProvider.deleteEvent(userId, externalEventId);
      default:
        throw new BadRequestException(
          `Provider ${providerType} not implemented`
        );
    }
  }
}
