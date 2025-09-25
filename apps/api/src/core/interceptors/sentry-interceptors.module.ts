import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SentryDatabaseInterceptor } from './sentry-database.interceptor';
import { SentryApiInterceptor } from './sentry-api.interceptor';
import { SentryIntegrationInterceptor } from './sentry-integration.interceptor';
import { SentryOperationInterceptor } from './sentry-operation.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryOperationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryApiInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryDatabaseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryIntegrationInterceptor,
    },
  ],
})
export class SentryInterceptorsModule {}
