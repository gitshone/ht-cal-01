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
import { SentryOperation } from '../../../core/decorators/sentry-operation.decorator';

@Injectable()
export class IntegrationsService {
  constructor(
    private providerRegistry: ProviderRegistry,
    private userIntegrationsRepository: UserIntegrationsRepository,
    private googleCalendarProvider: GoogleCalendarProvider
  ) {}

  @SentryOperation({
    operation: 'read',
    category: 'integration',
    description: 'Getting connected providers',
    trackSuccess: false,
  })
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

  @SentryOperation({
    operation: 'read',
    category: 'integration',
    description: 'Getting provider configurations',
    trackSuccess: false,
  })
  async getProviderConfigs(): Promise<ProviderConfigDto[]> {
    const configs = await this.providerRegistry.getAllProviderConfigs();
    return Promise.all(
      configs.map(async config => ({
        ...config,
        authUrl: await config.authUrl,
      }))
    );
  }

  @SentryOperation({
    operation: 'connect',
    category: 'integration',
    description: 'Connecting provider',
  })
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

  @SentryOperation({
    operation: 'disconnect',
    category: 'integration',
    description: 'Disconnecting provider',
  })
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

  @SentryOperation({
    operation: 'read',
    category: 'integration',
    description: 'Getting provider status',
    trackSuccess: false,
  })
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

  @SentryOperation({
    operation: 'sync',
    category: 'integration',
    description: 'Syncing calendar with provider',
  })
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

  @SentryOperation({
    operation: 'read',
    category: 'integration',
    description: 'Getting auth URL for provider',
    trackSuccess: false,
  })
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

  @SentryOperation({
    operation: 'create',
    category: 'integration',
    description: 'Creating event with external provider',
  })
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

  @SentryOperation({
    operation: 'update',
    category: 'integration',
    description: 'Updating event with external provider',
  })
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

  @SentryOperation({
    operation: 'delete',
    category: 'integration',
    description: 'Deleting event with external provider',
  })
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
