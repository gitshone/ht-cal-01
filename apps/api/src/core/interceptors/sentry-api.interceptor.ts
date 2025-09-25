import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryApiInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const className = context.getClass().name;
    const methodName = context.getHandler().name;

    const operation = this.getApiOperationType(request.method, methodName);

    // Add breadcrumb for API operation start
    Sentry.addBreadcrumb({
      message: `API operation: ${operation}`,
      category: 'api',
      level: 'info',
      data: {
        method: request.method,
        url: request.url,
        class: className,
        handler: methodName,
        operation,
      },
    });

    return next.handle().pipe(
      tap(result => {
        // Log successful API operations
        Sentry.addBreadcrumb({
          message: `API operation completed: ${operation}`,
          category: 'api',
          level: 'info',
          data: {
            method: request.method,
            url: request.url,
            class: className,
            handler: methodName,
            operation,
            responseType: Array.isArray(result) ? 'array' : typeof result,
          },
        });
      }),
      catchError(error => {
        // Capture API errors with context
        Sentry.withScope(scope => {
          scope.setTag('operation_type', 'api');
          scope.setTag('api_operation', operation);
          scope.setTag('http_method', request.method);
          scope.setTag('endpoint', `${request.method} ${request.url}`);
          scope.setTag('class', className);
          scope.setTag('handler', methodName);

          scope.setContext('api_operation', {
            method: request.method,
            url: request.url,
            class: className,
            handler: methodName,
            operation,
            body: request.body,
            query: request.query,
            params: request.params,
          });

          if (request.user) {
            const user = request.user as any;
            scope.setUser({
              id: user.id || user.userId,
              email: user.email,
            });
          }

          scope.addBreadcrumb({
            message: `API operation failed: ${operation}`,
            category: 'api',
            level: 'error',
            data: {
              method: request.method,
              url: request.url,
              class: className,
              handler: methodName,
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

  private getApiOperationType(httpMethod: string, handlerName: string): string {
    const method = httpMethod.toLowerCase();
    const handler = handlerName.toLowerCase();

    if (method === 'post' || handler.includes('create')) {
      return 'create';
    }
    if (method === 'put' || method === 'patch' || handler.includes('update')) {
      return 'update';
    }
    if (
      method === 'delete' ||
      handler.includes('delete') ||
      handler.includes('remove')
    ) {
      return 'delete';
    }
    if (
      method === 'get' ||
      handler.includes('find') ||
      handler.includes('list')
    ) {
      return 'read';
    }

    return 'unknown';
  }
}
