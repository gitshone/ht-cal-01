import { SetMetadata } from '@nestjs/common';

export const SENTRY_OPERATION_KEY = 'sentry_operation';

export interface SentryOperationOptions {
  operation:
    | 'create'
    | 'update'
    | 'delete'
    | 'read'
    | 'sync'
    | 'connect'
    | 'disconnect';
  category?: 'database' | 'api' | 'integration' | 'file' | 'queue';
  description?: string;
  trackSuccess?: boolean;
  trackErrors?: boolean;
}

export const SentryOperation = (options: SentryOperationOptions) =>
  SetMetadata(SENTRY_OPERATION_KEY, options);
