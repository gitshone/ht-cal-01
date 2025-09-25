import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { IntegrationsService } from './services/integrations.service';
import { IntegrationsController } from './controllers/integrations.controller';
import { ProviderRegistry } from './providers/provider-registry';
import { GoogleCalendarProvider } from './providers/google-calendar.provider';
import { ProviderQueueService } from './services/provider-queue.service';
import { ProviderQueueProcessor } from './processors/provider-queue.processor';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { UserIntegrationsRepository } from './repositories/user-integrations.repository';
import { EventsRepository } from '../events/repositories/events.repository';

@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    BullModule.registerQueue({
      name: 'provider',
    }),
  ],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    ProviderRegistry,
    GoogleCalendarProvider,
    ProviderQueueService,
    ProviderQueueProcessor,
    UserIntegrationsRepository,
    EventsRepository,
  ],
  exports: [
    IntegrationsService,
    ProviderRegistry,
    GoogleCalendarProvider,
    ProviderQueueService,
  ],
})
export class IntegrationsModule {}
