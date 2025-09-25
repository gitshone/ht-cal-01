import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryIntegrationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const operation = this.getIntegrationOperationType(methodName);

    Sentry.addBreadcrumb({
      message: `Integration operation: ${operation}`,
      category: 'integration',
      level: 'info',
      data: {
        class: className,
        method: methodName,
        operation,
      },
    });

    return next.handle().pipe(
      tap(result => {
        Sentry.addBreadcrumb({
          message: `Integration operation completed: ${operation}`,
          category: 'integration',
          level: 'info',
          data: {
            class: className,
            method: methodName,
            operation,
            resultType: Array.isArray(result) ? 'array' : typeof result,
          },
        });
      }),
      catchError(error => {
        Sentry.withScope(scope => {
          scope.setTag('operation_type', 'integration');
          scope.setTag('integration_operation', operation);
          scope.setTag('class', className);
          scope.setTag('method', methodName);

          scope.setContext('integration_operation', {
            class: className,
            method: methodName,
            operation,
          });

          scope.addBreadcrumb({
            message: `Integration operation failed: ${operation}`,
            category: 'integration',
            level: 'error',
            data: {
              class: className,
              method: methodName,
              operation,
              error: error.message,
            },
          });

          Sentry.captureException(error);
        });

        throw error;
      })
    );
  }

  private getIntegrationOperationType(methodName: string): string {
    const method = methodName.toLowerCase();

    if (method.includes('connect') || method.includes('auth')) {
      return 'connect';
    }
    if (method.includes('disconnect') || method.includes('revoke')) {
      return 'disconnect';
    }
    if (method.includes('sync') || method.includes('refresh')) {
      return 'sync';
    }
    if (method.includes('create') || method.includes('add')) {
      return 'create';
    }
    if (method.includes('update') || method.includes('modify')) {
      return 'update';
    }
    if (method.includes('delete') || method.includes('remove')) {
      return 'delete';
    }
    if (
      method.includes('fetch') ||
      method.includes('get') ||
      method.includes('list')
    ) {
      return 'fetch';
    }

    return 'unknown';
  }
}
