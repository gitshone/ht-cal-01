import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { SentryModule } from '@sentry/nestjs/setup';
import { CoreConfigModule } from './core/config/core-config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { WebSocketsModule } from './infrastructure/websockets/websockets.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { FileStorageModule } from './modules/file-storage/file-storage.module';
import { HealthModule } from './modules/health/health.module';
import { SettingsModule } from './modules/settings/settings.module';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';

@Module({
  imports: [
    SentryModule.forRoot(),

    // Core modules
    CoreConfigModule,
    DatabaseModule,
    CacheModule,
    WebSocketsModule,
    QueueModule,

    // Throttling
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    EventsModule,
    IntegrationsModule,
    FileStorageModule,
    SettingsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
