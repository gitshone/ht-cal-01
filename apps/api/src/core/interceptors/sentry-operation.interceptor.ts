import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import * as Sentry from '@sentry/nestjs';
import {
  SENTRY_OPERATION_KEY,
  SentryOperationOptions,
} from '../decorators/sentry-operation.decorator';

@Injectable()
export class SentryOperationInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const operationOptions =
      this.reflector.getAllAndOverride<SentryOperationOptions>(
        SENTRY_OPERATION_KEY,
        [context.getHandler(), context.getClass()]
      );

    if (!operationOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const className = context.getClass().name;
    const methodName = context.getHandler().name;

    Sentry.addBreadcrumb({
      message:
        operationOptions.description ||
        `${operationOptions.operation} operation started`,
      category: operationOptions.category || 'api',
      level: 'info',
      data: {
        operation: operationOptions.operation,
        class: className,
        method: methodName,
        url: request?.url,
        httpMethod: request?.method,
      },
    });

    return next.handle().pipe(
      tap(result => {
        if (operationOptions.trackSuccess !== false) {
          Sentry.addBreadcrumb({
            message:
              operationOptions.description ||
              `${operationOptions.operation} operation completed`,
            category: operationOptions.category || 'api',
            level: 'info',
            data: {
              operation: operationOptions.operation,
              class: className,
              method: methodName,
              resultType: Array.isArray(result) ? 'array' : typeof result,
              resultCount: Array.isArray(result) ? result.length : undefined,
            },
          });
        }
      }),
      catchError(error => {
        if (operationOptions.trackErrors !== false) {
          Sentry.withScope(scope => {
            scope.setTag('operation_type', operationOptions.category || 'api');
            scope.setTag('operation', operationOptions.operation);
            scope.setTag('class', className);
            scope.setTag('method', methodName);

            if (request) {
              scope.setTag('http_method', request.method);
              scope.setTag('endpoint', `${request.method} ${request.url}`);

              scope.setContext('request', {
                method: request.method,
                url: request.url,
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
            }

            scope.addBreadcrumb({
              message:
                operationOptions.description ||
                `${operationOptions.operation} operation failed`,
              category: operationOptions.category || 'api',
              level: 'error',
              data: {
                operation: operationOptions.operation,
                class: className,
                method: methodName,
                error: error.message,
              },
            });

            Sentry.captureException(error);
          });
        }

        throw error;
      })
    );
  }
}
