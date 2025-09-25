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
export class SentryDatabaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const operation = this.getOperationType(methodName);

    Sentry.addBreadcrumb({
      message: `Database operation: ${operation}`,
      category: 'database',
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
          message: `Database operation completed: ${operation}`,
          category: 'database',
          level: 'info',
          data: {
            class: className,
            method: methodName,
            operation,
            resultType: Array.isArray(result) ? 'array' : typeof result,
            resultCount: Array.isArray(result) ? result.length : undefined,
          },
        });
      }),
      catchError(error => {
        Sentry.withScope(scope => {
          scope.setTag('operation_type', 'database');
          scope.setTag('database_operation', operation);
          scope.setTag('class', className);
          scope.setTag('method', methodName);

          scope.setContext('database_operation', {
            class: className,
            method: methodName,
            operation,
          });

          scope.addBreadcrumb({
            message: `Database operation failed: ${operation}`,
            category: 'database',
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

  private getOperationType(methodName: string): string {
    const method = methodName.toLowerCase();

    if (method.includes('create') || method.includes('insert')) {
      return 'create';
    }
    if (method.includes('update') || method.includes('patch')) {
      return 'update';
    }
    if (method.includes('delete') || method.includes('remove')) {
      return 'delete';
    }
    if (
      method.includes('find') ||
      method.includes('get') ||
      method.includes('list')
    ) {
      return 'read';
    }

    return 'unknown';
  }
}
